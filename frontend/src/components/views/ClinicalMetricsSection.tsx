import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { OverallCadCard } from '../dashboard/OverallCadCard';
import { VesselCardsList } from '../dashboard/VesselCardsList';
import { ShapWaterfallChart } from '../dashboard/ShapWaterfallChart';
import { PhysiologyTable } from '../dashboard/PhysiologyTable';
import { MetricsTable } from '../trust/MetricsTable';
import { RocCurveChart } from '../trust/RocCurveChart';
import { CalibrationCurveChart } from '../trust/CalibrationCurveChart';
import { ConfusionMatrixCard } from '../trust/ConfusionMatrixCard';
import { GlassPanel } from '../common/GlassPanel';
import { Target } from '../../config/vessels.config';
import {
  Activity,
  Award,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

export const ClinicalMetricsSection: React.FC = () => {
  const {
    patient,
    metrics,
  } = useAppStore();

  const [activeModelTarget, setActiveModelTarget] = useState<Target>('CAD');
  const [activeCurveTab, setActiveCurveTab] = useState<'roc' | 'calibration' | 'confusion'>('roc');

  if (!patient) {
    return (
      <GlassPanel variant="default" className="w-full p-8 text-center space-y-3">
        <Activity className="w-10 h-10 text-teal-400/60 mx-auto animate-pulse" />
        <h3 className="text-base font-bold text-slate-200 font-mono">
          No Clinical Vector Loaded
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please select a sample patient profile in the Patient Input section to compute CAD and coronary vessel stenosis predictions.
        </p>
      </GlassPanel>
    );
  }

  const currentMetrics = metrics?.[activeModelTarget];

  return (
    <div className="w-full flex-1 space-y-4 overflow-y-auto max-h-[calc(100vh-8.5rem)] pr-1">
      {/* 1. TOP ROW: Multi-Target Risk Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Overall CAD Composite Risk Card */}
        <div className="lg:col-span-4">
          <OverallCadCard />
        </div>

        {/* 3 Coronary Artery Stenosis Cards */}
        <div className="lg:col-span-8">
          <VesselCardsList />
        </div>
      </div>

      {/* 2. MIDDLE ROW: SHAP Waterfall & Feature Attributions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SHAP Waterfall Diverging Chart */}
        <div className="lg:col-span-7">
          <ShapWaterfallChart />
        </div>

        {/* Physiology Biomarker Table with Inline Reference Tracks */}
        <div className="lg:col-span-5">
          <PhysiologyTable />
        </div>
      </div>

      {/* 3. BOTTOM ROW: Model Trust, 10-Fold Cross-Validation Rigor & Curves */}
      <GlassPanel variant="default" className="space-y-4">
        {/* Header & Anti-Leakage Methodology Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-xs font-mono uppercase text-slate-100 font-bold tracking-wider">
                Model Trust, 10-Fold Cross-Validation & Validation Diagnostics
              </h3>
              <p className="text-[11px] text-slate-400">
                Rigorous multi-task validation on the Z-Alizadeh Sani Cardiovascular Dataset
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300 text-[11px] font-mono font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            Zero Target Leakage
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sub-column: Comparative Benchmark Table */}
          <div className="lg:col-span-6 space-y-2">
            <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Cross-Target Performance Summary
            </span>
            <MetricsTable
              metrics={metrics}
              selectedTarget={activeModelTarget}
              onSelectTarget={setActiveModelTarget}
            />
          </div>

          {/* Right Sub-column: Interactive Diagnostic Validation Curves */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-teal-400" />
                Validation Curves ({activeModelTarget})
              </span>

              {/* Curve Tab Switcher */}
              <div className="flex p-0.5 bg-slate-900 rounded-md border border-white/10 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setActiveCurveTab('roc')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    activeCurveTab === 'roc'
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ROC
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCurveTab('calibration')}
                  className={`px-2 py-0.5 rounded transition-colors ${
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
                  className={`px-2 py-0.5 rounded transition-colors ${
                    activeCurveTab === 'confusion'
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Confusion
                </button>
              </div>
            </div>

            {/* Target Diagnostic View */}
            {currentMetrics && (
              <div>
                {activeCurveTab === 'roc' && (
                  <RocCurveChart
                    target={activeModelTarget}
                    targetMetrics={currentMetrics}
                  />
                )}
                {activeCurveTab === 'calibration' && (
                  <CalibrationCurveChart
                    target={activeModelTarget}
                    targetMetrics={currentMetrics}
                  />
                )}
                {activeCurveTab === 'confusion' && (
                  <ConfusionMatrixCard
                    target={activeModelTarget}
                    targetMetrics={currentMetrics}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
