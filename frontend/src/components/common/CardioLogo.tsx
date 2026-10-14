import React from 'react';

interface CardioLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  animated?: boolean;
  className?: string;
}

export const CardioLogo: React.FC<CardioLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  animated = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base', tag: 'text-[9px]' },
    md: { icon: 36, text: 'text-lg', tag: 'text-[10px]' },
    lg: { icon: 48, text: 'text-2xl', tag: 'text-xs' },
    xl: { icon: 72, text: 'text-4xl', tag: 'text-sm' },
  };

  const { icon: iconSize, text: textClass, tag: tagClass } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 font-sans select-none ${className}`}>
      {/* Refined EKG-to-Heart Morphing Vector Glyph */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl bg-slate-900/90 border border-teal-500/30 p-1.5 shadow-glow-teal backdrop-blur-md"
        style={{ width: iconSize, height: iconSize }}
      >
        {/* Ambient Glow Aura */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-800/10 blur-sm pointer-events-none" />

        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full drop-shadow-sm ${animated ? 'animate-pulse' : ''}`}
        >
          <defs>
            <linearGradient id="cardioGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="60%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Heart Contour Background Silhouette */}
          <path
            d="M 24 40 C 24 40 7 28.5 7 17 C 7 11.2 11.5 6.8 17.2 6.8 C 20.8 6.8 23.1 8.5 24 10 C 24.9 8.5 27.2 6.8 30.8 6.8 C 36.5 6.8 41 11.2 41 17 C 41 28.5 24 40 24 40 Z"
            fill="rgba(13, 148, 136, 0.14)"
            stroke="url(#cardioGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Integrated Continuous EKG Pulse Trace through Heart Core */}
          <path
            d="M 6 24 L 14 24 L 17 19 L 20 28 L 24 9 L 28 35 L 31 21 L 34 26 L 37 24 L 42 24"
            fill="none"
            stroke="url(#cardioGrad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glowFilter)"
          />

          {/* Apex Focus Dot */}
          <circle cx="24" cy="38" r="1.5" fill="#2dd4bf" />
        </svg>
      </div>

      {/* Typography Label */}
      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-slate-100 ${textClass}`}
              style={{ letterSpacing: '-0.03em' }}
            >
              Cardio<span className="text-teal-400">Twin</span>
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-950/80 text-teal-300 border border-teal-500/30">
              PRO
            </span>
          </div>

          {showTagline && (
            <span className={`hidden xl:inline text-slate-400 font-medium tracking-normal ${tagClass}`}>
              See the risk. <span className="text-teal-400 font-semibold">See why.</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CardioLogo;
