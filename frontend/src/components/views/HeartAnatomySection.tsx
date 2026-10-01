import React, { useState } from 'react';
import { HeartScene } from '../../three/HeartScene';
import { WhatIfPanel } from '../whatif/WhatIfPanel';
import { GlassPanel } from '../common/GlassPanel';
import { Sparkles, Sliders, BookOpen, ExternalLink, X, Heart, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HeartAnatomySection: React.FC = () => {
  const [showWhatIfDrawer, setShowWhatIfDrawer] = useState<boolean>(false);
  const [showAtlasGuide, setShowAtlasGuide] = useState<boolean>(false);

  return (
    <div className="relative w-full flex-1 flex flex-col xl:flex-row gap-4 h-full min-h-[640px]">
      {/* 3D Heart Hero Stage (Takes Full Focus) */}
      <div className="flex-1 flex flex-col h-full min-h-[580px] relative">
        <HeartScene />

        {/* Floating Top-Right Action Controls */}
        <div className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-2">
          {/* Anatomy Atlas & BodyParts3D Reference */}
          <button
            type="button"
            onClick={() => {
              setShowAtlasGuide(!showAtlasGuide);
              if (!showAtlasGuide) setShowWhatIfDrawer(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium backdrop-blur-xl shadow-lg transition-all ${
              showAtlasGuide
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-glow-teal font-bold'
                : 'bg-slate-900/90 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Open BodyParts3D Heart Anatomy Atlas Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
            <span>{showAtlasGuide ? 'Close Atlas' : 'Anatomy Atlas (BP3D)'}</span>
          </button>

          {/* Quick What-If Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowWhatIfDrawer(!showWhatIfDrawer);
              if (!showWhatIfDrawer) setShowAtlasGuide(false);
            }}
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
      <AnimatePresence>
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
                <button
                  onClick={() => setShowWhatIfDrawer(false)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <WhatIfPanel />
            </GlassPanel>
          </motion.div>
        )}

        {/* Slide-in BodyParts3D Heart Anatomy Atlas Guide */}
        {showAtlasGuide && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full xl:w-[410px] shrink-0 overflow-y-auto max-h-[calc(100vh-9.5rem)] pr-1"
          >
            <GlassPanel variant="default" className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-mono uppercase text-slate-100 font-bold">
                    Heart Anatomy Atlas & Nomenclature
                  </span>
                </div>
                <button
                  onClick={() => setShowAtlasGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* BodyParts3D Attribution Banner */}
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-indigo-300 font-bold text-[11px]">
                  <span>BodyParts3D / DBCLS Database</span>
                  <a
                    href="https://lifesciencedb.jp/bp3d/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-teal-400 hover:underline"
                  >
                    lifesciencedb.jp/bp3d <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  Anatomically mapped 3D digital twin replicating the iconic medical illustration:
                </p>
              </div>

              {/* Anatomical Key Reference Checklist */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    1. Aortic Arch & 3 Branches (Red)
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans pl-4">
                    Ascending aorta arching over the base with Brachiocephalic trunk (bifurcating), Left Common Carotid, and Left Subclavian artery.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-sky-300 font-bold text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                    2. Pulmonary Trunk & Arteries (Cobalt Blue)
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans pl-4">
                    Emerges from the RV outflow tract, crosses anteriorly across the aorta, and bifurcates into left & right pulmonary arteries.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    3. Right & Left Auricles (Ochre/Tan)
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans pl-4">
                    Textured, crenelated atrial appendages flanking the ventricular base on both medial and lateral borders.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    4. Paired Coronary Vasculature (LAD & Vein)
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans pl-4">
                    Left Anterior Descending artery (Red/Risk-mapped) accompanied by the Great Cardiac Vein (Blue) coursing down the anterior sulcus to the apex.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-[10px] font-mono text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>3D Spline coordinates calibrated to BodyParts3D FMA ontology</span>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeartAnatomySection;

