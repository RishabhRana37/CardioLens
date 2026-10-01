import React from 'react';
import { HeartScene } from '../../three/HeartScene';
import { WhatIfPanel } from '../whatif/WhatIfPanel';
import { GlassPanel } from '../common/GlassPanel';
import { Sparkles, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export const HeartAnatomySection: React.FC = () => {
  const [showWhatIfDrawer, setShowWhatIfDrawer] = React.useState<boolean>(false);

  return (
    <div className="relative w-full flex-1 flex flex-col xl:flex-row gap-4 h-full min-h-[640px]">
      {/* 3D Heart Hero Stage (Takes Full Focus) */}
      <div className="flex-1 flex flex-col h-full min-h-[580px] relative">
        <HeartScene />

        {/* Floating Quick What-If Toggle Button */}
        <div className="absolute top-4 right-4 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowWhatIfDrawer(!showWhatIfDrawer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium backdrop-blur-xl shadow-lg transition-all ${
              showWhatIfDrawer
                ? 'bg-teal-600 text-white border-teal-400 shadow-glow-teal font-bold'
                : 'bg-slate-900/90 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>{showWhatIfDrawer ? 'Close What-If' : 'Quick What-If Twin'}</span>
          </button>
        </div>
      </div>

      {/* Slide-in What-If Digital Twin Drawer if enabled */}
      {showWhatIfDrawer && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="w-full xl:w-[380px] shrink-0 overflow-y-auto max-h-[calc(100vh-9.5rem)] pr-1"
        >
          <GlassPanel variant="command" className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono uppercase text-teal-400 font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Live Simulation Workbench
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Near-Real-Time LERP
              </span>
            </div>
            <WhatIfPanel />
          </GlassPanel>
        </motion.div>
      )}
    </div>
  );
};
