import React, { useEffect } from 'react';
import { HeartScene } from '../../three/HeartScene';
import { MinimalPersistentHUD } from '../dashboard/MinimalPersistentHUD';
import { DetailsSlideOverPanel } from '../dashboard/DetailsSlideOverPanel';
import { useAppStore } from '../../store/useAppStore';
import { Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HeartAnatomySection: React.FC = () => {
  const {
    isDetailsOpen,
    setDetailsOpen,
    toggleDetailsOpen,
    isFocusMode,
    toggleFocusMode,
    setHasActiveDrawer,
  } = useAppStore();

  // Inform CameraController whenever the Details slide-over panel opens or closes
  // so the 3D heart frames naturally to the left when open, and centers when closed.
  useEffect(() => {
    setHasActiveDrawer(isDetailsOpen && !isFocusMode);
  }, [isDetailsOpen, isFocusMode, setHasActiveDrawer]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fadeTransition = {
    duration: prefersReducedMotion ? 0 : 0.3,
    ease: 'easeInOut',
  };

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      {/* 1. 3D Heart Hero Stage (The heart owns the entire screen) */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-auto">
        <HeartScene />
      </div>

      {/* 2. Floating Exit Focus Indicator & Button (Visible only in Focus Mode) */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -15 }}
            transition={fadeTransition}
            className="fixed top-5 right-5 z-50 pointer-events-auto"
          >
            <button
              onClick={toggleFocusMode}
              title="Exit Focus Mode (Key: Esc or F)"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-teal-500/40 hover:border-teal-400 text-xs font-mono font-medium text-slate-200 hover:text-white backdrop-blur-2xl shadow-2xl transition-all group"
            >
              <Minimize2 className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
              <span>Exit Focus</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-[10px] text-slate-400">
                Esc
              </kbd>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ALWAYS VISIBLE MINIMAL PERSISTENT SUMMARY (The entire persistent dashboard) */}
      <MinimalPersistentHUD
        isDetailsOpen={isDetailsOpen}
        onToggleDetails={toggleDetailsOpen}
      />

      {/* 4. ON-DEMAND DETAILS SLIDE-IN PANEL (Slides in from the right over canvas) */}
      <DetailsSlideOverPanel
        isOpen={isDetailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
};

export default HeartAnatomySection;
