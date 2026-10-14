import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Stethoscope, TrendingUp, TrendingDown } from 'lucide-react';

export const PhysiologyTable: React.FC = () => {
  const { explanation } = useAppStore();

  const contributions = explanation?.contributions || [];

  if (contributions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5">
          <Stethoscope className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-mono uppercase text-slate-200 tracking-wider font-bold">
            Physiological Biomarker Breakdown
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Top {Math.min(contributions.length, 5)} Drivers
        </span>
      </div>

      {/* Structured Rows */}
      <div className="space-y-2">
        {contributions.slice(0, 5).map((c, idx) => {
          const isHarmful = c.direction === 'increases';
          return (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-white/20 transition-all space-y-1.5"
            >
              {/* Row Header: Feature Name + Contribution Log-Odds */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {c.feature}
                </span>

                <div
                  className={`flex items-center gap-1 font-mono text-xs font-bold shrink-0 ${
                    isHarmful ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {isHarmful ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{c.shap > 0 ? `+${c.shap.toFixed(3)}` : c.shap.toFixed(3)}</span>
                </div>
              </div>

              {/* Patient Value vs Population Reference Comparison */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <div>
                  <span className="text-slate-400 text-[10px]">Patient: </span>
                  <span className="font-bold text-slate-100">{String(c.value)}</span>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 text-[10px]">Reference: </span>
                  <span className="text-slate-300">{c.population_reference}</span>
                </div>
              </div>

              {/* Inline Range Visualizer Track */}
              <div className="pt-0.5 space-y-0.5">
                <div className="relative h-1.5 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
                  {/* Subtle midpoint population reference marker */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-500/50 z-10" />

                  {/* Patient position bar */}
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: isHarmful ? '75%' : '35%',
                      backgroundColor: isHarmful ? '#dc2626' : '#16a34a',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhysiologyTable;
