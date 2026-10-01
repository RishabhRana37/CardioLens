import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

interface ProceduralHeartProps {
  isBeating?: boolean;
}

export const ProceduralHeart: React.FC<ProceduralHeartProps> = ({ isBeating = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const myocardiumMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const { quality, predictions, selectedVessel } = useAppStore();

  // Color palette matching the anatomical illustration
  const baseMyoColor = useMemo(() => new THREE.Color('#b53846'), []);
  const targetMyoColor = useMemo(() => new THREE.Color('#b53846'), []);
  const aortaColor = useMemo(() => new THREE.Color('#9e1b2e'), []);
  const pulmonaryBlue = useMemo(() => new THREE.Color('#1e5b9e'), []);
  const auricleColor = useMemo(() => new THREE.Color('#a89050'), []); // Ochre/tan auricle tissue

  // Compute slight tint on overall CAD status if whole-heart view active
  const cadProb = predictions?.CAD?.probability ?? 0.2;

  // Aortic Arch curve matching sticker
  const aorticCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, 0.5, 0.0),
      new THREE.Vector3(-0.02, 0.95, -0.05),
      new THREE.Vector3(0.08, 1.28, -0.08),
      new THREE.Vector3(0.28, 1.25, -0.15),
      new THREE.Vector3(0.42, 0.95, -0.22),
      new THREE.Vector3(0.46, 0.55, -0.28),
    ], false, 'centripetal');
  }, []);

  const aorticGeo = useMemo(() => {
    return new THREE.TubeGeometry(aorticCurve, 32, 0.16, 16, false);
  }, [aorticCurve]);

  // Pulmonary Trunk curve crossing in front of Aorta (Cobalt Blue)
  const pulmonaryCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, 0.35, 0.32),
      new THREE.Vector3(-0.02, 0.68, 0.28),
      new THREE.Vector3(-0.18, 0.92, 0.15),
      new THREE.Vector3(-0.42, 0.98, -0.02),
    ], false, 'centripetal');
  }, []);

  const pulmonaryGeo = useMemo(() => {
    return new THREE.TubeGeometry(pulmonaryCurve, 28, 0.15, 16, false);
  }, [pulmonaryCurve]);

  // Right Pulmonary Artery branch (crossing beneath aortic arch to right)
  const rightPulmonaryCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.92, 0.15),
      new THREE.Vector3(0.12, 0.96, 0.02),
      new THREE.Vector3(0.38, 0.94, -0.08),
    ], false, 'centripetal');
  }, []);

  const rightPulmonaryGeo = useMemo(() => {
    return new THREE.TubeGeometry(rightPulmonaryCurve, 16, 0.11, 14, false);
  }, [rightPulmonaryCurve]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Heartbeat Pulse Animation (Lub-Dub rhythm)
    if (isBeating && quality !== 'performance') {
      const time = state.clock.getElapsedTime();
      const bpm = 68;
      const cycle = (time * (bpm / 60) * Math.PI * 2) % (Math.PI * 2);

      const p1 = Math.sin(cycle);
      const p2 = Math.sin(cycle * 2 + 0.3);
      const beat = Math.max(0, p1 * 0.7 + p2 * 0.3);

      const scalePulse = 1.0 + beat * 0.038;
      groupRef.current.scale.set(scalePulse, scalePulse * 1.02, scalePulse);
      groupRef.current.rotation.y = Math.sin(time * 0.4) * 0.035 + beat * 0.015;
    } else if (isBeating && quality === 'performance') {
      const time = state.clock.getElapsedTime();
      const beat = Math.sin(time * 6) * 0.015;
      groupRef.current.scale.set(1 + beat, 1 + beat, 1 + beat);
    }

    // Dynamic color lerp
    if (myocardiumMatRef.current) {
      if (selectedVessel === null && cadProb > 0.6) {
        targetMyoColor.set('#b53846').lerp(new THREE.Color('#dc2626'), (cadProb - 0.6) * 0.5);
      } else {
        targetMyoColor.copy(baseMyoColor);
      }
      myocardiumMatRef.current.color.lerp(targetMyoColor, delta * 3);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.08, 0]}>
      {/* ========================================================
          1. VENTRICULAR MYOCARDIUM (ANTERIOR & APEX)
         ======================================================== */}
      {/* Left Ventricle (Apex cone pointing down & slightly left) */}
      <mesh position={[-0.12, -0.32, 0.08]} rotation={[0.22, 0.12, -0.32]}>
        <coneGeometry args={[0.88, 1.65, 32, 16]} />
        <meshPhysicalMaterial
          ref={myocardiumMatRef}
          color="#b53846"
          roughness={0.42}
          metalness={0.06}
          clearcoat={0.65}
          clearcoatRoughness={0.25}
          sheen={0.8}
          sheenColor="#e11d48"
        />
      </mesh>

      {/* Right Ventricle (Anterior wall & conus arteriosus) */}
      <mesh position={[0.32, -0.22, 0.18]} rotation={[0.12, -0.28, 0.28]}>
        <sphereGeometry args={[0.74, 32, 24]} />
        <meshPhysicalMaterial
          color="#a83240"
          roughness={0.44}
          metalness={0.05}
          clearcoat={0.55}
          sheen={0.7}
          sheenColor="#e11d48"
        />
      </mesh>

      {/* Ventricular Apex Cap (Rounded tip) */}
      <mesh position={[-0.22, -0.92, 0.04]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.28, 24, 16]} />
        <meshPhysicalMaterial
          color="#9c2434"
          roughness={0.4}
          clearcoat={0.6}
        />
      </mesh>

      {/* ========================================================
          2. RIGHT & LEFT AURICLES (ATRIAL APPENDAGES - OCHRE/TAN)
         ======================================================== */}
      {/* Right Auricle (Textured flap on upper left anatomical right) */}
      <group position={[0.62, 0.28, 0.12]} rotation={[0.1, -0.35, 0.2]}>
        <mesh>
          <sphereGeometry args={[0.38, 24, 16]} />
          <meshPhysicalMaterial
            color={auricleColor}
            roughness={0.65}
            metalness={0.08}
            clearcoat={0.3}
            sheen={0.5}
            sheenColor="#d4b86a"
          />
        </mesh>
        {/* Scalloped texture details */}
        <mesh position={[-0.08, 0.12, 0.12]} rotation={[0.2, 0.3, -0.1]}>
          <sphereGeometry args={[0.22, 16, 12]} />
          <meshPhysicalMaterial color="#947c38" roughness={0.7} />
        </mesh>
      </group>

      {/* Left Auricle (Textured flap on lateral LV margin) */}
      <group position={[-0.56, 0.34, 0.08]} rotation={[-0.1, 0.3, -0.25]}>
        <mesh>
          <sphereGeometry args={[0.36, 24, 16]} />
          <meshPhysicalMaterial
            color={auricleColor}
            roughness={0.65}
            metalness={0.08}
            clearcoat={0.3}
            sheen={0.5}
            sheenColor="#d4b86a"
          />
        </mesh>
        <mesh position={[0.08, 0.1, 0.1]} rotation={[-0.2, -0.3, 0.1]}>
          <sphereGeometry args={[0.2, 16, 12]} />
          <meshPhysicalMaterial color="#947c38" roughness={0.7} />
        </mesh>
      </group>

      {/* Posterior Left Atrium */}
      <mesh position={[-0.25, 0.48, -0.2]} rotation={[-0.1, 0.1, 0]}>
        <sphereGeometry args={[0.54, 24, 20]} />
        <meshPhysicalMaterial color="#7a1828" roughness={0.45} clearcoat={0.5} />
      </mesh>

      {/* ========================================================
          3. AORTIC ARCH & 3 BRACHIOCEPHALIC ARTERIAL BRANCHES
         ======================================================== */}
      {/* Main Sweeping Aortic Arch */}
      <mesh geometry={aorticGeo}>
        <meshPhysicalMaterial
          color={aortaColor}
          roughness={0.32}
          metalness={0.12}
          clearcoat={0.75}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Branch 1: Brachiocephalic Artery Trunk (Right branch with bifurcation) */}
      <group position={[0.02, 1.26, -0.06]} rotation={[0.1, 0, -0.15]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.055, 0.065, 0.44, 16]} />
          <meshPhysicalMaterial color={aortaColor} roughness={0.32} clearcoat={0.7} />
        </mesh>
        {/* Right Subclavian bifurcation */}
        <mesh position={[0.05, 0.44, 0.04]} rotation={[0.2, 0, 0.4]}>
          <cylinderGeometry args={[0.038, 0.045, 0.24, 12]} />
          <meshPhysicalMaterial color={aortaColor} roughness={0.32} clearcoat={0.7} />
        </mesh>
        {/* Right Common Carotid bifurcation */}
        <mesh position={[-0.04, 0.45, -0.02]} rotation={[-0.1, 0, -0.2]}>
          <cylinderGeometry args={[0.038, 0.045, 0.26, 12]} />
          <meshPhysicalMaterial color={aortaColor} roughness={0.32} clearcoat={0.7} />
        </mesh>
      </group>

      {/* Branch 2: Left Common Carotid Artery (Middle vertical branch) */}
      <group position={[0.16, 1.3, -0.12]} rotation={[0.05, 0, 0.05]}>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.48, 16]} />
          <meshPhysicalMaterial color={aortaColor} roughness={0.32} clearcoat={0.7} />
        </mesh>
      </group>

      {/* Branch 3: Left Subclavian Artery (Leftmost vertical branch) */}
      <group position={[0.28, 1.22, -0.16]} rotation={[0.1, 0, 0.25]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.048, 0.058, 0.44, 16]} />
          <meshPhysicalMaterial color={aortaColor} roughness={0.32} clearcoat={0.7} />
        </mesh>
      </group>

      {/* ========================================================
          4. PULMONARY TRUNK & BIFURCATING ARTERIES (COBALT BLUE)
         ======================================================== */}
      {/* Main Pulmonary Trunk crossing anteriorly */}
      <mesh geometry={pulmonaryGeo}>
        <meshPhysicalMaterial
          color={pulmonaryBlue}
          roughness={0.35}
          metalness={0.15}
          clearcoat={0.7}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* Right Pulmonary Artery Branch */}
      <mesh geometry={rightPulmonaryGeo}>
        <meshPhysicalMaterial
          color={pulmonaryBlue}
          roughness={0.35}
          metalness={0.15}
          clearcoat={0.7}
        />
      </mesh>

      {/* Left Pulmonary Artery Terminal Open Lumen */}
      <mesh position={[-0.42, 0.98, -0.02]} rotation={[0, 0, Math.PI / 2.5]}>
        <torusGeometry args={[0.11, 0.035, 12, 20]} />
        <meshPhysicalMaterial color="#144275" roughness={0.4} clearcoat={0.5} />
      </mesh>

      {/* ========================================================
          5. SUPERIOR VENA CAVA & PULMONARY VEINS (DEEP BLUE)
         ======================================================== */}
      {/* Superior Vena Cava (SVC) entering Right Atrium */}
      <group position={[0.62, 0.85, -0.14]} rotation={[-0.15, 0, 0.08]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.75, 20]} />
          <meshPhysicalMaterial color="#1a4d85" roughness={0.38} clearcoat={0.6} />
        </mesh>
        {/* SVC Open Lumen */}
        <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.03, 12, 20]} />
          <meshPhysicalMaterial color="#123862" roughness={0.4} />
        </mesh>
      </group>

      {/* Right Pulmonary Veins (2 small paired vessels) */}
      <mesh position={[0.68, 0.48, -0.28]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.28, 12]} />
        <meshPhysicalMaterial color="#8e1526" roughness={0.35} clearcoat={0.6} />
      </mesh>

      {/* Left Pulmonary Veins */}
      <mesh position={[-0.52, 0.52, -0.32]} rotation={[0, -Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.28, 12]} />
        <meshPhysicalMaterial color="#8e1526" roughness={0.35} clearcoat={0.6} />
      </mesh>

      {/* ========================================================
          6. ANTERIOR INTERVENTRICULAR SULCUS FATTY GROOVE
         ======================================================== */}
      <mesh position={[0.06, -0.05, 0.48]} rotation={[0.22, 0.1, -0.25]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#943828" roughness={0.65} />
      </mesh>
      <mesh position={[-0.08, -0.42, 0.38]} rotation={[0.15, 0.1, -0.3]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color="#882e22" roughness={0.65} />
      </mesh>
    </group>
  );
};

export default ProceduralHeart;
