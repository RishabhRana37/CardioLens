import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

interface BrandedHeartSkeletonProps {
  message?: string;
}

export const BrandedHeartSkeleton: React.FC<BrandedHeartSkeletonProps> = ({
  message = 'Reconstructing 3D Cardiac Digital Twin...',
}) => {
  const [telemetryStep, setTelemetryStep] = useState(0);

  const steps = [
    'Parsing BodyParts3D FMA anatomical meshes...',
    'Calibrating 10-Fold CV LightGBM & XGBoost models...',
    'Synthesizing localized SHAP feature attributions...',
    'Rendering interactive hemodynamics & living shaders...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryStep((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="relative w-full h-full min-h-[540px] lg:min-h-[660px] rounded-2xl bg-gradient-to-b from-slate-950/95 via-[#060912] to-[#030508] border border-white/10 shadow-2xl flex flex-col items-center justify-center p-6 text-slate-100 font-mono overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,148,136,0.12)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-30" />

      {/* Pulsing Anatomical Heart Silhouette with ECG Scanline */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-6">
        {/* Ambient Ring Wave 1 */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1.45],
            opacity: [0.6, 0.25, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: 'easeOut',
          }}
          className="absolute inset-0 rounded-full border border-teal-500/30"
        />

        {/* Ambient Ring Wave 2 */}
        <motion.div
          animate={{
            scale: [1, 1.18, 1.35],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            delay: 0.45,
            ease: 'easeOut',
          }}
          className="absolute inset-0 rounded-full border border-teal-400/20"
        />

        {/* Pulsing Core Heart */}
        <motion.div
          animate={{
            scale: [1, 1.08, 0.98, 1.05, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.88, // 68 BPM cardiac rhythm
            ease: 'easeInOut',
          }}
          className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-900/90 border border-teal-500/40 shadow-glow-teal flex items-center justify-center backdrop-blur-xl"
        >
          <Heart className="w-14 h-14 sm:w-16 sm:h-16 text-teal-400 fill-teal-400/20 drop-shadow-md" />

          {/* ECG Line Overlay */}
          <svg
            className="absolute inset-x-2 h-8 text-teal-300 overflow-visible"
            viewBox="0 0 100 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M 0 12 L 30 12 L 36 4 L 42 20 L 48 8 L 54 16 L 60 12 L 100 12"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={{ pathLength: [0, 1, 1, 0], opacity: [0.2, 1, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
            />
          </svg>
        </motion.div>
      </div>

      {/* Main Title & Telemetry Status */}
      <div className="relative z-10 text-center space-y-2 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/70 border border-teal-500/40 text-teal-300 text-xs font-semibold shadow-glow-teal">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
          <span>{message}</span>
        </div>

        <p className="text-xs text-slate-400 tracking-wide transition-all duration-300 min-h-[1.5rem]">
          {steps[telemetryStep]}
        </p>

        {/* Shimmer Progress Bar */}
        <div className="w-64 h-1.5 mx-auto rounded-full bg-slate-900 overflow-hidden border border-white/10 relative">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: 'easeInOut',
            }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-teal-400 to-transparent rounded-full"
          />
        </div>
      </div>

      {/* Bottom Rigor Footnote */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-2 text-[10px] text-slate-400 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
        <span>Clinical Digital Twin Runtime · Stratified CV Calibration</span>
      </div>
    </div>
  );
};

export default BrandedHeartSkeleton;
