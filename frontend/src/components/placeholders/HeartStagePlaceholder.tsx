import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Target } from '../../api/types';
import { VESSELS, VESSEL_LIST, VesselKey } from '../../config/vessels.config';
import {
  Heart,
  RotateCcw,
  ZoomIn,
  MousePointerClick,
  Box,
  RefreshCw,
} from 'lucide-react';

export const HeartStagePlaceholder: React.FC = () => {
  const {
    selectedVessel,
    selectVessel,
    quality,
    predictions,
    colorFor,
    isPredicting,
  } = useAppStore();

  const activeTarget: Target = selectedVessel || 'CAD';
  const activePred = predictions?.[activeTarget];
  const activeColor = colorFor(activeTarget);

  return (
    <main className="flex-1 flex flex-col gap-3 min-h-[500px] lg:min-h-[640px] relative">
      {/* 3D Stage Glass Canvas Container */}
      <div className="relative flex-1 rounded-2xl bg-gradient-to-b from-slate-950/90 via-[#060911] to-[#04060a] border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-6 group transition-colors">
        {/* Subtle stage spotlight glow dynamically tinted to active target's risk color */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
          style={{
            background: `radial-gradient(circle at center, ${activeColor} 0%, transparent 65%)`,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

        {/* Top Controls Overlay */}
        <div className="relative z-10 flex items-start justify-between gap-2">
          {/* Stage Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md text-xs font-mono text-slate-300 shadow-glass-sm">
            <Box className="w-3.5 h-3.5 text-teal-400" />
            <span>R3F 3D Stage</span>
            <span className="text-slate-600">|</span>
            <span className="text-teal-300 capitalize">{quality} Mode</span>
            {isPredicting && (
              <span className="flex items-center gap-1 text-amber-400 pl-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Live Recolor
              </span>
            )}
          </div>

          {/* Reset Camera / Target Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => selectVessel(null)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all backdrop-blur-md ${
                selectedVessel === null
                  ? 'bg-teal-950/80 border-teal-500/40 text-teal-300 font-semibold shadow-glow-teal'
                  : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              Whole Heart (CAD)
            </button>
            <button
              title="Reset Orbit Camera"
              onClick={() => selectVessel(null)}
              className="p-1.5 rounded-xl bg-slate-900/70 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors backdrop-blur-md"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center 3D Model Placeholder Graphic */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8 text-center space-y-4">
          <div className="relative">
            {/* Dynamic risk aura glow matching active probability */}
            <div
              className="absolute -inset-8 rounded-full blur-2xl transition-all duration-500 opacity-40 animate-pulse"
              style={{ backgroundColor: activeColor }}
            />
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border flex flex-col items-center justify-center relative shadow-2xl transition-all duration-500"
              style={{ borderColor: `${activeColor}60` }}
            >
              <Heart
                className="w-14 h-14 sm:w-16 sm:h-16 animate-pulse stroke-[1.5] transition-colors duration-500"
                style={{ color: activeColor }}
              />
              <span className="text-[10px] font-mono font-bold uppercase mt-1 tracking-wider text-slate-300">
                {activeTarget} {activePred ? `${(activePred.probability * 100).toFixed(0)}%` : ''}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              {selectedVessel && selectedVessel !== 'CAD'
                ? VESSELS[selectedVessel as VesselKey].label
                : 'Coronary Artery Tree'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedVessel && selectedVessel !== 'CAD'
                ? VESSELS[selectedVessel as VesselKey].description
                : 'Click any coronary artery below to focus the 3D camera and trigger localized SHAP feature attribution.'}
            </p>
          </div>

          {/* Direct Interactive Vessel Selection Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {VESSEL_LIST.map((vKey) => {
              const vConfig = VESSELS[vKey];
              const isSelected = selectedVessel === vKey;
              const prob = predictions?.[vKey]?.probability ?? 0.2;
              const color = colorFor(vKey);

              return (
                <button
                  key={vKey}
                  onClick={() => selectVessel(vKey)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 ${
                    isSelected
                      ? 'bg-slate-900 border-white/40 text-white shadow-glass-md scale-105 ring-1 ring-teal-500/30'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/25'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-colors duration-300"
                    style={{ backgroundColor: color }}
                  />
                  <span>{vConfig.name}</span>
                  <span className="text-[11px] tabular-nums font-semibold" style={{ color }}>
                    {(prob * 100).toFixed(0)}%
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
              <MousePointerClick className="w-3 h-3 text-teal-400" /> Click artery to inspect
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ZoomIn className="w-3 h-3 text-teal-400" /> Orbit & zoom
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HeartStagePlaceholder;
