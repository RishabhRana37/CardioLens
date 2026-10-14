import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TARGET_LIST, Target } from '../../config/vessels.config';
import { MetricsTable } from './MetricsTable';
import { RocCurveChart } from './RocCurveChart';
import { CalibrationCurveChart } from './CalibrationCurveChart';
import { ConfusionMatrixCard } from './ConfusionMatrixCard';
import { GlobalShapList } from './GlobalShapList';
import {
  ShieldCheck,
  X,
  Award,
  CheckCircle2,
  Database,
  Brain,
  FileCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ModelTrustDrawer: React.FC = () => {
  const {
    isModelTrustOpen,
    closeModelTrust,
    metrics,
    selectedVessel,
  } = useAppStore();

  const [activeTarget, setActiveTarget] = useState<Target>('CAD');
  const [activeCurveTab, setActiveCurveTab] = useState<'roc' | 'calibration' | 'confusion'>('roc');

  // Sync active target with selected vessel when drawer opens
  useEffect(() => {
    if (selectedVessel) {
      setActiveTarget(selectedVessel);
    } else {
      setActiveTarget('CAD');
    }
  }, [selectedVessel, isModelTrustOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModelTrustOpen) {
        closeModelTrust();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModelTrustOpen, closeModelTrust]);

  if (!isModelTrustOpen) return null;

  const currentMetrics = metrics?.[activeTarget];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-slate-950/70 backdrop-blur-md transition-opacity">
        {/* Backdrop click to dismiss */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={closeModelTrust}
          aria-label="Close Model Trust Drawer"
        />

        {/* Slide-over Drawer Content */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-slate-950 border-l border-white/10 shadow-2xl flex flex-col h-full z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-glow-teal">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-100 font-mono">
                    Model Trust & Validation
                  </h2>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-500/30 font-semibold">
                    10-Fold CV Rigor
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Multimodal Cardiac Risk Validation & Explainability Diagnostics
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeModelTrust}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* MANDATORY METHODOLOGY & LEAKAGE BANNER */}
            <div className="p-3.5 rounded-lg bg-teal-950/40 border border-teal-500/30 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-teal-300 font-mono text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                Validated Clinical Methodology & Zero Target Leakage
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Evaluated under <strong>Stratified 10-fold cross-validation</strong>. Angiography ground-truth labels (<code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">LAD</code>, <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">LCX</code>, <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">RCA</code>, <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">Cath</code>) are strictly excluded from model inputs — ensuring <strong>zero target leakage</strong>.
              </p>
            </div>

            {/* Target Model Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="uppercase tracking-wider font-semibold">Select Diagnostic Model</span>
                <span>4 Task Heads</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-white/10">
                {TARGET_LIST.map((target) => {
                  const isSelected = activeTarget === target;
                  const m = metrics?.[target];
                  return (
                    <button
                      key={target}
                      type="button"
                      onClick={() => setActiveTarget(target)}
                      className={`py-2 px-2 rounded-md font-mono text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{target}</span>
                      {m && (
                        <span className="text-[10px] font-normal opacity-85">
                          AUC {m.roc_auc.toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Model Performance Highlights */}
            {currentMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div className="p-3 rounded-lg bg-slate-900/70 border border-white/5 space-y-0.5">
                  <span className="text-[10px] uppercase text-slate-400 block font-medium">
                    ROC-AUC (10-Fold)
                  </span>
                  <div className="text-base font-bold text-teal-300">
                    {currentMetrics.cv.roc_auc_mean.toFixed(3)}
                  </div>
                  <span className="text-[9px] text-slate-400 block">
                    ± {currentMetrics.cv.roc_auc_std.toFixed(3)} std
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-white/5 space-y-0.5">
                  <span className="text-[10px] uppercase text-slate-400 block font-medium">
                    Accuracy
                  </span>
                  <div className="text-base font-bold text-slate-100">
                    {(currentMetrics.accuracy * 100).toFixed(1)}%
                  </div>
                  <span className="text-[9px] text-slate-400 block">
                    Cohort holdout
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-white/5 space-y-0.5">
                  <span className="text-[10px] uppercase text-slate-400 block font-medium">
                    Sensitivity / Recall
                  </span>
                  <div className="text-base font-bold text-teal-300">
                    {(currentMetrics.recall * 100).toFixed(1)}%
                  </div>
                  <span className="text-[9px] text-slate-400 block">
                    True positive rate
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-white/5 space-y-0.5">
                  <span className="text-[10px] uppercase text-slate-400 block font-medium">
                    F1-Score
                  </span>
                  <div className="text-base font-bold text-slate-100">
                    {(currentMetrics.f1 * 100).toFixed(1)}%
                  </div>
                  <span className="text-[9px] text-slate-400 block">
                    Harmonic mean
                  </span>
                </div>
              </div>
            )}

            {/* Cross-Target Comparative Table */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-300 font-bold">
                <Award className="w-3.5 h-3.5 text-teal-400" />
                Cross-Target Benchmark Table
              </div>
              <MetricsTable
                metrics={metrics}
                selectedTarget={activeTarget}
                onSelectTarget={setActiveTarget}
              />
            </div>

            {/* Validation Diagnostic Curves (Tabbed) */}
            {currentMetrics && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-teal-400" />
                    Validation Diagnostics
                  </span>

                  {/* Curve switcher */}
                  <div className="flex p-0.5 bg-slate-900 rounded-md border border-white/10 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveCurveTab('roc')}
                      className={`px-2 py-1 rounded transition-colors ${
                        activeCurveTab === 'roc'
                          ? 'bg-teal-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ROC Curve
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCurveTab('calibration')}
                      className={`px-2 py-1 rounded transition-colors ${
                        activeCurveTab === 'calibration'
                          ? 'bg-teal-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Calibration
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCurveTab('confusion')}
                      className={`px-2 py-1 rounded transition-colors ${
                        activeCurveTab === 'confusion'
                          ? 'bg-teal-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Confusion Matrix
                    </button>
                  </div>
                </div>

                {/* Active Diagnostic View */}
                <div>
                  {activeCurveTab === 'roc' && (
                    <RocCurveChart
                      target={activeTarget}
                      targetMetrics={currentMetrics}
                    />
                  )}
                  {activeCurveTab === 'calibration' && (
                    <CalibrationCurveChart
                      target={activeTarget}
                      targetMetrics={currentMetrics}
                    />
                  )}
                  {activeCurveTab === 'confusion' && (
                    <ConfusionMatrixCard
                      target={activeTarget}
                      targetMetrics={currentMetrics}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Global SHAP Hierarchy */}
            {currentMetrics && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-300 font-bold">
                  <Brain className="w-3.5 h-3.5 text-teal-400" />
                  Global Interpretability Hierarchy
                </div>
                <GlobalShapList
                  target={activeTarget}
                  targetMetrics={currentMetrics}
                />
              </div>
            )}

            {/* Provenance & Architecture Specs */}
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-white/5 space-y-2 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold uppercase text-[11px]">
                <Database className="w-3.5 h-3.5 text-teal-400" />
                Data Provenance & Model Architecture
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li>
                  <strong className="text-slate-300">Cohort:</strong> Z-Alizadeh Sani Cardiovascular Dataset (N=303 patients, 55 demographic, symptom, ECG, laboratory & echocardiographic features).
                </li>
                <li>
                  <strong className="text-slate-300">Model Architecture:</strong> Multi-Task Extreme Gradient Boosting (XGBoost) Ensemble with Isotonic Probability Calibration.
                </li>
                <li>
                  <strong className="text-slate-300">Explainability Engine:</strong> TreeSHAP (Lundberg et al., Nature Machine Intelligence) computing exact Shapley values.
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-mono text-slate-400">
              CardioTwin Validation Suite v1.0
            </span>
            <button
              type="button"
              onClick={closeModelTrust}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
