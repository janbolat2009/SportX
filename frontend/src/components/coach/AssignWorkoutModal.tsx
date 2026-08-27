import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { workoutService } from '../../services/workoutService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { CoachRosterAthlete, Exercise } from '../../types';
import { Dumbbell, X, Check, Loader2 } from 'lucide-react';

interface Props {
  athlete?: CoachRosterAthlete;
  athleteId?: number | string;
  athleteName?: string;
  exercises: Exercise[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignWorkoutModal: React.FC<Props> = ({ athlete, athleteId, athleteName, exercises, onClose, onSuccess }) => {
  const { user } = useAuth();
  const targetAthleteId = athlete?.athlete_id || athleteId || 1;
  const targetAthleteName = athlete?.full_name || athleteName || 'Athlete';
  const [selectedExId, setSelectedExId] = useState<number>(exercises[0]?.id || 1);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [tempo, setTempo] = useState('3-1-2');
  const [rom, setRom] = useState(90);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured() && user?.id) {
        // Get coach profile ID
        const { data: cp } = await supabase
          .from('coach_profiles')
          .select('id')
          .eq('user_id', String(user.id))
          .maybeSingle();

        const selectedEx = exercises.find((ex) => ex.id === selectedExId);

        await workoutService.assignWorkout({
          coach_id: cp?.id || null,
          athlete_id: String(targetAthleteId),
          exercise_id: selectedExId,
          title: selectedEx?.name || 'Assigned Exercise',
          target_sets: sets,
          target_reps: reps,
          target_tempo: tempo,
          target_rom: rom,
          notes,
          is_completed: false
        });
      } else {
        await api.assignExercise({
          athlete_id: targetAthleteId as any,
          exercise_id: selectedExId,
          target_sets: sets,
          target_reps: reps,
          target_tempo: tempo,
          target_rom: rom,
          notes
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to assign workout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Dumbbell className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Assign Exercise Program</h3>
              <p className="text-xs text-slate-400">Athlete: {targetAthleteName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Select Exercise</label>
            <select
              value={selectedExId}
              onChange={(e) => setSelectedExId(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.target_muscles.split(',')[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Sets</label>
              <input
                type="number"
                min="1"
                max="10"
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Reps</label>
              <input
                type="number"
                min="1"
                max="50"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Prescribed Cadence / Tempo</label>
              <input
                type="text"
                placeholder="e.g. 3-1-2"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target ROM (Degrees)</label>
              <input
                type="number"
                value={rom}
                onChange={(e) => setRom(parseFloat(e.target.value) || 90)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Coach Instructions & Movement Focus</label>
            <textarea
              rows={3}
              placeholder="e.g. Focus on driving knees out and controlling the 3-second descent."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
