import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getRiskColor } from '../../tokens';
import { Target } from '../../api/types';
import {
  Heart,
  RotateCcw,
  ZoomIn,
  MousePointerClick,
  Box,
} from 'lucide-react';

export const HeartStagePlaceholder: React.FC = () => {
  const { selectedVessel, setSelectedVessel, quality } = useAppStore();

  const vessels: { id: Target; name: string; full: string; mockProb: number }[] = [
    { id: 'LAD', name: 'LAD', full: 'Left Anterior Descending', mockProb: 0.74 },
    { id: 'LCX', name: 'LCX', full: 'Left Circumflex', mockProb: 0.22 },
    { id: 'RCA', name: 'RCA', full: 'Right Coronary Artery', mockProb: 0.61 },
  ];

  return (
    <main className="flex-1 flex flex-col gap-3 min-h-[500px] lg:min-h-[640px] relative">
      {/* 3D Stage Glass Canvas Container */}
      <div className="relative flex-1 rounded-2xl bg-gradient-to-b from-slate-950/90 via-[#060911] to-[#04060a] border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-6 group">
        {/* Subtle stage radial spotlight glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,148,136,0.12)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

        {/* Top Controls Overlay */}
        <div className="relative z-10 flex items-start justify-between gap-2">
          {/* Stage Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md text-xs font-mono text-slate-300 shadow-glass-sm">
            <Box className="w-3.5 h-3.5 text-teal-400" />
            <span>R3F 3D Stage</span>
            <span className="text-slate-600">|</span>
            <span className="text-teal-300 capitalize">{quality} Mode</span>
          </div>

          {/* Reset Camera / Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedVessel(null)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all backdrop-blur-md ${
                selectedVessel === null
                  ? 'bg-teal-950/80 border-teal-500/40 text-teal-300 font-semibold'
                  : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              Whole Heart (CAD)
            </button>
            <button
              title="Reset Orbit Camera"
              className="p-1.5 rounded-xl bg-slate-900/70 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors backdrop-blur-md"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center 3D Model Placeholder Graphic */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8 text-center space-y-4">
          <div className="relative">
            {/* Pulsing ring aura */}
            <div className="absolute -inset-6 rounded-full bg-teal-500/10 blur-xl animate-pulse" />
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-teal-500/30 flex items-center justify-center shadow-glow-teal relative">
              <Heart className="w-14 h-14 sm:w-16 sm:h-16 text-teal-400 animate-pulse stroke-[1.5]" />
            </div>
          </div>

          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              Interactive Coronary Tree (3D)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              React Three Fiber stage ready for Draco-compressed 3D mesh with per-vessel shader color binding.
            </p>
          </div>

          {/* Direct Interactive Vessel Selection Test Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {vessels.map((v) => {
              const isSelected = selectedVessel === v.id;
              const color = getRiskColor(v.mockProb);
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVessel(v.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 ${
                    isSelected
                      ? 'bg-slate-900 border-white/30 text-white shadow-glass-md scale-105'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span>{v.name}</span>
                  <span className="text-[11px] tabular-nums font-semibold" style={{ color }}>
                    {(v.mockProb * 100).toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Legend & Continuous Risk Scale */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 bg-slate-950/40 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-3 sm:p-4 rounded-b-2xl">
          {/* Continuous Risk Color Spectrum */}
          <div className="w-full sm:w-64 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span className="text-risk-low font-semibold">0.0 Low</span>
              <span className="text-risk-moderate font-semibold">0.5 Moderate</span>
              <span className="text-risk-high font-semibold">1.0 Stenotic</span>
            </div>
            <div className="h-2 rounded-full bg-gradient-to-r from-risk-low via-risk-moderate to-risk-high shadow-inner border border-white/10" />
          </div>

          {/* Interaction Guide */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <MousePointerClick className="w-3 h-3 text-teal-400" /> Click vessel to isolate
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ZoomIn className="w-3 h-3 text-teal-400" /> Scroll to zoom
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HeartStagePlaceholder;
