import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DatasetItem, ModelBenchmarkResult, HumanAiAgreementStats } from '../../types';
import {
  Cpu, Database, Sparkles, FileText, Download, Play, CheckCircle2,
  AlertCircle, Table, BarChart2, ShieldCheck, Layers, Award
} from 'lucide-react';

export const ResearchLaboratory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'datasets' | 'agreement' | 'export'>('benchmarks');
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<ModelBenchmarkResult | null>(null);
  const [agreementStats, setAgreementStats] = useState<HumanAiAgreementStats | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [exportDataJson, setExportDataJson] = useState<string | null>(null);

  useEffect(() => {
    async function loadResearchMetadata() {
      try {
        const [dsData, agreeData] = await Promise.all([
          api.getDatasets(),
          api.getHumanAgreementStats()
        ]);
        setDatasets(dsData);
        setAgreementStats(agreeData);
      } catch (e) {
        console.error(e);
      }
    }
    loadResearchMetadata();
  }, []);

  const handleRunBenchmark = async () => {
    setBenchmarkLoading(true);
    try {
      const res = await api.runBenchmark({ n_samples: 400 });
      setBenchmarkResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleFetchExport = async () => {
    try {
      const data = await api.getExportData();
      setExportDataJson(JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Research Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-950 flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md font-bold">
              Scientific Research Mode
            </span>
            <span className="text-xs text-slate-400 font-medium">Kinematic Evaluation & Model Benchmarks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            SportX Research Laboratory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Evaluate computer vision models, compare temporal sequence vs. classical algorithms, verify human-AI inter-rater agreement, and export reproducible study data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab('export');
              handleFetchExport();
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-200 transition-all"
          >
            <Download className="w-4 h-4 text-purple-400" />
            Export Research Dataset
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'benchmarks'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Model Benchmark Suite
        </button>

        <button
          onClick={() => setActiveTab('datasets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'datasets'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          Dataset Registry ({datasets.length})
        </button>

        <button
          onClick={() => setActiveTab('agreement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'agreement'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Human Expert vs. AI Agreement
        </button>

        <button
          onClick={() => {
            setActiveTab('export');
            handleFetchExport();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'export'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          Anonymized Data Exporter
        </button>
      </div>

      {/* Tab 1: Model Benchmark Suite */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Comparative Model Benchmark</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Trains and evaluates Random Forest, Gradient Boosting, Temporal 1D-CNN, and Rule State Machines on strict subject-wise splits.
              </p>
            </div>
            <button
              onClick={handleRunBenchmark}
              disabled={benchmarkLoading}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 disabled:bg-slate-800 transition-all"
            >
              {benchmarkLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Executing Cross-Subject Benchmark...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Run Live Benchmark Experiment
                </>
              )}
            </button>
          </div>

          {benchmarkResult ? (
            <div className="space-y-6 animate-in fade-in">
              {/* Models Comparison Table */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                      <th className="pb-3 font-semibold">Model Architecture</th>
                      <th className="pb-3 font-semibold">Accuracy</th>
                      <th className="pb-3 font-semibold">Weighted F1</th>
                      <th className="pb-3 font-semibold">Precision</th>
                      <th className="pb-3 font-semibold">Recall</th>
                      <th className="pb-3 font-semibold">Latency (ms)</th>
                      <th className="pb-3 font-semibold">FPS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {Object.entries(benchmarkResult.models).map(([key, m]: any) => (
                      <tr key={key} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 font-bold text-white font-sans flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                          {m.model_type.replace('_', ' ')}
                        </td>
                        <td className="py-3.5 text-emerald-400 font-bold">{(m.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-3.5 text-slate-200">{m.f1_score.toFixed(3)}</td>
                        <td className="py-3.5 text-slate-300">{m.precision.toFixed(3)}</td>
                        <td className="py-3.5 text-slate-300">{m.recall.toFixed(3)}</td>
                        <td className="py-3.5 text-cyan-400">{m.latency_ms.toFixed(2)} ms</td>
                        <td className="py-3.5 text-purple-400">{Math.round(m.latency_fps)} FPS</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confusion Matrix Visualizer for Temporal Model */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800">
                <h4 className="text-sm font-bold text-white mb-3">
                  Multi-Class Confusion Matrix (Temporal Sequence 1D-CNN)
                </h4>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-6 gap-1 min-w-[500px] text-center text-xs font-mono">
                    <div className="p-2 font-sans text-slate-500 text-left">Pred \ True</div>
                    {benchmarkResult.benchmark_metadata.classes.map((cls, i) => (
                      <div key={i} className="p-2 bg-slate-950 rounded-lg text-slate-400 font-bold truncate">
                        {cls.split(' ')[0]}
                      </div>
                    ))}

                    {benchmarkResult.models.temporal_cnn.confusion_matrix.map((row: number[], rowIdx: number) => (
                      <React.Fragment key={rowIdx}>
                        <div className="p-2 bg-slate-950 rounded-lg text-slate-400 font-bold text-left truncate">
                          {benchmarkResult.benchmark_metadata.classes[rowIdx].split(' ')[0]}
                        </div>
                        {row.map((val: number, colIdx: number) => (
                          <div
                            key={colIdx}
                            className={`p-3 rounded-lg flex items-center justify-center font-bold ${
                              rowIdx === colIdx
                                ? 'bg-purple-500/30 border border-purple-500/50 text-white font-extrabold'
                                : val > 0
                                ? 'bg-slate-900/80 text-slate-300'
                                : 'bg-slate-950/40 text-slate-600'
                            }`}
                          >
                            {val}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center text-slate-400">
              <Cpu className="w-10 h-10 text-purple-400/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">Benchmark Ready to Run</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Click 'Run Live Benchmark Experiment' to train models and generate evaluation metrics with subject-wise cross validation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dataset Registry */}
      {activeTab === 'datasets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((ds) => (
            <div key={ds.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold">
                  {ds.license}
                </span>
                <span className="text-xs text-slate-400 font-mono">{ds.sample_count} Samples</span>
              </div>
              <h4 className="text-base font-bold text-white">{ds.dataset_name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{ds.labels_description}</p>
              
              <div className="pt-3 border-t border-slate-800/80 text-xs space-y-1">
                <p className="text-slate-300"><span className="text-slate-500">Exercises:</span> {ds.exercises_covered}</p>
                <p className="text-slate-300"><span className="text-slate-500">Subjects:</span> {ds.subject_count} Cohort</p>
                <p className="text-amber-400/90 text-[11px]"><span className="text-slate-500">Limitations:</span> {ds.limitations}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Human Expert vs AI Agreement */}
      {activeTab === 'agreement' && agreementStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-3xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono">Pearson Correlation (r)</span>
              <p className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                {agreementStats.agreement_metrics.pearson_r}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">{agreementStats.agreement_metrics.agreement_strength}</p>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono">Spearman Rank (rho)</span>
              <p className="text-3xl font-extrabold text-cyan-400 font-mono mt-1">
                {agreementStats.agreement_metrics.spearman_rho}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Monotonic Rank Agreement</p>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono">Mean Absolute Error</span>
              <p className="text-3xl font-extrabold text-purple-400 font-mono mt-1">
                {agreementStats.agreement_metrics.mae} pts
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Avg Score Disparity</p>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono">Cohen's Kappa (κ)</span>
              <p className="text-3xl font-extrabold text-amber-400 font-mono mt-1">
                {agreementStats.agreement_metrics.cohens_kappa}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Categorical Error Agreement</p>
            </div>
          </div>

          {/* Sample Comparison Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 overflow-x-auto">
            <h4 className="text-sm font-bold text-white mb-4">Sample Score Comparisons (Human Coach vs. AI)</h4>
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="pb-3">Sample</th>
                  <th className="pb-3">Human Coach Score</th>
                  <th className="pb-3">AI Score</th>
                  <th className="pb-3">Delta</th>
                  <th className="pb-3">Coach Error Diagnosis</th>
                  <th className="pb-3">AI Detected Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {agreementStats.sample_comparisons.map((sc) => (
                  <tr key={sc.sample_id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 text-slate-400">#{sc.sample_id}</td>
                    <td className="py-2.5 text-white font-bold">{sc.human_score}</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{sc.ai_score}</td>
                    <td className="py-2.5 text-cyan-300">{sc.score_delta > 0 ? `+${sc.score_delta}` : sc.score_delta}</td>
                    <td className="py-2.5 font-sans text-slate-300">{sc.human_error || 'Optimal Form'}</td>
                    <td className="py-2.5 font-sans text-slate-300">{sc.ai_error || 'Optimal Form'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Anonymized Data Exporter */}
      {activeTab === 'export' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Anonymized Kinematic JSON Export</h3>
              <p className="text-xs text-slate-400">Complies with HIPAA Safe Harbor / GDPR research anonymization standards.</p>
            </div>
            <button
              onClick={() => {
                if (!exportDataJson) return;
                const blob = new Blob([exportDataJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sportx_research_export_${Date.now()}.json`;
                a.click();
              }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
            >
              <Download className="w-4 h-4" /> Download JSON
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-purple-300 font-mono max-h-96 overflow-y-auto">
            {exportDataJson || 'Loading export dataset...'}
          </pre>
        </div>
      )}

    </div>
  );
};
