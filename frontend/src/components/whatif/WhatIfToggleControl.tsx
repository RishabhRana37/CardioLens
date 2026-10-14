import React from 'react';

interface WhatIfToggleControlProps {
  name: string;
  label: string;
  value: number; // 0 or 1
  baselineValue: number;
  onChange: (val: number) => void;
  description?: string;
  activeLabel?: string;
  inactiveLabel?: string;
}

export const WhatIfToggleControl: React.FC<WhatIfToggleControlProps> = ({
  name,
  label,
  value,
  baselineValue,
  onChange,
  description,
  activeLabel = 'Yes (1)',
  inactiveLabel = 'No (0)',
}) => {
  const isChecked = value === 1;
  const isModified = value !== baselineValue;

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/70 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={`whatif-toggle-${name}`}
            className="text-[11px] font-medium text-slate-300 cursor-pointer"
            title={description}
          >
            {label}
          </label>
          {isModified && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded font-semibold text-teal-400 bg-teal-950/50 border border-teal-500/20">
              Mod
            </span>
          )}
        </div>
        <span className="text-[9px] font-mono text-slate-400">
          Base: {baselineValue === 1 ? activeLabel : inactiveLabel}
        </span>
      </div>

      <button
        id={`whatif-toggle-${name}`}
        type="button"
        role="switch"
        aria-checked={isChecked}
        onClick={() => onChange(isChecked ? 0 : 1)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-1 focus:ring-teal-500 ${
          isChecked ? 'bg-teal-600' : 'bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            isChecked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
