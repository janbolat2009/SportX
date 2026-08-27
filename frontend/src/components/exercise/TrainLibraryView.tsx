import React, { useState, useEffect } from 'react';
import { exerciseService } from '../../services/exerciseService';
import { Exercise, ExerciseCategory } from '../../types';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import {
  Search, Dumbbell, Sparkles, Filter, Play, CheckCircle2,
  ChevronRight, ArrowRight, Loader2, X, Activity, Layers
} from 'lucide-react';

interface Props {
  onStartLiveCamera: (exerciseSlug?: string) => void;
  onStartVideoUpload: () => void;
}

export const TrainLibraryView: React.FC<Props> = ({ onStartLiveCamera, onStartVideoUpload }) => {
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiOnly, setAiOnly] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');

  // Selected Detail Modal
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cats, exs] = await Promise.all([
          exerciseService.getCategories(),
          exerciseService.getExercises({
            categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
            search: searchQuery || undefined,
            analysisSupportedOnly: aiOnly || undefined,
            difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
            equipment: equipmentFilter !== 'all' ? equipmentFilter : undefined,
          }),
        ]);
        setCategories(cats);
        setExercises(exs);
      } catch (err) {
        console.error('Failed to load exercises:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCategory, searchQuery, aiOnly, difficultyFilter, equipmentFilter]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setAiOnly(false);
    setDifficultyFilter('all');
    setEquipmentFilter('all');
  };

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'advanced':
      case 'elite':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-surface-card border border-surface-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-800 text-brand-400 text-[10px] font-bold uppercase tracking-wider border border-surface-border">
            <Dumbbell className="w-3 h-3" />
            <span>Kinematic Movement Catalog</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight mt-2">
            Exercise & Technique Library
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Choose an exercise to review biomechanical execution cues, watch form breakdowns, or check your live technique with 3D pose tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartLiveCamera('squat')}
            className="px-5 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-black transition-all shadow-md shadow-brand-500/20 flex items-center gap-1.5 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Camera Studio</span>
          </button>
        </div>
      </div>

      {/* 2. Instant Search Bar & Filter Controls */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search exercises by name, muscle group, equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-surface-border rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Horizontal Category Filter Chips */}
        <div className="overflow-x-auto pb-1.5 no-scrollbar -mx-1 px-1">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-brand-500 text-black shadow-sm'
                  : 'bg-surface-subtle border border-surface-border text-zinc-400 hover:text-white'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-brand-500 text-black shadow-sm'
                    : 'bg-surface-subtle border border-surface-border text-zinc-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAiOnly(!aiOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                aiOnly
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                  : 'bg-surface-subtle border-surface-border text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Analysis Available</span>
            </button>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-surface-subtle border border-surface-border text-zinc-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="bg-surface-subtle border border-surface-border text-zinc-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Equipment</option>
              <option value="Bodyweight">Bodyweight</option>
              <option value="Dumbbell">Dumbbells</option>
              <option value="Barbell">Barbell</option>
              <option value="Cable">Cable</option>
            </select>
          </div>

          {(selectedCategory !== 'all' || searchQuery || aiOnly || difficultyFilter !== 'all' || equipmentFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-xs text-zinc-400 hover:text-brand-400 underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

      </div>

      {/* 3. Exercise Cards Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 space-y-3">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">Querying exercise catalog from Supabase...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="p-10 rounded-3xl bg-surface-card border border-surface-border text-center space-y-3">
          <p className="text-sm font-bold text-white">No exercises match your filter criteria.</p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try clearing filters or searching for terms like "squat", "pushup", "biceps", or "press".
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl bg-brand-500 text-black text-xs font-bold"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-surface-border hover:border-surface-borderLight cursor-pointer transition-all hover:translate-y-[-1px] group flex flex-col justify-between gap-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-surface-border">
                    {exercise.category_name || 'Strength'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getDifficultyBadge(exercise.difficulty)}`}>
                    {exercise.difficulty || 'Intermediate'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-brand-400 transition-colors">
                    {exercise.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {exercise.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-surface-border">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Target: <span className="text-zinc-200 font-medium">{exercise.target_muscles.split(',')[0]}</span></span>
                  <span className="font-mono">{exercise.ideal_rom_degrees || 90}° ROM</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  {exercise.analysis_supported ? (
                    <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Biomechanics
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">Technique Guide</span>
                  )}

                  <span className="text-xs text-brand-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onStartAnalysis={(slug) => onStartLiveCamera(slug)}
        />
      )}

    </div>
  );
};
