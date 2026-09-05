import React, { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";
import {
  trainerConnectionService,
  CoachPublicInfo,
} from "../../services/trainerConnectionService";
import {
  Camera, X, QrCode, Check, AlertCircle, Loader2,
  UserCheck, ShieldCheck, MessageSquare, Upload,
  Flashlight, FlashlightOff, Keyboard, ArrowRight
} from "lucide-react";

interface BarcodeDetectorInstance {
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorInstance;
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (coach: CoachPublicInfo) => void;
  onOpenChat?: (coachUserId: string) => void;
}

type Step = "scanner" | "confirm" | "success" | "error";
type InputTab = "camera" | "upload" | "manual";

export const ConnectTrainerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConnected,
  onOpenChat,
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("scanner");
  const [activeTab, setActiveTab] = useState<InputTab>("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannedCoach, setScannedCoach] = useState<CoachPublicInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setTorchAvailable(false);
  }, []);

  // Handle scanned or entered code
  const handleCodeDetected = useCallback(async (rawCode: string) => {
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

      if (user?.id && (coach.user_id === String(user.id) || coach.id === String(user.id))) {
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
  }, [stopCamera, t, user?.id]);

  // Continuous frame scanner loop
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    if (video.readyState < video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    // 1. Hardware-accelerated BarcodeDetector if supported
    if (typeof window !== "undefined" && window.BarcodeDetector) {
      try {
        if (!barcodeDetectorRef.current) {
          barcodeDetectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
        }
        const barcodes = await barcodeDetectorRef.current.detect(video);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          if (navigator.vibrate) navigator.vibrate(40);
          handleCodeDetected(barcodes[0].rawValue);
          return;
        }
      } catch {
        // Fallback to jsQR
      }
    }

    // 2. High-performance software fallback via jsQR
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const targetWidth = Math.min(video.videoWidth || 640, 720);
      const targetHeight = Math.round(
        targetWidth * ((video.videoHeight || 480) / (video.videoWidth || 640))
      );

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data) {
          if (navigator.vibrate) navigator.vibrate(40);
          handleCodeDetected(code.data);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleCodeDetected]);

  // Start camera stream for scanning
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        },
      });

      streamRef.current = stream;

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() as any) || {};
        if (capabilities.torch) {
          setTorchAvailable(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn("Camera access note:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? t("qr.cameraAccessError", "Camera permission denied. Please allow camera access or use photo upload / manual entry.")
          : t("qr.cameraUnavailable", "Could not access camera. Try photo upload or manual entry below.")
      );
      setCameraActive(false);
    }
  }, [scanFrame, stopCamera, t]);

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await (track.applyConstraints as any)({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn("Torch constraint not applied:", err);
    }
  };

  // Image Upload / Screenshot decoder
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        // 1. Hardware BarcodeDetector
        if (typeof window !== "undefined" && window.BarcodeDetector) {
          try {
            const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
            const barcodes = await detector.detect(img);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              if (navigator.vibrate) navigator.vibrate(40);
              handleCodeDetected(barcodes[0].rawValue);
              return;
            }
          } catch {}
        }

        // 2. jsQR fallback
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          if (code && code.data) {
            if (navigator.vibrate) navigator.vibrate(40);
            handleCodeDetected(code.data);
            return;
          }
        }

        setActionError(t("qr.noCodeInImage", "No QR code detected in this photo. Please upload a clear photo or enter the code."));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle manual input
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
  };

  // Confirm connection
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

  // Lifecycle
  useEffect(() => {
    if (isOpen && step === "scanner" && activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step, activeTab, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
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
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-brand-400 flex items-center justify-center font-bold shadow-xs">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white leading-tight">
                {t("qr.connectTitle", "Connect with Trainer")}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                {t("qr.scanInstruction", "Scan trainer’s QR code to link workouts & feedback")}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* STEP 1: Scanner View with 3 Modes */}
        {step === "scanner" && (
          <div className="space-y-4">
            
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-stone-100 dark:bg-zinc-950 border border-stone-200/80 dark:border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("camera")}
                className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "camera"
                    ? "bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-brand-400" />
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab("upload");
                  fileInputRef.current?.click();
                }}
                className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "upload"
                    ? "bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-brand-400" />
                <span>Photo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab("manual");
                }}
                className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "manual"
                    ? "bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 text-emerald-600 dark:text-brand-400" />
                <span>Code</span>
              </button>
            </div>

            {/* Hidden file input for Photo Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* TAB 1: Live Camera Viewfinder */}
            {activeTab === "camera" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-stone-950 border border-stone-200 dark:border-zinc-800 shadow-lg flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Elegant Viewfinder Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                    <div className="w-full h-full relative rounded-2xl">
                      {/* Corner Highlights */}
                      <span className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-emerald-500 dark:border-brand-400 rounded-tl-xl shadow-xs" />
                      <span className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-emerald-500 dark:border-brand-400 rounded-tr-xl shadow-xs" />
                      <span className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-emerald-500 dark:border-brand-400 rounded-bl-xl shadow-xs" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-emerald-500 dark:border-brand-400 rounded-br-xl shadow-xs" />

                      {/* Smooth Gliding Scan Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 dark:via-brand-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-md shadow-emerald-400/50" />
                    </div>
                  </div>

                  {/* Flashlight button if available */}
                  {torchAvailable && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-md ${
                        torchOn
                          ? "bg-amber-500 text-black"
                          : "bg-black/50 text-white hover:bg-black/70"
                      }`}
                      title={torchOn ? "Turn off torch" : "Turn on torch"}
                    >
                      {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Camera starting or error overlay */}
                  {!cameraActive && (
                    <div className="absolute inset-0 bg-stone-950/95 flex flex-col items-center justify-center p-5 text-center space-y-3">
                      {cameraError ? (
                        <>
                          <AlertCircle className="w-8 h-8 text-rose-500" />
                          <p className="text-xs text-stone-300 leading-relaxed max-w-xs">{cameraError}</p>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                            >
                              Upload Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab("manual")}
                              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
                            >
                              Enter Code
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                          <p className="text-xs text-stone-300 font-medium">
                            {t("qr.startingCamera", "Opening camera...")}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-stone-500 dark:text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t("qr.pointAtTrainerCode", "Point camera at trainer’s QR code")}</span>
                </div>
              </div>
            )}

            {/* TAB 2: Photo / Screenshot Upload */}
            {activeTab === "upload" && (
              <div className="space-y-3 py-4 text-center animate-in fade-in duration-200">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-3xl border-2 border-dashed border-stone-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-brand-400 cursor-pointer transition-all bg-stone-50 dark:bg-zinc-950 space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-brand-400 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-white">
                      Select QR Code Screenshot or Photo
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">
                      PNG, JPG, or screenshot from Telegram/WhatsApp
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Choose Photo
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Manual Code Entry */}
            {activeTab === "manual" && (
              <form onSubmit={handleManualSubmit} className="space-y-3 py-2 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                    {t("qr.orEnterCode", "Enter Trainer ID or Connection URL:")}
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. paste connection link or coach UUID"
                    className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span>{t("qr.findTrainer", "Find Trainer")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {actionError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-center font-medium">
                {actionError}
              </p>
            )}
          </div>
        )}

        {/* STEP 2: Confirmation Dialog */}
        {step === "confirm" && scannedCoach && (
          <div className="space-y-4 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-brand-400 mx-auto flex items-center justify-center font-bold text-2xl shadow-sm overflow-hidden">
              {scannedCoach.avatar_url ? (
                <img src={scannedCoach.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                scannedCoach.full_name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-brand-400 border border-emerald-500/20">
                {t("auth.trainer", "Verified Trainer")}
              </span>
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                {t("qr.confirmConnect", `Connect with ${scannedCoach.full_name}?`)}
              </h4>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                {scannedCoach.specialization} • {scannedCoach.organization || "SportX"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 text-left text-xs text-stone-600 dark:text-zinc-400 space-y-1.5">
              <p className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-zinc-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
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
                type="button"
                onClick={handleConfirmConnection}
                disabled={connecting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-brand-500 dark:hover:bg-brand-400 dark:text-black font-bold text-xs shadow-md shadow-emerald-600/20 dark:shadow-brand-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("qr.connecting", "Connecting...")}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>{t("qr.connectBtn", "Connect")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
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
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30">
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
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChat(scannedCoach.user_id);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t("qr.openChat", "Message Trainer")}</span>
                </button>
              )}

              <button
                type="button"
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
              type="button"
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
