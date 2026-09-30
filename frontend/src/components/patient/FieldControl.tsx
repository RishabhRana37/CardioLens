import React, { useState } from 'react';
import { FeatureField } from '../../api/types';
import { useAppStore } from '../../store/useAppStore';
import { HelpCircle } from 'lucide-react';

interface FieldControlProps {
  field: FeatureField;
}

export const FieldControl: React.FC<FieldControlProps> = ({ field }) => {
  const { patient, baseline, setFeature } = useAppStore();
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const currentValue = patient?.[field.name] ?? field.default;
  const baselineValue = baseline?.[field.name];
  const isModified = baselineValue !== undefined && baselineValue !== currentValue;

  const handleChange = (val: number | string) => {
    setFeature(field.name, val);
  };

  return (
    <div
      className={`p-2.5 rounded-xl border transition-all duration-200 ${
        isModified
          ? 'bg-amber-950/25 border-amber-500/40 shadow-sm'
          : 'bg-slate-950/40 border-white/5 hover:border-white/15'
      }`}
    >
      {/* Field Label & Top Info Bar */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <label
            htmlFor={`field-${field.name}`}
            className="text-xs font-semibold text-slate-200 truncate cursor-pointer"
            title={field.label}
          >
            {field.label}
          </label>

          {field.unit && (
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-white/10 shrink-0">
              {field.unit}
            </span>
          )}

          {field.modifiable && (
            <span
              title="Modifiable factor in What-If Digital Twin"
              className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
            />
          )}
        </div>

        {/* Clinical Info Tooltip Trigger */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label={`Clinical info for ${field.label}`}
            className="text-slate-500 hover:text-teal-400 p-0.5 rounded transition-colors"
          >
            <HelpCircle className="w-3 h-3" />
          </button>

          {showTooltip && field.description && (
            <div className="absolute right-0 bottom-full mb-1 z-50 w-52 p-2 rounded-lg bg-slate-900 border border-teal-500/30 text-[10px] text-slate-300 shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <p className="font-semibold text-teal-300 font-mono mb-0.5">{field.name}</p>
              <p className="leading-tight">{field.description}</p>
              {field.min !== undefined && field.max !== undefined && (
                <p className="text-[9px] text-slate-400 font-mono mt-1 pt-1 border-t border-white/10">
                  Range: {field.min} – {field.max} {field.unit || ''}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Render Control by Field Type */}
      {/* 1. NUMERIC FIELD */}
      {field.type === 'numeric' && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-2">
            <input
              id={`field-${field.name}`}
              type="range"
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.max && field.max > 100 ? 1 : 0.1}
              value={Number(currentValue)}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="flex-1 accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              min={field.min}
              max={field.max}
              step={field.max && field.max > 100 ? 1 : 0.1}
              value={currentValue}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="w-16 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono font-bold text-right tabular-nums focus:outline-none focus:border-teal-400"
            />
          </div>

          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>Min: {field.min}</span>
            {isModified && (
              <span className="text-amber-400 font-semibold">
                Original: {baselineValue}
              </span>
            )}
            <span>Max: {field.max}</span>
          </div>
        </div>
      )}

      {/* 2. BINARY FIELD */}
      {field.type === 'binary' && (
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          {[
            { val: 0, label: field.name === 'Sex' ? 'Female' : 'No / Absent' },
            { val: 1, label: field.name === 'Sex' ? 'Male' : 'Yes / Present' },
          ].map((opt) => {
            const isSelected = Number(currentValue) === opt.val;
            return (
              <button
                key={opt.val}
                type="button"
                onClick={() => handleChange(opt.val)}
                className={`py-1 px-2 rounded-lg text-xs font-medium transition-all text-center border ${
                  isSelected
                    ? 'bg-teal-950/90 border-teal-500/50 text-teal-300 font-semibold shadow-sm ring-1 ring-teal-500/20'
                    : 'bg-slate-900/80 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. NOMINAL FIELD */}
      {field.type === 'nominal' && (
        <div className="pt-0.5">
          <select
            id={`field-${field.name}`}
            value={String(currentValue)}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-teal-400 cursor-pointer"
          >
            {field.options?.map((opt) => (
              <option key={String(opt)} value={String(opt)}>
                {String(opt)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 4. ORDINAL FIELD */}
      {field.type === 'ordinal' && (
        <div className="flex items-center gap-1 pt-0.5">
          {[0, 1, 2, 3, 4].map((level) => {
            const isSelected = Number(currentValue) === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => handleChange(level)}
                className={`flex-1 py-1 rounded-lg text-xs font-mono transition-all text-center border ${
                  isSelected
                    ? 'bg-teal-950/90 border-teal-500/50 text-teal-300 font-bold shadow-sm'
                    : 'bg-slate-900/80 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FieldControl;
