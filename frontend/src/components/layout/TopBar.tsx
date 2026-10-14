import React, { useState, useRef, useEffect } from 'react';
import { useAppStore, DetailsSubSection } from '../../store/useAppStore';
import { CardioLogo } from '../common/CardioLogo';
import { SettingsMenuPopover } from './SettingsMenuPopover';
import {
  Heart,
  FileText,
  Columns,
  ChevronDown,
  BarChart3,
  Users,
  GitBranch,
  BookOpen,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TopBar: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const {
    activeSection,
    setActiveSection,
    isDetailsOpen,
    setDetailsOpen,
    activeDetailsSection,
    openDetailsSection,
    patientSummary,
    patientRiskTier,
    openDisclaimerModal,
    openModelTrust,
    patients,
    currentPatientId,
    loadSample,
    isPredicting,
  } = useAppStore();

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOpen]);

  // Close "More" dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMoreOpen) {
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  // Check if current view is one of the "More" items
  const isMoreActive =
    activeSection === 'metrics' ||
    (activeSection === 'heart' && isDetailsOpen && activeDetailsSection !== null);

  const moreItems: {
    id: 'metrics' | DetailsSubSection;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    action: () => void;
    isActive: boolean;
  }[] = [
    {
      id: 'metrics',
      label: 'Metrics & SHAP',
      description: 'Model explainability & feature attributions',
      icon: BarChart3,
      action: () => setActiveSection('metrics'),
      isActive: activeSection === 'metrics',
    },
    {
      id: 'cohort',
      label: 'Cohort Context',
      description: 'Population & demographic risk benchmarks',
      icon: Users,
      action: () => openDetailsSection('cohort'),
      isActive: activeSection === 'heart' && isDetailsOpen && activeDetailsSection === 'cohort',
    },
    {
      id: 'tree',
      label: '2D Coronary Map',
      description: 'Cath-lab 2D coronary tree schematic',
      icon: GitBranch,
      action: () => openDetailsSection('tree'),
      isActive: activeSection === 'heart' && isDetailsOpen && activeDetailsSection === 'tree',
    },
    {
      id: 'atlas',
      label: 'Anatomy Atlas (BP3D)',
      description: 'BodyParts3D FMA anatomical reference',
      icon: BookOpen,
      action: () => openDetailsSection('atlas'),
      isActive: activeSection === 'heart' && isDetailsOpen && activeDetailsSection === 'atlas',
    },
    {
      id: 'projection',
      label: '5-Yr Projection',
      description: 'Longitudinal risk trajectory simulation',
      icon: Calendar,
      action: () => openDetailsSection('projection'),
      isActive: activeSection === 'heart' && isDetailsOpen && activeDetailsSection === 'projection',
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-glass-border bg-slate-950/85 backdrop-blur-xl px-3 sm:px-5 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* 1. Left: Brand Logotype + Tagline & Patient Context Chip */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Brand Logo + Tagline */}
          <CardioLogo size="sm" showText={true} showTagline={true} />

          <div className="hidden sm:block h-6 w-[1px] bg-white/10" />

          {/* Patient Chip */}
          <div className="relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-teal-500/40 text-xs shadow-glass-sm transition-all group">
            {patientSummary ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <select
                  aria-label="Select Patient"
                  value={currentPatientId || ''}
                  onChange={(e) => loadSample(Number(e.target.value))}
                  disabled={isPredicting}
                  className="bg-transparent text-slate-200 font-medium text-xs focus:outline-none cursor-pointer pr-1 appearance-none max-w-[105px] sm:max-w-[135px] xl:max-w-[180px] truncate"
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

        {/* 2. Center: Unified Navigation System (3 Primary Tabs + One "More ▾" Menu) */}
        <nav
          aria-label="Unified Navigation"
          className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-glass-sm font-mono text-xs"
        >
          {/* Tab 1: 3D Heart (Home) */}
          <button
            type="button"
            onClick={() => {
              setActiveSection('heart');
              setDetailsOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSection === 'heart' && (!isDetailsOpen || activeDetailsSection === null)
                ? 'bg-teal-600 text-white shadow-xs font-bold ring-1 ring-teal-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-teal-400" />
            <span>3D Heart</span>
          </button>

          {/* Tab 2: Patient Input */}
          <button
            type="button"
            onClick={() => setActiveSection('inputs')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSection === 'inputs'
                ? 'bg-teal-600 text-white shadow-xs font-bold ring-1 ring-teal-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden xl:inline">Patient Input</span>
            <span className="hidden md:inline xl:hidden">Input</span>
          </button>

          {/* Tab 3: Split View */}
          <button
            type="button"
            onClick={() => setActiveSection('split')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSection === 'split'
                ? 'bg-teal-600 text-white shadow-xs font-bold ring-1 ring-teal-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden xl:inline">Split View</span>
            <span className="hidden md:inline xl:hidden">Split</span>
          </button>

          {/* Tab 4: "More ▾" Dropdown Menu */}
          <div ref={moreRef} className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              aria-label="More clinical views and tools"
              aria-expanded={isMoreOpen}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                isMoreActive
                  ? 'bg-teal-950 text-teal-300 border border-teal-500/50 font-bold shadow-xs'
                  : isMoreOpen
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>More</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMoreOpen ? 'rotate-180 text-teal-400' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Dropdown Popover */}
            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-950/95 border border-white/15 backdrop-blur-2xl shadow-2xl p-2 z-50 space-y-1 select-none"
                >
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/5 mb-1">
                    Clinical Tools & Analytics
                  </div>

                  {moreItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          item.action();
                          setIsMoreOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                          item.isActive
                            ? 'bg-teal-950/90 text-teal-200 border border-teal-500/40 shadow-xs'
                            : 'hover:bg-slate-900/90 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            item.isActive
                              ? 'bg-teal-900/80 text-teal-300'
                              : 'bg-slate-900 text-teal-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.isActive && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-800/80 text-teal-200">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5 truncate">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* 3. Right: Model Trust, Disclaimer, and Settings Gear (⚙ ▾) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Model Trust Button (Credibility) */}
          <button
            type="button"
            onClick={openModelTrust}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-teal-950/70 border border-teal-500/40 text-teal-300 hover:bg-teal-900/80 transition-colors text-xs font-mono font-medium shadow-xs group"
            title="Inspect 10-fold cross-validation metrics, ROC curves, calibration, and global SHAP hierarchy"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline text-[11px] font-bold">Model Trust</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-teal-900/90 text-teal-200 border border-teal-500/30 font-bold">
              AUC 0.94
            </span>
          </button>

          {/* Clinical Safety Disclaimer Pill (Required) */}
          <button
            type="button"
            onClick={openDisclaimerModal}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors text-xs font-medium shadow-sm group"
            title="Read clinical safety disclaimer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline text-[11px] font-semibold">Disclaimer</span>
          </button>

          {/* Settings Gear Popover (⚙ ▾) */}
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
