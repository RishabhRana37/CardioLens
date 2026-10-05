import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VESSEL_LIST } from '../../config/vessels.config';
import { ShieldCheck, Info } from 'lucide-react';

export const CanvasLegendAndWatermark: React.FC = () => {
  const { colorFor, predictions } = useAppStore();

  return (
    <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-white/10 bg-slate-950/70 backdrop-blur-xl pointer-events-none text-slate-300 font-mono text-[11px]">
      {/* Left: Compact Glass Color Scale Chip */}
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 shadow-glass-sm pointer-events-auto">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
          <Info className="w-3 h-3 text-teal-400" />
          <span>Risk Scale:</span>
        </div>

        {/* Continuous Gradient Bar */}
        <div className="flex flex-col gap-0.5 w-32 sm:w-40">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-risk-low via-risk-moderate to-risk-high shadow-inner border border-white/10" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span className="text-risk-low font-bold">0.00 Low</span>
            <span className="text-risk-moderate font-bold">0.50</span>
            <span className="text-risk-high font-bold">1.00 Severe</span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-white/10 hidden md:block" />

        {/* Vessel Risk Mini Chips */}
        <div className="hidden md:flex items-center gap-2">
          {VESSEL_LIST.map((vKey) => {
            const prob = predictions?.[vKey]?.probability ?? 0.2;
            const color = colorFor(vKey);
            return (
              <div key={vKey} className="flex items-center gap-1 text-[10px]">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-300 font-bold">{vKey}</span>
                <span className="tabular-nums font-semibold" style={{ color }}>
                  {(prob * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Refined Persistent Disclaimer Watermark Chip */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 shadow-glass-sm pointer-events-auto">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-glow-teal" />
        <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
        <span className="text-[10px] text-slate-300 font-medium">
          Clinical Decision Support
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-[9px] text-slate-400 italic hidden lg:inline">
          Not a standalone diagnostic device
        </span>
      </div>
    </div>
  );
};

export default CanvasLegendAndWatermark;
