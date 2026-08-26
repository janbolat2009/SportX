import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Exercise } from '../../types';
import {
  UploadCloud, FileVideo, CheckCircle2, AlertTriangle, ArrowLeft,
  Sparkles, Award, Clock, Activity, ShieldAlert, ChevronRight, BarChart3
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onViewSessionDetail?: (sessionId: number) => void;
}

export const VideoUploadStudio: React.FC<Props> = ({ onBack, onViewSessionDetail }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('squat');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [report, setReport] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        const data = await api.getExercises();
        setExercises(data);
      } catch (e) {
        console.error(e);
      }
    }
    loadExercises();
  }, []);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await api.uploadVideo(selectedFile, selectedSlug);
      setReport(res.report);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h2 className="text-lg font-extrabold text-white">Video Technique Analysis Studio</h2>
      </div>

      {!report ? (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Exercise Selection */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider block mb-2">
              Select Exercise to Analyze
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {exercises.map((ex) => (
                <button
                  key={ex.slug}
                  onClick={() => setSelectedSlug(ex.slug)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedSlug === ex.slug
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-sm text-white">{ex.name}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{ex.target_muscles.split(',')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="glass-panel p-8 rounded-3xl border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 transition-all text-center flex flex-col items-center justify-center cursor-pointer bg-slate-900/40"
          >
            <input
              type="file"
              id="video-input"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="video-input" className="cursor-pointer flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">
                {selectedFile ? selectedFile.name : 'Drag & drop exercise video'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports MP4, MOV, or WEBM format (recommended max duration: 60 seconds).
              </p>
            </label>

            {selectedFile && (
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full">
                <FileVideo className="w-4 h-4" />
                <span>{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB file ready</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleUploadAndAnalyze}
            disabled={!selectedFile || isUploading}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
              !selectedFile || isUploading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                Analyzing Kinematics & Pose Estimation...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run AI Technique Analysis
              </>
            )}
          </button>

        </div>
      ) : (
        /* Detailed Video Analysis Report */
        <div className="space-y-6 animate-in fade-in">
          
          {/* Top Score Summary Banner */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                    {report.exercise_slug.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Video Processing Complete</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white mt-1">Biomechanical Assessment Report</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyzed {report.total_frames_processed} frames ({report.video_duration_seconds}s) at {report.processing_fps} FPS.
                </p>
              </div>

              {/* Overall Score Dial */}
              <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Overall Technique Score</p>
                  <p className="text-3xl font-extrabold text-white font-mono leading-none">{report.overall_score}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-lg">
                  {report.overall_score >= 90 ? 'A' : report.overall_score >= 75 ? 'B' : 'C'}
                </div>
              </div>
            </div>

            {/* AI Feedback Summary Box */}
            <div className="mt-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-300 mb-0.5">Automated Biomechanical Feedback:</p>
                <p>{report.feedback_summary}</p>
              </div>
            </div>
          </div>

          {/* Sub-Score Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium">Alignment</p>
              <p className="text-xl font-extrabold text-white font-mono mt-1">{report.alignment_score}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium">Range of Motion</p>
              <p className="text-xl font-extrabold text-white font-mono mt-1">{report.rom_score}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium">Symmetry</p>
              <p className="text-xl font-extrabold text-white font-mono mt-1">{report.symmetry_score}%</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium">Tempo & Cadence</p>
              <p className="text-xl font-extrabold text-white font-mono mt-1">{report.tempo_score}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
              <p className="text-[11px] text-slate-400 font-medium">Stability</p>
              <p className="text-xl font-extrabold text-white font-mono mt-1">{report.stability_score}</p>
            </div>
          </div>

          {/* Repetition-by-Repetition Inspector */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <span>Repetition Breakdown ({report.total_reps} Reps Segmented)</span>
              <span className="text-xs text-emerald-400 font-mono">{report.valid_reps} Valid Reps</span>
            </h4>

            <div className="space-y-3">
              {report.repetitions.map((rep: any) => (
                <div
                  key={rep.rep_number}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-white">
                      #{rep.rep_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Score: {rep.rep_score}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          rep.is_valid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {rep.is_valid ? 'Valid Form' : 'Deviation Flagged'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Duration: {rep.duration_seconds}s • Min Angle: {rep.min_angle}°
                      </p>
                    </div>
                  </div>

                  {/* Errors in rep */}
                  <div className="flex flex-wrap gap-1.5">
                    {rep.detected_errors && rep.detected_errors.length > 0 ? (
                      rep.detected_errors.map((err: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300"
                        >
                          {err.error_name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Form
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setReport(null);
                setSelectedFile(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold hover:text-white"
            >
              Analyze Another Video
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20"
            >
              Return to Athlete Dashboard
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
