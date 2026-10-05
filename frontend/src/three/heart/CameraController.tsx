import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VesselKey } from '../../config/vessels.config';

export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { selectedVessel, quality, cameraPreset, setCameraPreset } = useAppStore();
  const { camera } = useThree();

  // Target camera position and lookAt vector
  const targetCamPos = useRef(new THREE.Vector3(0, 0.3, 3.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);

  // Intro Orbit Animation State
  const isIntroOrbiting = useRef(true);
  const introStartTime = useRef<number | null>(null);

  // Auto-Orbit Idle State (pauses on user interaction or vessel selection)
  const isUserInteracting = useRef(false);
  const lastInteractionTime = useRef(Date.now());

  // Detect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion || quality === 'performance') {
      isIntroOrbiting.current = false;
    }
  }, [prefersReducedMotion, quality]);

  // Handle selected vessel framing
  useEffect(() => {
    if (selectedVessel && selectedVessel !== 'CAD') {
      const vConfig = VESSELS[selectedVessel as VesselKey];
      targetCamPos.current.set(...vConfig.camera);
      targetLookAt.current.set(...vConfig.targetLookAt);
      isTransitioning.current = true;
      isIntroOrbiting.current = false;
    } else if (!cameraPreset) {
      targetCamPos.current.set(0, 0.3, 3.8);
      targetLookAt.current.set(0, 0, 0);
      isTransitioning.current = true;
    }
  }, [selectedVessel, cameraPreset]);

  // Handle camera presets (Anterior, Posterior, Left, Right, Apical)
  useEffect(() => {
    if (!cameraPreset) return;

    isIntroOrbiting.current = false;
    isTransitioning.current = true;

    switch (cameraPreset) {
      case 'anterior':
        targetCamPos.current.set(0, 0.3, 3.8);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 'posterior':
        targetCamPos.current.set(0, 0.3, -3.8);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 'left':
        targetCamPos.current.set(-3.8, 0.3, 0.2);
        targetLookAt.current.set(-0.1, 0, 0);
        break;
      case 'right':
        targetCamPos.current.set(3.8, 0.3, 0.2);
        targetLookAt.current.set(0.1, 0, 0);
        break;
      case 'apical':
        targetCamPos.current.set(0, -3.6, 0.9);
        targetLookAt.current.set(0, -0.2, 0);
        break;
    }
  }, [cameraPreset]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // 1. First-load Intro Orbit (2.4s cinematic sweep)
    if (isIntroOrbiting.current && quality === 'cinematic') {
      if (introStartTime.current === null) {
        introStartTime.current = state.clock.getElapsedTime();
      }

      const elapsed = state.clock.getElapsedTime() - introStartTime.current;
      const duration = 2.4;

      if (elapsed < duration) {
        const progress = elapsed / duration;
        const ease = Math.sin((progress * Math.PI) / 2);
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

    // 2. Dynamic Programmatic Easing to Selected Vessel or Preset Target
    if (isTransitioning.current) {
      const step = Math.min(1, delta * 3.8);

      camera.position.lerp(targetCamPos.current, step);
      controlsRef.current.target.lerp(targetLookAt.current, step);
      controlsRef.current.update();

      if (
        camera.position.distanceTo(targetCamPos.current) < 0.02 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.02
      ) {
        isTransitioning.current = false;
        // Reset preset state once converged
        if (cameraPreset) setCameraPreset(null);
      }
    }

    // 3. Slow Idle Auto-Orbit (pauses on manual interaction or vessel focus)
    const timeSinceInteraction = Date.now() - lastInteractionTime.current;
    if (
      !isTransitioning.current &&
      !isIntroOrbiting.current &&
      !isUserInteracting.current &&
      !selectedVessel &&
      timeSinceInteraction > 4000 &&
      quality !== 'performance'
    ) {
      const orbitSpeed = delta * 0.12;
      const x = camera.position.x;
      const z = camera.position.z;
      const radius = Math.sqrt(x * x + z * z);
      const curAngle = Math.atan2(x, z);
      const newAngle = curAngle + orbitSpeed;

      camera.position.x = Math.sin(newAngle) * radius;
      camera.position.z = Math.cos(newAngle) * radius;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={2.0}
      maxDistance={6.5}
      maxPolarAngle={Math.PI / 1.65}
      minPolarAngle={Math.PI / 6}
      onStart={() => {
        isUserInteracting.current = true;
        isIntroOrbiting.current = false;
        isTransitioning.current = false;
        lastInteractionTime.current = Date.now();
      }}
      onEnd={() => {
        isUserInteracting.current = false;
        lastInteractionTime.current = Date.now();
      }}
    />
  );
};

export default CameraController;
