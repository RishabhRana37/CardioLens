import React, { useRef, useEffect } from 'react';
import { useAppStore, GraphicQuality, AppSection } from '../../store/useAppStore';
import {
  Settings,
  Sparkles,
  SlidersHorizontal,
  Zap,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  ShieldCheck,
  ChevronRight,
  X,
  Cpu,
  HelpCircle,
  Heart,
  FileText,
  BarChart3,
  Columns,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsMenuPopoverProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const SettingsMenuPopover: React.FC<SettingsMenuPopoverProps> = ({
  isOpen,
  onToggle,
  onClose,
}) => {
  const {
    activeSection,
    setActiveSection,
    quality,
    setQuality,
    theme,
    toggleTheme,
    isAudioEnabled,
    toggleAudio,
    openModelTrust,
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sectionTabs: { id: AppSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'heart', label: '3D Heart Anatomy', icon: Heart },
    { id: 'inputs', label: 'Patient Input', icon: FileText },
    { id: 'metrics', label: 'Metrics & SHAP', icon: BarChart3 },
    { id: 'split', label: 'Split View', icon: Columns },
  ];

  const qualityOptions: { id: GraphicQuality; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'cinematic', label: 'Cinematic', icon: Sparkles },
    { id: 'balanced', label: 'Balanced', icon: SlidersHorizontal },
    { id: 'performance', label: 'Fast', icon: Zap },
  ];

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Settings Gear Button (⚙ ▾) */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="Application Settings"
        aria-expanded={isOpen}
        title="Settings & Display Preferences"
        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-mono transition-all duration-200 ${
          isOpen
            ? 'bg-teal-950/90 border-teal-400 text-teal-300 shadow-glow-teal ring-1 ring-teal-400/40'
            : 'bg-slate-900/90 hover:bg-slate-800/90 border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
        }`}
      >
        <Settings
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? 'rotate-90 text-teal-400' : 'text-slate-300'
          }`}
        />
        <span className="text-[10px] text-slate-400 select-none">▾</span>
      </button>

      {/* Popover Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 z-50 p-3.5 rounded-2xl bg-slate-950/95 border border-white/15 backdrop-blur-2xl shadow-2xl text-slate-100 font-mono space-y-3.5 select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Settings & Display
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
                title="Close settings"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Group 0: Workspace View Switcher */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="text-slate-400">Workspace View</span>
                <span className="text-[10px] font-bold text-teal-400">
                  {sectionTabs.find((t) => t.id === activeSection)?.label || '3D Heart'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-white/5">
                {sectionTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSection === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(tab.id);
                        onClose();
                      }}
                      className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white font-bold shadow-xs ring-1 ring-teal-400/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-teal-400'}`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group 1: 3D Graphics Quality */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="text-slate-400">3D Graphics Quality</span>
                <span className="text-[10px] uppercase font-bold text-teal-400">
                  {quality}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
                {qualityOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = quality === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuality(opt.id)}
                      className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group 2: Cardiac Sound Toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-2">
                {isAudioEnabled ? (
                  <Volume2 className="w-4 h-4 text-teal-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">Cardiac Auscultation</span>
                  <span className="text-[10px] text-slate-400 font-sans leading-none pt-0.5">
                    68 BPM Web Audio lub-dub
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleAudio}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                  isAudioEnabled
                    ? 'bg-teal-950 text-teal-300 border-teal-500/50 shadow-xs'
                    : 'bg-slate-800 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {isAudioEnabled ? 'Audio On' : 'Muted'}
              </button>
            </div>

            {/* Group 3: Interface Theme (Dark / Light) */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-teal-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-300" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">Theme</span>
                  <span className="text-[10px] text-slate-400 font-sans leading-none pt-0.5">
                    {theme === 'dark' ? 'Clinical Dark Studio' : 'Daylight Mode'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3 h-3 text-amber-300" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3 h-3 text-teal-300" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>

            {/* Group 4: Prediction Model Architecture & Calibration */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-teal-400" />
                  <span>Model Engine</span>
                </span>
                <span className="text-teal-300 font-bold text-[10px]">XGB-Calibrated</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Multi-target gradient boosted classifier (CAD, LAD, LCX, RCA) calibrated on Z-Alizadeh Sani cohort (AUC 0.94).
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openModelTrust();
                }}
                className="w-full mt-1 py-1 px-2 rounded-lg bg-teal-950/60 hover:bg-teal-900 border border-teal-500/30 text-teal-300 text-[10px] font-bold flex items-center justify-between transition-colors group"
              >
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-400" />
                  <span>View Cross-Validation & ROC</span>
                </span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Group 5: Interactive Tour Help */}
            <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('cardiotwin-start-tour'));
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-teal-300 transition-colors text-[10px]"
              >
                <HelpCircle className="w-3 h-3 text-teal-400" />
                <span>Start Interactive Tour</span>
              </button>
              <span className="text-[9px] text-slate-400">CardioTwin v1.2</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsMenuPopover;
