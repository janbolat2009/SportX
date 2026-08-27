import React, { useState, useEffect } from 'react';
import { exerciseService } from '../../services/exerciseService';
import { Exercise, ExerciseCategory } from '../../types';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { getMuscleIcon } from '../common/MuscleIcons';
import {
  Search, Play, Sparkles, ChevronRight, X, Loader2
} from 'lucide-react';

interface Props {
  onStartLiveCamera: (exerciseSlug?: string) => void;
  onStartVideoUpload?: () => void;
}

export const TrainLibraryView: React.FC<Props> = ({ onStartLiveCamera }) => {
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Selected Category (defaults to all or first)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cats, exs] = await Promise.all([
          exerciseService.getCategories(),
          exerciseService.getExercises(),
        ]);
        setCategories(cats);
        setExercises(exs);
      } catch (err) {
        console.error('Failed to load train library data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter exercises
  const filteredExercises = exercises.filter((ex) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = ex.name.toLowerCase().includes(q);
      const matchMuscle = ex.target_muscles.toLowerCase().includes(q);
      const matchEquipment = ex.equipment?.toLowerCase().includes(q);
      if (!matchName && !matchMuscle && !matchEquipment) return false;
    }

    // Category match
    if (selectedCategorySlug !== 'all') {
      const cat = categories.find((c) => c.slug === selectedCategorySlug);
      if (cat && ex.category_id !== cat.id) {
        // Also check if category slug is in target muscles or slug
        const matchCategoryText =
          ex.category_name?.toLowerCase() === cat.name.toLowerCase() ||
          ex.target_muscles.toLowerCase().includes(cat.name.toLowerCase());
        if (!matchCategoryText) return false;
      }
    }

    return true;
  });

  const getDifficultyColor = (difficulty?: string) => {
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
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* 1. Simple Title Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          What do you want to train today?
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Pick a target muscle group to see exercises and check your technique in real time.
        </p>
      </div>

      {/* 2. Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search by exercise name or equipment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Muscle Group Category Carousel / Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Muscle Groups
          </span>
          {selectedCategorySlug !== 'all' && (
            <button
              onClick={() => setSelectedCategorySlug('all')}
              className="text-xs text-brand-400 hover:underline font-medium"
            >
              Show All
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          <button
            onClick={() => setSelectedCategorySlug('all')}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
              selectedCategorySlug === 'all'
                ? 'bg-zinc-800 border-brand-500 text-white ring-1 ring-brand-500/30'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center">
              {getMuscleIcon('full_body', 20)}
            </div>
            <span className="text-xs font-bold truncate max-w-full">All Muscles</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-zinc-800 border-brand-500 text-white ring-1 ring-brand-500/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center">
                  {getMuscleIcon(cat.slug, 20)}
                </div>
                <span className="text-xs font-bold truncate max-w-full">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Exercises List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Available Exercises ({filteredExercises.length})
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            <p className="text-xs text-zinc-500">Loading exercise library...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
            <p className="text-xs text-zinc-400">No exercises found for this category or search.</p>
            <button
              onClick={() => {
                setSelectedCategorySlug('all');
                setSearchQuery('');
              }}
              className="text-xs text-brand-400 font-bold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise)}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    {getMuscleIcon(exercise.slug, 24)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors truncate">
                        {exercise.name}
                      </h3>
                      {exercise.analysis_supported && (
                        <span className="text-[10px] font-bold text-brand-400 flex items-center gap-0.5 shrink-0">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {exercise.target_muscles} • {exercise.equipment || 'Bodyweight'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={`hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getDifficultyColor(exercise.difficulty)}`}>
                    {exercise.difficulty || 'Intermediate'}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartLiveCamera(exercise.slug);
                    }}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-black transition-all flex items-center gap-1.5 active:scale-95"
                    title="Check My Technique"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Check Technique</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Exercise Detail Modal */}
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
