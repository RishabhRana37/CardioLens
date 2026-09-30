import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VESSEL_LIST } from '../../config/vessels.config';
import { getRiskTier } from '../../three/colorScale';
import { ChevronRight } from 'lucide-react';

export const VesselCardsList: React.FC = () => {
  const {
    predictions,
    selectedVessel,
    selectVessel,
    colorFor,
  } = useAppStore();

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider font-semibold">
          Coronary Artery Status (LAD · LCX · RCA)
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          Click card to isolate
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {VESSEL_LIST.map((vKey) => {
          const vConfig = VESSELS[vKey];
          const isSelected = selectedVessel === vKey;
          const pred = predictions?.[vKey];
          const prob = pred?.probability ?? 0.25;
          const conf = pred?.confidence ?? 0.75;
          const color = colorFor(vKey);
          const tier = getRiskTier(prob);

          return (
            <button
              key={vKey}
              type="button"
              onClick={() => selectVessel(isSelected ? null : vKey)}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'bg-slate-900/95 border-teal-500/60 shadow-glow-teal ring-1 ring-teal-500/40'
                  : 'bg-slate-950/60 border-white/10 hover:border-white/20 hover:bg-slate-900/50'
              }`}
            >
              {/* Left Color Accent Bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300"
                style={{ backgroundColor: color }}
              />

              <div className="pl-1.5 space-y-2">
                {/* Header: Vessel Name + Class Badge + Prob */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-100 font-mono tracking-wide">
                        {vConfig.name}
                      </span>
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${tier.badgeClass}`}>
                        {pred?.label || (prob >= 0.5 ? 'Stenotic' : 'Normal')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {vConfig.label}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className="font-mono font-extrabold text-base tabular-nums block"
                      style={{ color }}
                    >
                      {(prob * 100).toFixed(0)}%
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {(conf * 100).toFixed(0)}% conf
                    </span>
                  </div>
                </div>

                {/* Mini Risk Progress Bar */}
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(6, Math.round(prob * 100))}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span className="truncate max-w-[200px]">{vConfig.anatomicalTerritory}</span>
                    <span className="flex items-center gap-0.5 text-teal-400 group-hover:translate-x-0.5 transition-transform font-medium">
                      {isSelected ? 'Active in 3D' : 'Isolate'} <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VesselCardsList;
