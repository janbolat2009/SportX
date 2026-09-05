import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";
import {
  trainerConnectionService,
  CoachPublicInfo,
} from "../../services/trainerConnectionService";
import {
  Camera, X, QrCode, Check, AlertCircle, Loader2,
  UserCheck, ShieldCheck, ArrowLeft, MessageSquare, ExternalLink
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (coach: CoachPublicInfo) => void;
  onOpenChat?: (coachUserId: string) => void;
}

type Step = "scanner" | "confirm" | "success" | "error";

export const ConnectTrainerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConnected,
  onOpenChat,
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("scanner");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [scannedCoach, setScannedCoach] = useState<CoachPublicInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean stop of camera stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera stream for scanning
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn("Camera start warning:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access or enter the code manually below."
          : "Could not access camera. Please enter the trainer code manually."
      );
      setCameraActive(false);
    }
  };

  // Continuous frame scanner
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        handleCodeDetected(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Initialize or stop camera when modal opens/closes or step changes
  useEffect(() => {
    if (isOpen && step === "scanner") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  // Handle scanned or entered code
  const handleCodeDetected = async (rawCode: string) => {
    stopCamera();
    setActionError(null);

    const parsedId = trainerConnectionService.parseConnectionInput(rawCode);
    if (!parsedId) {
      setActionError(t("qr.invalidCode", "Invalid QR code format. Please scan a valid trainer code."));
      setStep("error");
      return;
    }

    try {
      const coach = await trainerConnectionService.getCoachByConnectionId(parsedId);
      if (!coach) {
        setActionError(t("qr.trainerNotFound", "Trainer profile not found. The QR code may be obsolete."));
        setStep("error");
        return;
      }

      if (user?.id && coach.user_id === String(user.id)) {
        setActionError(t("qr.cannotConnectSelf", "You cannot connect to yourself as a trainer."));
        setStep("error");
        return;
      }

      setScannedCoach(coach);
      setStep("confirm");
    } catch (e: any) {
      setActionError(e.message || "Failed to resolve trainer information.");
      setStep("error");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
  };

  // Confirm and create relationship
  const handleConfirmConnection = async () => {
    if (!user?.id || !scannedCoach) return;
    setConnecting(true);
    setActionError(null);

    try {
      const result = await trainerConnectionService.connectAthleteToCoach(
        String(user.id),
        scannedCoach.id
      );

      if (result.success) {
        setStep("success");
        if (onConnected) onConnected(scannedCoach);
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to establish connection.");
    } finally {
      setConnecting(false);
    }
  };

  const resetScanner = () => {
    setScannedCoach(null);
    setActionError(null);
    setManualCode("");
    setStep("scanner");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => {
          stopCamera();
          onClose();
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 shadow-2xl z-10 flex flex-col space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                {t("qr.connectTrainerTitle", "Connect with Trainer")}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                {t("qr.connectTrainerSubtitle", "Scan trainer's QR code to synchronize workouts & telemetry")}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Scanner View */}
        {step === "scanner" && (
          <div className="space-y-4">
            {/* Viewfinder Window */}
            <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-stone-950 border border-stone-300 dark:border-zinc-800 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-full h-full border-2 border-emerald-500/60 rounded-2xl relative shadow-lg">
                  {/* Corner Accents */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-500 rounded-tl-md" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-500 rounded-tr-md" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-500 rounded-bl-md" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-500 rounded-br-md" />

                  {/* Pulsing Scan Line */}
                  <div className="w-full h-0.5 bg-emerald-400/80 shadow-md shadow-emerald-400/50 absolute top-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>

              {/* Loading / Error overlay */}
              {!cameraActive && (
                <div className="absolute inset-0 bg-stone-950/90 flex flex-col items-center justify-center p-4 text-center space-y-2">
                  {cameraError ? (
                    <>
                      <AlertCircle className="w-8 h-8 text-rose-500" />
                      <p className="text-xs text-stone-300 leading-relaxed max-w-xs">{cameraError}</p>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                      <p className="text-xs text-stone-300">{t("qr.startingCamera", "Starting camera...")}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="text-center text-xs text-stone-500 dark:text-zinc-400">
              {t("qr.pointAtTrainerCode", "Point your camera at the trainer's permanent QR code")}
            </p>

            {/* Manual Code Input Fallback */}
            <form onSubmit={handleManualSubmit} className="pt-2 border-t border-stone-200/80 dark:border-zinc-800/80 space-y-2">
              <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300">
                {t("qr.orEnterCode", "Or enter trainer code / link manually:")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={t("qr.manualCodePlaceholder", "e.g. paste URL or coach ID")}
                  className="flex-1 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all active:scale-95"
                >
                  {t("qr.verify", "Verify")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Confirmation Dialog */}
        {step === "confirm" && scannedCoach && (
          <div className="space-y-4 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-brand-400 mx-auto flex items-center justify-center font-bold text-xl shadow-xs overflow-hidden">
              {scannedCoach.avatar_url ? (
                <img src={scannedCoach.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                scannedCoach.full_name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-brand-400 border border-emerald-500/20">
                {t("auth.trainer", "Trainer Verified")}
              </span>
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                {t("qr.connectWithQuestion", `Connect with ${scannedCoach.full_name}?`)}
              </h4>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                {scannedCoach.specialization} • {scannedCoach.organization || "SportX"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 text-left text-xs text-stone-600 dark:text-zinc-400 space-y-1.5">
              <p className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-zinc-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t("qr.whatHappens", "What this connects:")}</span>
              </p>
              <ul className="text-[11px] space-y-1 text-stone-500 dark:text-zinc-400 list-disc list-inside">
                <li>{t("qr.sync1", "Trainer can review your exercise technique & form alerts")}</li>
                <li>{t("qr.sync2", "Direct messaging and feedback communication becomes active")}</li>
                <li>{t("qr.sync3", "Your workouts & repetition progress will appear in trainer hub")}</li>
              </ul>
            </div>

            {actionError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-center font-medium">
                {actionError}
              </p>
            )}

            {/* Single Primary Action Button: "Connect" */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmConnection}
                disabled={connecting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("qr.connecting", "Connecting...")}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>{t("qr.confirmConnect", "Connect")}</span>
                  </>
                )}
              </button>

              <button
                onClick={resetScanner}
                disabled={connecting}
                className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                {t("common.cancel", "Scan another code")}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success State */}
        {step === "success" && scannedCoach && (
          <div className="space-y-4 text-center py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30 animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                {t("qr.connectedSuccess", "Successfully Connected!")}
              </h4>
              <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                {t("qr.connectedSuccessDesc", `You and ${scannedCoach.full_name} are now connected. You can now chat and receive real-time coaching feedback.`)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3">
              {onOpenChat && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenChat(scannedCoach.user_id);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t("qr.openChat", "Open Chat")}</span>
                </button>
              )}

              <button
                onClick={onClose}
                className={`py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 font-bold text-xs transition-all active:scale-95 ${
                  onOpenChat ? "" : "col-span-2"
                }`}
              >
                {t("common.done", "Done")}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Error State */}
        {step === "error" && (
          <div className="space-y-4 text-center py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                {t("qr.connectionFailed", "Connection Issue")}
              </h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed max-w-xs mx-auto">
                {actionError || t("qr.defaultError", "Could not establish connection with trainer.")}
              </p>
            </div>

            <button
              onClick={resetScanner}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold transition-all active:scale-95"
            >
              {t("qr.tryAgain", "Try Again")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
