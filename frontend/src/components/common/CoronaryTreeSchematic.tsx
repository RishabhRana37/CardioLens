import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Target, VesselKey, VESSELS } from '../../config/vessels.config';
import { riskGradient } from '../../three/colorScale';
import {
  Activity,
  GitBranch,
} from 'lucide-react';

interface CoronaryTreeSchematicProps {
  className?: string;
  showTitle?: boolean;
  variant?: 'default' | 'split';
}

export const CoronaryTreeSchematic: React.FC<CoronaryTreeSchematicProps> = ({
  className = '',
  showTitle = true,
  variant = 'default',
}) => {
  const {
    predictions,
    projectionPredictions,
    isProjectionMode,
    selectedVessel,
    selectVessel,
  } = useAppStore();

  const [hoveredVessel, setHoveredVessel] = useState<Target | null>(null);

  const effectivePredictions =
    isProjectionMode && projectionPredictions ? projectionPredictions : predictions;

  const getProb = (target: Target) => effectivePredictions?.[target]?.probability ?? 0.25;

  const cadProb = getProb('CAD');
  const ladProb = getProb('LAD');
  const lcxProb = getProb('LCX');
  const rcaProb = getProb('RCA');

  const ladColor = riskGradient(ladProb);
  const lcxColor = riskGradient(lcxProb);
  const rcaColor = riskGradient(rcaProb);
  const cadColor = riskGradient(cadProb);

  const activeVessel = hoveredVessel || selectedVessel;

  const handleVesselClick = (target: Target) => {
    if (target === 'CAD') {
      selectVessel(null);
    } else {
      selectVessel(selectedVessel === target ? null : (target as VesselKey));
    }
  };

  const isSplit = variant === 'split';

  return (
    <div
      className={`relative rounded-2xl bg-slate-950/85 border border-white/10 p-3.5 sm:p-4 backdrop-blur-xl shadow-glass-md flex flex-col font-mono text-slate-100 select-none transition-all ${className}`}
    >
      {/* Top Header */}
      {showTitle && (
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-glow-teal shrink-0">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 block">
                {isSplit ? '2D Coronary Angiogram Map' : '2D Coronary Tree Map'}
              </span>
              <span className="text-[10px] text-slate-400 block font-sans">
                {isSplit ? 'Cath-Lab AHA 15-Segment Angiographic Schematic' : 'Cath-Lab Standard Angiographic Schematic'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live 3D Synchronization Status Pill */}
            {isSplit && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-950/80 border border-teal-500/40 text-[10px] text-teal-300 font-semibold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>3D Synced</span>
              </div>
            )}

            {/* Whole CAD Overview Toggle */}
            <button
              type="button"
              onClick={() => selectVessel(null)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                selectedVessel === null
                  ? 'bg-slate-800 border-teal-400 text-teal-300 shadow-glow-teal ring-1 ring-teal-400/40'
                  : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Select CAD Whole Heart Overview"
            >
              All Vessels
            </button>
          </div>
        </div>
      )}

      {/* SVG Coronary Tree Graphic Viewport */}
      <div className={`relative w-full flex items-center justify-center my-auto ${isSplit ? 'min-h-[240px] flex-1 py-1' : 'min-h-[220px]'}`}>
        <svg
          viewBox="0 0 460 330"
          className={`w-full h-auto ${isSplit ? 'max-h-[340px] xl:max-h-[380px]' : 'max-h-[300px]'} overflow-visible drop-shadow-xl`}
        >
          <defs>
            {/* Glow Filters for Vessels */}
            <filter id="glow-lad" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={ladColor} floodOpacity="0.8" />
            </filter>
            <filter id="glow-lcx" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={lcxColor} floodOpacity="0.8" />
            </filter>
            <filter id="glow-rca" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={rcaColor} floodOpacity="0.8" />
            </filter>
            <filter id="glow-cad" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor={cadColor} floodOpacity="0.9" />
            </filter>

            {/* Linear Gradients */}
            <linearGradient id="aorta-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#9f1239" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Background Reference Grid / Silhouette */}
          <ellipse
            cx="225"
            cy="175"
            rx="160"
            ry="115"
            fill="rgba(15, 23, 42, 0.35)"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
          />

          {/* 1. Aortic Root Bulb / Ostium (Root) */}
          <g
            className="cursor-pointer transition-opacity"
            onClick={() => handleVesselClick('CAD')}
            onMouseEnter={() => setHoveredVessel('CAD')}
            onMouseLeave={() => setHoveredVessel(null)}
          >
            {/* Aortic Arch Root */}
            <path
              d="M 205 20 C 205 10, 245 10, 245 20 C 245 42, 238 52, 225 58 C 212 52, 205 42, 205 20 Z"
              fill="url(#aorta-grad)"
              stroke={selectedVessel === null ? '#2dd4bf' : '#fda4af'}
              strokeWidth={selectedVessel === null ? 2.5 : 1.5}
            />
            {/* Left Main (LMCA) Trunk */}
            <path
              d="M 216 52 C 200 60, 185 68, 172 75"
              fill="none"
              stroke={selectedVessel === null ? cadColor : '#f43f5e'}
              strokeWidth={7}
              strokeLinecap="round"
              filter={selectedVessel === null ? 'url(#glow-cad)' : undefined}
            />
            <text x="194" y="38" fill="#fecdd3" fontSize="9" fontWeight="bold" textAnchor="middle">
              Aorta
            </text>
            <text x="180" y="66" fill="#fecdd3" fontSize="8" fontWeight="semibold" textAnchor="end">
              LMCA
            </text>
          </g>

          {/* ============================================================ */}
          {/* 2. LAD (Left Anterior Descending) Branch System */}
          {/* ============================================================ */}
          <g
            className="cursor-pointer group"
            onClick={() => handleVesselClick('LAD')}
            onMouseEnter={() => setHoveredVessel('LAD')}
            onMouseLeave={() => setHoveredVessel(null)}
          >
            {/* Selection Highlight Underlay */}
            {(selectedVessel === 'LAD' || hoveredVessel === 'LAD') && (
              <path
                d="M 172 75 C 160 110, 150 160, 144 210 C 140 245, 146 270, 156 295"
                fill="none"
                stroke={ladColor}
                strokeWidth={14}
                strokeLinecap="round"
                opacity={0.35}
                filter="url(#glow-lad)"
              />
            )}

            {/* Main LAD Trunk: Proximal -> Mid -> Distal -> Apex */}
            <path
              d="M 172 75 C 160 110, 150 160, 144 210 C 140 245, 146 270, 156 295"
              fill="none"
              stroke={ladColor}
              strokeWidth={selectedVessel === 'LAD' ? 5.5 : 4.5}
              strokeLinecap="round"
              filter={selectedVessel === 'LAD' ? 'url(#glow-lad)' : undefined}
              className="transition-all duration-200"
            />

            {/* First Diagonal (D1) */}
            <path
              d="M 160 120 C 140 145, 115 168, 92 185"
              fill="none"
              stroke={ladColor}
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Second Diagonal (D2) */}
            <path
              d="M 148 180 C 132 205, 112 225, 96 242"
              fill="none"
              stroke={ladColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />

            {/* Septal Perforator (S1) */}
            <path
              d="M 154 140 C 168 160, 185 178, 195 190"
              fill="none"
              stroke={ladColor}
              strokeWidth={2}
              strokeDasharray="2 2"
              strokeLinecap="round"
            />

            {/* Stenosis Plaque Marker on Proximal LAD if > 0.33 */}
            {ladProb > 0.33 && (
              <circle
                cx="158"
                cy="130"
                r={selectedVessel === 'LAD' ? 6 : 4.5}
                fill="#fbbf24"
                stroke="#78350f"
                strokeWidth={1.5}
                className="animate-pulse"
              />
            )}

            {/* Labels */}
            <text x="126" y="105" fill="#f8fafc" fontSize="11" fontWeight="bold">
              LAD
            </text>
            <text x="82" y="188" fill="#94a3b8" fontSize="8" textAnchor="end">
              D1
            </text>
            <text x="86" y="246" fill="#94a3b8" fontSize="8" textAnchor="end">
              D2
            </text>
            <text x="200" y="194" fill="#94a3b8" fontSize="8">
              S1
            </text>
            <text x="162" y="302" fill="#94a3b8" fontSize="8">
              Apex
            </text>
          </g>

          {/* ============================================================ */}
          {/* 3. LCX (Left Circumflex) Branch System */}
          {/* ============================================================ */}
          <g
            className="cursor-pointer group"
            onClick={() => handleVesselClick('LCX')}
            onMouseEnter={() => setHoveredVessel('LCX')}
            onMouseLeave={() => setHoveredVessel(null)}
          >
            {/* Selection Highlight Underlay */}
            {(selectedVessel === 'LCX' || hoveredVessel === 'LCX') && (
              <path
                d="M 172 75 C 135 85, 95 105, 68 140 C 50 165, 42 195, 45 225"
                fill="none"
                stroke={lcxColor}
                strokeWidth={14}
                strokeLinecap="round"
                opacity={0.35}
                filter="url(#glow-lcx)"
              />
            )}

            {/* Main LCX Trunk: Proximal -> Distal */}
            <path
              d="M 172 75 C 135 85, 95 105, 68 140 C 50 165, 42 195, 45 225"
              fill="none"
              stroke={lcxColor}
              strokeWidth={selectedVessel === 'LCX' ? 5.5 : 4.5}
              strokeLinecap="round"
              filter={selectedVessel === 'LCX' ? 'url(#glow-lcx)' : undefined}
              className="transition-all duration-200"
            />

            {/* First Obtuse Marginal (OM1) */}
            <path
              d="M 108 98 C 88 118, 62 135, 42 148"
              fill="none"
              stroke={lcxColor}
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Second Obtuse Marginal (OM2) */}
            <path
              d="M 68 140 C 52 165, 34 185, 20 200"
              fill="none"
              stroke={lcxColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />

            {/* Posterolateral Branch (PLB-LCX) */}
            <path
              d="M 45 200 C 52 225, 65 245, 80 260"
              fill="none"
              stroke={lcxColor}
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* Stenosis Plaque Marker on LCX if > 0.33 */}
            {lcxProb > 0.33 && (
              <circle
                cx="88"
                cy="118"
                r={selectedVessel === 'LCX' ? 6 : 4.5}
                fill="#fbbf24"
                stroke="#78350f"
                strokeWidth={1.5}
                className="animate-pulse"
              />
            )}

            {/* Labels */}
            <text x="96" y="80" fill="#f8fafc" fontSize="11" fontWeight="bold">
              LCX
            </text>
            <text x="34" y="148" fill="#94a3b8" fontSize="8" textAnchor="end">
              OM1
            </text>
            <text x="14" y="200" fill="#94a3b8" fontSize="8" textAnchor="end">
              OM2
            </text>
            <text x="86" y="266" fill="#94a3b8" fontSize="8">
              PLB
            </text>
          </g>

          {/* ============================================================ */}
          {/* 4. RCA (Right Coronary Artery) Branch System */}
          {/* ============================================================ */}
          <g
            className="cursor-pointer group"
            onClick={() => handleVesselClick('RCA')}
            onMouseEnter={() => setHoveredVessel('RCA')}
            onMouseLeave={() => setHoveredVessel(null)}
          >
            {/* Selection Highlight Underlay */}
            {(selectedVessel === 'RCA' || hoveredVessel === 'RCA') && (
              <path
                d="M 235 52 C 275 62, 325 85, 345 130 C 358 165, 350 205, 320 240 C 290 270, 245 285, 215 295"
                fill="none"
                stroke={rcaColor}
                strokeWidth={14}
                strokeLinecap="round"
                opacity={0.35}
                filter="url(#glow-rca)"
              />
            )}

            {/* Main RCA C-Shaped Trunk */}
            <path
              d="M 235 52 C 275 62, 325 85, 345 130 C 358 165, 350 205, 320 240 C 290 270, 245 285, 215 295"
              fill="none"
              stroke={rcaColor}
              strokeWidth={selectedVessel === 'RCA' ? 5.5 : 4.5}
              strokeLinecap="round"
              filter={selectedVessel === 'RCA' ? 'url(#glow-rca)' : undefined}
              className="transition-all duration-200"
            />

            {/* Conus Branch */}
            <path
              d="M 260 62 C 275 52, 290 48, 305 48"
              fill="none"
              stroke={rcaColor}
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* SA Nodal Branch */}
            <path
              d="M 275 68 C 292 60, 310 54, 325 52"
              fill="none"
              stroke={rcaColor}
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* Acute Marginal (AM) Branch */}
            <path
              d="M 348 150 C 375 168, 395 188, 410 205"
              fill="none"
              stroke={rcaColor}
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Posterior Descending Artery (PDA) */}
            <path
              d="M 255 280 C 235 292, 210 305, 185 315"
              fill="none"
              stroke={rcaColor}
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Posterolateral (PLB-RCA) */}
            <path
              d="M 255 280 C 275 290, 295 295, 315 295"
              fill="none"
              stroke={rcaColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />

            {/* Stenosis Plaque Marker on Mid RCA if > 0.33 */}
            {rcaProb > 0.33 && (
              <circle
                cx="348"
                cy="142"
                r={selectedVessel === 'RCA' ? 6 : 4.5}
                fill="#fbbf24"
                stroke="#78350f"
                strokeWidth={1.5}
                className="animate-pulse"
              />
            )}

            {/* Labels */}
            <text x="358" y="115" fill="#f8fafc" fontSize="11" fontWeight="bold">
              RCA
            </text>
            <text x="312" y="44" fill="#94a3b8" fontSize="8">
              SA Node
            </text>
            <text x="415" y="212" fill="#94a3b8" fontSize="8">
              AM
            </text>
            <text x="180" y="322" fill="#94a3b8" fontSize="8" textAnchor="end">
              PDA
            </text>
            <text x="320" y="302" fill="#94a3b8" fontSize="8">
              PLB
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Vessel Chips Row (Two-Way Sync Readout) */}
      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/10 text-xs">
        {/* CAD */}
        <button
          type="button"
          onClick={() => handleVesselClick('CAD')}
          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
            selectedVessel === null
              ? 'bg-slate-900 border-teal-400 shadow-glow-teal ring-1 ring-teal-400/40'
              : 'bg-slate-950/60 border-white/5 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cadColor }} />
            <span className="font-bold text-[11px] text-slate-200">CAD</span>
          </div>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: cadColor }}>
            {(cadProb * 100).toFixed(0)}%
          </span>
        </button>

        {/* LAD */}
        <button
          type="button"
          onClick={() => handleVesselClick('LAD')}
          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
            selectedVessel === 'LAD'
              ? 'bg-slate-900 border-rose-400 shadow-glow-red ring-1 ring-rose-400/40'
              : 'bg-slate-950/60 border-white/5 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ladColor }} />
            <span className="font-bold text-[11px] text-slate-200">LAD</span>
          </div>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: ladColor }}>
            {(ladProb * 100).toFixed(0)}%
          </span>
        </button>

        {/* LCX */}
        <button
          type="button"
          onClick={() => handleVesselClick('LCX')}
          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
            selectedVessel === 'LCX'
              ? 'bg-slate-900 border-amber-400 shadow-glow-amber ring-1 ring-amber-400/40'
              : 'bg-slate-950/60 border-white/5 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lcxColor }} />
            <span className="font-bold text-[11px] text-slate-200">LCX</span>
          </div>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: lcxColor }}>
            {(lcxProb * 100).toFixed(0)}%
          </span>
        </button>

        {/* RCA */}
        <button
          type="button"
          onClick={() => handleVesselClick('RCA')}
          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
            selectedVessel === 'RCA'
              ? 'bg-slate-900 border-sky-400 shadow-glow-teal ring-1 ring-sky-400/40'
              : 'bg-slate-950/60 border-white/5 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rcaColor }} />
            <span className="font-bold text-[11px] text-slate-200">RCA</span>
          </div>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: rcaColor }}>
            {(rcaProb * 100).toFixed(0)}%
          </span>
        </button>
      </div>

      {/* Selected Vessel Context Footer */}
      {activeVessel && activeVessel !== 'CAD' ? (
        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-teal-500/30 text-xs text-slate-300 shadow-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-bold text-slate-100">{VESSELS[activeVessel as VesselKey].name} Artery:</span>
              <span className="text-slate-300 font-sans">{VESSELS[activeVessel as VesselKey].label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: `${riskGradient(getProb(activeVessel))}22`,
                  color: riskGradient(getProb(activeVessel)),
                  border: `1px solid ${riskGradient(getProb(activeVessel))}55`,
                }}
              >
                Stenosis {(getProb(activeVessel) * 100).toFixed(0)}%
              </span>
              <span className="text-teal-300 text-[10px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                3D Synced
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-sans pt-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span>
              <strong className="text-slate-300 font-mono text-[10px] uppercase">Territory:</strong>{' '}
              {VESSELS[activeVessel as VesselKey].anatomicalTerritory}
            </span>
            <span className="text-slate-400 text-[10px] italic">
              {VESSELS[activeVessel as VesselKey].description}
            </span>
          </div>
        </div>
      ) : isSplit ? (
        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/50 border border-white/5 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cadColor }} />
            <div>
              <span className="font-bold text-slate-200">Global CAD Assessment:</span>{' '}
              <span className="text-slate-400 text-[11px] font-sans">
                Whole-organ coronary network overview. Click any vessel to isolate in 3D.
              </span>
            </div>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded font-mono shrink-0"
            style={{
              backgroundColor: `${cadColor}22`,
              color: cadColor,
              border: `1px solid ${cadColor}55`,
            }}
          >
            CAD {(cadProb * 100).toFixed(0)}%
          </span>
        </div>
      ) : null}

      {/* Plaque Stenosis Severity Reference Legend */}
      {isSplit && (
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="text-slate-400">Plaque Severity:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>&lt;33% Low</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>33–69% Plaque</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>&ge;70% Severe</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoronaryTreeSchematic;
