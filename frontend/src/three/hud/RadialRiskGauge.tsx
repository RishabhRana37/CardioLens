import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VesselKey } from '../../config/vessels.config';
import { riskGradient, getRiskTier } from '../colorScale';
import { Activity, ShieldAlert, HeartPulse } from 'lucide-react';

export const RadialRiskGauge: React.FC = () => {
  const {
    selectedVessel,
    predictions,
    projectionPredictions,
    isProjectionMode,
    isIntroPlaying,
    introKey,
    quality,
  } = useAppStore();

  const isVesselSelected = selectedVessel !== null && selectedVessel !== 'CAD';
  const vesselKey = isVesselSelected ? (selectedVessel as VesselKey) : null;
  const vConfig = vesselKey ? VESSELS[vesselKey] : null;

  const effectivePredictions = isProjectionMode && projectionPredictions ? projectionPredictions : predictions;
  const targetKey = selectedVessel || 'CAD';
  const targetPred = effectivePredictions?.[targetKey];
  const targetProb = targetPred?.probability ?? 0.24;

  // Animated Count-up for probability number
  const [displayProb, setDisplayProb] = useState<number>(() => (isIntroPlaying ? 0.0 : targetProb));
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const isIntro = isIntroPlaying && quality !== 'performance';
    const startVal = isIntro ? 0.0 : displayProb;
    const endVal = targetProb;
    const startTime = performance.now();
    const duration = isIntro ? 2400 : 650; // ms

    const animate = (now: number) => {
      const elapsed = now - startTime;

      if (isIntro) {
        // Wait 400ms before starting count-up to sync with LAD ignition
        if (elapsed < 400) {
          setDisplayProb(0.0);
          animFrameRef.current = requestAnimationFrame(animate);
          return;
        }
        const activeElapsed = elapsed - 400;
        const activeDuration = duration - 400;
        const progress = Math.min(1, activeElapsed / activeDuration);
        const ease = 1 - Math.pow(1 - progress, 2.5);
        setDisplayProb(startVal + (endVal - startVal) * ease);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      } else {
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDisplayProb(startVal + (endVal - startVal) * ease);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetProb, isIntroPlaying, introKey, quality]);

  const riskColor = riskGradient(displayProb);
  const { label: tierLabel, tier } = getRiskTier(displayProb);

  // SVG Gauge Arc Geometry
  const size = 96;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270-degree arc for a classic cockpit gauge
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - displayProb * arcLength;

  return (
    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-glass-md text-slate-100 font-mono transition-all duration-300 pointer-events-auto">
      {/* Radial Arc SVG Gauge */}
      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-[135deg] drop-shadow-md"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Animated Risk Color Fill Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={riskColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${riskColor}88)`,
            }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="text-xl font-bold tracking-tight tabular-nums transition-colors duration-200"
            style={{ color: riskColor }}
          >
            {(displayProb * 100).toFixed(0)}%
          </span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
            {targetKey} Risk
          </span>
        </div>
      </div>

      {/* Details Meta Column */}
      <div className="flex flex-col justify-center gap-1 min-w-[130px] pr-1">
        {/* Title */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 tracking-wide">
          {isVesselSelected ? (
            <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          ) : (
            <HeartPulse className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          )}
          <span className="truncate">
            {isVesselSelected ? `${vConfig?.name} Artery` : 'CAD Overall'}
          </span>
        </div>

        {/* Territory Subtitle */}
        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
          {isVesselSelected
            ? vConfig?.anatomicalTerritory
            : 'Global Multi-Vessel Burden'}
        </div>

        {/* Clinical Risk Tier Chip */}
        <div className="pt-0.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border tracking-tight ${
              tier === 'high'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-glow-red'
                : tier === 'moderate'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {tier === 'high' && <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />}
            {tierLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RadialRiskGauge;
