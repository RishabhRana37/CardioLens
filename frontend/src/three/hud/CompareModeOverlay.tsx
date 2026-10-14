import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VESSEL_LIST, Target, TARGET_LIST } from '../../config/vessels.config';
import { riskGradient } from '../colorScale';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  GitCompare,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CompareModeOverlay: React.FC = () => {
  const {
    predictions,
    baselinePredictions,
    toggleCompareMode,
    selectVessel,
    selectedVessel,
  } = useAppStore();

  const cadCurrent = predictions?.CAD?.probability ?? 0.25;
  const cadBase = baselinePredictions?.CAD?.probability ?? cadCurrent;
  const cadDelta = cadCurrent - cadBase;

  // Compute key modifiable vessel deltas for headline
  const vesselDeltas = VESSEL_LIST.map((vKey) => {
    const cur = predictions?.[vKey]?.probability ?? 0.2;
    const base = baselinePredictions?.[vKey]?.probability ?? cur;
    const delta = cur - base;
    return { vKey, delta, cur, base };
  });

  const changedVessels = vesselDeltas.filter((v) => Math.abs(v.delta) >= 0.005);
  
  // Format requested headline: "Modifiable-risk change: LAD −0.28, RCA −0.12"
  const headlineReadout =
    changedVessels.length > 0
      ? `Modifiable-risk change: ${changedVessels
          .map((v) => `${v.vKey} ${v.delta < 0 ? '−' : '+'}${Math.abs(v.delta).toFixed(2)}`)
          .join(', ')}`
      : 'Modifiable-risk change: Baseline and modified parameters are identical';

  const isReduced = cadDelta <= -0.01 || (changedVessels.length > 0 && changedVessels.every((v) => v.delta <= 0));
  const isElevated = cadDelta >= 0.01 || (changedVessels.length > 0 && changedVessels.some((v) => v.delta > 0.02));

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-4 font-mono select-none">
      {/* Top Headline Comparison Banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/92 border border-teal-500/40 shadow-2xl backdrop-blur-2xl pointer-events-auto"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-950 border border-teal-500/50 flex items-center justify-center text-teal-300 shadow-glow-teal shrink-0">
            <GitCompare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                Side-by-Side Digital Twin Comparison
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  isReduced
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-xs'
                    : isElevated
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-white/10'
                }`}
              >
                {isReduced ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Projected risk reduced
                  </>
                ) : isElevated ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    Projected risk elevated
                  </>
                ) : (
                  'Baseline reference'
                )}
              </span>
            </div>
            <p className="text-[11px] text-teal-300 font-semibold truncate pt-0.5">
              {headlineReadout}
            </p>
          </div>
        </div>

        {/* Close Compare Mode Button */}
        <button
          onClick={toggleCompareMode}
          className="p-1.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-colors"
          title="Exit Compare Mode (Key: C)"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Stage Labels & Center Column Delta Matrix */}
      <div className="flex justify-between items-center w-full px-2 sm:px-6 text-xs font-bold text-slate-300">
        {/* Left Heart Badge (Baseline) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-white/10 shadow-glass-sm backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <div className="flex flex-col text-left">
            <span className="tracking-wider uppercase text-slate-200 text-[11px]">
              1. BASELINE
            </span>
            <span className="text-[9px] text-slate-400 font-normal">
              Patient Snapshot
            </span>
          </div>
        </div>

        {/* Center Column Vessel Delta Matrix */}
        <div className="flex flex-col gap-1 p-2 rounded-2xl bg-slate-950/90 border border-white/15 backdrop-blur-2xl shadow-2xl pointer-events-auto max-w-sm w-full mx-2 sm:mx-4">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-2 border-b border-white/10 pb-1">
            <span>VESSEL</span>
            <span>BASE → MOD</span>
            <span>DELTA</span>
          </div>

          {TARGET_LIST.map((target: Target) => {
            const cur = predictions?.[target]?.probability ?? 0.25;
            const base = baselinePredictions?.[target]?.probability ?? cur;
            const delta = cur - base;
            const deltaVal = delta < 0 ? `−${Math.abs(delta).toFixed(2)}` : `+${delta.toFixed(2)}`;
            const isSelected = selectedVessel === target;

            return (
              <button
                key={target}
                onClick={() => selectVessel(isSelected ? null : target)}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-[11px] transition-all ${
                  isSelected
                    ? 'bg-slate-900 border border-teal-500/50 shadow-glow-teal'
                    : 'hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-[54px]">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: riskGradient(cur) }}
                  />
                  <span className="font-bold text-slate-200">{target}</span>
                </div>

                <div className="text-slate-400 tabular-nums text-[10px] flex items-center gap-1">
                  <span style={{ color: riskGradient(base) }}>{(base * 100).toFixed(0)}%</span>
                  <span className="text-slate-600">→</span>
                  <span className="font-bold" style={{ color: riskGradient(cur) }}>
                    {(cur * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="text-right min-w-[72px]">
                  {delta <= -0.005 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0" />
                      {deltaVal}
                    </span>
                  ) : delta >= 0.005 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/30">
                      <TrendingUp className="w-3 h-3 text-rose-400 shrink-0" />
                      {deltaVal}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      <Minus className="w-3 h-3 text-slate-500 shrink-0" />
                      0.00
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Heart Badge (Modified) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-teal-500/40 shadow-glow-teal backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse shadow-glow-teal" />
          <div className="flex flex-col text-right">
            <span className="tracking-wider uppercase text-teal-200 text-[11px]">
              2. MODIFIED
            </span>
            <span className="text-[9px] text-teal-400 font-normal">
              What-If Twin
            </span>
          </div>
        </div>
      </div>

      {/* Synchronized Orbit Camera Notice */}
      <div className="mx-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-white/10 text-[10px] text-slate-400 backdrop-blur-md">
        <Sparkles className="w-3 h-3 text-teal-400" />
        <span>Synchronized Camera: Orbiting one heart orbits both in 3D space</span>
      </div>
    </div>
  );
};

export default CompareModeOverlay;
