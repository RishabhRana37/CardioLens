import React from 'react';
import { Target, TargetMetrics } from '../../api/types';
import { motion } from 'framer-motion';

interface GlobalShapListProps {
  target: Target;
  targetMetrics: TargetMetrics;
}

export const GlobalShapList: React.FC<GlobalShapListProps> = ({
  target,
  targetMetrics,
}) => {
  const topFeatures = targetMetrics.top_features || [];
  const maxImportance = Math.max(...topFeatures.map((f) => f.importance), 0.01);

  return (
    <div className="space-y-3 p-3 rounded-lg bg-slate-900/50 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-slate-200">
          Global SHAP Feature Importance · {target}
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Mean |SHAP| impact across cohort
        </span>
      </div>

      <div className="space-y-2">
        {topFeatures.map((feat, idx) => {
          const pct = Math.min(100, Math.max(8, (feat.importance / maxImportance) * 100));

          return (
            <div key={feat.feature} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-400 w-3.5">
                    #{idx + 1}
                  </span>
                  <span className="text-slate-200 font-medium truncate max-w-[180px] sm:max-w-[260px]">
                    {feat.feature}
                  </span>
                </div>
                <span className="text-teal-300 font-bold">
                  {(feat.importance * 100).toFixed(1)}%
                </span>
              </div>

              {/* Bar track */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
