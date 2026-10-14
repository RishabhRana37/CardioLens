import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CardioLogo } from '../common/CardioLogo';
import { SettingsMenuPopover } from './SettingsMenuPopover';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const {
    patientSummary,
    patientRiskTier,
    openDisclaimerModal,
    openModelTrust,
    patients,
    currentPatientId,
    loadSample,
    isPredicting,
  } = useAppStore();

  return (
    <header className="sticky top-0 z-40 border-b border-glass-border bg-slate-950/85 backdrop-blur-xl px-3 sm:px-5 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* 1. Brand Logotype + Tagline & 2. Patient Context Chip */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* 1. Brand Logo + Tagline */}
          <CardioLogo size="sm" showText={true} showTagline={true} />

          <div className="hidden sm:block h-6 w-[1px] bg-white/10" />

          {/* 2. Patient Chip */}
          <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-teal-500/40 text-xs shadow-glass-sm transition-all group">
            {patientSummary ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <select
                  aria-label="Select Patient"
                  value={currentPatientId || ''}
                  onChange={(e) => loadSample(Number(e.target.value))}
                  disabled={isPredicting}
                  className="bg-transparent text-slate-200 font-medium text-xs focus:outline-none cursor-pointer pr-1 appearance-none max-w-[130px] sm:max-w-[180px] truncate"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-950 text-slate-100 py-1">
                      {p.summary}
                    </option>
                  ))}
                </select>
                {patientRiskTier && (
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded shrink-0 pointer-events-none ${
                      patientRiskTier === 'high'
                        ? 'bg-red-950/80 text-red-300 border border-red-800/50'
                        : patientRiskTier === 'moderate'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                        : 'bg-green-950/80 text-green-300 border border-green-800/50'
                    }`}
                  >
                    {patientRiskTier}
                  </span>
                )}
              </>
            ) : (
              <>
                <UserX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400 italic">No patient loaded</span>
              </>
            )}
          </div>
        </div>

        {/* 3. Model Trust, 4. Disclaimer, and 5. Settings Gear (⚙ ▾) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* 3. Model Trust Button (Credibility) */}
          <button
            type="button"
            onClick={openModelTrust}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-950/70 border border-teal-500/40 text-teal-300 hover:bg-teal-900/80 transition-colors text-xs font-mono font-medium shadow-xs group"
            title="Inspect 10-fold cross-validation metrics, ROC curves, calibration, and global SHAP hierarchy"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-[11px] font-bold">Model Trust</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-teal-900/90 text-teal-200 border border-teal-500/30 font-bold">
              AUC 0.94
            </span>
          </button>

          {/* 4. Clinical Safety Disclaimer Pill (Required) */}
          <button
            type="button"
            onClick={openDisclaimerModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors text-xs font-medium shadow-sm group"
            title="Read clinical safety disclaimer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-[11px] font-semibold">Disclaimer</span>
            <span className="sm:hidden text-[10px]">⚠</span>
          </button>

          {/* 5. Settings Gear Popover (⚙ ▾) */}
          <SettingsMenuPopover
            isOpen={isSettingsOpen}
            onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
