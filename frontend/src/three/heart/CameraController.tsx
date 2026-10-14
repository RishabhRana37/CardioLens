import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VesselKey, getVesselObject } from '../../config/vessels.config';

/**
 * Computes canonical camera position and target that:
 * 1. Auto-fits the heart bounding box to fill ~67% of the viewport's free vertical height.
 * 2. Leaves ~16% headroom at the top (so aortic arch & great vessels are never obscured under the top bar).
 * 3. Offsets the visual center horizontally and vertically to account for floating overlays
 *    (TopBar, bottom dock, and any active right drawer panel).
 * 4. Adapts automatically to window resize and focus mode.
 */
function computeCanonicalFraming(
  box: THREE.Box3,
  width: number,
  height: number,
  camera: THREE.PerspectiveCamera,
  hasRightPanel: boolean,
  isFocusMode: boolean,
  isSplitView: boolean = false
) {
  // Offsets for floating translucent glass chrome (in pixels)
  // In Split View, TopBar is outside the Canvas container. The minimal HUD is at bottom (~54px).
  const topOffset = isSplitView ? 14 : (isFocusMode ? 0 : 64);
  const bottomOffset = isSplitView ? 58 : (isFocusMode ? 0 : 88);
  const rightOffset = isSplitView
    ? (hasRightPanel ? Math.min(320, width * 0.4) : 0)
    : (isFocusMode ? 0 : hasRightPanel ? Math.min(460, width * 0.38) : 0);
  const leftOffset = 0;

  const freeWidth = Math.max(200, width - leftOffset - rightOffset);

  // Normalized Device Coordinate (NDC) shift of the free area's center relative to viewport center
  const ndcOffsetX = (leftOffset - rightOffset) / width;
  const ndcOffsetY = (bottomOffset - topOffset) / height;

  const boxSize = box.getSize(new THREE.Vector3());
  const boxCenter = box.getCenter(new THREE.Vector3());

  // Organ dimensions (ensuring a calibrated clinical bounding box including great vessels)
  const organH = Math.max(2.4, boxSize.y);
  const organW = Math.max(2.2, boxSize.x);

  const fovRad = (camera.fov * Math.PI) / 180;
  const aspect = width / height;

  // In Split View, the container is narrower (aspect ~1.0-1.2), so we use a more conservative fill
  // (54% vertical, 58% horizontal) so aorta arch, apex, and 3D labels are never cramped or cropped!
  const targetVerticalFill = isSplitView ? 0.54 : 0.67;
  const reqFrustumHeight = organH / targetVerticalFill;
  const distY = reqFrustumHeight / (2 * Math.tan(fovRad / 2));

  // Ensure horizontal fit in free width
  const targetHorizontalFill = isSplitView ? 0.58 : 0.70;
  const freeFrustumWidthRatio = freeWidth / width;
  const distX = organW / (targetHorizontalFill * 2 * Math.tan(fovRad / 2) * aspect * freeFrustumWidthRatio);

  const distance = Math.max(distY, distX);

  const frustumH = 2 * distance * Math.tan(fovRad / 2);
  const frustumW = frustumH * aspect;

  // Shift target in world space so boxCenter projects to the visual center of the free area
  const targetX = boxCenter.x - (ndcOffsetX * frustumW) / 2;
  const targetY = boxCenter.y - (ndcOffsetY * frustumH) / 2;
  const targetZ = boxCenter.z;

  const targetLookAt = new THREE.Vector3(targetX, targetY, targetZ);
  const targetCamPos = new THREE.Vector3(targetX, targetY + (isSplitView ? 0.04 : 0.08), targetZ + distance);

  return { targetCamPos, targetLookAt, distance, targetX, targetY, targetZ, aspect, isSplitView };
}

function getHeartBounds(): THREE.Box3 {
  const cadObj = getVesselObject('CAD');
  if (cadObj) {
    const box = new THREE.Box3().setFromObject(cadObj);
    if (!box.isEmpty()) return box;
  }
  // Default calibrated bounding box for the heart model
  return new THREE.Box3(
    new THREE.Vector3(-1.0, -1.2, -0.9),
    new THREE.Vector3(1.0, 1.2, 0.9)
  );
}

