import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TopBar } from './TopBar';
import { MobileTabBar } from './MobileTabBar';
import { Footer } from './Footer';
import { DisclaimerModal } from '../disclaimer/DisclaimerModal';
import { ModelTrustDrawer } from '../trust/ModelTrustDrawer';
import { OnboardingCoachMarks } from '../onboarding/OnboardingCoachMarks';
import { HeartAnatomySection } from '../views/HeartAnatomySection';
import { PatientInputSection } from '../views/PatientInputSection';
import { ClinicalMetricsSection } from '../views/ClinicalMetricsSection';
import { SplitViewSection } from '../views/SplitViewSection';
import { StateDebugPanel } from '../debug/StateDebugPanel';
import { CinematicBootScreen } from '../common/CinematicBootScreen';
import { motion, AnimatePresence } from 'framer-motion';

export const AppLayout: React.FC = () => {
  const { theme, activeSection, init, isFocusMode } = useAppStore();

  // Boot foundation data on app mount
  useEffect(() => {
    init();
  }, [init]);

  // Apply theme class to <html> element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isHeartView = activeSection === 'heart';
  const isSplitView = activeSection === 'split';

  const chromeTransition = {
    duration: prefersReducedMotion ? 0 : 0.35,
    ease: 'easeInOut',
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-background text-slate-100 selection:bg-accent/30 selection:text-teal-200 ${
        isHeartView || isSplitView ? 'overflow-hidden h-screen' : ''
      }`}
    >
      {/* Cinematic Brand Boot Screen (Animated EKG-Heart Morph & Tagline on Load) */}
      <CinematicBootScreen />

      {/* Top Clinical Header with Primary Section Navigation */}
      <motion.div
        animate={{
          y: isHeartView && isFocusMode ? -80 : 0,
          opacity: isHeartView && isFocusMode ? 0 : 1,
          pointerEvents: isHeartView && isFocusMode ? 'none' : 'auto',
        }}
        transition={chromeTransition}
        className={isHeartView ? 'fixed top-0 left-0 right-0 z-40' : 'sticky top-0 z-40'}
      >
        <TopBar />
      </motion.div>

      {/* Mobile/Tablet Bottom Tab Bar */}
      <motion.div
        animate={{
          y: isHeartView && isFocusMode ? 80 : 0,
          opacity: isHeartView && isFocusMode ? 0 : 1,
          pointerEvents: isHeartView && isFocusMode ? 'none' : 'auto',
        }}
        transition={chromeTransition}
      >
        <MobileTabBar />
      </motion.div>

      {/* Main Console Workspace */}
      {isHeartView ? (
        /* Full-Bleed Hero 3D Stage (Takes Entire Viewport) */
        <main className="flex-1 w-full h-full p-0 m-0 overflow-hidden relative">
          <HeartAnatomySection />
        </main>
      ) : (
        /* Standard Viewport for Tabular Data & Metrics / Split Screen Console */
        <main
          className={`flex-1 w-full mx-auto flex flex-col ${
            isSplitView
              ? 'p-2 sm:p-3 lg:p-3 max-w-[1840px] h-[calc(100vh-64px)] overflow-hidden'
              : 'p-3 sm:p-4 lg:p-5 max-w-[1740px]'
          }`}
        >
          <AnimatePresence mode="wait">
            {/* Section 2: 📋 Dedicated Patient Inputs & Clinical Feature Vector View */}
            {activeSection === 'inputs' && (
              <motion.div
                key="view-inputs"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                <PatientInputSection />
              </motion.div>
            )}

            {/* Section 3: 📊 Dedicated Clinical Metrics & SHAP Analytics View */}
            {activeSection === 'metrics' && (
              <motion.div
                key="view-metrics"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                <ClinicalMetricsSection />
              </motion.div>
            )}

            {/* Section 4: 🔀 Split Console View: Clean 3D Heart ⇄ 2D Angiogram Pairing */}
            {activeSection === 'split' && (
              <motion.div
                key="view-split"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 w-full h-full flex flex-col"
              >
                <SplitViewSection />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* Persistent Disclaimer & Credits Footer (Shown in non-hero, non-split views) */}
      {!isHeartView && !isSplitView && <Footer />}

      {/* Mandatory Clinical Disclaimer Modal (Req 5) */}
      <DisclaimerModal />

      {/* Model Trust & Rigor Drawer (Req 7.4) */}
      <ModelTrustDrawer />

      {/* Interactive Clinical Onboarding Coachmarks */}
      <OnboardingCoachMarks />

      {/* Dev-Only State & Mock Engine Debugger (Strictly gated behind ?debug=1) */}
      {!isFocusMode && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1' && (
        <StateDebugPanel />
      )}
    </div>
  );
};

export default AppLayout;

export const App = AppLayout;
