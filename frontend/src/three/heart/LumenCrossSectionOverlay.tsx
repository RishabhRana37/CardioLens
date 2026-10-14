import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VesselKey } from '../../config/vessels.config';
import { riskGradient } from '../colorScale';
import {
  Activity,
  Sliders,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface LumenCrossSectionOverlayProps {
  onClose?: () => void;
}

export const LumenCrossSectionOverlay: React.FC<LumenCrossSectionOverlayProps> = ({ onClose }) => {
  const { selectedVessel, predictions, isCrossSectionOpen, setCrossSectionOpen } = useAppStore();
  const [segmentPosition, setSegmentPosition] = useState<number>(45); // 0 = Proximal, 50 = Mid, 100 = Distal
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setCrossSectionOpen(false);
    }
  };

  const vesselKey = selectedVessel as VesselKey | null;
  const vConfig = vesselKey ? VESSELS[vesselKey] : null;
  const pred = vesselKey ? predictions?.[vesselKey] : null;
  const prob = pred?.probability ?? 0.25;

  // Compute segment-adjusted stenosis percentage (peaks at Mid ~42%)
  const segmentFactor = useMemo(() => {
    // Gaussian peak around Mid (42%)
    const dist = Math.abs(segmentPosition - 42) / 40;
    const factor = Math.max(0.35, 1.0 - dist * 0.65);
    return factor;
  }, [segmentPosition]);

  const stenosisPct = Math.min(99, Math.round(prob * 100 * segmentFactor));
  const segmentLabel = segmentPosition < 30 ? 'proximal' : segmentPosition > 65 ? 'distal' : 'mid';
  const normalDiameterMm = vesselKey === 'LAD' ? 3.6 : vesselKey === 'RCA' ? 3.8 : 3.2;
  const residualDiameterMm = Math.max(0.4, (normalDiameterMm * (1 - (stenosisPct / 100) * 0.78))).toFixed(1);

  if (!isCrossSectionOpen || !vesselKey || !vConfig) return null;

  // SVG Geometry parameters for lumen cross section (viewBox 0 0 120 120, center 60,60)
  const outerRadius = 50;
  const plaqueThickness = Math.max(2, Math.min(42, (stenosisPct / 100) * 44));
  const lumenRadius = Math.max(6, outerRadius - plaqueThickness);

  return (
    <div className="absolute bottom-16 left-4 z-30 w-72 sm:w-80 rounded-2xl bg-slate-950/90 border border-teal-500/40 shadow-2xl backdrop-blur-xl overflow-hidden text-slate-100 font-mono animate-in fade-in slide-in-from-bottom duration-200 pointer-events-auto">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-900/80 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: riskGradient(prob) }}
          />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {vConfig.name} Lumen Cutaway
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title={isMinimized ? 'Expand Cross-Section' : 'Minimize Cross-Section'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Close Vessel Cross-Section"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3.5 space-y-3">
          {/* Clinical Identifier Label */}
          <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span className="text-teal-300 font-bold">
              {vConfig.name} · {segmentLabel} · ~{stenosisPct}% narrowing
            </span>
            <span className="text-[10px] text-slate-400 italic">(model estimate)</span>
          </div>

          {/* SVG Stylized Cutaway Lumen Cross-Section */}
          <div className="relative flex items-center justify-center py-2 bg-slate-900/60 rounded-xl border border-white/5">
            <svg width="128" height="128" viewBox="0 0 120 120" className="drop-shadow-md">
              <defs>
                <radialGradient id="plaqueGrad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="65%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#b45309" />
                </radialGradient>
                <radialGradient id="lumenGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="85%" stopColor="#be123c" />
                  <stop offset="100%" stopColor="#881337" />
                </radialGradient>
              </defs>

              {/* 1. Tunica Adventitia / External Arterial Wall */}
              <circle cx="60" cy="60" r={outerRadius} fill="#1e293b" stroke="#475569" strokeWidth="2.5" />

              {/* 2. Tunica Media Smooth Muscle Layer */}
              <circle cx="60" cy="60" r={outerRadius - 3} fill="#7f1d1d" stroke="#991b1b" strokeWidth="1.5" />

              {/* 3. Atherosclerotic Plaque Cuff Core */}
              {plaqueThickness > 3 && (
                <circle
                  cx="58"
                  cy="59"
                  r={outerRadius - 5}
                  fill="url(#plaqueGrad)"
                  stroke="#fbbf24"
                  strokeWidth="1"
                  opacity={Math.min(0.95, 0.4 + (stenosisPct / 100) * 0.55)}
                />
              )}

              {/* 4. Patent Residual Lumen Orifice */}
              <circle
                cx={60 + (plaqueThickness > 10 ? 4 : 0)}
                cy={60 + (plaqueThickness > 10 ? 2 : 0)}
                r={lumenRadius}
                fill="url(#lumenGrad)"
                stroke="#fda4af"
                strokeWidth="1.5"
              />

              {/* Center Blood Flow Icon/Dot */}
              <circle
                cx={60 + (plaqueThickness > 10 ? 4 : 0)}
                cy={60 + (plaqueThickness > 10 ? 2 : 0)}
                r={Math.max(2, lumenRadius * 0.35)}
                fill="#ffffff"
                opacity="0.75"
              />
            </svg>

            {/* Quick Dimension Badges */}
            <div className="absolute top-2 right-2 text-right text-[10px] space-y-0.5">
              <div className="text-slate-400">Ref: {normalDiameterMm}mm</div>
              <div className="text-teal-300 font-bold">Lumen: {residualDiameterMm}mm</div>
            </div>
          </div>

          {/* Morphological Category Tag */}
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-white/5">
            <span className="text-slate-400 flex items-center gap-1">
              {stenosisPct >= 70 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-teal-400" />
              )}
              Morphology:
            </span>
            <span
              className={`font-bold ${
                stenosisPct >= 70
                  ? 'text-rose-400'
                  : stenosisPct >= 50
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {stenosisPct >= 70
                ? 'Severe / Critical (≥70%)'
                : stenosisPct >= 50
                ? 'Moderate (50–69%)'
                : 'Mild (<50%)'}
            </span>
          </div>

          {/* Interactive Vessel Sweep Scrubber */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-teal-400" /> IVUS Sweep Position:
              </span>
              <span className="text-slate-200 capitalize font-bold">{segmentLabel}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={segmentPosition}
              onChange={(e) => setSegmentPosition(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Proximal (Ostium)</span>
              <span className="text-teal-400 font-bold">Mid (Lesion)</span>
              <span>Distal (Apex)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LumenCrossSectionOverlay;
