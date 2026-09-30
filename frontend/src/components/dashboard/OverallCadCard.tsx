import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getRiskTier } from '../../three/colorScale';
import { GlassPanel } from '../common/GlassPanel';
import {
  Heart,
  ShieldCheck,
} from 'lucide-react';

export const OverallCadCard: React.FC = () => {
  const { predictions, selectedVessel, selectVessel, colorFor } = useAppStore();

  const cadPred = predictions?.CAD;
  const cadProb = cadPred?.probability ?? 0.2;
  const cadConf = cadPred?.confidence ?? 0.8;
  const cadTier = getRiskTier(cadProb);
  const isCadActive = selectedVessel === null;
  const hexColor = colorFor('CAD');

  return (
    <GlassPanel
      variant="command"
      onClick={() => selectVessel(null)}
      className={`cursor-pointer transition-all duration-300 relative group overflow-hidden ${
        isCadActive
          ? 'ring-1 ring-teal-500/50 shadow-glow-teal border-teal-500/40'
          : 'hover:border-white/20'
      }`}
    >
      {/* Background soft ambient radial tint */}
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: hexColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Heart className="w-4 h-4 text-teal-400 fill-teal-400/20" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block font-semibold">
              Global CAD Assessment
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              {cadPred?.label === 'CAD' ? 'Coronary Artery Disease' : 'Normal / Low Risk'}
            </h3>
          </div>
        </div>

        <span
          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-sm ${cadTier.badgeClass}`}
        >
          {(cadProb * 100).toFixed(0)}% Probability
        </span>
      </div>

      {/* Main Score & Confidence */}
      <div className="flex items-end justify-between py-1">
        <div className="space-y-0.5">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tabular-nums">
            {(cadProb * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] font-mono text-slate-400 block">
            Stenosis Threshold: ≥ 50%
          </span>
        </div>

        <div className="text-right space-y-0.5">
          <div className="flex items-center justify-end gap-1 text-[11px] font-mono text-teal-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>{(cadConf * 100).toFixed(0)}% Conf.</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 block">
            10-Fold CV Calibrated
          </span>
        </div>
      </div>

      {/* Continuous Risk Meter */}
      <div className="space-y-1 pt-1.5">
        <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-white/5 relative">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${(cadProb * 100).toFixed(0)}%`,
              backgroundColor: cadTier.colorHex,
            }}
          />
        </div>

        <div className="flex justify-between text-[9px] font-mono text-slate-400">
          <span>0% Normal</span>
          <span className="text-slate-300 font-medium">{cadTier.label}</span>
          <span>100% Critical</span>
        </div>
      </div>
    </GlassPanel>
  );
};

export default OverallCadCard;
