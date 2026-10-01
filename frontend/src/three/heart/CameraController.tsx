import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VesselKey } from '../../config/vessels.config';

export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { selectedVessel, quality } = useAppStore();
  const { camera } = useThree();

  // Target camera position and lookAt vector
  const targetCamPos = useRef(new THREE.Vector3(0, 0.3, 3.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);

  // Intro Orbit Animation State
  const isIntroOrbiting = useRef(true);
  const introStartTime = useRef<number | null>(null);

  // Detect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Disable intro orbit if performance mode or reduced motion
    if (prefersReducedMotion || quality === 'performance') {
      isIntroOrbiting.current = false;
    }
  }, [prefersReducedMotion, quality]);

  useEffect(() => {
    if (selectedVessel && selectedVessel !== 'CAD') {
      const vConfig = VESSELS[selectedVessel as VesselKey];
      targetCamPos.current.set(...vConfig.camera);
      targetLookAt.current.set(...vConfig.targetLookAt);
    } else {
      // Default overview of whole heart
      targetCamPos.current.set(0, 0.3, 3.8);
      targetLookAt.current.set(0, 0, 0);
    }
    isTransitioning.current = true;
  }, [selectedVessel]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // 1. First-load Intro Orbit (2.5s cinematic sweep)
    if (isIntroOrbiting.current && quality === 'cinematic') {
      if (introStartTime.current === null) {
        introStartTime.current = state.clock.getElapsedTime();
      }

      const elapsed = state.clock.getElapsedTime() - introStartTime.current;
      const duration = 2.4;

      if (elapsed < duration) {
        const progress = elapsed / duration;
        const ease = Math.sin((progress * Math.PI) / 2); // Ease out
        const angle = (1 - ease) * 0.9;
        const dist = 4.6 - ease * 0.8;

        camera.position.x = Math.sin(angle) * dist;
        camera.position.y = 0.6 - ease * 0.3;
        camera.position.z = Math.cos(angle) * dist;
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
        return;
      } else {
        isIntroOrbiting.current = false;
      }
    }

    // 2. Dynamic Programmatic Easing to Selected Vessel Target
    if (isTransitioning.current) {
      const step = Math.min(1, delta * 3.5);

      camera.position.lerp(targetCamPos.current, step);
      controlsRef.current.target.lerp(targetLookAt.current, step);
      controlsRef.current.update();

      // Check convergence to stop transition
      if (
        camera.position.distanceTo(targetCamPos.current) < 0.02 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.02
      ) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={2.0}
      maxDistance={6.5}
      maxPolarAngle={Math.PI / 1.75}
      minPolarAngle={Math.PI / 5}
      onStart={() => {
        // User manually interacted, immediately cancel intro orbit and programmatic transition
        isIntroOrbiting.current = false;
        isTransitioning.current = false;
      }}
    />
  );
};

export default CameraController;
