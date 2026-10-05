import React from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  SMAA,
} from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

export const PostProcessingEffects: React.FC = () => {
  const { quality, isAngiogramMode } = useAppStore();

  // Performance mode bypasses all postprocessing shaders
  if (quality === 'performance') {
    return null;
  }

  if (quality === 'balanced') {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={isAngiogramMode ? 0.42 : 0.55}
          luminanceSmoothing={0.25}
          intensity={isAngiogramMode ? 1.15 : 0.65}
          mipmapBlur
        />
        <Vignette eskil={false} offset={isAngiogramMode ? 0.35 : 0.25} darkness={isAngiogramMode ? 0.75 : 0.6} />
        <SMAA />
      </EffectComposer>
    );
  }

  // Cinematic Mode: Full clinical bloom, subtle lens aberration, and vignette
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={isAngiogramMode ? 0.38 : 0.50}
        luminanceSmoothing={0.3}
        intensity={isAngiogramMode ? 1.45 : 0.85}
        mipmapBlur
      />
      <ChromaticAberration
        offset={isAngiogramMode ? new THREE.Vector2(0.0009, 0.0009) : new THREE.Vector2(0.0006, 0.0006)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={isAngiogramMode ? 0.35 : 0.3} darkness={isAngiogramMode ? 0.8 : 0.65} />
      <SMAA />
    </EffectComposer>
  );
};

export default PostProcessingEffects;
