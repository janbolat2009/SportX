import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, Sun, Maximize2, User } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface Props {
  videoElement: HTMLVideoElement | null;
  landmarks: any[] | null;
  onQualityPass: () => void;
  onCancel: () => void;
}

export const CameraQualityCheck: React.FC<Props> = ({ videoElement, landmarks, onQualityPass, onCancel }) => {
  const { t } = useTranslation();
  const [personVisible, setPersonVisible] = useState(false);
  const [fullBodyVisible, setFullBodyVisible] = useState(false);
  const [distanceStatus, setDistanceStatus] = useState<'too_close' | 'too_far' | 'optimal'>('optimal');
  const [lightingStatus, setLightingStatus] = useState<'too_dark' | 'optimal'>('optimal');
  const [feedbackPromptKey, setFeedbackPromptKey] = useState('camera.promptPosition');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!videoElement) return;

    const interval = setInterval(() => {
      // 1. Lighting Check (measure frame luminance)
      if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, 64, 64);
          const imgData = ctx.getImageData(0, 0, 64, 64).data;
          let totalLuminance = 0;
          for (let i = 0; i < imgData.length; i += 4) {
            totalLuminance += (imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114);
          }
          const avgLuminance = totalLuminance / (imgData.length / 4);
          if (avgLuminance < 40) {
            setLightingStatus('too_dark');
          } else {
            setLightingStatus('optimal');
          }
        }
      }

      // 2. Pose & Landmark Check
      if (landmarks && landmarks.length >= 33) {
        setPersonVisible(true);

        const nose = landmarks[0];
        const l_sh = landmarks[11];
        const r_sh = landmarks[12];
        const l_hip = landmarks[23];
        const r_hip = landmarks[24];
        const l_knee = landmarks[25];
        const r_knee = landmarks[26];
        const l_ank = landmarks[27];
        const r_ank = landmarks[28];

        const keyJoints = [nose, l_sh, r_sh, l_hip, r_hip, l_knee, r_knee, l_ank, r_ank];
        const visibleJoints = keyJoints.filter((j) => j && (j.visibility || 1.0) > 0.45);

        // Full body requires head, hips, and at least knees/ankles
        const isFull = visibleJoints.length >= 7;
        setFullBodyVisible(isFull);

        // Height ratio check (from nose/shoulders to ankles)
        const minY = Math.min(...keyJoints.map((j) => j.y));
        const maxY = Math.max(...keyJoints.map((j) => j.y));
        const bodyHeightRatio = maxY - minY;

        if (bodyHeightRatio > 0.92) {
          setDistanceStatus('too_close');
          setFeedbackPromptKey('camera.promptStepBack');
        } else if (bodyHeightRatio < 0.35) {
          setDistanceStatus('too_far');
          setFeedbackPromptKey('camera.promptMoveCloser');
        } else if (!isFull) {
          setFeedbackPromptKey('camera.promptEnsureJoints');
        } else {
          setDistanceStatus('optimal');
          setFeedbackPromptKey('camera.promptReady');
        }
      } else {
        setPersonVisible(false);
        setFullBodyVisible(false);
        setFeedbackPromptKey('camera.promptStandInFront');
      }
    }, 250);

    return () => clearInterval(interval);
  }, [videoElement, landmarks]);

  const allChecksPass = personVisible && fullBodyVisible && distanceStatus === 'optimal' && lightingStatus === 'optimal';

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-5 max-w-md w-full mx-auto shadow-xl animate-in fade-in">
      <div className="flex items-center gap-2.5 pb-3 border-b border-surface-border">
        <ShieldCheck className="w-5 h-5 text-brand-400" />
        <div>
          <h3 className="text-sm font-bold text-white">{t('camera.readinessCheck')}</h3>
          <p className="text-xs text-zinc-400">{t('camera.readinessDesc')}</p>
        </div>
      </div>

      <div className="py-3.5 space-y-2.5">
        {/* Checklist Item 1: Person Detected */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle border border-surface-border">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-200">{t('camera.personDetected')}</span>
          </div>
          {personVisible ? (
            <span className="text-[11px] font-semibold text-status-good flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('camera.detected')}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> {t('camera.searching')}
            </span>
          )}
        </div>

        {/* Checklist Item 2: Full Body in Frame */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle border border-surface-border">
          <div className="flex items-center gap-2.5">
            <Maximize2 className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-200">{t('camera.fullBodyFraming')}</span>
          </div>
          {fullBodyVisible ? (
            <span className="text-[11px] font-semibold text-status-good flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('camera.inFrame')}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-status-attention flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {t('camera.stepBackPrompt')}
            </span>
          )}
        </div>

        {/* Checklist Item 3: Lighting Check */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle border border-surface-border">
          <div className="flex items-center gap-2.5">
            <Sun className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-200">{t('camera.envLighting')}</span>
          </div>
          {lightingStatus === 'optimal' ? (
            <span className="text-[11px] font-semibold text-status-good flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('camera.goodLight')}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-status-attention flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {t('camera.lowLight')}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      <div className={`p-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2 ${
        allChecksPass
          ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
          : 'bg-zinc-800/80 text-zinc-300 border border-zinc-700'
      }`}>
        {allChecksPass ? <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-status-attention shrink-0" />}
        <span>{t(feedbackPromptKey)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold transition-colors"
        >
          {t('camera.cancel')}
        </button>
        <button
          onClick={onQualityPass}
          className="flex-[2] py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <span>{t('camera.startTraining')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

