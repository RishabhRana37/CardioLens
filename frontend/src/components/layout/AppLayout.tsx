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
import { PatientRail } from '../patient/PatientRail';
import { HeartScene } from '../../three/HeartScene';
import { ClinicalDashboard } from '../dashboard/ClinicalDashboard';
import { StateDebugPanel } from '../debug/StateDebugPanel';
import { CinematicBootScreen } from '../common/CinematicBootScreen';
import { motion, AnimatePresence } from 'framer-motion';

export const AppLayout: React.FC = () => {
  const { theme, activeSection, init } = useAppStore();

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100 selection:bg-accent/30 selection:text-teal-200">
      {/* Cinematic Brand Boot Screen (Animated EKG-Heart Morph & Tagline on Load) */}
      <CinematicBootScreen />

      {/* Top Clinical Header with Primary Section Navigation */}
      <TopBar />

      {/* Mobile/Tablet Bottom Tab Bar */}
      <MobileTabBar />

      {/* Main Console Workspace */}
      <main className="flex-1 max-w-[1740px] w-full mx-auto p-3 sm:p-4 lg:p-5 flex flex-col">
        <AnimatePresence mode="wait">
          {/* Section 1: 🫀 Dedicated Heart Anatomy & 3D Twin View */}
          {activeSection === 'heart' && (
            <motion.div
              key="view-heart"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <HeartAnatomySection />
            </motion.div>
          )}

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

          {/* Optional Split Console View (For Ultra-Wide Screens) */}
          {activeSection === 'split' && (
            <motion.div
              key="view-split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:flex flex-row items-stretch gap-4 xl:gap-5 flex-1 h-full"
            >
              <PatientRail />
              <div className="flex-1 flex flex-col min-h-[540px] lg:min-h-[660px]">
                <HeartScene />
              </div>
              <ClinicalDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Disclaimer & Credits Footer */}
      <Footer />

      {/* Mandatory Clinical Disclaimer Modal (Req 5) */}
      <DisclaimerModal />

      {/* Model Trust & Rigor Drawer (Req 7.4) */}
      <ModelTrustDrawer />

      {/* Interactive Clinical Onboarding Coachmarks */}
      <OnboardingCoachMarks />

      {/* Temporary Interactive State Debug Panel */}
      <StateDebugPanel />
    </div>
  );
};

export default AppLayout;

export const App = AppLayout;

