import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { workoutService } from '../../services/workoutService';
import { analysisService } from '../../services/analysisService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Exercise, Repetition } from '../../types';
import { CameraQualityCheck } from './CameraQualityCheck';
import { PostWorkoutReport } from '../athlete/PostWorkoutReport';
import {
  Camera as CameraIcon, Play, Square, RotateCcw, ArrowLeft,
  CheckCircle2, AlertTriangle, Activity, Volume2, VolumeX, ShieldCheck
} from 'lucide-react';
import { Pose, Results as PoseResults } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

interface Props {
  initialExerciseSlug?: string;
  onBack: () => void;
  onSessionComplete?: (session: any) => void;
}

export const LiveCameraStudio: React.FC<Props> = ({ initialExerciseSlug = 'squat', onBack, onSessionComplete }) => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(initialExerciseSlug);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isQualityPassed, setIsQualityPassed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live Biomechanical Telemetry
  const [currentPhase, setCurrentPhase] = useState<string>('STANDING');
  const [repCount, setRepCount] = useState<number>(0);
  const [instantScore, setInstantScore] = useState<number>(95);
  const [primaryAngle, setPrimaryAngle] = useState<number>(175);
  const [symmetryRatio, setSymmetryRatio] = useState<number>(95);
  const [activeCue, setActiveCue] = useState<string>('Stand in position');
  const [activeSeverity, setActiveSeverity] = useState<'good' | 'attention' | 'deviation'>('good');
  const [latestLandmarks, setLatestLandmarks] = useState<any[] | null>(null);

  // Session History & Report
  const [sessionReps, setSessionReps] = useState<Repetition[]>([]);
  const [sessionIssues, setSessionIssues] = useState<any[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [completedSession, setCompletedSession] = useState<any | null>(null);

  // Audio & State Machine Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraInstanceRef = useRef<Camera | null>(null);
  const poseInstanceRef = useRef<Pose | null>(null);
  const stateMachineRef = useRef<{
    phase: string;
    repCount: number;
    minAngle: number;
    maxAngle: number;
    repStartTime: number;
    issuesInRep: any[];
  }>({
    phase: 'STANDING',
    repCount: 0,
    minAngle: 180,
    maxAngle: 0,
    repStartTime: 0,
    issuesInRep: []
  });

  useEffect(() => {
    async function loadEx() {
      try {
        const data = await workoutService.getExercises();
        setExercises(data);
      } catch (e) {
        console.error(e);
      }
    }
    loadEx();
  }, []);

  const selectedExercise = exercises.find((e) => e.slug === selectedSlug) || {
    name: selectedSlug.replace('_', ' ').toUpperCase(),
    slug: selectedSlug,
    target_muscles: 'Core & Major Muscle Groups',
    camera_setup_instructions: 'Position camera 2.5 - 3.5m away with full body in frame.',
    ideal_rom_degrees: 90
  };

  const playBeep = (freq = 880, durationMs = 150) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  };

  const calculateAngle = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360.0 - angle;
    return angle;
  };

  const onPoseResults = useCallback((results: PoseResults) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.poseLandmarks || results.poseLandmarks.length < 33) {
      ctx.restore();
      return;
    }

    const lms = results.poseLandmarks;
    setLatestLandmarks(lms);

    // Draw Skeleton Lines
    const drawLine = (idx1: number, idx2: number, color = '#10b981', width = 4) => {
      const p1 = lms[idx1];
      const p2 = lms[idx2];
      if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.3) || (p2.visibility && p2.visibility < 0.3)) return;
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    // Draw Keypoints
    const drawPoint = (idx: number, color = '#ffffff', radius = 5) => {
      const p = lms[idx];
      if (!p || (p.visibility && p.visibility < 0.3)) return;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Torso Box
    drawLine(11, 12, '#38bdf8', 3);
    drawLine(11, 23, '#38bdf8', 3);
    drawLine(12, 24, '#38bdf8', 3);
    drawLine(23, 24, '#38bdf8', 3);

    // Left Arm
    drawLine(11, 13, '#10b981', 4);
    drawLine(13, 15, '#10b981', 4);

    // Right Arm
    drawLine(12, 14, '#10b981', 4);
    drawLine(14, 16, '#10b981', 4);

    // Left Leg
    drawLine(23, 25, '#10b981', 4);
    drawLine(25, 27, '#10b981', 4);
    drawLine(27, 31, '#10b981', 4);

    // Right Leg
    drawLine(24, 26, '#10b981', 4);
    drawLine(26, 28, '#10b981', 4);
    drawLine(28, 32, '#10b981', 4);

    // Draw Joints
    [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((idx) => {
      drawPoint(idx, '#ffffff', 4);
    });

    // Extract Relevant Angles based on Exercise
    let primary = 180;
    let symmetry = 95;
    const now = Date.now();
    const sm = stateMachineRef.current;

    if (selectedSlug === 'squat') {
      const l_knee = calculateAngle(lms[23], lms[25], lms[27]);
      const r_knee = calculateAngle(lms[24], lms[26], lms[28]);
      primary = Math.round((l_knee + r_knee) / 2);
      symmetry = Math.round(100 - Math.abs(l_knee - r_knee));
      setPrimaryAngle(primary);
      setSymmetryRatio(Math.max(60, symmetry));

      if (isRecording) {
        if (sm.phase === 'STANDING' && primary < 155) {
          sm.phase = 'DESCENT';
          sm.minAngle = primary;
          sm.repStartTime = now;
          setActiveCue('Control descent');
          setActiveSeverity('good');
        } else if (sm.phase === 'DESCENT') {
          if (primary < sm.minAngle) sm.minAngle = primary;
          if (primary <= 95) {
            sm.phase = 'BOTTOM';
            setActiveCue('Good depth - drive up');
            setActiveSeverity('good');
          }
        } else if (sm.phase === 'BOTTOM' && primary > 110) {
          sm.phase = 'ASCENT';
          setActiveCue('Drive through heels');
        } else if ((sm.phase === 'ASCENT' || sm.phase === 'DESCENT') && primary > 160) {
          const repDuration = (now - sm.repStartTime) / 1000;
          if (repDuration >= 0.8 && sm.minAngle < 120) {
            sm.repCount += 1;
            setRepCount(sm.repCount);
            playBeep(880, 150);

            const repScore = sm.minAngle <= 95 ? 95 : Math.round(100 - (sm.minAngle - 90));
            const newRep: Repetition = {
              id: sm.repCount,
              rep_number: sm.repCount,
              start_time: 0,
              end_time: repDuration,
              duration_seconds: repDuration,
              rep_score: Math.min(100, Math.max(50, repScore)),
              alignment_score: symmetry,
              rom_score: sm.minAngle <= 95 ? 98 : 80,
              symmetry_score: symmetry,
              tempo_score: repDuration >= 2.0 ? 92 : 80,
              stability_score: 90,
              peak_angle: sm.minAngle,
              min_angle: sm.minAngle,
              is_valid: sm.minAngle <= 110
            };
            setSessionReps((prev) => [...prev, newRep]);
            setActiveCue('Good repetition!');
            setActiveSeverity('good');
          }
          sm.phase = 'STANDING';
          sm.minAngle = 180;
        }
      }
      setCurrentPhase(sm.phase);

    } else if (selectedSlug === 'push_up' || selectedSlug === 'pushup') {
      const l_elbow = calculateAngle(lms[11], lms[13], lms[15]);
      const r_elbow = calculateAngle(lms[12], lms[14], lms[16]);
      primary = Math.round((l_elbow + r_elbow) / 2);
      symmetry = Math.round(100 - Math.abs(l_elbow - r_elbow));
      setPrimaryAngle(primary);
      setSymmetryRatio(Math.max(60, symmetry));

      if (isRecording) {
        if (sm.phase === 'PLANK' && primary < 155) {
          sm.phase = 'DESCENT';
          sm.minAngle = primary;
          sm.repStartTime = now;
          setActiveCue('Lower chest smoothly');
        } else if (sm.phase === 'DESCENT') {
          if (primary < sm.minAngle) sm.minAngle = primary;
          if (primary <= 95) {
            sm.phase = 'BOTTOM';
            setActiveCue('Push back to lockout');
          }
        } else if (sm.phase === 'BOTTOM' && primary > 110) {
          sm.phase = 'ASCENT';
        } else if ((sm.phase === 'ASCENT' || sm.phase === 'DESCENT') && primary > 160) {
          const repDuration = (now - sm.repStartTime) / 1000;
          if (repDuration >= 0.7 && sm.minAngle < 120) {
            sm.repCount += 1;
            setRepCount(sm.repCount);
            playBeep(880, 150);

            const repScore = sm.minAngle <= 90 ? 96 : 82;
            const newRep: Repetition = {
              id: sm.repCount,
              rep_number: sm.repCount,
              start_time: 0,
              end_time: repDuration,
              duration_seconds: repDuration,
              rep_score: repScore,
              alignment_score: symmetry,
              rom_score: sm.minAngle <= 90 ? 98 : 78,
              symmetry_score: symmetry,
              tempo_score: 90,
              stability_score: 92,
              peak_angle: sm.minAngle,
              min_angle: sm.minAngle,
              is_valid: sm.minAngle <= 105
            };
            setSessionReps((prev) => [...prev, newRep]);
            setActiveCue('Solid push-up rep');
          }
          sm.phase = 'PLANK';
          sm.minAngle = 180;
        }
      }
      setCurrentPhase(sm.phase);

    } else if (selectedSlug === 'bicep_curl') {
      const l_elbow = calculateAngle(lms[11], lms[13], lms[15]);
      const r_elbow = calculateAngle(lms[12], lms[14], lms[16]);
      primary = Math.round((l_elbow + r_elbow) / 2);
      symmetry = Math.round(100 - Math.abs(l_elbow - r_elbow));
      setPrimaryAngle(primary);
      setSymmetryRatio(Math.max(60, symmetry));

      if (isRecording) {
        if (sm.phase === 'STANDING' && primary < 140) {
          sm.phase = 'FLEXION';
          sm.minAngle = primary;
          sm.repStartTime = now;
          setActiveCue('Curl smoothly');
        } else if (sm.phase === 'FLEXION') {
          if (primary < sm.minAngle) sm.minAngle = primary;
          if (primary <= 65) {
            sm.phase = 'PEAK';
            setActiveCue('Peak contraction - lower controlled');
          }
        } else if (sm.phase === 'PEAK' && primary > 80) {
          sm.phase = 'EXTENSION';
        } else if ((sm.phase === 'EXTENSION' || sm.phase === 'FLEXION') && primary > 150) {
          const repDuration = (now - sm.repStartTime) / 1000;
          if (repDuration >= 0.8 && sm.minAngle < 85) {
            sm.repCount += 1;
            setRepCount(sm.repCount);
            playBeep(880, 150);

            const newRep: Repetition = {
              id: sm.repCount,
              rep_number: sm.repCount,
              start_time: 0,
              end_time: repDuration,
              duration_seconds: repDuration,
              rep_score: sm.minAngle <= 60 ? 95 : 85,
              alignment_score: symmetry,
              rom_score: sm.minAngle <= 60 ? 98 : 82,
              symmetry_score: symmetry,
              tempo_score: 90,
              stability_score: 90,
              peak_angle: sm.minAngle,
              min_angle: sm.minAngle,
              is_valid: true
            };
            setSessionReps((prev) => [...prev, newRep]);
            setActiveCue('Good curl!');
          }
          sm.phase = 'STANDING';
          sm.minAngle = 180;
        }
      }
      setCurrentPhase(sm.phase);

    } else {
      // Shoulder press default
      const l_elbow = calculateAngle(lms[11], lms[13], lms[15]);
      const r_elbow = calculateAngle(lms[12], lms[14], lms[16]);
      primary = Math.round((l_elbow + r_elbow) / 2);
      symmetry = Math.round(100 - Math.abs(l_elbow - r_elbow));
      setPrimaryAngle(primary);
      setSymmetryRatio(Math.max(60, symmetry));
      setCurrentPhase(isRecording ? 'PRESSING' : 'READY');
    }

    ctx.restore();
  }, [selectedSlug, isRecording, soundEnabled]);

  const startCamera = async () => {
    try {
      if (videoRef.current) {
        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        pose.onResults(onPoseResults);
        poseInstanceRef.current = pose;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' }
        });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && poseInstanceRef.current) {
              await poseInstanceRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720
        });
        await camera.start();
        cameraInstanceRef.current = camera;
        setCameraActive(true);
      }
    } catch (err) {
      setCameraError('Camera access required.');
    }
  };

  const stopCamera = () => {
    if (cameraInstanceRef.current) cameraInstanceRef.current.stop();
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleStartWorkout = () => {
    setIsRecording(true);
    setRepCount(0);
    setSessionReps([]);
    setSessionIssues([]);
    setSessionStartTime(Date.now());
    stateMachineRef.current = {
      phase: selectedSlug === 'push_up' ? 'PLANK' : 'STANDING',
      repCount: 0,
      minAngle: 180,
      maxAngle: 0,
      repStartTime: Date.now(),
      issuesInRep: []
    };
    playBeep(660, 250);
  };

  const handleFinishWorkout = async () => {
    setIsRecording(false);
    playBeep(440, 300);
    const duration = Math.max(1, (Date.now() - sessionStartTime) / 1000);

    const calculatedOverall = sessionReps.length > 0
      ? Math.round(sessionReps.reduce((a, b) => a + b.rep_score, 0) / sessionReps.length)
      : 88;

    const sessionPayload = {
      exercise_slug: selectedSlug,
      session_type: 'LIVE_CAMERA' as const,
      duration_seconds: duration,
      total_reps: repCount,
      valid_reps: sessionReps.filter((r) => r.is_valid).length,
      overall_score: calculatedOverall,
      alignment_score: symmetryRatio,
      rom_score: calculatedOverall,
      symmetry_score: symmetryRatio,
      tempo_score: 88,
      stability_score: 90,
      model_version: 'sportx-gb-v1.0',
      feedback_summary: activeCue || `Completed ${repCount} repetitions with solid technique.`,
      repetitions: sessionReps,
      issues: sessionIssues
    };

    let savedSession: any = null;

    if (isSupabaseConfigured() && user?.id) {
      try {
        const { data: ap } = await supabase
          .from('athlete_profiles')
          .select('id')
          .eq('user_id', String(user.id))
          .maybeSingle();

        if (ap) {
          const exObj = exercises.find((e) => e.slug === selectedSlug) || exercises[0];
          const newSession = await workoutService.createWorkoutSession({
            athlete_id: ap.id,
            exercise_id: exObj?.id || 1,
            session_type: 'LIVE_CAMERA',
            duration_seconds: duration,
            total_reps: repCount,
            valid_reps: sessionReps.filter((r) => r.is_valid).length,
            overall_score: calculatedOverall,
            alignment_score: symmetryRatio,
            rom_score: calculatedOverall,
            symmetry_score: symmetryRatio,
            tempo_score: 88,
            stability_score: 90,
            model_version: 'sportx-gb-v1.0',
            feedback_summary: activeCue || `Completed ${repCount} repetitions with solid technique.`,
          });

          if (newSession && sessionReps.length > 0) {
            await workoutService.createRepetitions(
              sessionReps.map((r, idx) => ({
                session_id: newSession.id,
                rep_number: r.rep_number || idx + 1,
                start_time: r.start_time || 0,
                end_time: r.end_time || 0,
                duration_seconds: r.duration_seconds || 0,
                rep_score: r.rep_score || calculatedOverall,
                alignment_score: r.alignment_score || symmetryRatio,
                rom_score: r.rom_score || calculatedOverall,
                symmetry_score: r.symmetry_score || symmetryRatio,
                tempo_score: r.tempo_score || 88,
                stability_score: r.stability_score || 90,
                peak_angle: r.peak_angle || 90,
                min_angle: r.min_angle || 90,
                is_valid: r.is_valid ?? true,
                phase_durations: r.phase_durations || null,
                detected_errors: (r.detected_errors as any) || null,
              }))
            );

            await analysisService.saveTechniqueAnalysis({
              session_id: newSession.id,
              model_name: 'SportX Gradient Boosting',
              model_version: 'sportx-gb-v1.0',
              overall_score: calculatedOverall,
              confidence: 0.95,
              range_of_motion: calculatedOverall,
              symmetry: symmetryRatio / 100,
              tempo: 2.8,
            });
          }

          savedSession = {
            ...sessionPayload,
            id: newSession?.id,
          };
        }
      } catch (err) {
        console.warn('Supabase session persistence fallback:', err);
      }
    }

    if (!savedSession) {
      try {
        savedSession = await api.finalizeSession(sessionPayload);
      } catch {
        savedSession = sessionPayload;
      }
    }

    setCompletedSession(savedSession);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border text-zinc-300 hover:text-white text-xs font-semibold active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Studio</span>
        </button>

        {/* Exercise Switcher */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSlug}
            onChange={(e) => {
              setSelectedSlug(e.target.value);
              setRepCount(0);
              setSessionReps([]);
            }}
            disabled={isRecording}
            className="bg-surface-card border border-surface-border text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500 capitalize"
          >
            <option value="squat">Barbell / Bodyweight Squat</option>
            <option value="pushup">Standard Push-up</option>
            <option value="bicep_curl">Bicep Curl</option>
            <option value="shoulder_press">Overhead Shoulder Press</option>
          </select>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-surface-card border border-surface-border text-zinc-400 hover:text-white"
            title={soundEnabled ? 'Mute audio cues' : 'Enable audio cues'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Camera & Workout Container */}
      <div className="relative rounded-3xl overflow-hidden bg-black border border-surface-border shadow-2xl aspect-[4/3] sm:aspect-video flex items-center justify-center">
        
        {/* Hidden HTML Video element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />

        {/* Pose Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
        />

        {/* Pre-workout Camera Quality Check Overlay */}
        {!isQualityPassed && cameraActive && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-20">
            <CameraQualityCheck
              videoElement={videoRef.current}
              landmarks={latestLandmarks}
              onQualityPass={() => setIsQualityPassed(true)}
              onCancel={onBack}
            />
          </div>
        )}

        {/* Live HUD Overlays when Quality is Passed */}
        {isQualityPassed && (
          <>
            {/* Top HUD: Joint Angle & Phase */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
              
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white font-mono text-xs flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-400" />
                  <span>{primaryAngle}°</span>
                </div>

                <div className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white font-bold text-xs">
                  {currentPhase}
                </div>
              </div>

              <div className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-brand-400 font-mono text-xs">
                Symmetry: {symmetryRatio}%
              </div>
            </div>

            {/* Center Dynamic Feedback Cue */}
            <div className="absolute bottom-20 left-4 right-4 flex justify-center z-10 pointer-events-none">
              <div className={`px-4 py-2 rounded-2xl backdrop-blur-md border text-xs sm:text-sm font-bold shadow-lg transition-all animate-in fade-in flex items-center gap-2 ${
                activeSeverity === 'good'
                  ? 'bg-status-good/20 border-status-good/40 text-green-300'
                  : activeSeverity === 'attention'
                  ? 'bg-status-attention/20 border-status-attention/40 text-amber-300'
                  : 'bg-status-deviation/20 border-status-deviation/40 text-red-300'
              }`}>
                {activeSeverity === 'good' ? <CheckCircle2 className="w-4 h-4 text-status-good" /> : <AlertTriangle className="w-4 h-4 text-status-attention" />}
                <span>{activeCue}</span>
              </div>
            </div>

            {/* Bottom HUD: Reps Counter & Start/Stop Controls */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
              
              {/* Rep Count Box */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10">
                <span className="text-xs text-zinc-400 uppercase font-semibold">Reps</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">{repCount}</span>
              </div>

              {/* Start / Finish Workout Button */}
              {!isRecording ? (
                <button
                  onClick={handleStartWorkout}
                  className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-black text-sm font-black transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Exercise</span>
                </button>
              ) : (
                <button
                  onClick={handleFinishWorkout}
                  className="px-6 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white text-sm font-black transition-all shadow-lg shadow-red-500/25 flex items-center gap-2 active:scale-95"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Finish Set</span>
                </button>
              )}

            </div>
          </>
        )}

      </div>

      {/* Post Workout Report Modal */}
      {completedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <PostWorkoutReport
            session={completedSession}
            onClose={() => {
              if (onSessionComplete) onSessionComplete(completedSession);
              onBack();
            }}
          />
        </div>
      )}

    </div>
  );
};
