import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VESSEL_LIST } from '../../config/vessels.config';
import { getRiskTier, riskGradient } from '../../three/colorScale';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
  Compass,
  RotateCcw,
  Pause,
  Play,
  Clapperboard,
  Layers,
  GitCompare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MinimalPersistentHUDProps {
  onToggleDetails: () => void;
  isDetailsOpen: boolean;
  position?: 'fixed' | 'absolute';
  className?: string;
}

export const MinimalPersistentHUD: React.FC<MinimalPersistentHUDProps> = ({
  onToggleDetails,
  isDetailsOpen,
  position = 'fixed',
  className = '',
}) => {
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  const {
    predictions,
    projectionPredictions,
    isProjectionMode,
    selectedVessel,
    selectVessel,
    colorFor,
    isFocusMode,
    isAngiogramMode,
    toggleAngiogramMode,
    isCompareMode,
    toggleCompareMode,
    cameraPreset,
    setCameraPreset,
    isBeating,
    toggleBeating,
    playIntro,
    resetCameraView,
    isInspectorOpen,
    toggleInspector,
  } = useAppStore();

  const cameraPresets = [
    { id: 'anterior', label: 'ANT', title: 'Anterior View (Front)' },
    { id: 'posterior', label: 'POST', title: 'Posterior View (Back)' },
    { id: 'left', label: 'LAO', title: 'Left Anterior Oblique (LAO)' },
    { id: 'right', label: 'RAO', title: 'Right Anterior Oblique (RAO)' },
    { id: 'apical', label: 'APEX', title: 'Apical View (Bottom Apex)' },
  ] as const;

  // Close View menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setIsViewMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isViewMenuOpen) {
        setIsViewMenuOpen(false);
      }
    };
    if (isViewMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isViewMenuOpen]);

  const effectivePredictions =
    isProjectionMode && projectionPredictions ? projectionPredictions : predictions;

  const cadProb = effectivePredictions?.CAD?.probability ?? 0.24;
  const cadColor = riskGradient(cadProb);
  const cadTier = getRiskTier(cadProb);

  const isVesselActive = selectedVessel !== null;

  // Compact circular radial progress arc geometry
  const size = 38;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - cadProb * circumference;

  return (
    <div
      className={`${position} bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none max-w-[96vw] ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: isFocusMode ? 0 : 1,
          y: isFocusMode ? 30 : 0,
          pointerEvents: isFocusMode ? 'none' : 'auto',
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl bg-slate-950/85 hover:bg-slate-950/90 border border-white/10 backdrop-blur-2xl shadow-2xl text-slate-100 font-mono transition-all pointer-events-auto"
      >
        {/* 1. OVERALL CAD % (Compact Radial + Risk Label) */}
        <div
          onClick={() => selectVessel(null)}
          title="Global CAD Assessment · Click to reset whole-heart view"
          className="flex items-center gap-2 px-1.5 sm:px-2 py-1 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group shrink-0"
        >
          {/* Mini 38px Radial Gauge */}
          <div className="relative w-[38px] h-[38px] shrink-0 flex items-center justify-center">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90 drop-shadow-sm"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={cadColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 ease-out"
                style={{ filter: `drop-shadow(0 0 4px ${cadColor}88)` }}
              />
            </svg>
            <span
              className="absolute text-[11px] font-bold tabular-nums"
              style={{ color: cadColor }}
            >
              {(cadProb * 100).toFixed(0)}%
            </span>
          </div>

          {/* Minimal Label & Tier */}
          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-200 group-hover:text-white transition-colors">
                CAD
              </span>
              <span
                className={`text-[9px] font-bold px-1 py-0.2 rounded font-mono ${
                  cadTier.tier === 'high'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    : cadTier.tier === 'moderate'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {cadTier.tier}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-sans leading-none pt-0.5">
              Overall Risk
            </span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-white/10 shrink-0" />

        {/* 2. FOUR VESSEL CHIPS (CAD / LAD / LCX / RCA) — Prominent 3D Vessel Selector */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 1. CAD (Whole Heart) Chip */}
          <button
            type="button"
            onClick={() => selectVessel(null)}
            title="Whole Heart / CAD Overview · Click to isolate whole organ"
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              selectedVessel === null
                ? 'bg-teal-950/90 border border-teal-400 text-teal-200 shadow-glow-teal ring-1 ring-teal-400/40 font-bold'
                : 'bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-white/15'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm transition-transform"
              style={{ backgroundColor: cadColor }}
            />
            <span className="text-[11px]">CAD</span>
            <span
              className="text-[11px] tabular-nums font-bold"
              style={{ color: cadColor }}
            >
              {(cadProb * 100).toFixed(0)}%
            </span>
          </button>

          {/* 2, 3, 4. Three Artery Vessel Chips (LAD / LCX / RCA) */}
          {VESSEL_LIST.map((vKey) => {
            const isSelected = selectedVessel === vKey;
            const prob = effectivePredictions?.[vKey]?.probability ?? 0.25;
            const color = colorFor(vKey);

            return (
              <button
                key={vKey}
                type="button"
                onClick={() => selectVessel(isSelected ? null : vKey)}
                title={`Isolate ${vKey} in 3D & view localized metrics`}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isSelected
                    ? 'bg-slate-800 border border-teal-400 text-white shadow-glow-teal ring-1 ring-teal-400/40 font-bold'
                    : 'bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-white/15'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px]">{vKey}</span>
                <span
                  className="text-[11px] tabular-nums font-bold"
                  style={{ color }}
                >
                  {(prob * 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-6 w-[1px] bg-white/10 shrink-0" />

        {/* 3. PROMINENT CONSTANT-USE CONTROL: ANATOMY ⇄ ANGIOGRAM TOGGLE */}
        <button
          type="button"
          onClick={toggleAngiogramMode}
          title="Toggle Anatomy ⇄ Angiogram Fluoroscopy Mode (Key: A)"
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border shrink-0 ${
            isAngiogramMode
              ? 'bg-teal-950/90 border-teal-400 text-teal-200 shadow-glow-teal ring-1 ring-teal-400/40 font-bold'
              : 'bg-slate-900/60 border-white/5 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-white/15'
          }`}
        >
          {isAngiogramMode ? (
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
          ) : (
            <Activity className="w-3.5 h-3.5 text-teal-400" />
          )}
          <span className="hidden md:inline">{isAngiogramMode ? 'Angiogram' : 'Anatomy'}</span>
          <kbd className="hidden lg:inline text-[9px] px-1 py-0.2 rounded bg-slate-800 border border-white/10 text-slate-400 font-mono">
            A
          </kbd>
        </button>

        {/* 4. COMPACT "VIEW ▾" POPOVER CLUSTER (Presets, BPM, Replay, Layers, Reset) */}
        <div className="relative shrink-0" ref={viewMenuRef}>
          <button
            type="button"
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
            title="Camera Presets, Cardiac Motion, Replay & Stage Controls"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
              isViewMenuOpen
                ? 'bg-slate-800 border-teal-400 text-teal-200 shadow-glow-teal ring-1 ring-teal-400/40 font-bold'
                : 'bg-slate-900/60 border-white/5 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-white/15'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>View</span>
            <ChevronUp
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isViewMenuOpen ? 'rotate-180 text-teal-300' : ''
              }`}
            />
          </button>

          {/* Upward Floating Popover Card */}
          <AnimatePresence>
            {isViewMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 p-3 rounded-2xl bg-slate-950/95 border border-white/10 backdrop-blur-2xl shadow-2xl text-xs font-mono text-slate-200 z-50 pointer-events-auto"
              >
                {/* Popover Header with Camera Reset */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Camera & Stage
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      resetCameraView();
                      setCameraPreset(null);
                    }}
                    title="Reset camera framing to default home view"
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* 1. Camera Angle Presets Row */}
                <div className="mb-2.5">
                  <div className="text-[10px] text-slate-400 mb-1.5 font-sans font-medium">
                    Anatomical Presets
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {cameraPresets.map((view) => (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => {
                          setCameraPreset(view.id);
                        }}
                        title={view.title}
                        className={`py-1 rounded-lg text-[10px] font-bold text-center transition-all ${
                          cameraPreset === view.id
                            ? 'bg-teal-950 border border-teal-400 text-teal-200 shadow-glow-teal ring-1 ring-teal-400/40'
                            : 'bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[1px] bg-white/10 my-2" />

                {/* 2. Interactive Stage Toggles (Rhythm, Replay, Compare, Layers) */}
                <div className="space-y-1">
                  {/* Cardiac Rhythm / BPM */}
                  <button
                    type="button"
                    onClick={toggleBeating}
                    title="Pause/Resume Cardiac Beating Rhythm (Spacebar)"
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isBeating ? (
                        <Pause className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="text-slate-200 group-hover:text-white">
                        {isBeating ? 'Cardiac Rhythm (68 BPM)' : 'Cardiac Rhythm (Paused)'}
                      </span>
                    </div>
                    <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400">
                      Space
                    </kbd>
                  </button>

                  {/* Cinematic Intro Replay */}
                  <button
                    type="button"
                    onClick={() => {
                      playIntro();
                      setIsViewMenuOpen(false);
                    }}
                    title="Replay Cinematic 3D Reveal Sequence"
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Clapperboard className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-slate-200 group-hover:text-white">Replay Reveal</span>
                    </div>
                    <span className="text-[10px] text-teal-400 font-sans">Cinematic</span>
                  </button>

                  {/* Compare Twin Mode */}
                  <button
                    type="button"
                    onClick={toggleCompareMode}
                    title="Toggle Side-by-Side Baseline vs What-If Comparison (Key: C)"
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left ${
                      isCompareMode
                        ? 'bg-teal-950/60 border border-teal-500/40 text-teal-200'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GitCompare className="w-3.5 h-3.5 text-teal-400" />
                      <span>Compare Twin Mode</span>
                    </div>
                    <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400">
                      C
                    </kbd>
                  </button>

                  {/* 3D Model Layers / Inspector */}
                  <button
                    type="button"
                    onClick={toggleInspector}
                    title="Inspect 3D Heart Mesh Nodes & Hierarchy (Key: I)"
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left ${
                      isInspectorOpen
                        ? 'bg-teal-950/60 border border-teal-500/40 text-teal-200'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      <span>3D Mesh Layers</span>
                    </div>
                    <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400">
                      I
                    </kbd>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-[1px] bg-white/10 shrink-0" />

        {/* 5. DETAILS ON-DEMAND BUTTON (Pulses when vessel is selected and details closed) */}
        <button
          type="button"
          onClick={onToggleDetails}
          title={
            isDetailsOpen
              ? 'Close Details Panel (Esc)'
              : 'Open SHAP waterfall & physiology breakdown'
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border shrink-0 ${
            isDetailsOpen
              ? 'bg-teal-500 text-slate-950 border-teal-300 shadow-glow-teal'
              : isVesselActive
              ? 'bg-slate-900/90 border-teal-400/60 text-teal-300 shadow-glow-teal ring-1 ring-teal-400/50 animate-pulse hover:bg-teal-950'
              : 'bg-slate-900/80 border-white/10 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-white/20'
          }`}
        >
          <Sparkles
            className={`w-3.5 h-3.5 ${
              isDetailsOpen ? 'text-slate-950' : 'text-teal-400'
            }`}
          />
          <span className="hidden sm:inline">Details</span>
          {isDetailsOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default MinimalPersistentHUD;
