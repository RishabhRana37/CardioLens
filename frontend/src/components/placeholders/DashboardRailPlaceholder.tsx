import React from 'react';
import { GlassPanel } from '../common/GlassPanel';
import { useAppStore } from '../../store/useAppStore';
import { Target } from '../../api/types';
import { getRiskColor } from '../../tokens';
import {
  Activity,
  BarChart3,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const DashboardRailPlaceholder: React.FC = () => {
  const { selectedVessel, setSelectedVessel } = useAppStore();

  const vessels: { id: Target; name: string; full: string; prob: number; status: string }[] = [
    { id: 'LAD', name: 'LAD', full: 'Left Anterior Descending', prob: 0.74, status: 'Stenotic' },
    { id: 'LCX', name: 'LCX', full: 'Left Circumflex', prob: 0.22, status: 'Normal' },
    { id: 'RCA', name: 'RCA', full: 'Right Coronary Artery', prob: 0.61, status: 'Stenotic' },
  ];

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
            <span className="text-xs text-slate-400 font-mono">Predicted Overall CAD</span>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>CAD Positive</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/50">
                87% Risk
              </span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">Confidence</span>
            <span className="text-sm font-mono text-teal-300 font-bold">81%</span>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 w-[87%]" />
        </div>
      </GlassPanel>

      {/* Per-Vessel Stenosis Cards */}
      <GlassPanel variant="default" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            Coronary Artery Status (3 Targets)
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Bi-directional sync</span>
        </div>

        <div className="space-y-2">
          {vessels.map((v) => {
            const isSelected = selectedVessel === v.id;
            const color = getRiskColor(v.prob);
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVessel(v.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                  isSelected
                    ? 'bg-slate-900 border-teal-500/40 shadow-glow-teal'
                    : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-xs text-slate-200">{v.name}</span>
                    <span className="text-[11px] text-slate-400">({v.status})</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-4.5">{v.full}</p>
                </div>

                <div className="text-right flex items-center gap-2">
                  <span className="font-mono font-bold text-sm tabular-nums" style={{ color }}>
                    {(v.prob * 100).toFixed(0)}%
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-teal-400' : 'text-slate-600'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* SHAP & Physiology Preview Card */}
      <GlassPanel variant="default" className="space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> SHAP Feature Attribution
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            {selectedVessel ? selectedVessel : 'Global CAD'}
          </span>
        </div>

        <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded-lg border border-white/5 leading-relaxed">
          &ldquo;Elevated risk driven predominantly by Typical Chest Pain, reduced Ejection Fraction (38%), and Systolic Blood Pressure (150 mmHg).&rdquo;
        </p>

        {/* Model Trust Shortcut */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-teal-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            ROC-AUC ≥ 0.90 (10-fold CV)
          </span>
          <button className="text-[11px] text-slate-300 hover:text-white underline">
            Model Trust ▸
          </button>
        </div>
      </GlassPanel>
    </aside>
  );
};

export default DashboardRailPlaceholder;
