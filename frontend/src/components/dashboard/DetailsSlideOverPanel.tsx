import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ShapWaterfallChart } from './ShapWaterfallChart';
import { PhysiologyTable } from './PhysiologyTable';
import { ClinicalSummaryCard } from './ClinicalSummaryCard';
import { WhatIfPanel } from '../whatif/WhatIfPanel';
import { ProjectionPanel } from '../projection/ProjectionPanel';
import { CoronaryTreeSchematic } from '../common/CoronaryTreeSchematic';
import { CohortContextView } from './CohortContextView';
import { VESSEL_LIST } from '../../config/vessels.config';
import { riskGradient, getRiskTier } from '../../three/colorScale';
import {
  X,
  Sliders,
  Calendar,
  GitBranch,
  Users,
  BookOpen,
  Camera,
  Heart,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DetailsSlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DetailsSlideOverPanel: React.FC<DetailsSlideOverPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    selectedVessel,
    selectVessel,
    predictions,
    projectionPredictions,
    isProjectionMode,
    colorFor,
    isFocusMode,
    cameraPreset,
    setCameraPreset,
    isAngiogramMode,
    toggleAngiogramMode,
  } = useAppStore();

  const [expandedSection, setExpandedSection] = useState<'whatif' | 'projection' | 'tree' | 'cohort' | 'atlas' | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const effectivePredictions =
    isProjectionMode && projectionPredictions ? projectionPredictions : predictions;

  const currentTargetKey = selectedVessel || 'CAD';
  const targetProb = effectivePredictions?.[currentTargetKey]?.probability ?? 0.25;
  const targetColor = riskGradient(targetProb);
  const targetTier = getRiskTier(targetProb);

  const presets = [
    { id: 'anterior', label: 'ANT' },
    { id: 'posterior', label: 'POST' },
    { id: 'left', label: 'LAO' },
    { id: 'right', label: 'RAO' },
    { id: 'apical', label: 'APEX' },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && !isFocusMode && (
        <>
          {/* Subtle backdrop on small screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 sm:hidden pointer-events-auto"
          />

          {/* Slide-over panel container */}
          <motion.aside
            key="details-slide-over-panel"
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-14 sm:top-16 right-0 bottom-0 z-40 w-full sm:w-[500px] md:w-[540px] lg:w-[580px] max-w-full bg-slate-950/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col font-mono text-slate-100 select-none pointer-events-auto"
          >
            {/* Header: Active Target & Risk Tier */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0 bg-slate-900/70">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-lg"
                  style={{
                    backgroundColor: `${targetColor}18`,
                    borderColor: `${targetColor}60`,
                  }}
                >
                  <Heart className="w-5 h-5" style={{ color: targetColor }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white tracking-wide truncate">
                      {selectedVessel ? `${selectedVessel} Vessel Details` : 'Whole-Heart CAD Details'}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        targetTier.tier === 'high'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : targetTier.tier === 'moderate'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {targetTier.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-sans mt-0.5">
                    <span>Model Risk:</span>
                    <span className="font-bold font-mono text-sm" style={{ color: targetColor }}>
                      {(targetProb * 100).toFixed(0)}%
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[11px] text-slate-400">
                      {selectedVessel ? 'Isolated Artery' : 'Global CAD Composite'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                title="Close Details Panel (Esc)"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-colors group shrink-0"
              >
                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Target Switcher Bar: CAD / LAD / LCX / RCA Quick Selector */}
            <div className="px-4 py-2 border-b border-white/5 bg-slate-950/60 flex items-center justify-between gap-1.5 shrink-0">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider shrink-0 mr-1">
                Target:
              </span>
              <div className="grid grid-cols-4 gap-1.5 flex-1">
                {/* CAD Option */}
                <button
                  type="button"
                  onClick={() => selectVessel(null)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    selectedVessel === null
                      ? 'bg-teal-950/90 border border-teal-400 text-teal-200 shadow-glow-teal font-bold'
                      : 'bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: riskGradient(effectivePredictions?.CAD?.probability ?? 0.25) }}
                  />
                  <span>CAD</span>
                  <span className="text-[10px] tabular-nums font-bold opacity-80">
                    {((effectivePredictions?.CAD?.probability ?? 0.25) * 100).toFixed(0)}%
                  </span>
                </button>

                {/* Vessel Options */}
                {VESSEL_LIST.map((vKey) => {
                  const isSel = selectedVessel === vKey;
                  const prob = effectivePredictions?.[vKey]?.probability ?? 0.25;
                  const color = colorFor(vKey);

                  return (
                    <button
                      key={vKey}
                      type="button"
                      onClick={() => selectVessel(vKey)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        isSel
                          ? 'bg-slate-800 border border-teal-400 text-white shadow-glow-teal font-bold'
                          : 'bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <span>{vKey}</span>
                      <span className="text-[10px] tabular-nums font-bold opacity-80">
                        {(prob * 100).toFixed(0)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Main Content containing deeper content: SHAP waterfall + narrative, physiology breakdown, and Clinical Summary */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
              {/* SECTION 1: SHAP WATERFALL + NARRATIVE */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 shadow-lg">
                <ShapWaterfallChart />
              </div>

              {/* SECTION 2: PHYSIOLOGY BREAKDOWN */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 shadow-lg">
                <PhysiologyTable />
              </div>

              {/* SECTION 3: VOICE-NARRATED CLINICAL SUMMARY */}
              <div className="rounded-2xl border border-white/10 overflow-hidden shadow-lg">
                <ClinicalSummaryCard />
              </div>

              {/* SECTION 4: DEEP TOOLS & SIMULATION COLLAPSIBLE SECTIONS */}
              <div className="space-y-2.5 pt-1">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-1">
                  Additional Clinical Explorations
                </div>

                {/* Live What-If Twin Simulation */}
                <div className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden shadow-md">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === 'whatif' ? null : 'whatif')}
                    className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Interactive What-If Simulation Twin
                      </span>
                    </div>
                    {expandedSection === 'whatif' ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedSection === 'whatif' && (
                    <div className="p-4 border-t border-white/5 bg-slate-950/40">
                      <WhatIfPanel />
                    </div>
                  )}
                </div>

                {/* 5-Year Horizon Longitudinal Forecast */}
                <div className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden shadow-md">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === 'projection' ? null : 'projection')}
                    className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200">
                        5-Year Longitudinal Risk Trajectory
                      </span>
                    </div>
                    {expandedSection === 'projection' ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedSection === 'projection' && (
                    <div className="p-4 border-t border-white/5 bg-slate-950/40">
                      <ProjectionPanel />
                    </div>
                  )}
                </div>

                {/* 2D Cath-Lab Coronary Tree Schematic */}
                <div className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden shadow-md">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === 'tree' ? null : 'tree')}
                    className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-bold text-slate-200">
                        2D Cath-Lab Coronary Tree Schematic
                      </span>
                    </div>
                    {expandedSection === 'tree' ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedSection === 'tree' && (
                    <div className="p-4 border-t border-white/5 bg-slate-950/40">
                      <CoronaryTreeSchematic showTitle={false} />
                    </div>
                  )}
                </div>

                {/* Population Cohort Benchmarks */}
                <div className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden shadow-md">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === 'cohort' ? null : 'cohort')}
                    className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Population Cohort Distribution
                      </span>
                    </div>
                    {expandedSection === 'cohort' ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedSection === 'cohort' && (
                    <div className="p-4 border-t border-white/5 bg-slate-950/40">
                      <CohortContextView showTitle={false} />
                    </div>
                  )}
                </div>

                {/* Anatomy Atlas & BodyParts3D Reference */}
                <div className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden shadow-md">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === 'atlas' ? null : 'atlas')}
                    className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-200">
                        BodyParts3D Heart Anatomy Guide
                      </span>
                    </div>
                    {expandedSection === 'atlas' ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedSection === 'atlas' && (
                    <div className="p-4 border-t border-white/5 bg-slate-950/40 space-y-3 text-xs font-sans">
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 space-y-1">
                        <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                          <span>BodyParts3D Database</span>
                          <a
                            href="https://lifesciencedb.jp/bp3d/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-400 hover:underline flex items-center gap-1"
                          >
                            lifesciencedb.jp/bp3d <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Calibrated 3D coronary architecture with FMA ontology coordinates.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3D Camera Presets & Fluoroscopy Quick Controls */}
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-teal-400" />
                    <span>3D View Presets</span>
                  </span>
                  <button
                    type="button"
                    onClick={toggleAngiogramMode}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      isAngiogramMode
                        ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-300 border-white/10 hover:text-white'
                    }`}
                  >
                    {isAngiogramMode ? 'Fluoroscopy On' : 'Fluoroscopy Off'}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCameraPreset(p.id)}
                      className={`py-1 rounded-lg text-[11px] font-bold transition-all ${
                        cameraPreset === p.id
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-900/80 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer: Esc shortcut notice & Done button */}
            <div className="p-3 border-t border-white/10 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span className="flex items-center gap-1 text-slate-400">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-[10px] text-slate-300">
                  Esc
                </kbd>
                <span>to return to full 3D stage</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-teal-400 hover:text-teal-300 font-bold transition-colors px-2 py-0.5 rounded hover:bg-teal-950"
              >
                Done
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailsSlideOverPanel;
