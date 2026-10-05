import React from 'react';
import { GlassPanel } from './GlassPanel';
import {
  Activity,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { scaleIn } from '../../tokens/motion';

interface BrandedEmptyStateProps {
  type?: 'empty' | 'error' | 'no-patient' | 'no-vessel';
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
}

export const BrandedEmptyState: React.FC<BrandedEmptyStateProps> = ({
  type = 'empty',
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon,
}) => {
  const isError = type === 'error';

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full h-full min-h-[300px] flex items-center justify-center p-4 font-mono"
    >
      <GlassPanel
        variant="command"
        className="max-w-md w-full p-6 text-center space-y-4 shadow-2xl"
      >
        {/* Animated Icon Avatar */}
        <div
          className={`w-14 h-14 rounded-2xl border mx-auto flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
            isError
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-400 shadow-glow-red'
              : 'bg-teal-950/80 border-teal-500/40 text-teal-400 shadow-glow-teal'
          }`}
        >
          {icon ? (
            icon
          ) : isError ? (
            <ShieldAlert className="w-7 h-7" />
          ) : (
            <Activity className="w-7 h-7" />
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-100 tracking-wide">
            {title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        {(onPrimaryAction || onSecondaryAction) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {onPrimaryAction && primaryActionLabel && (
              <button
                type="button"
                onClick={onPrimaryAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                  isError
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-glow-red'
                    : 'bg-teal-600 hover:bg-teal-500 text-slate-950 shadow-glow-teal'
                }`}
              >
                <span>{primaryActionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onSecondaryAction && secondaryActionLabel && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-all"
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
};

export default BrandedEmptyState;
