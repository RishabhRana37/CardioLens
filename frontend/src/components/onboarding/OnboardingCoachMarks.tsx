import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  UserCheck,
  Heart,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

const STORAGE_KEY = 'cardiotwin_onboarding_dismissed';

interface CoachStep {
  title: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
  tag: string;
}

const STEPS: CoachStep[] = [
  {
    title: '1. Load a Patient Profile',
    desc: 'Select from 8 diverse clinical profiles (#101–#108) with ground-truth angiography references to populate the 55-feature vector.',
    icon: UserCheck,
    tag: 'Zone 1: Left Rail',
  },
  {
    title: '2. Interrogate 3D Coronary Vessels',
    desc: 'Click on LAD (Anterior), LCX (Lateral), or RCA (Inferior) on the 3D heart to isolate individual arterial stenosis risk and trigger smooth camera focus.',
    icon: Heart,
    tag: 'Zone 2: Center Stage',
  },
  {
    title: '3. Simulate What-If Interventions',
    desc: 'Toggle the What-If Twin tab to drag modifiable biomarkers (LDL, Blood Pressure, Smoking) and watch the heart visibly recolor in real time.',
    icon: Sliders,
    tag: 'What-If Twin',
  },
  {
    title: '4. Validate Model Trust & SHAP',
    desc: 'Explore Recharts SHAP waterfalls on the dashboard and open the Model Trust drawer to inspect 10-fold cross-validation metrics (AUC 0.94).',
    icon: ShieldCheck,
    tag: 'Zone 3: Rigor & SHAP',
  },
];

export const OnboardingCoachMarks: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (!isDismissed) {
      // Show onboarding 1.2s after boot
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      <div className="fixed bottom-14 left-4 sm:left-6 z-50 max-w-sm sm:max-w-md pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="p-4 rounded-2xl bg-slate-950/95 border border-teal-500/40 shadow-2xl backdrop-blur-xl space-y-3 ring-1 ring-teal-500/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-300 font-bold">
                Interactive Tour ({currentStep + 1}/{STEPS.length})
              </span>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
              title="Dismiss Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <StepIcon className="w-4 h-4 text-teal-400 shrink-0" />
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                {step.title}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {step.desc}
            </p>
            <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-teal-300 border border-white/10">
              {step.tag}
            </span>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-5 bg-teal-400'
                      : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Prev
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm flex items-center gap-1.5 transition-all"
              >
                {currentStep === STEPS.length - 1 ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Done
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
