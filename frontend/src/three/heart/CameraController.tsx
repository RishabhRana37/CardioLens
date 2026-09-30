import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VesselKey } from '../../config/vessels.config';

export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { selectedVessel } = useAppStore();
  const { camera } = useThree();

  // Target camera position and lookAt vector
  const targetCamPos = useRef(new THREE.Vector3(0, 0.3, 3.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);

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

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioning.current) {
      // Smooth easing step
      const step = Math.min(1, delta * 3.2);

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
        // User manually interacted, release programmatic transition
        isTransitioning.current = false;
      }}
    />
  );
};

export default CameraController;
