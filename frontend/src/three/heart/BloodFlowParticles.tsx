import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { VESSEL_ANCHORS } from '../../config/vessels.anchors';
import { riskColor3 } from '../colorScale';
import { VesselKey } from '../../config/vessels.config';

interface FlowStreamProps {
  vesselKey: VesselKey;
  points: [number, number, number][];
  particleCount?: number;
}

const FlowStream: React.FC<FlowStreamProps> = ({
  vesselKey,
  points,
  particleCount = 36,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { predictions, quality, isAngiogramMode } = useAppStore();

  const pred = predictions?.[vesselKey];
  const prob = pred?.probability ?? 0.25;

  const curve = useMemo(() => {
    const v3Points = points.map((p) => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(v3Points, false, 'centripetal');
  }, [points]);

  // Initial offsets along curve [0, 1]
  const offsets = useMemo(() => {
    const arr = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      arr[i] = i / particleCount;
    }
    return arr;
  }, [particleCount]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const pt = curve.getPoint(offsets[i]);
      pos[i * 3] = pt.x;
      pos[i * 3 + 1] = pt.y;
      pos[i * 3 + 2] = pt.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [curve, offsets, particleCount]);

  const colorRef = useRef(new THREE.Color());

  useFrame((_, delta) => {
    if (!pointsRef.current || quality === 'performance') return;

    // Fluoroscopic contrast dye color in Angiogram mode, else risk gradient
    if (isAngiogramMode) {
      const rgb = riskColor3(prob);
      // Boost luminance in angiogram mode
      colorRef.current.setRGB(Math.min(1, rgb.r * 1.3), Math.min(1, rgb.g * 1.3), Math.min(1, rgb.b * 1.3));
    } else {
      const rgb = riskColor3(prob);
      colorRef.current.setRGB(rgb.r, rgb.g, rgb.b);
    }

    // Dynamic Stenosis Flow Choking: Flow Speed inversely proportional to stenosis risk (1 - prob * 0.78)
    const baseFlowRate = isAngiogramMode ? 0.52 : 0.38;
    const flowChokeFactor = Math.max(0.12, 1.0 - prob * 0.78);
    const speed = delta * baseFlowRate * flowChokeFactor;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      offsets[i] = (offsets[i] + speed) % 1;
      const u = offsets[i];
      const pt = curve.getPoint(u);

      // Localized particle pinching at lesion site (u ~ 0.42)
      const lesionDist = Math.abs(u - 0.42);
      const pinchFactor = lesionDist < 0.08 ? 1.0 - prob * 0.5 : 1.0;

      array[i * 3] = pt.x * pinchFactor;
      array[i * 3 + 1] = pt.y;
      array[i * 3 + 2] = pt.z;
    }
    posAttr.needsUpdate = true;
  });

  if (quality === 'performance') return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={isAngiogramMode ? 0.048 : 0.035}
        color={colorRef.current}
        transparent
        opacity={isAngiogramMode ? 0.95 : 0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const BloodFlowParticles: React.FC = () => {
  const { quality } = useAppStore();

  if (quality === 'performance') return null;

  return (
    <group name="BloodFlowParticles">
      <FlowStream vesselKey="LAD" points={VESSEL_ANCHORS.LAD.main} />
      <FlowStream vesselKey="LCX" points={VESSEL_ANCHORS.LCX.main} />
      <FlowStream vesselKey="RCA" points={VESSEL_ANCHORS.RCA.main} />
    </group>
  );
};
