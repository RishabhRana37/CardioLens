import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TopBar } from './TopBar';
import { MobileTabBar } from './MobileTabBar';
import { Footer } from './Footer';
import { DisclaimerModal } from '../disclaimer/DisclaimerModal';
import { PatientRailPlaceholder } from '../placeholders/PatientRailPlaceholder';
import { HeartStagePlaceholder } from '../placeholders/HeartStagePlaceholder';
import { DashboardRailPlaceholder } from '../placeholders/DashboardRailPlaceholder';
import { motion, AnimatePresence } from 'framer-motion';

export const AppLayout: React.FC = () => {
  const { theme, activeMobileTab } = useAppStore();

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
      {/* Top Clinical Header */}
      <TopBar />

      {/* Mobile/Tablet Tab Bar (Visible on < 1024px) */}
      <MobileTabBar />

      {/* Main Console Workspace */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-4 lg:p-5 flex flex-col">
        {/* Desktop 3-Zone Console Layout (>= 1024px) */}
        <div className="hidden lg:flex flex-row items-stretch gap-4 xl:gap-5 flex-1">
          {/* Zone 1: Patient Input & Controls */}
          <PatientRailPlaceholder />

          {/* Zone 2: 3D Heart Viewer Stage */}
          <HeartStagePlaceholder />

          {/* Zone 3: Clinical Dashboard */}
          <DashboardRailPlaceholder />
        </div>

        {/* Mobile / Tablet Tabbed View (< 1024px) */}
        <div className="lg:hidden flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {activeMobileTab === 'heart' && (
              <motion.div
                key="tab-heart"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col"
              >
                <HeartStagePlaceholder />
              </motion.div>
            )}

            {activeMobileTab === 'inputs' && (
              <motion.div
                key="tab-inputs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col"
              >
                <PatientRailPlaceholder />
              </motion.div>
            )}

            {activeMobileTab === 'results' && (
              <motion.div
                key="tab-results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col"
              >
                <DashboardRailPlaceholder />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Persistent Disclaimer & Credits Footer */}
      <Footer />

      {/* Mandatory Clinical Disclaimer Modal (Req 5) */}
      <DisclaimerModal />
    </div>
  );
};

export default AppLayout;
