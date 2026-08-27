import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { workoutService } from '../../services/workoutService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Exercise, Repetition } from '../../types';
import { PostWorkoutReport } from '../athlete/PostWorkoutReport';
import {
  Play, Square, ArrowLeft, CheckCircle2, AlertTriangle,
  Volume2, VolumeX, SwitchCamera, Loader2, Sparkles, RefreshCw,
  Activity, ShieldCheck, Dumbbell
} from 'lucide-react';

type CameraState =
  | 'idle'
  | 'requesting_permission'
  | 'ready'
  | 'recording'
  | 'permission_denied'
  | 'camera_in_use'
  | 'camera_unavailable'
  | 'insecure_context'
  | 'browser_unsupported'
  | 'model_error'
  | 'stopped';

interface Props {
  initialExerciseSlug?: string;
  onBack: () => void;
  onSessionComplete?: (session: any) => void;
}

// Resilient loader for MediaPipe Pose & Camera
const getMediaPipePoseConstructors = async (): Promise<{ PoseConstructor: any; CameraConstructor: any }> => {
  if (typeof window === 'undefined') {
    throw new Error('Window is undefined');
  }

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  // Ensure scripts are loaded
  if (!(window as any).Pose) {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
  }
  if (!(window as any).Camera) {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
  }

  const PoseConstructor = (window as any).Pose;
  const CameraConstructor = (window as any).Camera;

  if (!PoseConstructor) {
    throw new Error('MediaPipe Pose constructor is unavailable.');
  }

  return { PoseConstructor, CameraConstructor };
};

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSetupGuide, setShowSetupGuide] = useState(true);

  // Live Biomechanical Telemetry
  const [currentPhase, setCurrentPhase] = useState<string>('READY');
  const [repCount, setRepCount] = useState<number>(0);
  const [primaryAngle, setPrimaryAngle] = useState<number>(180);
  const [symmetryRatio, setSymmetryRatio] = useState<number>(96);
  const [activeCue, setActiveCue] = useState<string>('Stand so your whole body is in frame');
  const [activeSeverity, setActiveSeverity] = useState<'good' | 'attention' | 'deviation'>('good');
  const [, setLatestLandmarks] = useState<any[] | null>(null);

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
  const cameraInstanceRef = useRef<any | null>(null);
  const poseInstanceRef = useRef<any | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);
  const prevLandmarksRef = useRef<any[] | null>(null);

  const stateMachineRef = useRef<{
    phase: string;
    repCount: number;
    minAngle: number;
    maxAngle: number;
    repStartTime: number;
    lastRepCompleteTime: number;
    issuesInRep: any[];
  }>({
    phase: 'READY',
    repCount: 0,
    minAngle: 180,
    maxAngle: 0,
    repStartTime: 0,
    lastRepCompleteTime: 0,
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
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  };

  // 3-point Angle with standard geometry
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

  // Landmark Exponential Moving Average (EMA) Smoothing
  const smoothLandmarks = (rawLandmarks: any[]): any[] => {
    const alpha = 0.65; // Smoothing weight for new frame
    if (!prevLandmarksRef.current || prevLandmarksRef.current.length !== rawLandmarks.length) {
      prevLandmarksRef.current = rawLandmarks;
      return rawLandmarks;
    }

    const smoothed = rawLandmarks.map((lm, idx) => {
      const prev = prevLandmarksRef.current![idx];
      return {
        x: prev.x * (1 - alpha) + lm.x * alpha,
        y: prev.y * (1 - alpha) + lm.y * alpha,
        z: prev.z ? prev.z * (1 - alpha) + lm.z * alpha : lm.z,
        visibility: lm.visibility,
      };
    });

    prevLandmarksRef.current = smoothed;
    return smoothed;
  };

  const onPoseResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.poseLandmarks || results.poseLandmarks.length < 33) {
      setLatestLandmarks(null);
      if (isRecordingRef.current) {
        setActiveCue('Move farther from camera so your full body is visible');
        setActiveSeverity('attention');
      }
      ctx.restore();
      return;
    }

    // Apply EMA Smoothing
    const lms = smoothLandmarks(results.poseLandmarks);
    setLatestLandmarks(lms);

    // Draw Biomechanical Skeleton
    const drawLine = (idx1: number, idx2: number, color = '#10b981', width = 3.5) => {
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

    const drawPoint = (idx: number, color = '#ffffff', radius = 4.5) => {
      const p = lms[idx];
      if (!p || (p.visibility && p.visibility < 0.3)) return;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Torso Frame
    drawLine(11, 12, '#38bdf8', 3);
    drawLine(11, 23, '#38bdf8', 3);
    drawLine(12, 24, '#38bdf8', 3);
    drawLine(23, 24, '#38bdf8', 3);

    // Arms
    drawLine(11, 13, '#10b981', 3.5);
    drawLine(13, 15, '#10b981', 3.5);
    drawLine(12, 14, '#10b981', 3.5);
    drawLine(14, 16, '#10b981', 3.5);

    // Legs
    drawLine(23, 25, '#10b981', 3.5);
    drawLine(25, 27, '#10b981', 3.5);
    drawLine(27, 31, '#10b981', 3.5);
    drawLine(24, 26, '#10b981', 3.5);
    drawLine(26, 28, '#10b981', 3.5);
    drawLine(28, 32, '#10b981', 3.5);

    [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((idx) => {
      drawPoint(idx, '#ffffff', 4);
    });

    const now = Date.now();
    const sm = stateMachineRef.current;
    const cooldownPeriodMs = 350; // Minimum time between consecutive repetitions

    // ==========================================
    // EXERCISE 1: SQUAT KINEMATICS & STATE MACHINE
    // ==========================================
    if (selectedSlug === 'squat') {
      const hipsVis = ((lms[23]?.visibility || 0) + (lms[24]?.visibility || 0)) / 2;
      const kneesVis = ((lms[25]?.visibility || 0) + (lms[26]?.visibility || 0)) / 2;
      const anklesVis = ((lms[27]?.visibility || 0) + (lms[28]?.visibility || 0)) / 2;

      if (hipsVis < 0.4 || kneesVis < 0.4 || anklesVis < 0.4) {
        if (isRecordingRef.current) {
          setActiveCue('Step back so your full body from hips to feet is visible');
          setActiveSeverity('attention');
        }
        ctx.restore();
        return;
      }

      const l_knee = calculateAngle(lms[23], lms[25], lms[27]);
      const r_knee = calculateAngle(lms[24], lms[26], lms[28]);
      const kneeAngle = Math.round((l_knee + r_knee) / 2);
      const symmetry = Math.max(50, Math.min(100, Math.round(100 - Math.abs(l_knee - r_knee))));
      
      setPrimaryAngle(kneeAngle);
      setSymmetryRatio(symmetry);

      if (isRecordingRef.current) {
        // Phase 1: Initiation of Descent
        if ((sm.phase === 'STANDING' || sm.phase === 'READY') && kneeAngle < 150) {
          if (now - sm.lastRepCompleteTime > cooldownPeriodMs) {
            sm.phase = 'DESCENT';
            sm.minAngle = kneeAngle;
            sm.repStartTime = now;
            setActiveCue('Control descent smoothly');
            setActiveSeverity('good');
          }
        } 
        // Phase 2: In Descent, tracking peak depth
        else if (sm.phase === 'DESCENT') {
          if (kneeAngle < sm.minAngle) sm.minAngle = kneeAngle;
          if (kneeAngle <= 100) {
            sm.phase = 'BOTTOM';
            setActiveCue('Good depth — drive up through midfoot');
            setActiveSeverity('good');
          } else if (symmetry < 80) {
            setActiveCue('Balance weight evenly between both legs');
            setActiveSeverity('attention');
          }
        } 
        // Phase 3: Ascent initiation
        else if (sm.phase === 'BOTTOM') {
          if (kneeAngle < sm.minAngle) sm.minAngle = kneeAngle;
          if (kneeAngle > 115) {
            sm.phase = 'ASCENT';
            setActiveCue('Drive hips and chest up together');
          }
        } 
        // Phase 4: Standing Lockout & Repetition Verification
        else if ((sm.phase === 'ASCENT' || sm.phase === 'DESCENT') && kneeAngle >= 155) {
          const repDuration = (now - sm.repStartTime) / 1000;
          if (repDuration >= 0.8 && sm.minAngle <= 120) {
            sm.repCount += 1;
            sm.lastRepCompleteTime = now;
            setRepCount(sm.repCount);
            playBeep(880, 150);

            const depthScore = sm.minAngle <= 90 ? 98 : sm.minAngle <= 100 ? 92 : 82;
            const newRep: Repetition = {
              id: sm.repCount,
              rep_number: sm.repCount,
              start_time: 0,
              end_time: repDuration,
              duration_seconds: repDuration,
              rep_score: Math.round((depthScore + symmetry + 90) / 3),
              alignment_score: symmetry,
              rom_score: depthScore,
              symmetry_score: symmetry,
              tempo_score: repDuration >= 2.0 ? 94 : 85,
              stability_score: 90,
              peak_angle: sm.minAngle,
              min_angle: sm.minAngle,
              is_valid: sm.minAngle <= 110
            };
            setSessionReps((prev) => [...prev, newRep]);
            setActiveCue('Rep completed! Great form.');
            setActiveSeverity('good');
          }
          sm.phase = 'STANDING';
          sm.minAngle = 180;
        }
      }
      setCurrentPhase(sm.phase);

    // ==========================================
    // EXERCISE 2: PUSH-UP KINEMATICS & STATE MACHINE
    // ==========================================
    } else if (selectedSlug === 'push_up' || selectedSlug === 'pushup') {
      const shouldersVis = ((lms[11]?.visibility || 0) + (lms[12]?.visibility || 0)) / 2;
      const elbowsVis = ((lms[13]?.visibility || 0) + (lms[14]?.visibility || 0)) / 2;
      const wristsVis = ((lms[15]?.visibility || 0) + (lms[16]?.visibility || 0)) / 2;

      if (shouldersVis < 0.4 || elbowsVis < 0.4 || wristsVis < 0.4) {
        if (isRecordingRef.current) {
          setActiveCue('Ensure your arms and torso are in frame');
          setActiveSeverity('attention');
        }
        ctx.restore();
        return;
      }

      const l_elbow = calculateAngle(lms[11], lms[13], lms[15]);
      const r_elbow = calculateAngle(lms[12], lms[14], lms[16]);
      const elbowAngle = Math.round((l_elbow + r_elbow) / 2);
      const symmetry = Math.max(50, Math.min(100, Math.round(100 - Math.abs(l_elbow - r_elbow))));
      
      setPrimaryAngle(elbowAngle);
      setSymmetryRatio(symmetry);

      if (isRecordingRef.current) {
        if ((sm.phase === 'PLANK' || sm.phase === 'READY') && elbowAngle < 150) {
          if (now - sm.lastRepCompleteTime > cooldownPeriodMs) {
            sm.phase = 'DESCENT';
            sm.minAngle = elbowAngle;
            sm.repStartTime = now;
            setActiveCue('Lower chest with control');
          }
        } else if (sm.phase === 'DESCENT') {
          if (elbowAngle < sm.minAngle) sm.minAngle = elbowAngle;
          if (elbowAngle <= 95) {
            sm.phase = 'BOTTOM';
            setActiveCue('Target depth reached — press up powerfully');
          }
        } else if (sm.phase === 'BOTTOM') {
          if (elbowAngle < sm.minAngle) sm.minAngle = elbowAngle;
          if (elbowAngle > 115) {
            sm.phase = 'ASCENT';
          }
        } else if ((sm.phase === 'ASCENT' || sm.phase === 'DESCENT') && elbowAngle >= 155) {
          const repDuration = (now - sm.repStartTime) / 1000;
          if (repDuration >= 0.7 && sm.minAngle <= 110) {
            sm.repCount += 1;
            sm.lastRepCompleteTime = now;
            setRepCount(sm.repCount);
            playBeep(880, 150);

            const romScore = sm.minAngle <= 90 ? 98 : 84;
            const newRep: Repetition = {
              id: sm.repCount,
              rep_number: sm.repCount,
              start_time: 0,
              end_time: repDuration,
              duration_seconds: repDuration,
              rep_score: Math.round((romScore + symmetry + 92) / 3),
              alignment_score: symmetry,
              rom_score: romScore,
              symmetry_score: symmetry,
              tempo_score: 90,
              stability_score: 92,
              peak_angle: sm.minAngle,
              min_angle: sm.minAngle,
              is_valid: sm.minAngle <= 105
            };
            setSessionReps((prev) => [...prev, newRep]);
            setActiveCue('Good push-up repetition!');
          }
          sm.phase = 'PLANK';
          sm.minAngle = 180;
        }
      }
      setCurrentPhase(sm.phase);

    // ==========================================
    // EXERCISE 3: BICEP CURL KINEMATICS & STATE MACHINE
    // ==========================================
    } else if (selectedSlug === 'bicep_curl') {
      const l_elbow = calculateAngle(lms[11], lms[13], lms[15]);
      const r_elbow = calculateAngle(lms[12], lms[14], lms[16]);
      const elbowAngle = Math.round((l_elbow + r_elbow) / 2);
      const symmetry = Math.max(50, Math.min(100, Math.round(100 - Math.abs(l_elbow - r_elbow))));
      
      setPrimaryAngle(elbowAngle);
      setSymmetryRatio(symmetry);

      if (isRecordingRef.current) {
        if ((sm.phase === 'EXTENDED' || sm.phase === 'READY') && elbowAngle < 135) {
          if (now - sm.lastRepCompleteTime > cooldownPeriodMs) {
            sm.phase = 'CURLING';
            sm.minAngle = elbowAngle;
            sm.repStartTime = now;
            setActiveCue('Curl smoothly without swinging');
          }
        } else if (sm.phase === 'CURLING') {
          if (elbowAngle < sm.minAngle) sm.minAngle = elbowAngle;
          if (elbowAngle <= 70) {
            sm.phase = 'PEAK';
            setActiveCue('Peak contraction — lower with control');
          }
        } else if (sm.phase === 'PEAK') {
          if (elbowAngle > 85) {
            sm.phase = 'LOWERING';
          }
        } else if ((sm.phase === 'LOWERING' || sm.phase === 'CURLING') && elbowAngle >= 145) {
          const repDuration = (now - sm.repStartTime) / 1000;
          if (repDuration >= 0.8 && sm.minAngle <= 80) {
            sm.repCount += 1;
            sm.lastRepCompleteTime = now;
            setRepCount(sm.repCount);
            playBeep(880, 150);

            const romScore = sm.minAngle <= 60 ? 98 : 85;
            const newRep: Repetition = {
              id: sm.repCount,
              rep_number: sm.repCount,
              start_time: 0,
              end_time: repDuration,
              duration_seconds: repDuration,
              rep_score: Math.round((romScore + symmetry + 90) / 3),
              alignment_score: symmetry,
              rom_score: romScore,
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
          sm.phase = 'EXTENDED';
          sm.minAngle = 180;
        }
      }
      setCurrentPhase(sm.phase);

    // ==========================================
    // EXERCISE 4: SHOULDER PRESS KINEMATICS & STATE MACHINE
    // ==========================================
    } else if (selectedSlug === 'shoulder_press') {
      const l_elbow = calculateAngle(lms[11], lms[13], lms[15]);
      const r_elbow = calculateAngle(lms[12], lms[14], lms[16]);
      const elbowAngle = Math.round((l_elbow + r_elbow) / 2);
      const symmetry = Math.max(50, Math.min(100, Math.round(100 - Math.abs(l_elbow - r_elbow))));
      
      setPrimaryAngle(elbowAngle);
      setSymmetryRatio(symmetry);

      if (isRecordingRef.current) {
        if ((sm.phase === 'RACK' || sm.phase === 'READY') && elbowAngle > 105) {
          if (now - sm.lastRepCompleteTime > cooldownPeriodMs) {
            sm.phase = 'PRESSING';
            sm.maxAngle = elbowAngle;
            sm.repStartTime = now;
            setActiveCue('Press vertically overhead');
          }
        } else if (sm.phase === 'PRESSING') {
          if (elbowAngle > sm.maxAngle) sm.maxAngle = elbowAngle;
          if (elbowAngle >= 155) {
            sm.phase = 'LOCKOUT';
            setActiveCue('Full overhead lockout reached');
          }
        } else if (sm.phase === 'LOCKOUT') {
          if (elbowAngle < 135) {
            sm.phase = 'LOWERING';
          }
        } else if ((sm.phase === 'LOWERING' || sm.phase === 'PRESSING') && elbowAngle <= 90) {
          const repDuration = (now - sm.repStartTime) / 1000;
          if (repDuration >= 0.8 && sm.maxAngle >= 150) {
            sm.repCount += 1;
            sm.lastRepCompleteTime = now;
            setRepCount(sm.repCount);
            playBeep(880, 150);

            const romScore = sm.maxAngle >= 160 ? 98 : 88;
            const newRep: Repetition = {
              id: sm.repCount,
              rep_number: sm.repCount,
              start_time: 0,
              end_time: repDuration,
              duration_seconds: repDuration,
              rep_score: Math.round((romScore + symmetry + 92) / 3),
              alignment_score: symmetry,
              rom_score: romScore,
              symmetry_score: symmetry,
              tempo_score: 90,
              stability_score: 92,
              peak_angle: sm.maxAngle,
              min_angle: 90,
              is_valid: true
            };
            setSessionReps((prev) => [...prev, newRep]);
            setActiveCue('Strong overhead press rep!');
          }
          sm.phase = 'RACK';
          sm.maxAngle = 0;
        }
      }
      setCurrentPhase(sm.phase);
    }

    ctx.restore();
  }, [selectedSlug]);

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (cameraInstanceRef.current) {
      try {
        cameraInstanceRef.current.stop();
      } catch {}
      cameraInstanceRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
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

    // 1. Check browser mediaDevices support
    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('browser_unsupported');
      setCameraError('Camera API is not supported on this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    const mode = overrideFacingMode || facingMode;

    try {
      let stream: MediaStream;

      // 2. Request real MediaStream via getUserMedia
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr: any) {
        console.warn('Retrying with standard video constraints:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');

        await video.play().catch((playErr) => {
          console.warn('AutoPlay playback warning:', playErr);
        });

        // 3. Load & Initialize MediaPipe Pose Constructors
        const { PoseConstructor, CameraConstructor } = await getMediaPipePoseConstructors();

        const pose = new PoseConstructor({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
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

        // 4. Connect Camera Loop
        if (CameraConstructor) {
          const camera = new CameraConstructor(video, {
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
        } else {
          // Fallback animation frame loop
          const renderLoop = async () => {
            if (videoRef.current && poseInstanceRef.current) {
              await poseInstanceRef.current.send({ image: videoRef.current });
            }
            animFrameIdRef.current = requestAnimationFrame(renderLoop);
          };
          renderLoop();
        }

        setCameraState('ready');
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('permission_denied');
        setCameraError('Camera access was denied. Please allow camera permissions in your browser address bar.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraState('camera_in_use');
        setCameraError('Camera is already in use by another application. Please close other camera tabs and retry.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('camera_unavailable');
        setCameraError('No camera hardware detected on your device.');
      } else {
        setCameraState('camera_unavailable');
        setCameraError(err.message || 'Unable to connect to camera.');
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
      phase: selectedSlug === 'push_up' ? 'PLANK' : selectedSlug === 'shoulder_press' ? 'RACK' : 'STANDING',
      repCount: 0,
      minAngle: 180,
      maxAngle: 0,
      repStartTime: Date.now(),
      lastRepCompleteTime: 0,
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
          }

          savedSession = {
            ...sessionPayload,
            id: newSession?.id,
          };
        }
      } catch (err) {
        console.warn('Supabase session save fallback:', err);
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
          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
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
            className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="squat">Squat</option>
            <option value="pushup">Push-up</option>
            <option value="bicep_curl">Bicep Curl</option>
            <option value="shoulder_press">Shoulder Press</option>
          </select>

          {/* Camera Flip (Mobile Switch) */}
          <button
            onClick={handleToggleCameraFacing}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all"
            title="Flip Camera (Front/Back)"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          {/* Audio Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all"
            title={soundEnabled ? 'Mute Audio Cues' : 'Unmute Audio Cues'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative rounded-3xl overflow-hidden bg-black border border-zinc-800 aspect-[4/3] sm:aspect-video shadow-2xl flex items-center justify-center">
        
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

        {/* Permission Denied Banner */}
        {cameraState === 'permission_denied' && (
          <div className="absolute inset-0 z-30 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Camera Permission Needed</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Camera access is required for real-time form tracking. In mobile Safari or Chrome, tap the permissions icon in your address bar and enable Camera access.
            </p>
            <button
              onClick={() => startCamera()}
              className="px-5 py-2.5 rounded-xl bg-brand-500 text-black text-xs font-bold active:scale-95 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Permission</span>
            </button>
          </div>
        )}

        {/* Camera In Use Banner */}
        {cameraState === 'camera_in_use' && (
          <div className="absolute inset-0 z-30 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3 max-w-md mx-auto">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <h3 className="text-base font-bold text-white">Camera In Use</h3>
            <p className="text-xs text-zinc-400">
              Another app or browser tab is currently using your camera. Please close other camera tabs and tap retry.
            </p>
            <button
              onClick={() => startCamera()}
              className="px-4 py-2 rounded-xl bg-brand-500 text-black text-xs font-bold"
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* Camera Unavailable Banner */}
        {cameraState === 'camera_unavailable' && (
          <div className="absolute inset-0 z-30 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3 max-w-md mx-auto">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <h3 className="text-base font-bold text-white">Connecting Camera</h3>
            <p className="text-xs text-zinc-400">
              {cameraError || 'Ensure your webcam or mobile camera is connected.'}
            </p>
            <button
              onClick={() => startCamera()}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Initializing State */}
        {cameraState === 'requesting_permission' && (
          <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <p className="text-xs text-zinc-300 font-mono">Connecting camera & AI pose tracker...</p>
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
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800">
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

              {/* Stop Set Button */}
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
