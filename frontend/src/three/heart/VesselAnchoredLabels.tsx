import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VESSEL_LIST, VesselKey } from '../../config/vessels.config';
import { riskGradient } from '../colorScale';

export const VesselAnchoredLabels: React.FC = () => {
  const { predictions, selectedVessel, selectVessel } = useAppStore();
  const { camera } = useThree();

  // Compute camera distance from origin for semantic zoom collapse
  const cameraDistance = useMemo(() => {
    return camera.position.length();
  }, [camera.position.x, camera.position.y, camera.position.z]);

  // Zoom threshold: At home framing (~4.4) or split view (~5.8), labels collapse to dots
  // When zoomed in to inspect (< 3.9) or when selected, labels expand into full glass cards
  const isZoomedOut = cameraDistance > 3.9;

  return (
    <group name="vessel_anchored_labels_group">
      {VESSEL_LIST.map((vKey: VesselKey) => {
        const vConfig = VESSELS[vKey];
        const pred = predictions?.[vKey];
        const prob = pred?.probability ?? 0.22;
        const color = riskGradient(prob);
        const isSelected = selectedVessel === vKey;

        // Carefully calibrated lateral offsets pointing OUTWARD away from the organ center (0,0,0):
        // - LAD (+X, +Y, +Z): Lateral-anterior left
        // - LCX (+X, +Y, -Z): Lateral-superior left/posterolateral
        // - RCA (-X, -Y, +Z): Lateral right (negative X)
        // This guarantees labels NEVER overlap the cardiac center, ventricles, or great vessels!
        const labelOffset: [number, number, number] =
          vKey === 'LAD'
            ? [0.32, 0.12, 0.14]
            : vKey === 'LCX'
            ? [0.34, 0.18, 0.02]
            : [-0.32, -0.10, 0.12];

        const anchorPos = vConfig.lesionAnchor;
        const showExpanded = isSelected || !isZoomedOut;

        return (
          <group key={vKey} position={anchorPos}>
            {/* Drei Anchored HTML Label Card with Occlusion Culling */}
            <Html
              position={labelOffset}
              center
              distanceFactor={6.2}
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
                {/* SVG Connecting Leader Line (Visible only when expanded to avoid cluttering dots) */}
                {showExpanded && (
                  <svg
                    className="absolute pointer-events-none overflow-visible transition-opacity duration-200"
                    style={{
                      left: vKey === 'RCA' ? '100%' : '-24px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '28px',
                      height: '24px',
                      opacity: isSelected ? 0.95 : 0.65,
                    }}
                  >
                    <path
                      d={
                        vKey === 'RCA'
                          ? 'M 2 12 L 14 12 L 26 22'
                          : 'M 26 12 L 14 12 L 2 22'
                      }
                      fill="none"
                      stroke={isSelected ? '#2dd4bf' : color}
                      strokeWidth={isSelected ? '1.75' : '1.2'}
                      strokeDasharray={isSelected ? 'none' : '2,2'}
                    />
                    <circle
                      cx={vKey === 'RCA' ? '26' : '2'}
                      cy="22"
                      r={isSelected ? '2.5' : '1.75'}
                      fill={color}
                    />
                  </svg>
                )}

                {/* Collapsed Minimal Dot (when zoomed out and not selected) */}
                {!showExpanded ? (
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full border shadow-xl backdrop-blur-xl transition-all duration-200 bg-slate-950/90 hover:scale-125 hover:border-white/80 group-hover/label:ring-2 group-hover/label:ring-teal-400/40"
                    style={{
                      borderColor: color,
                      boxShadow: `0 0 10px ${color}55`,
                    }}
                    title={`${vKey}: ${(prob * 100).toFixed(0)}% · Click to focus`}
                  >
                    <span className="text-[10px] font-bold tracking-tight" style={{ color }}>
                      {vKey}
                    </span>
                  </div>
                ) : (
                  /* Expanded Sleek Glassmorphic Label Card */
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-2xl shadow-2xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-slate-900/95 border-teal-400 text-white shadow-glow-teal ring-1 ring-teal-400/50'
                        : 'bg-slate-950/90 border-white/15 text-slate-200 hover:border-white/35 hover:bg-slate-900/95'
                    }`}
                  >
                    {/* Vessel Indicator Dot */}
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm transition-transform group-hover/label:scale-125"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 6px ${color}aa`,
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
