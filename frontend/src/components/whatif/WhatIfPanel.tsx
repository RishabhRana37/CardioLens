import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { WhatIfDeltaCard } from './WhatIfDeltaCard';
import { WhatIfSliderControl } from './WhatIfSliderControl';
import { WhatIfToggleControl } from './WhatIfToggleControl';
import { Target } from '../../api/types';
import {
  RotateCcw,
  Sparkles,
  Sliders,
  AlertTriangle,
  HeartPulse,
  Activity,
  Flame,
  CheckCircle2,
  GitCompare,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const WhatIfPanel: React.FC = () => {
  const {
    patient,
    baseline,
    predictions,
    baselinePredictions,
    selectedVessel,
    selectVessel,
    setFeature,
    resetWhatIf,
    isPredicting,
    isCompareMode,
    toggleCompareMode,
  } = useAppStore();

  const currentFeatures = patient || {};
  const baselineFeatures = baseline || {};

  // Count modified features
  const modifiedCount = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(currentFeatures)) {
      if (baselineFeatures[key] !== undefined && currentFeatures[key] !== baselineFeatures[key]) {
        count++;
      }
    }
    return count;
  }, [currentFeatures, baselineFeatures]);

  // Calculate overall delta summary
  const overallDeltaSummary = useMemo(() => {
    if (!predictions || !baselinePredictions) return null;
    const cadDelta = (predictions.CAD?.probability ?? 0) - (baselinePredictions.CAD?.probability ?? 0);
    const ladDelta = (predictions.LAD?.probability ?? 0) - (baselinePredictions.LAD?.probability ?? 0);
    const lcxDelta = (predictions.LCX?.probability ?? 0) - (baselinePredictions.LCX?.probability ?? 0);
    const rcaDelta = (predictions.RCA?.probability ?? 0) - (baselinePredictions.RCA?.probability ?? 0);

    const avgDelta = (cadDelta + ladDelta + lcxDelta + rcaDelta) / 4;
    const avgPct = Math.round(avgDelta * 100);

    if (avgDelta <= -0.02) {
      return {
        type: 'improved' as const,
        text: `Risk reduced by avg ${Math.abs(avgPct)}% across coronary vessels`,
      };
    }
    if (avgDelta >= 0.02) {
      return {
        type: 'worsened' as const,
        text: `Risk escalated by avg +${avgPct}% across coronary vessels`,
      };
    }
    return {
      type: 'neutral' as const,
      text: 'Parameters match baseline reference snapshot',
    };
  }, [predictions, baselinePredictions]);

  // Preset Handlers for instant demo
  const applyOptimalPreset = () => {
    setFeature('Current Smoker', 0);
    setFeature('LDL', 70);
    setFeature('BP', 115);
    setFeature('FBS', 85);
    setFeature('Typical Chest Pain', 0);
    setFeature('Dyspnea', 0);
    setFeature('TG', 120);
    setFeature('HDL', 55);
  };

  const applyAdversePreset = () => {
    setFeature('Current Smoker', 1);
    setFeature('LDL', 195);
    setFeature('BP', 165);
    setFeature('FBS', 190);
    setFeature('Typical Chest Pain', 1);
    setFeature('TG', 280);
    setFeature('HDL', 28);
  };

  if (!patient) {
    return (
      <div className="p-4 text-center text-slate-400 font-mono text-xs">
        Load a patient to begin What-If digital twin simulation.
      </div>
    );
  }

  const targets: Target[] = ['CAD', 'LAD', 'LCX', 'RCA'];

  return (
    <div className="space-y-4">
      {/* Header & Clinical Safety Micro-Copy */}
      <div className="space-y-1.5 border-b border-white/5 pb-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
              What-If Digital Twin
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isPredicting && (
              <span className="text-[10px] font-mono text-teal-400 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Computing...
              </span>
            )}
            {modifiedCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-500/30">
                {modifiedCount} modified
              </span>
            )}
          </div>
        </div>

        {/* Regulatory Safety Framing Micro-Copy */}
        <p className="text-[10px] text-slate-400 leading-relaxed italic bg-slate-900/60 p-2 rounded border border-white/5">
          "Exploring how modifiable factors relate to the model's predicted risk — not a treatment recommendation."
        </p>
      </div>

      {/* Live Delta Risk Grid (CAD, LAD, LCX, RCA) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
          <span className="font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 text-teal-400" /> Real-time Vessel Deltas
          </span>
          <span className="text-[9px] text-slate-400">vs. Baseline</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {targets.map((target) => (
            <WhatIfDeltaCard
              key={target}
              target={target}
              current={predictions?.[target]}
              baseline={baselinePredictions?.[target]}
              isSelected={selectedVessel === target || (target === 'CAD' && selectedVessel === null)}
              onSelect={() => selectVessel(target === 'CAD' ? null : target)}
            />
          ))}
        </div>

        {/* Dynamic Summary Pill */}
        {overallDeltaSummary && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-2 rounded text-[11px] font-mono flex items-center gap-2 border ${
              overallDeltaSummary.type === 'improved'
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                : overallDeltaSummary.type === 'worsened'
                ? 'bg-rose-950/50 text-rose-300 border-rose-500/30'
                : 'bg-slate-900/40 text-slate-400 border-white/5'
            }`}
          >
            {overallDeltaSummary.type === 'improved' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            {overallDeltaSummary.type === 'worsened' && (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            {overallDeltaSummary.type === 'neutral' && (
              <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className="truncate">{overallDeltaSummary.text}</span>
          </motion.div>
        )}
      </div>

      {/* Quick Demo Actions & Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={toggleCompareMode}
          className={`py-1.5 px-2.5 rounded text-[10px] font-mono font-bold border transition-all flex items-center justify-center gap-1.5 ${
            isCompareMode
              ? 'bg-teal-950/90 text-teal-300 border-teal-400 shadow-glow-teal ring-1 ring-teal-400/50'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-white/10 hover:text-white'
          }`}
          title="Toggle Side-by-Side Baseline vs Modified Twin Stage (Key: C)"
        >
          <GitCompare className="w-3 h-3 text-teal-400" />
          <span>{isCompareMode ? 'Exit Compare' : 'Compare Twins'}</span>
        </button>

        <button
          type="button"
          onClick={applyOptimalPreset}
          className="flex-1 py-1.5 px-2 rounded text-[10px] font-mono font-medium bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center justify-center gap-1"
          title="Simulate optimal lifestyle: Quit smoking, low LDL (70), normal BP (115)"
        >
          <Sparkles className="w-2.5 h-2.5" /> Optimal Lifestyle
        </button>

        <button
          type="button"
          onClick={applyAdversePreset}
          className="flex-1 py-1.5 px-2 rounded text-[10px] font-mono font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors flex items-center justify-center gap-1"
          title="Simulate acute risk factors: Active smoker, high BP (165), elevated LDL (195)"
        >
          <Flame className="w-2.5 h-2.5" /> Acute Stress
        </button>

        <button
          type="button"
          onClick={resetWhatIf}
          disabled={modifiedCount === 0}
          className={`py-1.5 px-2.5 rounded text-[10px] font-mono font-medium border transition-colors flex items-center gap-1 ${
            modifiedCount > 0
              ? 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-teal-500/30 shadow-xs'
              : 'bg-slate-900/50 text-slate-500 border-white/5 cursor-not-allowed opacity-60'
          }`}
          title="Restore original patient feature vector"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Stack of Modifiable Feature Controls */}
      <div className="space-y-3 pt-1">
        {/* Section 1: Lipids & Glycemia */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-slate-400 font-semibold px-0.5">
            <HeartPulse className="w-3 h-3 text-teal-400" />
            Lipids & Glycemia
          </div>
          <div className="space-y-1.5">
            <WhatIfSliderControl
              name="LDL"
              label="LDL Cholesterol"
              unit="mg/dL"
              min={30}
              max={280}
              step={1}
              value={Number(currentFeatures.LDL ?? 154)}
              baselineValue={Number(baselineFeatures.LDL ?? 154)}
              onChange={(val) => setFeature('LDL', val)}
              description="Low-density lipoprotein cholesterol"
            />
            <WhatIfSliderControl
              name="HDL"
              label="HDL Cholesterol"
              unit="mg/dL"
              min={15}
              max={95}
              step={1}
              value={Number(currentFeatures.HDL ?? 38)}
              baselineValue={Number(baselineFeatures.HDL ?? 38)}
              onChange={(val) => setFeature('HDL', val)}
              description="High-density lipoprotein cholesterol (protective)"
            />
            <WhatIfSliderControl
              name="TG"
              label="Triglycerides (TG)"
              unit="mg/dL"
              min={40}
              max={600}
              step={5}
              value={Number(currentFeatures.TG ?? 175)}
              baselineValue={Number(baselineFeatures.TG ?? 175)}
              onChange={(val) => setFeature('TG', val)}
              description="Serum triglyceride level"
            />
            <WhatIfSliderControl
              name="FBS"
              label="Fasting Blood Sugar (FBS)"
              unit="mg/dL"
              min={60}
              max={350}
              step={1}
              value={Number(currentFeatures.FBS ?? 112)}
              baselineValue={Number(baselineFeatures.FBS ?? 112)}
              onChange={(val) => setFeature('FBS', val)}
              description="Fasting blood glucose"
            />
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <WhatIfToggleControl
                name="DM"
                label="Diabetes Mellitus"
                value={Number(currentFeatures.DM ?? 0)}
                baselineValue={Number(baselineFeatures.DM ?? 0)}
                onChange={(val) => setFeature('DM', val)}
                description="Documented diabetes mellitus"
              />
              <WhatIfToggleControl
                name="DLP"
                label="Dyslipidemia"
                value={Number(currentFeatures.DLP ?? 1)}
                baselineValue={Number(baselineFeatures.DLP ?? 1)}
                onChange={(val) => setFeature('DLP', val)}
                description="Serum dyslipidemia diagnosis"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Blood Pressure & Hemodynamics */}
        <div className="space-y-2 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-slate-400 font-semibold px-0.5">
            <Activity className="w-3 h-3 text-teal-400" />
            Hemodynamics & Echo
          </div>
          <div className="space-y-1.5">
            <WhatIfSliderControl
              name="BP"
              label="Systolic Blood Pressure"
              unit="mmHg"
              min={90}
              max={200}
              step={1}
              value={Number(currentFeatures.BP ?? 135)}
              baselineValue={Number(baselineFeatures.BP ?? 135)}
              onChange={(val) => setFeature('BP', val)}
              description="Resting systolic blood pressure"
            />
            <WhatIfSliderControl
              name="EF-TTE"
              label="Ejection Fraction (EF-TTE)"
              unit="%"
              min={15}
              max={70}
              step={1}
              value={Number(currentFeatures['EF-TTE'] ?? currentFeatures.EF_TTE ?? 45)}
              baselineValue={Number(baselineFeatures['EF-TTE'] ?? baselineFeatures.EF_TTE ?? 45)}
              onChange={(val) => {
                setFeature('EF-TTE', val);
                setFeature('EF_TTE', val);
              }}
              description="Left ventricular ejection fraction"
            />
            <WhatIfSliderControl
              name="PR"
              label="Pulse Rate"
              unit="bpm"
              min={50}
              max={125}
              step={1}
              value={Number(currentFeatures.PR ?? 74)}
              baselineValue={Number(baselineFeatures.PR ?? 74)}
              onChange={(val) => setFeature('PR', val)}
              description="Resting heart rate"
            />
            <WhatIfToggleControl
              name="HTN"
              label="Hypertension History"
              value={Number(currentFeatures.HTN ?? 1)}
              baselineValue={Number(baselineFeatures.HTN ?? 1)}
              onChange={(val) => setFeature('HTN', val)}
              description="Chronic arterial hypertension"
            />
          </div>
        </div>

        {/* Section 3: Lifestyle & Symptoms */}
        <div className="space-y-2 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-slate-400 font-semibold px-0.5">
            <Sliders className="w-3 h-3 text-teal-400" />
            Lifestyle & Symptoms
          </div>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <WhatIfToggleControl
                name="Current Smoker"
                label="Current Smoker"
                value={Number(currentFeatures['Current Smoker'] ?? 0)}
                baselineValue={Number(baselineFeatures['Current Smoker'] ?? 0)}
                onChange={(val) => setFeature('Current Smoker', val)}
                description="Active tobacco smoker"
              />
              <WhatIfToggleControl
                name="Typical Chest Pain"
                label="Typical Angina"
                value={Number(currentFeatures['Typical Chest Pain'] ?? 0)}
                baselineValue={Number(baselineFeatures['Typical Chest Pain'] ?? 0)}
                onChange={(val) => setFeature('Typical Chest Pain', val)}
                description="Typical anginal chest pain symptoms"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <WhatIfToggleControl
                name="Exertional CP"
                label="Exertional CP"
                value={Number(currentFeatures['Exertional CP'] ?? 0)}
                baselineValue={Number(baselineFeatures['Exertional CP'] ?? 0)}
                onChange={(val) => setFeature('Exertional CP', val)}
                description="Pain with physical exertion"
              />
              <WhatIfToggleControl
                name="Dyspnea"
                label="Dyspnea"
                value={Number(currentFeatures.Dyspnea ?? 0)}
                baselineValue={Number(baselineFeatures.Dyspnea ?? 0)}
                onChange={(val) => setFeature('Dyspnea', val)}
                description="Exertional shortness of breath"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <WhatIfSliderControl
                name="BMI"
                label="BMI"
                unit="kg/m²"
                min={18}
                max={42}
                step={0.1}
                value={Number(currentFeatures.BMI ?? 25.7)}
                baselineValue={Number(baselineFeatures.BMI ?? 25.7)}
                onChange={(val) => setFeature('BMI', val)}
                description="Body Mass Index"
              />
              <WhatIfSliderControl
                name="Weight"
                label="Weight"
                unit="kg"
                min={48}
                max={120}
                step={1}
                value={Number(currentFeatures.Weight ?? 76)}
                baselineValue={Number(baselineFeatures.Weight ?? 76)}
                onChange={(val) => setFeature('Weight', val)}
                description="Body weight in kilograms"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
