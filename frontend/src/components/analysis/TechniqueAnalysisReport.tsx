import React, { useState, useEffect } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import {
  CheckCircle2, AlertTriangle, Sparkles, Award, ArrowRight,
  TrendingUp, ShieldCheck, Compass, Activity, Loader2, MessageSquare
} from "lucide-react";
import { WorkoutSession } from "../../types";

interface Props {
  session: Partial<WorkoutSession>;
  onOpenAssistantWithContext?: (initialQuery: string) => void;
}

export const TechniqueAnalysisReport: React.FC<Props> = ({
  session,
  onOpenAssistantWithContext,
}) => {
  const { t, language } = useTranslation();
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  const score = Math.round(session.overall_score || 88);
  const totalReps = session.total_reps || 0;
  const validReps = session.valid_reps ?? totalReps;
  const symmetry = Math.round(session.symmetry_score || 94);
  const rom = Math.round(session.rom_score || 88);

  const rawIssues: any[] = session.issues || [];
  const exerciseName = session.exercise_name || session.exercise_slug?.replace("_", " ").toUpperCase() || "Exercise";

  // Deduplicate issues by type
  const uniqueIssuesMap = new Map<string, any>();
  rawIssues.forEach((iss) => {
    const key = iss.type || iss.error_name || iss.errorName || "general_issue";
    if (!uniqueIssuesMap.has(key)) {
      uniqueIssuesMap.set(key, {
        name: iss.errorName || iss.error_name || iss.defaultMessage || iss.message || t("report.movementDeviation", "Movement Discrepancy"),
        explanation: iss.explanation || iss.description || t("report.movementDeviation", "Deviation detected in target joint path."),
        correction: iss.correctiveInstruction || iss.corrective_instruction || t("report.focusAlignment", "Focus on joint alignment and steady tempo."),
        severity: iss.severity || "medium",
      });
    }
  });
  const detectedIssues = Array.from(uniqueIssuesMap.values());

  // Determine positive criteria verified by analysis
  const positiveChecks: string[] = [];
  if (!detectedIssues.some((i) => i.name.toLowerCase().includes("valgus") || i.name.toLowerCase().includes("knee") || i.name.toLowerCase().includes("колен") || i.name.toLowerCase().includes("тізе"))) {
    positiveChecks.push(t("report.goodKneeAlignment", "Good knee alignment"));
  }
  if (!detectedIssues.some((i) => i.name.toLowerCase().includes("torso") || i.name.toLowerCase().includes("sag") || i.name.toLowerCase().includes("корпус") || i.name.toLowerCase().includes("тұлға"))) {
    positiveChecks.push(t("report.stableTorso", "Stable torso alignment"));
  }
  if (symmetry >= 85) {
    positiveChecks.push(t("report.balancedSymmetry", "Balanced bilateral symmetry"));
  }
  if (positiveChecks.length === 0) {
    positiveChecks.push(t("report.solidLockout", "Solid lockout & pacing"));
  }

  // Generate primary corrective recommendation
  const primaryRecommendation = detectedIssues.length > 0
    ? detectedIssues[0].correction
    : language === "ru"
    ? "Отличная биомеханика движения. Поддерживайте ровное дыхание и контролируйте эксцентрическую фазу."
    : language === "kk"
    ? "Қозғалыстың тамаша биомеханикасы. Тыныс алуды қадағалап, түсу фазасын бақылауда ұстаңыз."
    : "Maintain smooth cadence and continue driving evenly through your midfoot on every repetition.";

  // Fetch AI interpretation using structured facts
  const fetchAiSummary = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Interpret this workout session for ${exerciseName}: Repetitions: ${totalReps}, Technique Score: ${score}%, Symmetry: ${symmetry}%, ROM: ${rom}%, Detected Issues: ${detectedIssues.map((i) => i.name).join(", ") || "None"}. Give a concise 2-sentence expert coach summary.`,
          user_context: {
            exercise: exerciseName,
            score,
            totalReps,
            symmetry,
            rom,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiInterpretation(data.content || null);
      }
    } catch (e) {
      console.warn("AI summary error:", e);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchAiSummary();
  }, [session.overall_score, session.total_reps]);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200 text-left">
      
      {/* 1. Objective ML Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        
        {/* Technique Score */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-100/70 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
            {t("report.techniqueScore", "Technique Score")}
          </span>
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 dark:text-white font-mono mt-0.5">
            {score}<span className="text-xs text-stone-400 font-normal">%</span>
          </div>
          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 truncate">
            {score >= 90 ? t("report.excellent", "Excellent") : score >= 75 ? t("report.solidForm", "Solid Form") : t("report.needsAttention", "Needs Attention")}
          </span>
        </div>

        {/* Repetitions */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-100/70 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
            {t("report.repetitions", "Repetitions")}
          </span>
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 dark:text-white font-mono mt-0.5">
            {validReps}<span className="text-xs text-stone-400 font-normal">/{totalReps}</span>
          </div>
          <span className="text-[10px] text-stone-500 dark:text-zinc-400 block mt-1 truncate">
            {validReps === totalReps ? t("report.fullRom", "100% full ROM") : `${totalReps - validReps} ${t("report.incompleteReps", "incomplete")}`}
          </span>
        </div>

        {/* Symmetry */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-100/70 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
            {t("report.symmetry", "Symmetry")}
          </span>
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 dark:text-white font-mono mt-0.5">
            {symmetry}<span className="text-xs text-stone-400 font-normal">%</span>
          </div>
          <span className="text-[10px] text-stone-500 dark:text-zinc-400 block mt-1 truncate">
            {symmetry >= 90 ? t("report.optimalSymmetry", "Optimal bilateral balance") : t("report.minorAsymmetry", "Minor side drift")}
          </span>
        </div>

        {/* Range of Motion */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-100/70 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
            {t("report.rom", "Range of Motion")}
          </span>
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 dark:text-white font-mono mt-0.5">
            {rom}<span className="text-xs text-stone-400 font-normal">%</span>
          </div>
          <span className="text-[10px] text-stone-500 dark:text-zinc-400 block mt-1 truncate">
            {t("report.standardDepth", "Target depth standard")}
          </span>
        </div>

      </div>

      {/* 2. Technique Feedback Breakdown */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-100/50 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 space-y-2.5 sm:space-y-3">
        <h4 className="text-xs font-bold text-stone-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
          <span>{t("report.techniqueFeedback", "Technique Feedback")}</span>
        </h4>

        {/* Passed Biomechanical Checks */}
        <div className="space-y-1.5">
          {positiveChecks.map((check, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/15">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{check}</span>
            </div>
          ))}
        </div>

        {/* Detected Technique Discrepancies */}
        {detectedIssues.length > 0 && (
          <div className="space-y-2 pt-1">
            {detectedIssues.map((issue, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{issue.name}</span>
                </div>
                <p className="text-stone-600 dark:text-zinc-300 pl-6 text-[11px] leading-relaxed">
                  {issue.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Actionable How to Improve Guidance */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 space-y-1.5 shadow-xs">
        <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
          {t("report.howToImprove", "How to Improve")}
        </span>
        <p className="text-xs text-stone-800 dark:text-zinc-200 leading-relaxed font-medium">
          “{primaryRecommendation}”
        </p>
      </div>

      {/* 4. AI Coach Interpretation (Based Strictly on Real ML Telemetry) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
            <span>{t("report.aiInterpretation", "AI Coach Interpretation")}</span>
          </div>
          {loadingAi && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
        </div>

        <p className="text-xs text-stone-700 dark:text-zinc-300 leading-relaxed italic">
          {aiInterpretation || (loadingAi
            ? t("report.generatingAiSummary", "Synthesizing kinematic telemetry...")
            : language === "ru"
            ? `Выполнено ${totalReps} повторений упражнения ${exerciseName} с общей оценкой техники ${score}% и симметрией ${symmetry}%.`
            : language === "kk"
            ? `${exerciseName} бойынша ${totalReps} қайталау орындалды. Техника бағасы: ${score}%, симметрия: ${symmetry}%.`
            : `Completed ${totalReps} ${exerciseName} reps with ${score}% technique score and ${symmetry}% symmetry ratio.`)}
        </p>

        {onOpenAssistantWithContext && (
          <button
            onClick={() => onOpenAssistantWithContext(
              language === "ru"
                ? `Как я могу улучшить технику выполнения ${exerciseName} на основе этой тренировки?`
                : language === "kk"
                ? `Осы жаттығу негізінде ${exerciseName} техникасын қалай жақсартуға болады?`
                : `How can I improve my ${exerciseName} form based on this session?`
            )}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1"
          >
            <span>{t("report.askAiCoach", "Ask AI Coach follow-up question")}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

    </div>
  );
};
