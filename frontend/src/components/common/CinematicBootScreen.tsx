import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardioLogo } from './CardioLogo';
import { ShieldCheck } from 'lucide-react';

interface CinematicBootScreenProps {
  onComplete?: () => void;
}

export const CinematicBootScreen: React.FC<CinematicBootScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Initializing Clinical Engine...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(40);
      setStatusText('Calibrating 10-Fold CV LightGBM & XGBoost Models...');
    }, 450);

    const timer2 = setTimeout(() => {
      setProgress(80);
      setStatusText('Mounting BodyParts3D FMA Cardiac Digital Twin...');
    }, 1100);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('System Ready · See the risk. See why.');
    }, 1700);

    const timer4 = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="cinematic-boot-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleSkip}
          className="fixed inset-0 z-50 bg-[#03060c] flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-pointer overflow-hidden font-mono"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(13,148,136,0.18)_0%,rgba(6,9,18,0.95)_55%,#020408_100%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none opacity-40" />

          {/* Top Status Header */}
          <div className="relative z-10 flex items-center justify-between w-full max-w-4xl text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-glow-teal" />
              <span className="text-teal-400 font-bold uppercase tracking-wider text-[11px]">
                System Boot
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors">
              Click anywhere to skip intro →
            </span>
          </div>

          {/* Center Stage Hero Logo & EKG Motion */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 max-w-lg">
            {/* Animated Large CardioLogo with Pulse */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Expanding Halo Waves */}
              <motion.div
                animate={{
                  scale: [1, 1.3, 1.6],
                  opacity: [0.6, 0.2, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: 'easeOut',
                }}
                className="absolute -inset-4 rounded-3xl border border-teal-500/30"
              />

              <CardioLogo size="xl" showText={true} showTagline={false} />
            </motion.div>

            {/* Tagline Reveal */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-1"
            >
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight font-sans">
                See the risk. <span className="text-teal-400">See why.</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto font-sans leading-relaxed">
                Explainable cardiac digital twin for multi-vessel coronary artery disease assessment.
              </p>
            </motion.div>

            {/* Sweeping EKG Scanline SVG */}
            <div className="w-72 sm:w-80 h-10 relative flex items-center justify-center">
              <svg
                className="w-full h-full text-teal-400 drop-shadow-md overflow-visible"
                viewBox="0 0 200 30"
                fill="none"
              >
                <path
                  d="M 0 15 L 60 15 L 72 6 L 82 26 L 94 2 L 106 28 L 118 11 L 128 19 L 138 15 L 200 15"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1.5"
                />
                <motion.path
                  d="M 0 15 L 60 15 L 72 6 L 82 26 L 94 2 L 106 28 L 118 11 L 128 19 L 138 15 L 200 15"
                  stroke="#2dd4bf"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, pathOffset: 0 }}
                  animate={{ pathLength: [0, 0.4, 0.4, 0], pathOffset: [0, 0.6, 1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              </svg>
            </div>

            {/* Status Ticker & Smooth Progress Bar */}
            <div className="w-full space-y-2">
              <div className="h-1 rounded-full bg-slate-900 border border-white/10 overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-sky-400 shadow-glow-teal rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate pr-2">{statusText}</span>
                <span className="tabular-nums font-bold text-teal-300">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Bottom Rigor Footnote */}
          <div className="relative z-10 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Stratified 10-Fold CV Validated · Educational & Decision Support</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CinematicBootScreen;
