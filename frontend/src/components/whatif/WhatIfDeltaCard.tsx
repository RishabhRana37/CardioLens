import React from 'react';
import { Target, Prediction } from '../../api/types';
import { VESSELS, VesselKey } from '../../config/vessels.config';
import { riskGradient } from '../../three/colorScale';
import { AnimatedNumber } from '../../tokens/motion';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface WhatIfDeltaCardProps {
  target: Target;
  current?: Prediction;
  baseline?: Prediction;
  isSelected: boolean;
  onSelect: () => void;
}

export const WhatIfDeltaCard: React.FC<WhatIfDeltaCardProps> = ({
  target,
  current,
  baseline,
  isSelected,
  onSelect,
}) => {
  const currentProb = current?.probability ?? 0.25;
  const baselineProb = baseline?.probability ?? currentProb;
  const delta = currentProb - baselineProb;
  const deltaPct = Math.round(delta * 100);

  const targetLabel =
    target === 'CAD'
      ? 'Overall CAD'
      : (VESSELS[target as VesselKey]?.label || target);
  const color = riskGradient(currentProb);

  // Delta status
  const isImproved = delta <= -0.005;
  const isWorsened = delta >= 0.005;
  const isNeutral = !isImproved && !isWorsened;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`relative p-2.5 rounded-lg border text-left transition-all duration-200 w-full flex flex-col justify-between cursor-pointer ${
        isSelected
          ? 'bg-slate-800/90 border-teal-500/60 ring-1 ring-teal-500/30 shadow-lg shadow-teal-500/10'
          : 'bg-slate-900/60 hover:bg-slate-800/50 border-white/10 hover:border-white/20'
      }`}
    >
      {/* Target Title & Current % */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shadow-xs"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-xs font-bold text-slate-200">
            {target}
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[80px]">
            {targetLabel}
          </span>
        </div>
        <span
          className="font-mono text-xs font-semibold tabular-nums"
          style={{ color }}
        >
          <AnimatedNumber value={currentProb} multiplier={100} precision={0} suffix="%" />
        </span>
      </div>

      {/* Probability Mini-Bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden my-1 relative">
        {/* Baseline marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10"
          style={{ left: `${Math.min(98, Math.max(2, baselineProb * 100))}%` }}
          title={`Baseline: ${Math.round(baselineProb * 100)}%`}
        />
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{
            width: `${Math.min(100, Math.max(3, currentProb * 100))}%`,
            backgroundColor: color,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {/* Delta Readout */}
      <div className="flex items-center justify-between w-full mt-1">
        <span className="text-[9px] font-mono text-slate-400">
          Base: <AnimatedNumber value={baselineProb} multiplier={100} precision={0} suffix="%" />
        </span>

        {isImproved && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded tabular-nums">
            <TrendingDown className="w-2.5 h-2.5" />
            <AnimatedNumber value={deltaPct} precision={0} suffix="%" />
          </span>
        )}

        {isWorsened && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-1 py-0.2 rounded tabular-nums">
            <TrendingUp className="w-2.5 h-2.5" />
            +<AnimatedNumber value={deltaPct} precision={0} suffix="%" />
          </span>
        )}

        {isNeutral && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/60 px-1 py-0.2 rounded tabular-nums">
            <Minus className="w-2.5 h-2.5" />
            0%
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default WhatIfDeltaCard;
