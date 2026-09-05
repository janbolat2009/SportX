import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { trainerConnectionService, CoachConnectionPayload } from "../../services/trainerConnectionService";
import {
  QrCode, Maximize2, Copy, Check, Share2, Sparkles, X,
  ShieldCheck, Loader2
} from "lucide-react";

interface Props {
  className?: string;
  compact?: boolean;
}

export const CoachQRCodeCard: React.FC<Props> = ({ className = "", compact = false }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [payload, setPayload] = useState<CoachConnectionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);

  useEffect(() => {
    async function loadQR() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await trainerConnectionService.getCoachConnectionPayload(
          String(user.id),
          user.full_name || "Trainer"
        );
        setPayload(data);
      } catch (err) {
        console.error("Failed to load QR payload:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQR();
  }, [user]);

  const handleCopyLink = async () => {
    if (!payload?.shareUrl) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload.shareUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-2 text-stone-400 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-brand-400" />
        <span className="text-xs">{t("qr.generating", "Generating trainer connection QR...")}</span>
      </div>
    );
  }

  if (!payload) return null;

  return (
    <>
      <div
        className={`p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4 ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                {t("qr.myQrCode", "My Trainer QR Code")}
              </h3>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400">
              {t("qr.scanInstruction", "Athletes can scan to connect directly")}
            </p>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-brand-400 border border-emerald-500/20 shrink-0">
            {t("qr.permanent", "Permanent")}
          </span>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#faf8f5] dark:bg-zinc-950 border border-stone-200/80 dark:border-zinc-800/80 space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow-xs border border-stone-200/60 inline-flex">
            <QRCodeSVG
              value={payload.qrValue}
              size={compact ? 130 : 155}
              level="M"
              includeMargin={false}
              fgColor="#18181b"
              bgColor="#ffffff"
            />
          </div>

          <div className="text-center space-y-0.5">
            <p className="text-xs font-bold text-stone-900 dark:text-white">
              {payload.coachName}
            </p>
            <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
              {payload.specialization}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            onClick={() => setIsEnlarged(true)}
            className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{t("qr.enlarge", "Enlarge")}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t("qr.copied", "Copied!")}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t("qr.copyLink", "Share Link")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Enlarged QR Modal */}
      {isEnlarged && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsEnlarged(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-6 shadow-2xl z-10 flex flex-col items-center space-y-4 text-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEnlarged(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-brand-400 border border-emerald-500/20">
                {t("auth.trainer", "Trainer")}
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {payload.coachName}
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                {payload.specialization}
              </p>
            </div>

            {/* Large High-Contrast QR Code */}
            <div className="p-4 bg-white rounded-3xl shadow-md border border-stone-200/80">
              <QRCodeSVG
                value={payload.qrValue}
                size={230}
                level="Q"
                includeMargin={false}
                fgColor="#09090b"
                bgColor="#ffffff"
              />
            </div>

            <p className="text-xs text-stone-600 dark:text-zinc-400 max-w-xs leading-relaxed">
              {t("qr.scanToConnectModal", "Ask the athlete to open SportX and tap 'Connect with Trainer' to scan this QR code.")}
            </p>

            <button
              onClick={handleCopyLink}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-90"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t("qr.copied", "Copied to clipboard!")}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t("qr.copyConnectionUrl", "Copy Connection Link")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
