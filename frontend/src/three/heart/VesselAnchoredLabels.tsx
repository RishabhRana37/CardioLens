import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VESSEL_LIST, VesselKey } from '../../config/vessels.config';
import { riskGradient } from '../colorScale';

export const VesselAnchoredLabels: React.FC = () => {
  const { predictions, selectedVessel, selectVessel, isAngiogramMode } = useAppStore();
  const { camera } = useThree();

  // Compute camera distance from origin for semantic zoom collapse
  const cameraDistance = useMemo(() => {
    return camera.position.length();
  }, [camera.position.x, camera.position.y, camera.position.z]);

  const isZoomedOut = cameraDistance > 4.6;

  return (
    <group name="vessel_anchored_labels_group">
      {VESSEL_LIST.map((vKey: VesselKey) => {
        const vConfig = VESSELS[vKey];
        const pred = predictions?.[vKey];
        const prob = pred?.probability ?? 0.22;
        const color = riskGradient(prob);
        const isSelected = selectedVessel === vKey;

        // Custom leader line offset vectors positioning labels neatly outside the heart silhouette
        // LAD goes right-lateral anterior, LCX goes upper-left lateral, RCA goes lower-right lateral
        const labelOffset: [number, number, number] =
          vKey === 'LAD'
            ? [0.28, 0.12, 0.16]
            : vKey === 'LCX'
            ? [-0.32, 0.20, 0.05]
            : [0.30, -0.20, 0.10];

        const anchorPos = vConfig.lesionAnchor;

        return (
          <group key={vKey} position={anchorPos}>
            {/* Drei Anchored HTML Label Card with Occlusion Culling */}
            <Html
              position={labelOffset}
              center
              distanceFactor={6.5}
              occlude="blending"
              className="pointer-events-auto select-none"
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  selectVessel(isSelected ? null : vKey);
                }}
                className={`group/label relative cursor-pointer font-mono transition-all duration-200 ease-out ${
                  isSelected ? 'scale-110 z-40' : 'hover:scale-105 z-20'
                }`}
              >
                {/* Clean SVG Connecting Leader Line to Artery Anchor [0,0,0] */}
                <svg
                  className="absolute pointer-events-none overflow-visible transition-opacity duration-200"
                  style={{
                    left: vKey === 'LCX' ? '100%' : '-26px',
                    top: vKey === 'RCA' ? '-18px' : '50%',
                    width: '32px',
                    height: '28px',
                    opacity: isSelected ? 0.9 : 0.6,
                  }}
                >
                  <path
                    d={
                      vKey === 'LCX'
                        ? 'M 0 14 L 18 14 L 28 24'
                        : vKey === 'RCA'
                        ? 'M 26 24 L 14 24 L 0 6'
                        : 'M 26 14 L 12 14 L 0 24'
                    }
                    fill="none"
                    stroke={isSelected ? '#38bdf8' : isAngiogramMode ? '#fbbf24' : color}
                    strokeWidth={isSelected ? '1.75' : '1.2'}
                    strokeDasharray={isSelected ? 'none' : '2,2'}
                  />
                  <circle
                    cx={vKey === 'LCX' ? '28' : '0'}
                    cy={vKey === 'RCA' ? '6' : '24'}
                    r={isSelected ? '2.5' : '1.75'}
                    fill={color}
                  />
                </svg>

                {/* Collapsed Minimal Dot (when zoomed out and not selected/hovered) */}
                {isZoomedOut && !isSelected ? (
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded-full border shadow-lg backdrop-blur-md transition-all duration-150 bg-slate-950/85 hover:scale-110 hover:border-white/60"
                    style={{ borderColor: color }}
                    title={`${vKey}: ${(prob * 100).toFixed(0)}%`}
                  >
                    <span className="text-[9px] font-bold" style={{ color }}>
                      {vKey}
                    </span>
                  </div>
                ) : (
                  /* Expanded Sleek Glassmorphic Label Card */
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-xl shadow-glass-md transition-all duration-200 ${
                      isSelected
                        ? 'bg-slate-900/95 border-teal-400 text-white shadow-glow-teal ring-1 ring-teal-400/40'
                        : isAngiogramMode
                        ? 'bg-slate-950/90 border-amber-500/40 text-slate-200 hover:border-amber-400/70 hover:bg-slate-900/95'
                        : 'bg-slate-950/85 border-white/15 text-slate-200 hover:border-white/35 hover:bg-slate-900/90'
                    }`}
                  >
                    {/* Vessel Indicator Dot */}
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm transition-transform group-hover/label:scale-125"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 6px ${color}99`,
                      }}
                    />

                    {/* Vessel Symbol */}
                    <span className="text-[11px] font-bold tracking-wide text-slate-100">
                      {vKey}
                    </span>

                    <span className="text-slate-600 text-[10px]">·</span>

                    {/* Probability Percentage */}
                    <span
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color }}
                    >
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

export default VesselAnchoredLabels;
