import React, { useState } from 'react';
import { GlassPanel } from '../common/GlassPanel';
import { SamplePatientSelector } from './SamplePatientSelector';
import { DynamicPatientForm } from './DynamicPatientForm';
import { WhatIfPanel } from '../whatif/WhatIfPanel';
import { Sparkles, FileText, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeSlideUp, transitions } from '../../tokens/motion';

export const PatientRail: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'whatif' | 'form'>('whatif');

  return (
    <motion.aside
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="w-full lg:w-[340px] xl:w-[370px] flex flex-col gap-3 shrink-0 overflow-y-auto max-h-[calc(100vh-8.2rem)] pr-1 font-mono"
    >
      {/* Pinned Top Card: Sample Patient Loader */}
      <motion.div variants={fadeSlideUp}>
        <GlassPanel variant="command" className="space-y-3 shrink-0 shadow-glass-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 flex items-center gap-1.5 font-bold">
              <UserPlus className="w-3.5 h-3.5" /> Zone 1 · Patient Input
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-300 border border-teal-500/20">
              Req 1
            </span>
          </div>

          {/* Load Sample Patient Component */}
          <SamplePatientSelector />
        </GlassPanel>
      </motion.div>

      {/* Mode Switcher: What-If Twin vs Full 55-Feature Form */}
      <motion.div variants={fadeSlideUp}>
        <div className="flex p-1 bg-slate-900/80 rounded-xl border border-white/10 shrink-0 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveMode('whatif')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'whatif'
                ? 'bg-teal-600 text-slate-950 shadow-glow-teal font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            What-If Twin
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('form')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'form'
                ? 'bg-teal-600 text-slate-950 shadow-glow-teal font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Full Form (55)
          </button>
        </div>
      </motion.div>

      {/* Dynamic Content Panel */}
      <motion.div variants={fadeSlideUp} className="flex-1">
        <GlassPanel variant="default" className="space-y-3 h-full">
          <AnimatePresence mode="wait">
            {activeMode === 'whatif' ? (
              <motion.div
                key="whatif-panel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={transitions.fast}
              >
                <WhatIfPanel />
              </motion.div>
            ) : (
              <motion.div
                key="form-panel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={transitions.fast}
                className="space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider font-semibold">
                    Clinical Feature Vector
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    55 parameters
                  </span>
                </div>
                <DynamicPatientForm />
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </motion.div>
    </motion.aside>
  );
};

export default PatientRail;
