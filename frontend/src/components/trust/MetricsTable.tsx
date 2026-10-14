import React from 'react';
import { MetricsBundle, Target } from '../../api/types';
import { TARGET_LIST } from '../../config/vessels.config';

interface MetricsTableProps {
  metrics: MetricsBundle | null;
  selectedTarget: Target;
  onSelectTarget: (target: Target) => void;
}

export const MetricsTable: React.FC<MetricsTableProps> = ({
  metrics,
  selectedTarget,
  onSelectTarget,
}) => {
  if (!metrics) {
    return (
      <div className="p-4 text-center font-mono text-xs text-slate-400">
        Loading performance metrics...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-900/60">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
          <tr>
            <th className="py-2.5 px-3">Target Model</th>
            <th className="py-2.5 px-3 text-right">ROC-AUC (10-Fold CV)</th>
            <th className="py-2.5 px-3 text-right">Accuracy</th>
            <th className="py-2.5 px-3 text-right">Precision</th>
            <th className="py-2.5 px-3 text-right">Recall</th>
            <th className="py-2.5 px-3 text-right">F1-Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {TARGET_LIST.map((target) => {
            const m = metrics[target];
            if (!m) return null;
            const isSelected = selectedTarget === target;

            const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;
            const formatAuc = (mean: number, std: number) =>
              `${mean.toFixed(3)} ± ${std.toFixed(3)}`;

            return (
              <tr
                key={target}
                onClick={() => onSelectTarget(target)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-teal-950/40 text-teal-200 font-semibold'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <td className="py-2.5 px-3 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-teal-400 ring-2 ring-teal-400/40' : 'bg-slate-500'
                    }`}
                  />
                  <span className="font-bold">{target}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {target === 'CAD' ? 'Composite' : 'Artery'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-teal-300 font-bold">
                  {formatAuc(m.cv.roc_auc_mean, m.cv.roc_auc_std)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-slate-200">
                  {formatPct(m.accuracy)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-slate-200">
                  {formatPct(m.precision)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-slate-200">
                  {formatPct(m.recall)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-slate-200">
                  {formatPct(m.f1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