export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const {
    selectedVessel,
    quality,
    cameraPreset,
    setCameraPreset,
    isIntroPlaying,
    introKey,
    skipIntro,
    isFocusMode,
    hasActiveDrawer,
    cameraResetTrigger,
    activeSection,
  } = useAppStore();
  const { camera, size } = useThree();

  // Canonical home framing reference
  const canonicalHomeRef = useRef<{
    targetCamPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    distance: number;
    targetX: number;
    targetY: number;
    targetZ: number;
    aspect: number;
    isSplitView: boolean;
  }>({
    targetCamPos: new THREE.Vector3(0, 0.08, 4.4),
    targetLookAt: new THREE.Vector3(0, 0, 0),
    distance: 4.4,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    aspect: 1.6,
    isSplitView: false,
  });

  // Target camera position and lookAt vector
  const targetCamPos = useRef(new THREE.Vector3(0, 0.08, 4.4));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);

  // Intro Animation Clock
  const introStartTime = useRef<number | null>(null);

  // Auto-Orbit Idle State (pauses on user interaction or vessel selection)
  const isUserInteracting = useRef(false);
  const lastInteractionTime = useRef(Date.now());

  // Detect prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Recompute canonical framing
  const updateCanonicalFraming = useCallback(() => {
    const box = getHeartBounds();
    const pCamera = camera as THREE.PerspectiveCamera;
    const isSplit = activeSection === 'split';
    const framing = computeCanonicalFraming(
      box,
      size.width,
      size.height,
      pCamera,
      hasActiveDrawer,
      isFocusMode,
      isSplit
    );
    canonicalHomeRef.current = framing;
    return framing;
  }, [camera, size.width, size.height, hasActiveDrawer, isFocusMode, activeSection]);

  // Compute on mount and on every resize or overlay/focus mode/section change
  useEffect(() => {
    const framing = updateCanonicalFraming();

    // If not inspecting a vessel and no preset active, transition to canonical home
    if (!selectedVessel && !cameraPreset && !isIntroPlaying) {
      targetCamPos.current.copy(framing.targetCamPos);
      targetLookAt.current.copy(framing.targetLookAt);
      isTransitioning.current = true;
    }
  }, [updateCanonicalFraming, selectedVessel, cameraPreset, isIntroPlaying, activeSection]);

  // Reset intro start time when introKey changes
  useEffect(() => {
    if (prefersReducedMotion || quality === 'performance') {
      skipIntro();
    } else if (isIntroPlaying) {
      introStartTime.current = null;
      isTransitioning.current = false;
    }
  }, [introKey, isIntroPlaying, prefersReducedMotion, quality, skipIntro]);

  // Handle explicit Reset View trigger
  useEffect(() => {
    if (cameraResetTrigger === 0) return;
    const framing = updateCanonicalFraming();
    targetCamPos.current.copy(framing.targetCamPos);
    targetLookAt.current.copy(framing.targetLookAt);
    isTransitioning.current = true;
  }, [cameraResetTrigger, updateCanonicalFraming]);

  // Handle selected vessel framing
  useEffect(() => {
    if (isIntroPlaying) return;

    if (selectedVessel && selectedVessel !== 'CAD') {
      const vConfig = VESSELS[selectedVessel as VesselKey];
      const { targetX, targetY, isSplitView } = canonicalHomeRef.current;
      
      // Compute viewing direction vector from vessel targetLookAt to configured camera position
      const dirX = vConfig.camera[0] - vConfig.targetLookAt[0];
      const dirY = vConfig.camera[1] - vConfig.targetLookAt[1];
      const dirZ = vConfig.camera[2] - vConfig.targetLookAt[2];
      const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
      const ndx = dirX / len;
      const ndy = dirY / len;
      const ndz = dirZ / len;

      // In Split View, calibrated camera distance of 4.1 preserves surrounding anatomical context
      // without over-zooming or cropping the vessel; Full View uses 3.2.
      const inspectDistance = isSplitView ? 4.1 : 3.2;

      const tX = vConfig.targetLookAt[0] + targetX;
      const tY = vConfig.targetLookAt[1] + targetY;
      const tZ = vConfig.targetLookAt[2];

      targetLookAt.current.set(tX, tY, tZ);
      targetCamPos.current.set(
        tX + ndx * inspectDistance,
        tY + ndy * inspectDistance,
        tZ + ndz * inspectDistance
      );
      isTransitioning.current = true;
    } else if (!cameraPreset) {
      const framing = canonicalHomeRef.current;
      targetCamPos.current.copy(framing.targetCamPos);
      targetLookAt.current.copy(framing.targetLookAt);
      isTransitioning.current = true;
    }
  }, [selectedVessel, cameraPreset, isIntroPlaying, activeSection]);

  // Handle camera presets (Anterior, Posterior, LAO, RAO, Apical)
  useEffect(() => {
    if (!cameraPreset || isIntroPlaying) return;

    isTransitioning.current = true;
    const { distance, targetX, targetY, targetZ } = canonicalHomeRef.current;

    switch (cameraPreset) {
      case 'anterior':
        targetCamPos.current.set(targetX, targetY + 0.08, targetZ + distance);
        targetLookAt.current.set(targetX, targetY, targetZ);
        break;
      case 'posterior':
        targetCamPos.current.set(targetX, targetY + 0.08, targetZ - distance);
        targetLookAt.current.set(targetX, targetY, targetZ);
        break;
      case 'left':
        // Left Anterior Oblique (LAO) - View Left Ventricle & LCX
        targetCamPos.current.set(targetX + distance * 0.72, targetY + 0.1, targetZ + distance * 0.72);
        targetLookAt.current.set(targetX + 0.1, targetY, targetZ);
        break;
      case 'right':
        // Right Anterior Oblique (RAO) - View Right Ventricle & RCA
        targetCamPos.current.set(targetX - distance * 0.72, targetY + 0.1, targetZ + distance * 0.72);
        targetLookAt.current.set(targetX - 0.1, targetY, targetZ);
        break;
      case 'apical':
        targetCamPos.current.set(targetX + 0.1, targetY - distance * 0.65, targetZ + distance * 0.65);
        targetLookAt.current.set(targetX + 0.05, targetY - 0.2, targetZ);
        break;
    }
  }, [cameraPreset, isIntroPlaying]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // 1. First-load / Replay Cinematic Intro Ease-in (~2.5s from wide to anterior home)
    if (isIntroPlaying && quality !== 'performance' && !prefersReducedMotion) {
      if (introStartTime.current === null) {
        introStartTime.current = state.clock.getElapsedTime();
      }

      const elapsed = state.clock.getElapsedTime() - introStartTime.current;
      const duration = 2.5;

      if (elapsed < duration) {
        const progress = Math.min(1, elapsed / duration);
        // Smooth cubic ease-out curve
        const ease = 1 - Math.pow(1 - progress, 3);

        const framing = canonicalHomeRef.current;
        const targetPos = framing.targetCamPos;
        const startY = targetPos.y + 0.35;
        const targetY = targetPos.y;
        const startZ = framing.distance * 1.55;
        const targetZ = targetPos.z;

        camera.position.set(
          targetPos.x,
          startY + (targetY - startY) * ease,
          startZ + (targetZ - startZ) * ease
        );
        controlsRef.current.target.copy(framing.targetLookAt);
        controlsRef.current.update();
        return;
      } else {
        skipIntro();
      }
    }

    // 2. Dynamic Programmatic Easing to Selected Vessel, Preset Target, or Canonical Home
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

    // 3. Slow Idle Auto-Orbit (pauses on manual interaction, vessel focus, or drawer open)
    const timeSinceInteraction = Date.now() - lastInteractionTime.current;
    if (
      !isTransitioning.current &&
      !isIntroPlaying &&
      !isUserInteracting.current &&
      !selectedVessel &&
      !hasActiveDrawer &&
      timeSinceInteraction > 4000 &&
      quality !== 'performance'
    ) {
      const orbitSpeed = delta * 0.10;
      const center = controlsRef.current.target;
      const relX = camera.position.x - center.x;
      const relZ = camera.position.z - center.z;
      const radius = Math.sqrt(relX * relX + relZ * relZ);
      const curAngle = Math.atan2(relX, relZ);
      const newAngle = curAngle + orbitSpeed;

      camera.position.x = center.x + Math.sin(newAngle) * radius;
      camera.position.z = center.z + Math.cos(newAngle) * radius;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={2.2}
      maxDistance={8.5}
      maxPolarAngle={Math.PI / 1.65}
      minPolarAngle={Math.PI / 6}
      onStart={() => {
        isUserInteracting.current = true;
        if (isIntroPlaying) skipIntro();
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
