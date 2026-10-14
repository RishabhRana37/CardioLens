import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VesselKey, VESSELS } from '../../config/vessels.config';
import { useAppStore } from '../../store/useAppStore';
import { riskColor3 } from '../colorScale';

interface StenosisPlaqueMarkerProps {
  vesselKey: VesselKey;
}

export const StenosisPlaqueMarker: React.FC<StenosisPlaqueMarkerProps> = ({ vesselKey }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const { predictions, quality, selectedVessel } = useAppStore();

  const vConfig = VESSELS[vesselKey];
  const pred = predictions?.[vesselKey];
  const prob = pred?.probability ?? 0.2;
  const isSelected = selectedVessel === vesselKey;

  const currentScale = useRef<number>(0.001);
  const targetScale = useRef<number>(0.001);
  const currentColor = useRef<THREE.Color>(new THREE.Color('#16a34a'));

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Plaque size scales with probability (visible from prob > 0.25)
    targetScale.current = prob > 0.25 ? 0.05 + prob * 0.055 : 0.0001;
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale.current, delta * 5);
    meshRef.current.scale.setScalar(currentScale.current);

    if (ringRef.current) {
      ringRef.current.scale.setScalar(currentScale.current * 1.35);
      ringRef.current.rotation.z += delta * 0.8;
      ringRef.current.rotation.x += delta * 0.4;
    }

    // Color transition
    const rgb = riskColor3(prob);
    currentColor.current.lerp(new THREE.Color(rgb.r, rgb.g, rgb.b), delta * 4.5);

    materialRef.current.color.copy(currentColor.current);
    materialRef.current.emissive.copy(currentColor.current);

    // Emissive intensity & pulse
    let intensity = prob > 0.66 ? 1.8 : 0.8;
    if (prob > 0.66 && quality !== 'performance') {
      const time = state.clock.getElapsedTime();
      intensity += Math.sin(time * 5) * 0.5 + 0.5;
    }
    if (isSelected) intensity += 0.6;

    materialRef.current.emissiveIntensity = intensity;
    materialRef.current.opacity = Math.min(0.85, 0.25 + prob * 0.6);

    if (ringMaterialRef.current) {
      ringMaterialRef.current.color.copy(currentColor.current);
      ringMaterialRef.current.opacity = Math.min(0.6, prob * 0.7);
    }
  });

  if (prob <= 0.25 && !isSelected) return null;

  return (
    <group position={vConfig.lesionAnchor} name={`StenosisLesion_${vesselKey}`}>
      {/* Plaque Cuff / Narrowing Collar */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Pulsing Outer Stenosis Warning Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.15, 8, 24]} />
        <meshBasicMaterial
          ref={ringMaterialRef}
          color="#f43f5e"
          transparent
          opacity={0.5}
          wireframe
        />
      </mesh>
    </group>
  );
};
