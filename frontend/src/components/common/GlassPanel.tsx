import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassPanelProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'subtle' | 'command';
  glow?: boolean;
  glowColor?: 'teal' | 'red' | 'none';
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = 'default',
  glow = false,
  glowColor = 'teal',
  children,
  className,
  noPadding = false,
  ...motionProps
}) => {
  const variantStyles = {
    default: 'bg-slate-900/80 border-white/10 shadow-glass-md',
    elevated: 'bg-slate-900/90 border-white/15 shadow-glass-lg backdrop-blur-xl',
    subtle: 'bg-slate-950/60 border-white/5 shadow-glass-sm',
    command: 'bg-slate-950/85 border-teal-500/20 shadow-glow-teal',
  };

  const glowStyles = {
    teal: 'shadow-glow-teal border-teal-500/30',
    red: 'shadow-glow-red border-red-500/30',
    none: '',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={twMerge(
        clsx(
          'relative rounded-xl border backdrop-blur-md transition-all duration-300',
          variantStyles[variant],
          glow && glowStyles[glowColor],
          !noPadding && 'p-4 md:p-5',
          className
        )
      )}
      {...motionProps}
    >
      {/* Subtle top hairline highlight for glass effect */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-t-xl pointer-events-none" />
      {children}
    </motion.div>
  );
};

export default GlassPanel;
