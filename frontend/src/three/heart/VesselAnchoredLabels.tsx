import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VESSEL_LIST, VesselKey } from '../../config/vessels.config';
import { riskGradient, getRiskTier } from '../colorScale';

export const VesselAnchoredLabels: React.FC = () => {
  const { predictions, selectedVessel, selectVessel, isAngiogramMode } = useAppStore();
  const { camera } = useThree();

  // Compute camera distance from origin for semantic zoom collapse
  const cameraDistance = useMemo(() => {
    return camera.position.length();
  }, [camera.position.x, camera.position.y, camera.position.z]);

  const isZoomedOut = cameraDistance > 5.2;

  return (
    <group name="vessel_anchored_labels_group">
      {VESSEL_LIST.map((vKey: VesselKey) => {
        const vConfig = VESSELS[vKey];
        const pred = predictions?.[vKey];
        const prob = pred?.probability ?? 0.22;
        const color = riskGradient(prob);
        const { tier } = getRiskTier(prob);
        const isSelected = selectedVessel === vKey;
        const isHighRisk = prob >= 0.67;

        // Custom leader line offset vector for clean positioning away from heart surface
        // LAD goes up-right, LCX goes up-left, RCA goes down-right
        const labelOffset: [number, number, number] =
          vKey === 'LAD'
            ? [0.18, 0.22, 0.08]
            : vKey === 'LCX'
            ? [-0.22, 0.18, 0.06]
            : [0.22, -0.16, 0.06];

        const anchorPos = vConfig.lesionAnchor;

        return (
          <group key={vKey} position={anchorPos}>
            {/* 3D Pulsing Anchor Point on the Artery Surface */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.024, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Glowing Anchor Halo for High Risk */}
            {isHighRisk && (
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.045, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.35} />
              </mesh>
            )}

            {/* Drei Anchored HTML Label Card with Occlusion */}
            <Html
              position={labelOffset}
              center
              distanceFactor={6.8}
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
                {/* SVG Connecting Leader Line to Artery Anchor [0,0,0] */}
                <svg
                  className="absolute pointer-events-none overflow-visible"
                  style={{
                    left: vKey === 'LCX' ? '100%' : '-32px',
                    top: vKey === 'RCA' ? '-24px' : '50%',
                    width: '42px',
                    height: '36px',
                  }}
                >
                  <path
                    d={
                      vKey === 'LCX'
                        ? 'M 0 16 L 24 16 L 36 32'
                        : vKey === 'RCA'
                        ? 'M 32 32 L 16 32 L 0 8'
                        : 'M 36 18 L 14 18 L 0 32'
                    }
                    fill="none"
                    stroke={isSelected ? '#38bdf8' : isAngiogramMode ? '#fbbf24' : color}
                    strokeWidth={isSelected ? '2' : '1.25'}
                    strokeDasharray={isSelected ? 'none' : '2,2'}
                    opacity={isSelected ? 0.95 : 0.7}
                  />
                  <circle
                    cx={vKey === 'LCX' ? '36' : '0'}
                    cy={vKey === 'RCA' ? '8' : '32'}
                    r={isSelected ? '3' : '2'}
                    fill={color}
                  />
                </svg>

                {/* Collapsed View (when zoomed out) */}
                {isZoomedOut ? (
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full border shadow-lg backdrop-blur-md transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-teal-400 text-white shadow-glow-teal ring-2 ring-teal-400/50'
                        : 'bg-slate-950/80 border-white/20 text-slate-200 hover:border-white/40'
                    }`}
                    style={{ borderColor: isSelected ? undefined : color }}
                  >
                    <span className="text-[9px] font-bold">{vKey}</span>
                  </div>
                ) : (
                  /* Expanded Glassmorphic Command Label Card */
                  <div
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border backdrop-blur-xl shadow-glass-md transition-all duration-200 ${
                      isSelected
                        ? 'bg-slate-900/95 border-teal-400/80 text-white shadow-glow-teal ring-1 ring-teal-400/40'
                        : isAngiogramMode
                        ? 'bg-slate-950/90 border-amber-500/40 text-slate-200 hover:border-amber-400/70 hover:bg-slate-900/95'
                        : 'bg-slate-950/85 border-white/15 text-slate-200 hover:border-white/35 hover:bg-slate-900/90'
                    }`}
                  >
                    {/* Vessel Indicator Dot */}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform group-hover/label:scale-125"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}88`,
                      }}
                    />

                    {/* Vessel Symbol */}
                    <span className="text-xs font-bold tracking-wide text-slate-100">
                      {vKey}
                    </span>

                    <span className="text-slate-600 text-[10px]">|</span>

                    {/* Probability Percentage */}
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color }}
                    >
                      {(prob * 100).toFixed(0)}%
                    </span>

                    {/* Compact Clinical Badge */}
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-semibold tracking-tight border uppercase ${
                        tier === 'high'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-600/50'
                          : tier === 'moderate'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                      }`}
                    >
                      {tier === 'high' ? 'Severe' : tier === 'moderate' ? 'Mod' : 'Low'}
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
