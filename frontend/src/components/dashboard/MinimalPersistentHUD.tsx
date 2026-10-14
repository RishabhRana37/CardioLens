import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VESSEL_LIST } from '../../config/vessels.config';
import { getRiskTier, riskGradient } from '../../three/colorScale';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MinimalPersistentHUDProps {
  onToggleDetails: () => void;
  isDetailsOpen: boolean;
}

export const MinimalPersistentHUD: React.FC<MinimalPersistentHUDProps> = ({
  onToggleDetails,
  isDetailsOpen,
}) => {
  const {
    predictions,
    projectionPredictions,
    isProjectionMode,
    selectedVessel,
    selectVessel,
    colorFor,
    isFocusMode,
  } = useAppStore();

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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none max-w-[95vw]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: isFocusMode ? 0 : 1,
          y: isFocusMode ? 30 : 0,
          pointerEvents: isFocusMode ? 'none' : 'auto',
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 hover:bg-slate-950/90 border border-white/10 backdrop-blur-2xl shadow-2xl text-slate-100 font-mono transition-all pointer-events-auto"
      >
        {/* 1. OVERALL CAD % (Compact Radial + Risk Label) */}
        <div
          onClick={() => selectVessel(null)}
          title="Global CAD Assessment · Click to reset whole-heart view"
          className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
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
          <div className="flex flex-col text-left">
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

        {/* 2. FOUR VESSEL CHIPS (CAD / LAD / LCX / RCA) — Doubles as 3D vessel selector */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* 1. CAD (Whole Heart) Chip */}
          <button
            type="button"
            onClick={() => selectVessel(null)}
            title="Whole Heart / CAD Overview · Click to isolate whole organ"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
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

        {/* 3. DETAILS ON-DEMAND BUTTON (Pulses when vessel is selected and details closed) */}
        <button
          type="button"
          onClick={onToggleDetails}
          title={isDetailsOpen ? 'Close Details Panel (Esc)' : 'Open SHAP waterfall & physiology breakdown'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
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
          <span>Details</span>
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
