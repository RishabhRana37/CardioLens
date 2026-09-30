import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Target, TargetMetrics } from '../../api/types';

interface RocCurveChartProps {
  target: Target;
  targetMetrics: TargetMetrics;
}

export const RocCurveChart: React.FC<RocCurveChartProps> = ({
  target,
  targetMetrics,
}) => {
  // Generate realistic smooth ROC curve points for target
  const data = useMemo(() => {
    const auc = targetMetrics.roc_auc;
    const points = [];
    const n = 20;

    // Power shape reflecting AUC: TPR = FPR^( (1-auc)/auc * 0.7 )
    const power = Math.max(0.12, (1 - auc) / (auc * 0.85));

    for (let i = 0; i <= n; i++) {
      const fpr = i / n;
      let tpr = Math.pow(fpr, power);
      if (i === 0) tpr = 0;
      if (i === n) tpr = 1;

      points.push({
        fpr: Number(fpr.toFixed(2)),
        tpr: Number(Math.min(1, tpr).toFixed(3)),
        chance: Number(fpr.toFixed(2)),
      });
    }
    return points;
  }, [targetMetrics.roc_auc]);

  return (
    <div className="space-y-2 p-3 rounded-lg bg-slate-900/50 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-slate-200">
          ROC Curve · {target}
        </span>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-500/30 font-bold">
          AUC = {targetMetrics.roc_auc.toFixed(3)}
        </span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="fpr"
              type="number"
              domain={[0, 1]}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <YAxis
              dataKey="tpr"
              type="number"
              domain={[0, 1]}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              formatter={(val: number, name: string) => [
                `${(val * 100).toFixed(1)}%`,
                name === 'tpr' ? 'True Positive Rate' : 'Random Guess',
              ]}
              labelFormatter={(label) => `False Positive Rate: ${(Number(label) * 100).toFixed(0)}%`}
            />
            {/* 45-degree chance line */}
            <ReferenceLine
              segment={[
                { x: 0, y: 0 },
                { x: 1, y: 1 },
              ]}
              stroke="#64748b"
              strokeDasharray="3 3"
            />
            {/* ROC Curve Line */}
            <Line
              type="monotone"
              dataKey="tpr"
              stroke="#0d9488"
              strokeWidth={2.5}
              dot={{ r: 2, fill: '#0d9488' }}
              activeDot={{ r: 5, fill: '#2dd4bf' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
        <span>False Positive Rate (1 - Specificity)</span>
        <span>Sensitivity (TPR)</span>
      </div>
    </div>
  );
};
