import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { CORONARY_PATHS } from './CoronaryVessels';
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
  particleCount = 28,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { predictions, quality } = useAppStore();

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
    if (!pointsRef.current || quality !== 'cinematic') return;

    const rgb = riskColor3(prob);
    colorRef.current.setRGB(rgb.r, rgb.g, rgb.b);

    // Particle flow speed
    const speed = delta * (0.28 + prob * 0.15);

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      offsets[i] = (offsets[i] + speed) % 1;
      const pt = curve.getPoint(offsets[i]);
      array[i * 3] = pt.x;
      array[i * 3 + 1] = pt.y;
      array[i * 3 + 2] = pt.z;
    }
    posAttr.needsUpdate = true;
  });

  if (quality !== 'cinematic') return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.035}
        color={colorRef.current}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const BloodFlowParticles: React.FC = () => {
  const { quality } = useAppStore();

  if (quality !== 'cinematic') return null;

  return (
    <group>
      <FlowStream vesselKey="LAD" points={CORONARY_PATHS.LAD.main} />
      <FlowStream vesselKey="LCX" points={CORONARY_PATHS.LCX.main} />
      <FlowStream vesselKey="RCA" points={CORONARY_PATHS.RCA.main} />
    </group>
  );
};
