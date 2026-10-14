import React from 'react';

interface WhatIfSliderControlProps {
  name: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  baselineValue: number;
  onChange: (val: number) => void;
  description?: string;
}

export const WhatIfSliderControl: React.FC<WhatIfSliderControlProps> = ({
  name,
  label,
  unit,
  min,
  max,
  step = 1,
  value,
  baselineValue,
  onChange,
  description,
}) => {
  const isModified = value !== baselineValue;
  const numDelta = Number((value - baselineValue).toFixed(1));

  // Range percentage for baseline tick
  const baselinePct = Math.min(100, Math.max(0, ((baselineValue - min) / (max - min)) * 100));
  const currentPct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="group space-y-1.5 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/70 border border-white/5 hover:border-white/10 transition-all">
      {/* Label and Live Value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={`whatif-slider-${name}`}
            className="text-[11px] font-medium text-slate-300 group-hover:text-slate-100 transition-colors"
            title={description}
          >
            {label}
          </label>
          {isModified && (
            <span
              className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                numDelta > 0
                  ? 'text-amber-400 bg-amber-950/50 border border-amber-500/20'
                  : 'text-teal-400 bg-teal-950/50 border border-teal-500/20'
              }`}
            >
              {numDelta > 0 ? `+${numDelta}` : numDelta}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              if (!isNaN(parsed)) {
                onChange(Math.min(max, Math.max(min, parsed)));
              }
            }}
            className="w-14 text-right px-1 py-0.5 text-xs font-mono font-bold bg-slate-800 border border-slate-700/60 rounded text-teal-300 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
          />
          {unit && (
            <span className="text-[10px] font-mono text-slate-400 min-w-[28px]">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Slider Track with Baseline Marker */}
      <div className="relative flex items-center py-1">
        {/* Baseline position tick */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-slate-400/50 rounded-xs pointer-events-none z-10"
          style={{ left: `${baselinePct}%` }}
          title={`Baseline: ${baselineValue} ${unit || ''}`}
        />

        <input
          id={`whatif-slider-${name}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-hidden"
          style={{
            background: `linear-gradient(to right, rgb(13 148 136) 0%, rgb(13 148 136) ${currentPct}%, rgb(30 41 59) ${currentPct}%, rgb(30 41 59) 100%)`,
          }}
        />
      </div>

      {/* Min / Baseline / Max Hints */}
      <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
        <span>{min}</span>
        <span className="text-slate-400">Base: {baselineValue}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
