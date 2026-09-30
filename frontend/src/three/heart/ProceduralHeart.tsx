import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

interface ProceduralHeartProps {
  isBeating?: boolean;
}

export const ProceduralHeart: React.FC<ProceduralHeartProps> = ({ isBeating = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const vesselMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const { quality, predictions, selectedVessel } = useAppStore();

  // Cardiac muscle base colors
  const baseHeartColor = useMemo(() => new THREE.Color('#781224'), []);
  const targetHeartColor = useMemo(() => new THREE.Color('#781224'), []);
  const aortaColor = useMemo(() => new THREE.Color('#942938'), []);
  const veinColor = useMemo(() => new THREE.Color('#24466b'), []);

  // Compute slight tint on overall CAD status if whole-heart view active
  const cadProb = predictions?.CAD?.probability ?? 0.2;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Heartbeat Pulse Animation
    if (isBeating && quality !== 'performance') {
      const time = state.clock.getElapsedTime();
      const bpm = 68; // 68 BPM
      const cycle = (time * (bpm / 60) * Math.PI * 2) % (Math.PI * 2);

      // Dual-phase cardiac cycle (lub-dub pulse)
      const p1 = Math.sin(cycle);
      const p2 = Math.sin(cycle * 2 + 0.3);
      const beat = Math.max(0, p1 * 0.7 + p2 * 0.3);

      const scalePulse = 1.0 + beat * 0.035;
      groupRef.current.scale.set(scalePulse, scalePulse * 1.02, scalePulse);

      // Subtle organic twist during systole
      groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.04 + beat * 0.015;
    } else if (isBeating && quality === 'performance') {
      const time = state.clock.getElapsedTime();
      const beat = Math.sin(time * 6) * 0.015;
      groupRef.current.scale.set(1 + beat, 1 + beat, 1 + beat);
    }

    // Dynamic tint if CAD is selected / whole heart
    if (materialRef.current) {
      if (selectedVessel === null && cadProb > 0.6) {
        targetHeartColor.set('#8e1526').lerp(new THREE.Color('#dc2626'), (cadProb - 0.6) * 0.4);
      } else {
        targetHeartColor.copy(baseHeartColor);
      }
      materialRef.current.color.lerp(targetHeartColor, delta * 3);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* --- Main Cardiac Muscle Body (Ventricles & Myocardium) --- */}
      {/* Left Ventricle (Apex & Anterior) */}
      <mesh position={[-0.15, -0.3, 0.05]} rotation={[0.2, 0.1, -0.35]}>
        <coneGeometry args={[0.9, 1.6, 32, 16]} />
        <meshPhysicalMaterial
          ref={materialRef}
          color="#781224"
          roughness={0.36}
          metalness={0.06}
          clearcoat={0.65}
          clearcoatRoughness={0.25}
          sheen={0.8}
          sheenColor="#e11d48"
          sheenRoughness={0.4}
        />
      </mesh>

      {/* Right Ventricle (Anterior Conus & Basal Wall) */}
      <mesh position={[0.35, -0.2, 0.15]} rotation={[0.1, -0.25, 0.3]}>
        <sphereGeometry args={[0.72, 32, 24]} />
        <meshPhysicalMaterial
          color="#6f1020"
          roughness={0.4}
          metalness={0.05}
          clearcoat={0.55}
          clearcoatRoughness={0.3}
          sheen={0.7}
          sheenColor="#e11d48"
        />
      </mesh>

      {/* Left Atrium & Base */}
      <mesh position={[-0.38, 0.45, -0.15]} rotation={[-0.1, 0.2, -0.1]}>
        <sphereGeometry args={[0.55, 24, 20]} />
        <meshPhysicalMaterial
          color="#681020"
          roughness={0.42}
          clearcoat={0.5}
          sheen={0.6}
          sheenColor="#be123c"
        />
      </mesh>

      {/* Right Atrium & Auricle */}
      <mesh position={[0.48, 0.4, -0.05]} rotation={[0.15, -0.2, 0.1]}>
        <sphereGeometry args={[0.52, 24, 20]} />
        <meshPhysicalMaterial
          color="#64101e"
          roughness={0.42}
          clearcoat={0.5}
          sheen={0.6}
          sheenColor="#be123c"
        />
      </mesh>

      {/* --- Great Vessels & Outflow Tracts --- */}
      {/* Ascending Aorta Arch */}
      <mesh position={[-0.05, 0.85, -0.1]} rotation={[0.1, 0.1, -0.15]}>
        <cylinderGeometry args={[0.3, 0.33, 0.85, 24]} />
        <meshPhysicalMaterial
          color={aortaColor}
          roughness={0.32}
          clearcoat={0.7}
          metalness={0.08}
        />
      </mesh>

      {/* Aortic Arch Curved Cap */}
      <mesh position={[-0.08, 1.25, -0.15]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.26, 0.14, 16, 24, Math.PI]} />
        <meshPhysicalMaterial
          color={aortaColor}
          roughness={0.32}
          clearcoat={0.7}
        />
      </mesh>

      {/* Pulmonary Artery Trunk */}
      <mesh position={[0.2, 0.72, 0.22]} rotation={[0.35, -0.3, 0.25]}>
        <cylinderGeometry args={[0.26, 0.28, 0.75, 24]} />
        <meshPhysicalMaterial
          ref={vesselMaterialRef}
          color={veinColor}
          roughness={0.38}
          clearcoat={0.6}
        />
      </mesh>

      {/* Superior Vena Cava (SVC) */}
      <mesh position={[0.58, 0.88, -0.2]} rotation={[-0.1, 0, 0.1]}>
        <cylinderGeometry args={[0.2, 0.22, 0.75, 20]} />
        <meshPhysicalMaterial
          color={veinColor}
          roughness={0.4}
          clearcoat={0.5}
        />
      </mesh>

      {/* Inferior Vena Cava (IVC) Base */}
      <mesh position={[0.52, -0.7, -0.25]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.5, 16]} />
        <meshPhysicalMaterial
          color={veinColor}
          roughness={0.45}
          clearcoat={0.4}
        />
      </mesh>

      {/* Interventricular & Atrioventricular Sulcus Fatty Grooves */}
      <mesh position={[0.12, -0.1, 0.52]} rotation={[0.2, 0.1, -0.2]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#943828" roughness={0.6} />
      </mesh>
      <mesh position={[-0.32, 0.1, 0.42]} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color="#943828" roughness={0.6} />
      </mesh>
    </group>
  );
};

export default ProceduralHeart;
