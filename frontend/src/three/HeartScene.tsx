import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { HeartModelLoader, InspectedNodeInfo, ModelMode } from './heart/HeartModelLoader';
import { BloodFlowParticles } from './heart/BloodFlowParticles';
import { VesselAnchoredLabels } from './heart/VesselAnchoredLabels';
import { CameraController } from './heart/CameraController';
import { PostProcessingEffects } from './heart/PostProcessingEffects';
import { ThreeErrorBoundary } from './ThreeErrorBoundary';
import { ModelInspectorOverlay } from './inspector/ModelInspectorOverlay';
import { CompareModeOverlay } from './hud/CompareModeOverlay';
import { BrandedHeartSkeleton } from '../components/common/BrandedHeartSkeleton';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FastForward,
} from 'lucide-react';

import { heartbeatAudio } from '../audio/heartbeatAudio';

export const HeartScene: React.FC = () => {
  const [isBeating, setIsBeating] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [modelNodes, setModelNodes] = useState<InspectedNodeInfo[]>([]);
  const [detectedMode, setDetectedMode] = useState<ModelMode>('MODE_A');
  const [selectedInspectorNodeId, setSelectedInspectorNodeId] = useState<string | null>(null);

  const {
    quality,
    predictions,
    baselinePredictions,
    selectedVessel,
    selectVessel,
    colorFor,
    isAngiogramMode,
    toggleAngiogramMode,
    isCompareMode,
    toggleCompareMode,
    isIntroPlaying,
    skipIntro,
    isAudioEnabled,
    toggleAudio,
    isFocusMode,
    toggleFocusMode,
    setFocusMode,
  } = useAppStore();

  const dpr = quality === 'cinematic' ? 2 : quality === 'balanced' ? 1.5 : 1;
  const activeColor = colorFor(selectedVessel || 'CAD');

  const handleModelLoaded = useCallback((nodes: InspectedNodeInfo[], mode: ModelMode) => {
    setModelNodes(nodes);
    setDetectedMode(mode);
    setIsModelReady(true);
  }, []);

  // Synchronize Web Audio heartbeat synthesizer with cardiac rhythm
  useEffect(() => {
    if (isBeating && isAudioEnabled) {
      heartbeatAudio.start(68);
    } else {
      heartbeatAudio.stop();
    }

    return () => {
      heartbeatAudio.stop();
    };
  }, [isBeating, isAudioEnabled]);

  // Global keyboard shortcuts (1: CAD, 2: LAD, 3: LCX, 4: RCA, Space: Beat, M: Audio, I: Inspector, A: Angiogram, C: Compare, Esc: Skip Intro)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input/textarea
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        if (isIntroPlaying) {
          skipIntro();
        } else if (isFocusMode) {
          setFocusMode(false);
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFocusMode();
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleAudio();
      }
      if (e.key === '1') selectVessel(null);
      if (e.key === '2') selectVessel('LAD');
      if (e.key === '3') selectVessel('LCX');
      if (e.key === '4') selectVessel('RCA');
      if (e.key === 'a' || e.key === 'A') {
        toggleAngiogramMode();
      }
      if (e.key === 'c' || e.key === 'C') {
        toggleCompareMode();
      }
      if (e.key === 'i' || e.key === 'I') {
        setIsInspectorOpen((prev) => !prev);
      }
      if (e.key === ' ') {
        e.preventDefault();
        setIsBeating((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectVessel,
    toggleAngiogramMode,
    toggleCompareMode,
    isIntroPlaying,
    skipIntro,
    toggleAudio,
    isFocusMode,
    toggleFocusMode,
    setFocusMode,
  ]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-950/95 via-[#060912] to-[#030508] overflow-hidden flex flex-col justify-between select-none">
      {/* Background Deep Near-Black Radial-Gradient Backdrop with Vignette */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: isAngiogramMode
            ? `radial-gradient(circle at 50% 38%, rgba(2, 6, 23, 0.95) 0%, rgba(2, 4, 10, 0.98) 60%, #010204 100%)`
            : isCompareMode
            ? `radial-gradient(circle at 50% 38%, rgba(13, 148, 136, 0.08) 0%, rgba(6, 9, 18, 0.96) 55%, #020408 100%)`
            : `radial-gradient(circle at 50% 38%, rgba(15, 23, 42, 0.75) 0%, rgba(6, 9, 18, 0.95) 55%, #020408 100%)`,
        }}
      />
      {/* Subtle Dynamic Risk Color Halo */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${activeColor} 0%, transparent 60%)`,
        }}
      />
      {/* Stage Vignette Shadow & Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-25" />

      {/* 3D Model Loading Skeleton Overlay */}
      <AnimatePresence>
        {!isModelReady && (
          <motion.div
            key="heart-loading-skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 z-40"
          >
            <BrandedHeartSkeleton message="Reconstructing 3D Cardiac Digital Twin..." />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skippable Product Reveal Intro Pill */}
      <AnimatePresence>
        {isIntroPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
          >
            <button
              onClick={skipIntro}
              title="Skip Intro (Escape)"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-teal-500/40 text-xs font-mono font-semibold text-slate-200 backdrop-blur-xl shadow-glass-md hover:border-teal-400 hover:text-white transition-all group/skip"
            >
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Cinematic Reveal</span>
              <span className="text-slate-500">·</span>
              <span className="text-teal-300 font-bold flex items-center gap-1 group-hover/skip:translate-x-0.5 transition-transform">
                Skip <FastForward className="w-3.5 h-3.5" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Mode Full-Stage Overlay */}
      {isCompareMode && <CompareModeOverlay />}

      {/* Dev-Only Model Inspector Overlay (Key: I) */}
      <ModelInspectorOverlay
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        nodes={modelNodes}
        detectedMode={detectedMode}
        selectedNodeId={selectedInspectorNodeId}
        onSelectNode={setSelectedInspectorNodeId}
      />

      {/* 3D WebGL Canvas Viewport */}
      <div className="absolute inset-0 z-10">
        <ThreeErrorBoundary>
          <Canvas
            dpr={dpr}
            camera={{ position: isCompareMode ? [0, 0.2, 4.4] : [0, 0.12, 3.2], fov: 42 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: isAngiogramMode ? 1.25 : 1.08,
            }}
          >
            {/* Balanced Clinical Lighting Rig: Deep contrast for realistic wet muscle + glowing arteries */}
            <ambientLight intensity={isAngiogramMode ? 0.18 : 0.35} />

            {/* 1. Key Light (Soft warm clinical illumination) */}
            <directionalLight
              position={[4.2, 4.8, 3.8]}
              intensity={isAngiogramMode ? 0.6 : 1.3}
              color="#fff5ee"
            />

            {/* 2. Cool Teal Fill Light (Subtle curvature rim) */}
            <directionalLight
              position={[-4.5, 2.2, 2.0]}
              intensity={isAngiogramMode ? 0.3 : 0.7}
              color="#0ea5e9"
            />

            {/* 3. Rim / Back Light (Silhouetting organ contours) */}
            <directionalLight
              position={[0, 4.2, -4.8]}
              intensity={isAngiogramMode ? 2.4 : 1.8}
              color="#38bdf8"
            />

            {/* 4. Inferior Fill Light */}
            <directionalLight
              position={[0, -3.8, -2.0]}
              intensity={isAngiogramMode ? 0.3 : 0.5}
              color="#0d9488"
            />

            {/* 5. Fluoroscopy / Focus Spotlight */}
            <spotLight
              position={[0, 4.8, 0.2]}
              target-position={[0, 0, 0]}
              angle={0.42}
              penumbra={0.88}
              intensity={isAngiogramMode ? 3.4 : 1.2}
              color={isAngiogramMode ? '#38bdf8' : '#f8fafc'}
              distance={8}
            />

            {/* Specular Wet Glint Center Point */}
            <pointLight
              position={[0, 1.2, 3.0]}
              intensity={isAngiogramMode ? 0.3 : 0.35}
              color="#ffffff"
              distance={7}
            />

            {/* Soft Dark Studio Environment */}
            <Environment preset="night" environmentIntensity={isAngiogramMode ? 0.25 : 0.5} />

            {/* Suspended Heart Mesh(es) */}
            <Suspense fallback={null}>
              {isCompareMode ? (
                /* Dual Synchronized Hearts: Left = Baseline, Right = Modified */
                <group name="CompareModeDualHearts">
                  {/* Left Heart (Baseline Snapshot) */}
                  <group position={[-1.75, 0, 0]}>
                    <Float
                      speed={isBeating ? 1.0 : 0}
                      rotationIntensity={0.08}
                      floatIntensity={0.12}
                      floatingRange={[-0.03, 0.03]}
                    >
                      <HeartModelLoader
                        isBeating={isBeating}
                        predictionsOverride={baselinePredictions}
                        onModelLoaded={handleModelLoaded}
                      />
                      <BloodFlowParticles />
                    </Float>
                  </group>

                  {/* Right Heart (Modified What-If Twin) */}
                  <group position={[1.75, 0, 0]}>
                    <Float
                      speed={isBeating ? 1.0 : 0}
                      rotationIntensity={0.08}
                      floatIntensity={0.12}
                      floatingRange={[-0.03, 0.03]}
                    >
                      <HeartModelLoader
                        isBeating={isBeating}
                        predictionsOverride={predictions}
                      />
                      <BloodFlowParticles />
                      <VesselAnchoredLabels />
                    </Float>
                  </group>
                </group>
              ) : (
                /* Standard Single Hero Heart View */
                <Float
                  speed={isBeating ? 1.0 : 0}
                  rotationIntensity={0.1}
                  floatIntensity={0.15}
                  floatingRange={[-0.04, 0.04]}
                >
                  <HeartModelLoader
                    isBeating={isBeating}
                    selectedNodeId={selectedInspectorNodeId}
                    onModelLoaded={handleModelLoaded}
                  />
                  <BloodFlowParticles />
                  <VesselAnchoredLabels />
                </Float>
              )}
            </Suspense>

            {/* Ground Contact Shadows */}
            {quality !== 'performance' && (
              <>
                {isCompareMode ? (
                  <>
                    <ContactShadows
                      position={[-1.75, -1.35, 0]}
                      opacity={isAngiogramMode ? 0.4 : 0.6}
                      scale={4.8}
                      blur={2.2}
                      far={4.0}
                      color="#000000"
                    />
                    <ContactShadows
                      position={[1.75, -1.35, 0]}
                      opacity={isAngiogramMode ? 0.4 : 0.6}
                      scale={4.8}
                      blur={2.2}
                      far={4.0}
                      color="#000000"
                    />
                  </>
                ) : (
                  <ContactShadows
                    position={[0, -1.35, 0]}
                    opacity={isAngiogramMode ? 0.45 : 0.65}
                    scale={5.8}
                    blur={2.5}
                    far={4.2}
                    color="#000000"
                  />
                )}
              </>
            )}

            {/* Orbit Camera Controller */}
            <CameraController />

            {/* Postprocessing (Fluoroscopy Bloom & Vignette) */}
            <PostProcessingEffects />
          </Canvas>
        </ThreeErrorBoundary>
      </div>

    </div>
  );
};

export default HeartScene;
