import React from 'react';
import { useAppStore, GraphicQuality } from '../../store/useAppStore';
import {
  Activity,
  Heart,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
  Sparkles,
  SlidersHorizontal,
  Zap,
  UserCheck,
  UserX,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    quality,
    setQuality,
    theme,
    toggleTheme,
    patientSummary,
    patientRiskTier,
    openDisclaimerModal,
    openModelTrust,
  } = useAppStore();

  const qualityOptions: { id: GraphicQuality; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'cinematic', label: 'Cinematic', icon: Sparkles },
    { id: 'balanced', label: 'Balanced', icon: SlidersHorizontal },
    { id: 'performance', label: 'Performance', icon: Zap },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-glass-border bg-slate-950/85 backdrop-blur-md px-3 sm:px-5 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand Logotype & Patient Context Chip */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-glow-teal border border-teal-400/30">
              <Activity className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-teal-300 bg-clip-text text-transparent">
                  CardioTwin
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-teal-500/20">
                  v1.0
                </span>
              </div>
              <span className="hidden md:inline text-[10px] text-slate-400 font-medium">
                Cardiac Digital Twin
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-[1px] bg-white/10" />

          {/* Current Patient Chip */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-white/10 text-xs">
            {patientSummary ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="text-slate-200 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                  {patientSummary}
                </span>
                {patientRiskTier && (
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
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

        {/* Right: Quality, Theme Toggle, Disclaimer Pill, Model Version */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quality Selector (Segmented Button) */}
          <div className="hidden lg:flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-white/10 text-xs">
            {qualityOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = quality === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setQuality(opt.id)}
                  title={`Graphics Quality: ${opt.label}`}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600 text-slate-950 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Model Version Tag */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-white/10 text-[11px] font-mono text-slate-300">
            <Heart className="w-3 h-3 text-teal-400" />
            <span>XGB-Calibrated</span>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Model Trust Validation Modal / Drawer Trigger */}
          <button
            onClick={openModelTrust}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/70 border border-teal-500/40 text-teal-300 hover:bg-teal-900/80 transition-colors text-xs font-mono font-medium shadow-xs group"
            title="Inspect 10-fold cross-validation metrics, ROC curves, calibration, and global SHAP hierarchy"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-[11px] font-bold">Model Trust</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-teal-900/90 text-teal-200 border border-teal-500/30">
              AUC 0.94
            </span>
          </button>

          {/* Condensed Disclaimer Pill (Req 5) */}
          <button
            onClick={openDisclaimerModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors text-xs font-medium shadow-sm group"
            title="Read clinical safety disclaimer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-[11px] font-semibold">Disclaimer</span>
            <span className="sm:hidden text-[10px]">⚠</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
