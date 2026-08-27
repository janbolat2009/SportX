import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { workoutService } from '../../services/workoutService';
import { analysisService } from '../../services/analysisService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Exercise, Repetition } from '../../types';
import { PostWorkoutReport } from '../athlete/PostWorkoutReport';
import {
  Camera as CameraIcon, Play, Square, RotateCcw, ArrowLeft,
  CheckCircle2, AlertTriangle, Activity, Volume2, VolumeX,
  ShieldCheck, SwitchCamera, Loader2, Sparkles, HelpCircle, ChevronRight
} from 'lucide-react';
import { Pose, Results as PoseResults } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

type CameraState =
  | 'idle'
  | 'requesting_permission'
  | 'permission_granted'
  | 'permission_denied'
  | 'camera_unavailable'
  | 'ready'
  | 'recording'
  | 'stopped';

interface Props {
  initialExerciseSlug?: string;
  onBack: () => void;
  onSessionComplete?: (session: any) => void;
}

export const LiveCameraStudio: React.FC<Props> = ({
  initialExerciseSlug = 'squat',
  onBack,
  onSessionComplete
}) => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(initialExerciseSlug);
  
  // Camera & Device State
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSetupGuide, setShowSetupGuide] = useState(true);

  // Live Biomechanical Telemetry
  const [currentPhase, setCurrentPhase] = useState<string>('READY');
  const [repCount, setRepCount] = useState<number>(0);
  const [instantScore, setInstantScore] = useState<number>(92);
  const [primaryAngle, setPrimaryAngle] = useState<number>(180);
  const [symmetryRatio, setSymmetryRatio] = useState<number>(96);
  const [activeCue, setActiveCue] = useState<string>('Position your full body in camera view');
  const [activeSeverity, setActiveSeverity] = useState<'good' | 'attention' | 'deviation'>('good');
  const [latestLandmarks, setLatestLandmarks] = useState<any[] | null>(null);

  // Session State
  const [isRecording, setIsRecording] = useState(false);
  const [sessionReps, setSessionReps] = useState<Repetition[]>([]);
  const [sessionIssues, setSessionIssues] = useState<any[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [completedSession, setCompletedSession] = useState<any | null>(null);

  // Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraInstanceRef = useRef<Camera | null>(null);
  const poseInstanceRef = useRef<Pose | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

  const stateMachineRef = useRef<{
    phase: string;
    repCount: number;
    minAngle: number;
    maxAngle: number;
    repStartTime: number;
    issuesInRep: any[];
  }>({
    phase: 'READY',
    repCount: 0,
    minAngle: 180,
    maxAngle: 0,
    repStartTime: 0,
    issuesInRep: []
  });

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

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
    target_muscles: 'Core & Kinetic Chain',
    camera_setup_instructions: 'Position camera 2 to 3 meters away with full body visible.',
    default_camera_angle: 'Side View (90 deg)',
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
      setLatestLandmarks(null);
      if (isRecordingRef.current) {
        setActiveCue('Step back so your full body is visible');
        setActiveSeverity('attention');
      }
      ctx.restore();
      return;
    }

    const lms = results.poseLandmarks;
    setLatestLandmarks(lms);

    // Draw Skeleton
    const drawLine = (idx1: number, idx2: number, color = '#10b981', width = 3.5) => {
      const p1 = lms[idx1];
      const p2 = lms[idx2];
      if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.25) || (p2.visibility && p2.visibility < 0.25)) return;
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const drawPoint = (idx: number, color = '#ffffff', radius = 4.5) => {
      const p = lms[idx];
      if (!p || (p.visibility && p.visibility < 0.25)) return;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Torso box
    drawLine(11, 12, '#38bdf8', 3);
    drawLine(11, 23, '#38bdf8', 3);
    drawLine(12, 24, '#38bdf8', 3);
    drawLine(23, 24, '#38bdf8', 3);

    // Left arm
    drawLine(11, 13, '#10b981', 3.5);
    drawLine(13, 15, '#10b981', 3.5);

    // Right arm
    drawLine(12, 14, '#10b981', 3.5);
    drawLine(14, 16, '#10b981', 3.5);

    // Left leg
    drawLine(23, 25, '#10b981', 3.5);
    drawLine(25, 27, '#10b981', 3.5);
    drawLine(27, 31, '#10b981', 3.5);

    // Right leg
    drawLine(24, 26, '#10b981', 3.5);
    drawLine(26, 28, '#10b981', 3.5);
    drawLine(28, 32, '#10b981', 3.5);

    [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((idx) => {
      drawPoint(idx, '#ffffff', 4);
    });

    let primary = 180;
    let symmetry = 96;
    const now = Date.now();
    const sm = stateMachineRef.current;

    if (selectedSlug === 'squat') {
      const l_knee = calculateAngle(lms[23], lms[25], lms[27]);
      const r_knee = calculateAngle(lms[24], lms[26], lms[28]);
      primary = Math.round((l_knee + r_knee) / 2);
      symmetry = Math.round(100 - Math.abs(l_knee - r_knee));
      setPrimaryAngle(primary);
      setSymmetryRatio(Math.max(50, symmetry));

      if (isRecordingRef.current) {
        if ((sm.phase === 'STANDING' || sm.phase === 'READY') && primary < 155) {
          sm.phase = 'DESCENT';
          sm.minAngle = primary;
          sm.repStartTime = now;
          setActiveCue('Control descent smoothly');
          setActiveSeverity('good');
        } else if (sm.phase === 'DESCENT') {
          if (primary < sm.minAngle) sm.minAngle = primary;
          if (primary <= 95) {
            sm.phase = 'BOTTOM';
            setActiveCue('Good depth reached — drive through heels');
            setActiveSeverity('good');
          }
        } else if (sm.phase === 'BOTTOM' && primary > 110) {
          sm.phase = 'ASCENT';
          setActiveCue('Drive hips up and exhale');
        } else if ((sm.phase === 'ASCENT' || sm.phase === 'DESCENT') && primary > 160) {
          const repDuration = (now - sm.repStartTime) / 1000;
          if (repDuration >= 0.8 && sm.minAngle < 125) {
            sm.repCount += 1;
            setRepCount(sm.repCount);
            playBeep(880, 150);

            const repScore = sm.minAngle <= 95 ? 96 : Math.round(100 - (sm.minAngle - 90));
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
              tempo_score: repDuration >= 2.0 ? 92 : 82,
              stability_score: 90,
              peak_angle: sm.minAngle,
              min_angle: sm.minAngle,
              is_valid: sm.minAngle <= 110
            };
            setSessionReps((prev) => [...prev, newRep]);
            setActiveCue('Solid repetition!');
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
      setSymmetryRatio(Math.max(50, symmetry));

      if (isRecordingRef.current) {
        if ((sm.phase === 'PLANK' || sm.phase === 'READY') && primary < 155) {
          sm.phase = 'DESCENT';
          sm.minAngle = primary;
          sm.repStartTime = now;
          setActiveCue('Lower chest with control');
        } else if (sm.phase === 'DESCENT') {
          if (primary < sm.minAngle) sm.minAngle = primary;
          if (primary <= 95) {
            sm.phase = 'BOTTOM';
            setActiveCue('Chest depth achieved — push up');
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
            setActiveCue('Good push-up rep!');
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
      setSymmetryRatio(Math.max(50, symmetry));

      if (isRecordingRef.current) {
        if ((sm.phase === 'STANDING' || sm.phase === 'READY') && primary < 140) {
          sm.phase = 'FLEXION';
          sm.minAngle = primary;
          sm.repStartTime = now;
          setActiveCue('Curl smoothly without swinging');
        } else if (sm.phase === 'FLEXION') {
          if (primary < sm.minAngle) sm.minAngle = primary;
          if (primary <= 65) {
            sm.phase = 'PEAK';
            setActiveCue('Peak contraction — 2s eccentric descent');
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
              rep_score: sm.minAngle <= 60 ? 96 : 85,
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
      // Overhead Press
      const l_elbow = calculateAngle(lms[11], lms[13], lms[15]);
      const r_elbow = calculateAngle(lms[12], lms[14], lms[16]);
      primary = Math.round((l_elbow + r_elbow) / 2);
      symmetry = Math.round(100 - Math.abs(l_elbow - r_elbow));
      setPrimaryAngle(primary);
      setSymmetryRatio(Math.max(50, symmetry));
      setCurrentPhase(isRecordingRef.current ? 'PRESSING' : 'READY');
    }

    ctx.restore();
  }, [selectedSlug]);

  const stopCamera = () => {
    if (cameraInstanceRef.current) {
      try {
        cameraInstanceRef.current.stop();
      } catch {}
      cameraInstanceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('stopped');
  };

  const startCamera = async (overrideFacingMode?: 'user' | 'environment') => {
    stopCamera();
    setCameraState('requesting_permission');
    setCameraError(null);

    const mode = overrideFacingMode || facingMode;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraState('camera_unavailable');
        setCameraError('Camera API is not supported on this browser or context.');
        return;
      }

      // Query available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
      } catch {}

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play();

        // Initialize MediaPipe Pose
        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        pose.onResults(onPoseResults);
        poseInstanceRef.current = pose;

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && poseInstanceRef.current) {
              await poseInstanceRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720,
        });
        await camera.start();
        cameraInstanceRef.current = camera;
        setCameraState('ready');
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('permission_denied');
        setCameraError('Camera permission was blocked. Please enable camera access in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('camera_unavailable');
        setCameraError('No camera device was detected on your hardware.');
      } else {
        setCameraState('camera_unavailable');
        setCameraError(err.message || 'Unable to access camera.');
      }
    }
  };

  const handleToggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleStartWorkout = () => {
    setShowSetupGuide(false);
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6 animate-in fade-in">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Studio</span>
        </button>

        {/* Exercise Quick Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSlug}
            onChange={(e) => {
              setSelectedSlug(e.target.value);
              setShowSetupGuide(true);
            }}
            className="bg-surface-card border border-surface-border text-xs font-bold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="squat">Squat</option>
            <option value="pushup">Push-up</option>
            <option value="bicep_curl">Bicep Curl</option>
            <option value="shoulder_press">Shoulder Press</option>
          </select>

          {/* Camera Flip (Mobile Switch) */}
          <button
            onClick={handleToggleCameraFacing}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-zinc-300 hover:text-white transition-all"
            title="Flip Camera (Front/Back)"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          {/* Audio Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-zinc-300 hover:text-white transition-all"
            title={soundEnabled ? 'Mute Cues' : 'Unmute Cues'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative rounded-3xl overflow-hidden bg-black border border-surface-border aspect-[4/3] sm:aspect-video shadow-2xl flex items-center justify-center">
        
        {/* Hidden Raw HTML Video Element for MediaPipe */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />

        {/* Interactive Skeleton Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none z-10"
        />

        {/* Permission / Camera Error Banners */}
        {cameraState === 'permission_denied' && (
          <div className="absolute inset-0 z-30 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Camera Permission Denied</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Camera access is required for real-time biomechanical pose estimation. Please allow camera access in your browser address bar and tap retry.
            </p>
            <button
              onClick={() => startCamera()}
              className="px-5 py-2.5 rounded-xl bg-brand-500 text-black text-xs font-bold active:scale-95"
            >
              Retry Camera Permission
            </button>
          </div>
        )}

        {cameraState === 'camera_unavailable' && (
          <div className="absolute inset-0 z-30 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <h3 className="text-base font-bold text-white">No Camera Detected</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              {cameraError || 'Ensure your webcam or mobile camera is connected and not in use by another app.'}
            </p>
            <button
              onClick={() => startCamera()}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
            >
              Refresh Devices
            </button>
          </div>
        )}

        {cameraState === 'requesting_permission' && (
          <div className="absolute inset-0 z-30 bg-black/75 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <p className="text-xs text-zinc-300 font-mono">Initializing 3D Pose Landmarker...</p>
          </div>
        )}

        {/* Pre-Workout Setup Overlay Guide */}
        {showSetupGuide && cameraState === 'ready' && !isRecording && (
          <div className="absolute inset-0 z-20 bg-black/75 p-5 flex flex-col items-center justify-between text-center backdrop-blur-xs">
            <div className="w-full flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-400" /> Camera Setup
              </span>
              <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono text-[10px]">
                {selectedExercise.default_camera_angle || 'Side View'}
              </span>
            </div>

            <div className="max-w-md space-y-2.5 my-auto">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {selectedExercise.name}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed bg-surface-card/80 p-3.5 rounded-2xl border border-surface-border">
                {selectedExercise.camera_setup_instructions || 'Position camera 2 to 3 meters away so your full body is visible from head to feet.'}
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Full Body Tracking Ready
                </span>
              </div>
            </div>

            <button
              onClick={handleStartWorkout}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-black text-sm font-black transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Workout</span>
            </button>
          </div>
        )}

        {/* Active In-Workout HUD Overlay */}
        {isRecording && (
          <div className="absolute inset-0 z-20 p-3 sm:p-5 flex flex-col justify-between pointer-events-none">
            
            {/* Top Telemetry Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase">{currentPhase}</span>
              </div>

              <div className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">Joint Angle</span>
                  <span className="text-xs font-bold text-white font-mono">{primaryAngle}°</span>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">Symmetry</span>
                  <span className="text-xs font-bold text-brand-400 font-mono">{symmetryRatio}%</span>
                </div>
              </div>
            </div>

            {/* Center Prioritized Real-Time Feedback Cue */}
            <div className="flex justify-center">
              <div className={`px-4 py-2.5 rounded-2xl backdrop-blur-md text-xs font-bold text-center max-w-sm shadow-xl flex items-center gap-2 ${
                activeSeverity === 'deviation'
                  ? 'bg-rose-500/90 text-white'
                  : activeSeverity === 'attention'
                  ? 'bg-amber-500/90 text-black'
                  : 'bg-black/80 text-white border border-white/15'
              }`}>
                {activeSeverity === 'deviation' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                )}
                <span>{activeCue}</span>
              </div>
            </div>

            {/* Bottom HUD: Rep Counter & Stop Control */}
            <div className="flex items-end justify-between gap-3">
              {/* Repetition Counter Badge */}
              <div className="bg-black/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex items-center gap-3 shadow-2xl">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">Reps</span>
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
                    {repCount}
                  </span>
                </div>
              </div>

              {/* Stop Set Button (Large touch target for mobile) */}
              <button
                onClick={handleFinishWorkout}
                className="pointer-events-auto px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Finish Set</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Post-Workout Summary Modal */}
      {completedSession && (
        <div className="fixed inset-0 z-50 p-4 bg-black/85 backdrop-blur-md flex items-center justify-center overflow-y-auto">
          <PostWorkoutReport
            session={completedSession}
            onClose={() => {
              setCompletedSession(null);
              if (onSessionComplete) {
                onSessionComplete(completedSession);
              } else {
                onBack();
              }
            }}
          />
        </div>
      )}

    </div>
  );
};
