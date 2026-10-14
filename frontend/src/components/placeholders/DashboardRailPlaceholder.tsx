import React from 'react';
import { GlassPanel } from '../common/GlassPanel';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VESSEL_LIST } from '../../config/vessels.config';
import { getRiskTier } from '../../three/colorScale';
import {
  Activity,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export const DashboardRailPlaceholder: React.FC = () => {
  const {
    predictions,
    explanation,
    selectedVessel,
    selectVessel,
    colorFor,
  } = useAppStore();

  const cadPred = predictions?.CAD;
  const cadProb = cadPred?.probability ?? 0.2;
  const cadTier = getRiskTier(cadProb);

  return (
    <aside className="w-full lg:w-[380px] xl:w-[410px] flex flex-col gap-4 shrink-0 overflow-y-auto max-h-[calc(100vh-8.5rem)] pl-1">
      {/* Overall CAD Risk Card */}
      <GlassPanel variant="command" className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Zone 3 · Clinical Dashboard
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-300 border border-teal-500/20">
            Req 3
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs text-slate-400 font-mono">Overall CAD Prediction</span>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>{cadPred?.label === 'CAD' ? 'CAD Positive' : 'Normal / Low CAD'}</span>
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${cadTier.badgeClass}`}>
                {(cadProb * 100).toFixed(0)}% Risk
              </span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">Confidence</span>
            <span className="text-sm font-mono text-teal-300 font-bold">
              {cadPred ? `${(cadPred.confidence * 100).toFixed(0)}%` : '---'}
            </span>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden border border-white/5">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${(cadProb * 100).toFixed(0)}%`,
              backgroundColor: cadTier.colorHex,
            }}
          />
        </div>
      </GlassPanel>

      {/* Per-Vessel Stenosis Cards */}
      <GlassPanel variant="default" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            Per-Vessel Stenosis (LAD · LCX · RCA)
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Click to isolate</span>
        </div>

        <div className="space-y-2">
          {VESSEL_LIST.map((vKey) => {
            const vConfig = VESSELS[vKey];
            const isSelected = selectedVessel === vKey;
            const pred = predictions?.[vKey];
            const prob = pred?.probability ?? 0.2;
            const color = colorFor(vKey);

            return (
              <button
                key={vKey}
                onClick={() => selectVessel(isSelected ? null : vKey)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                  isSelected
                    ? 'bg-slate-900 border-teal-500/50 shadow-glow-teal ring-1 ring-teal-500/30'
                    : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-xs text-slate-200">{vConfig.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({pred?.label || '---'})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-4.5">{vConfig.label}</p>
                </div>

                <div className="text-right flex items-center gap-2">
                  <span className="font-mono font-bold text-sm tabular-nums" style={{ color }}>
                    {(prob * 100).toFixed(0)}%
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isSelected ? 'rotate-90 text-teal-400' : 'text-slate-600'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* SHAP Feature Attribution & Physiology Breakdown */}
      <GlassPanel variant="default" className="space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> SHAP Feature Attribution
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-white/10">
            {selectedVessel ? selectedVessel : 'Overall CAD'}
          </span>
        </div>

        {/* Narrative */}
        <p className="text-xs text-slate-300 italic bg-slate-950/70 p-2.5 rounded-lg border border-white/5 leading-relaxed">
          {explanation ? `"${explanation.narrative}"` : 'Calculating SHAP feature attribution...'}
        </p>

        {/* Top Feature Contributions Waterfall Bars */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            Top Factor Contributions (Log-Odds Shift)
          </span>
          {explanation?.contributions.slice(0, 4).map((c, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-slate-950/50 border border-white/5 flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <span className="text-slate-200 font-medium">{c.feature}</span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Patient: {String(c.value)} · Ref: {c.population_reference}
                </span>
              </div>
              <div
                className={`font-mono text-xs font-bold flex items-center gap-1 shrink-0 ${
                  c.direction === 'increases' ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {c.direction === 'increases' ? (
                  <TrendingUp className="w-3 h-3 text-red-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-400" />
                )}
                <span>{c.shap > 0 ? `+${c.shap}` : c.shap}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Model Trust Shortcut Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-teal-300 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            10-Fold CV ROC-AUC: 0.94
          </span>
          <span className="text-[11px] font-mono text-slate-400">Leakage Guard Active</span>
        </div>
      </GlassPanel>
    </aside>
  );
};

export default DashboardRailPlaceholder;
