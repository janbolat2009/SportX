import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CoachRosterAthlete, NotificationItem, Exercise } from '../../types';
import {
  Award, Users, AlertTriangle, ShieldAlert, Dumbbell, Calendar,
  MessageSquare, Plus, ChevronRight, CheckCircle2, User, Search
} from 'lucide-react';
import { AssignWorkoutModal } from './AssignWorkoutModal';
import { AthleteDetailModal } from './AthleteDetailModal';

export const CoachDashboard: React.FC = () => {
  const [roster, setRoster] = useState<CoachRosterAthlete[]>([]);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [assigningAthlete, setAssigningAthlete] = useState<CoachRosterAthlete | null>(null);

  useEffect(() => {
    async function loadCoachData() {
      try {
        const [rosterData, alertsData, exercisesData] = await Promise.all([
          api.getCoachRoster(),
          api.getCoachAlerts(),
          api.getExercises()
        ]);
        setRoster(rosterData);
        setAlerts(alertsData);
        setExercises(exercisesData);
      } catch (e) {
        console.error('Failed to load coach data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCoachData();
  }, []);

  const filteredRoster = roster.filter(
    (a) =>
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-950 flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md font-bold">
              Coach Command Center
            </span>
            <span className="text-xs text-slate-400 font-medium">Youth Biomechanics Monitoring</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            Athlete Roster & Technique Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Monitor remote athletes, inspect AI biomechanical warnings, track holistic readiness, and assign structured training plans.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-mono">Active Athletes</p>
            <p className="text-2xl font-extrabold text-white font-mono">{roster.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Athlete Roster */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Supervised Athletes ({filteredRoster.length})</span>
              </h3>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search athlete or sport..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 w-56"
                />
              </div>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500 text-center py-8">Loading roster...</p>
            ) : filteredRoster.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No athletes found matching query.</p>
            ) : (
              <div className="space-y-3">
                {filteredRoster.map((athlete) => (
                  <div
                    key={athlete.athlete_id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-extrabold text-cyan-400">
                        {athlete.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{athlete.full_name}</h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {athlete.anonymized_subject_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {athlete.sport} • {athlete.training_level}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400">Avg Technique</p>
                        <p className="font-mono font-extrabold text-sm text-emerald-400">
                          {athlete.recent_average_score > 0 ? `${athlete.recent_average_score}/100` : 'No data'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAssigningAthlete(athlete)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Assign
                        </button>
                        <button
                          onClick={() => setSelectedAthleteId(athlete.athlete_id)}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Right Col: Prioritized Technique Alerts Feed */}
        <div className="space-y-6">
          
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Technique Alerts</h3>
              </div>
              <span className="text-xs text-amber-400 font-mono font-bold">
                {alerts.filter((a) => a.severity === 'ALERT').length} High Priority
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                <p className="text-xs">All athlete movement metrics are within acceptable variance.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className={`p-3.5 rounded-2xl border text-xs transition-colors ${
                      alt.severity === 'ALERT'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {alt.severity === 'ALERT' ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold text-white">{alt.title}</p>
                        <p className="mt-1 text-slate-300 leading-relaxed">{alt.message}</p>
                        <span className="mt-2 inline-block text-[10px] text-slate-400 font-mono">
                          {new Date(alt.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Assign Workout Modal */}
      {assigningAthlete && (
        <AssignWorkoutModal
          athlete={assigningAthlete}
          exercises={exercises}
          onClose={() => setAssigningAthlete(null)}
          onSuccess={() => {
            setAssigningAthlete(null);
          }}
        />
      )}

      {/* Athlete Detail Modal */}
      {selectedAthleteId && (
        <AthleteDetailModal
          athleteId={selectedAthleteId}
          onClose={() => setSelectedAthleteId(null)}
        />
      )}

    </div>
  );
};
