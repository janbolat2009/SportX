import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../i18n/LanguageContext";
import { coachService } from "../../services/coachService";
import { workoutService } from "../../services/workoutService";
import { CoachRosterAthlete, NotificationItem, Exercise } from "../../types";
import {
  Users, AlertTriangle, Dumbbell, Calendar,
  ChevronRight, Search, ShieldCheck, Loader2
} from "lucide-react";
import { AssignWorkoutModal } from "./AssignWorkoutModal";
import { AthleteDetailModal } from "./AthleteDetailModal";

export const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [roster, setRoster] = useState<CoachRosterAthlete[]>([]);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | string | null>(null);
  const [assigningAthlete, setAssigningAthlete] = useState<CoachRosterAthlete | null>(null);

  const loadCoachData = async () => {
    try {
      const coachUserIdStr = user?.id ? String(user.id) : undefined;
      const [rosterData, alertsData, exercisesData] = await Promise.all([
        coachService.getSupervisedAthletes(coachUserIdStr || ""),
        coachService.getCoachAlerts(coachUserIdStr || ""),
        workoutService.getExercises()
      ]);
      setRoster(rosterData);
      setAlerts(alertsData);
      setExercises(exercisesData);
    } catch (e) {
      console.error("Failed to load coach data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoachData();
  }, [user]);

  const filteredRoster = roster.filter(
    (a) =>
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-zinc-400 font-mono">{t("trainer.loading", "Loading supervised athlete roster & technique telemetry...")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="p-5 sm:p-7 rounded-3xl bg-surface-card border border-surface-border flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-subtle text-brand-400 border border-surface-border px-2.5 py-0.5 rounded-lg">
              {t("auth.trainer", "Trainer")}
            </span>
            <span className="text-xs text-zinc-400">{t("trainer.subtitle", "Supervised athletes & movement telemetry")}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
            {t("trainer.title", "Trainer Dashboard")}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            {t("trainer.subtitle", "Monitor movement patterns, review AI technique alerts, and prescribe structured training workouts.")}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border flex items-center gap-3 shadow-xs">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-mono">{t("trainer.activeAthletes", "Active Athletes")}</p>
            <p className="text-2xl font-black text-white font-mono leading-none mt-0.5">{roster.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-brand-400 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Athlete Roster */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="p-5 rounded-3xl bg-surface-card border border-surface-border space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                <span>{t("nav.athletes", "Athletes")} ({filteredRoster.length})</span>
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t("trainer.searchPlaceholder", "Search athlete or sport...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Roster Cards List */}
            {filteredRoster.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-subtle border border-surface-border text-center space-y-2">
                <p className="text-xs text-zinc-400 font-semibold">{t("trainer.noAthletes", "No connected athletes found.")}</p>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                  {t("trainer.noAthletesDesc", "When athletes connect to your trainer account, their technique reports and sessions will appear here.")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRoster.map((athlete) => (
                  <div
                    key={String(athlete.athlete_id)}
                    className="p-4 rounded-2xl bg-surface-subtle border border-surface-border hover:border-surface-borderLight transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div
                      onClick={() => setSelectedAthleteId(athlete.athlete_id)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-xs text-brand-400 shrink-0 shadow-xs">
                        {athlete.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white hover:text-brand-400 transition-colors">
                          {athlete.full_name}
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          {athlete.sport} • {athlete.training_level}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block">
                          {t("trainer.avgScore", "Avg Score")}
                        </span>
                        <span className="text-sm font-bold text-white font-mono">
                          {Math.round(athlete.average_technique_score ?? athlete.recent_average_score ?? 85)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAssigningAthlete(athlete)}
                          className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition-all shadow-xs"
                        >
                          {t("trainer.assign", "Assign")}
                        </button>

                        <button
                          onClick={() => setSelectedAthleteId(athlete.athlete_id)}
                          className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                          title={t("trainer.viewDetails", "View Details")}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Col: Technique Alerts Feed */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-surface-card border border-surface-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-attention" />
                <span>{t("trainer.techniqueAlerts", "Technique Alerts")}</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">{alerts.length} Active</span>
            </div>

            <div className="space-y-2.5">
              {alerts.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">
                  {t("trainer.noAlerts", "No active technique warnings.")}
                </p>
              ) : (
                alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">{alt.title}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {alt.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{alt.message}</p>
                    <span className="text-[9px] text-zinc-500 font-mono block pt-1">
                      {new Date(alt.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Assign Workout Modal */}
      {assigningAthlete && (
        <AssignWorkoutModal
          athlete={assigningAthlete}
          athleteId={assigningAthlete.athlete_id as any}
          athleteName={assigningAthlete.full_name}
          exercises={exercises}
          onClose={() => setAssigningAthlete(null)}
          onSuccess={() => {
            setAssigningAthlete(null);
            loadCoachData();
          }}
        />
      )}

      {/* Athlete Detail Modal */}
      {selectedAthleteId && (
        <AthleteDetailModal
          athleteId={selectedAthleteId as any}
          onClose={() => setSelectedAthleteId(null)}
        />
      )}

    </div>
  );
};
