import React, { useEffect, useState, useRef } from 'react';
import { Variants, Transition } from 'framer-motion';

/**
 * CardioLens Unified Motion System
 * Authoritative source of truth for all non-3D animations, easings, durations,
 * staggered enter/exit sequences, and number tweening.
 */

// Clinical decelerated curve (precise, medical, confident)
export const clinicalEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Shared Transition Tokens
export const transitions = {
  fast: {
    duration: 0.15,
    ease: clinicalEase,
  } as Transition,
  normal: {
    duration: 0.3,
    ease: clinicalEase,
  } as Transition,
  slow: {
    duration: 0.5,
    ease: clinicalEase,
  } as Transition,
  springSnappy: {
    type: 'spring',
    stiffness: 420,
    damping: 28,
  } as Transition,
  springGentle: {
    type: 'spring',
    stiffness: 260,
    damping: 24,
  } as Transition,
  pulseCardiac: {
    repeat: Infinity,
    duration: 0.88, // ~68 BPM cardiac rhythm
    ease: [0.4, 0, 0.6, 1],
  } as Transition,
};

// Orchestrated Staggered Container Variants
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

// Panel / Card Enter & Exit Variants
export const fadeSlideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.985,
    transition: transitions.fast,
  },
};

export const fadeSlideDown: Variants = {
  hidden: {
    opacity: 0,
    y: -12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: transitions.fast,
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.springSnappy,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    transition: transitions.fast,
  },
};

// Data Change Pulse / Glow Effect
export const dataChangePulse: Variants = {
  initial: { scale: 1 },
  changed: {
    scale: [1, 1.025, 1],
    transition: { duration: 0.35, ease: clinicalEase },
  },
};

/**
 * AnimatedNumber Component
 * Smoothly tweens from previous numeric value to next value using cubic easing.
 * Always renders with tabular-nums for non-jittering alignment.
 */
interface AnimatedNumberProps {
  value: number;
  precision?: number;
  prefix?: string;
  suffix?: string;
  duration?: number; // ms
  className?: string;
  multiplier?: number; // e.g. 100 for percentage
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  precision = 0,
  prefix = '',
  suffix = '',
  duration = 550,
  className = '',
  multiplier = 1,
}) => {
  const targetVal = isNaN(value) ? 0 : value * multiplier;
  const [displayVal, setDisplayVal] = useState<number>(targetVal);
  const prevValRef = useRef<number>(targetVal);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValRef.current;
    const endVal = targetVal;
    prevValRef.current = endVal;

    if (Math.abs(startVal - endVal) < 0.001) {
      setDisplayVal(endVal);
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic out easing
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;
      setDisplayVal(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayVal(endVal);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetVal, duration]);

  return (
    <span className={`tabular-nums font-mono ${className}`}>
      {prefix}
      {displayVal.toFixed(precision)}
      {suffix}
    </span>
  );
};
