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
  const { quality } = useAppStore();

  // Performance mode bypasses all postprocessing shaders
  if (quality === 'performance') {
    return null;
  }

  if (quality === 'balanced') {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.55}
          luminanceSmoothing={0.25}
          intensity={0.65}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.25} darkness={0.6} />
        <SMAA />
      </EffectComposer>
    );
  }

  // Cinematic Mode: Full clinical bloom, subtle lens aberration, and vignette
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.50}
        luminanceSmoothing={0.3}
        intensity={0.85}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0006, 0.0006)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.3} darkness={0.65} />
      <SMAA />
    </EffectComposer>
  );
};

export default PostProcessingEffects;
