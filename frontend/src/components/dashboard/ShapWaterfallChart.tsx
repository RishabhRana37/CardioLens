import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { AnimatedNumber } from '../../tokens/motion';
import {
  BarChart2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ShapWaterfallChart: React.FC = () => {
  const { explanation, selectedVessel, isExplaining } = useAppStore();

  // Format data for Recharts diverging horizontal bar chart
  const chartData = (explanation?.contributions || []).slice(0, 7).map((c) => {
    // Shorten very long feature labels for chart Y-axis
    let displayLabel = c.feature;
    if (displayLabel.length > 20) {
      displayLabel = displayLabel.slice(0, 19) + '…';
    }

    return {
      rawFeature: c.feature,
      name: displayLabel,
      shap: Number(c.shap.toFixed(3)),
      direction: c.direction,
      value: c.value,
      populationRef: c.population_reference,
    };
  });

  const baseVal = explanation?.base_value ?? 0.30;
  const predVal = explanation?.prediction ?? 0.50;

  return (
    <div className="space-y-3">
      {/* Header with Active Target & Base -> Prediction Annotation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <BarChart2 className="w-4 h-4 text-teal-400 shrink-0" />
          <h3 className="text-xs font-mono uppercase text-slate-200 tracking-wider font-bold truncate">
            SHAP Attribution: {selectedVessel || 'CAD'}
          </h3>
          {isExplaining && (
            <RefreshCw className="w-3 h-3 text-teal-400 animate-spin shrink-0" />
          )}
        </div>

        {/* Base -> Final Annotation */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0">
          <span>
            Base: <AnimatedNumber value={baseVal} multiplier={100} precision={0} suffix="%" />
          </span>
          <span>→</span>
          <span className="font-bold text-slate-100">
            Pred: <AnimatedNumber value={predVal} multiplier={100} precision={0} suffix="%" />
          </span>
        </div>
      </div>

      {/* Clinical Narrative Callout */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`narrative-${selectedVessel || 'CAD'}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="p-3 rounded-xl bg-slate-950/80 border border-teal-500/25 space-y-1 relative"
        >
          <div className="flex items-center gap-1.5 text-teal-400 text-[10px] font-mono font-semibold uppercase">
            <Sparkles className="w-3 h-3" />
            <span>Physiological Narrative</span>
          </div>
          <p className="text-xs text-slate-300 italic leading-relaxed">
            {explanation?.narrative || 'Computing localized SHAP feature attribution...'}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Diverging Bar Chart */}
      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={['auto', 'auto']}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
              stroke="rgba(255,255,255,0.1)"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#e2e8f0', fontSize: 10, fontFamily: 'sans-serif' }}
              width={110}
              stroke="rgba(255,255,255,0.1)"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-900/95 border border-white/15 shadow-2xl backdrop-blur-md text-xs font-sans text-slate-100 space-y-1 z-50">
                      <p className="font-bold text-teal-300 font-mono text-[11px]">
                        {data.rawFeature}
                      </p>
                      <div className="flex justify-between gap-4 text-[10px] font-mono text-slate-300">
                        <span>Patient Value:</span>
                        <span className="font-bold">{String(data.value)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-[10px] font-mono text-slate-300">
                        <span>Population Ref:</span>
                        <span>{data.populationRef}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-[10px] font-mono pt-1 border-t border-white/10">
                        <span>SHAP Contribution:</span>
                        <span
                          className={`font-bold ${
                            data.shap > 0 ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          {data.shap > 0 ? `+${data.shap}` : data.shap} log-odds
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="rgba(255, 255, 255, 0.25)" strokeDasharray="3 3" />
            <Bar
              dataKey="shap"
              radius={[3, 3, 3, 3]}
              isAnimationActive={true}
              animationDuration={650}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.shap >= 0 ? '#dc2626' : '#16a34a'}
                  fillOpacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
        <span className="flex items-center gap-1.5 text-green-400">
          <span className="w-2 h-2 rounded bg-risk-low" /> Pulls Risk Down (Protective)
        </span>
        <span className="flex items-center gap-1.5 text-red-400">
          <span className="w-2 h-2 rounded bg-risk-high" /> Pushes Risk Up (Harmful)
        </span>
      </div>
    </div>
  );
};

export default ShapWaterfallChart;
