import React from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  SMAA,
  N8AO,
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
        {/* N8AO: Soft organic contact shadowing for anatomical sulci and chambers */}
        <N8AO
          aoRadius={0.4}
          intensity={1.2}
          color="#050810"
        />
        {/* Bloom calibrated so only high emissive coronary arteries / fluoroscopy glow */}
        <Bloom
          luminanceThreshold={isAngiogramMode ? 0.45 : 0.88}
          luminanceSmoothing={0.2}
          intensity={isAngiogramMode ? 1.2 : 0.5}
          mipmapBlur
        />
        <Vignette eskil={false} offset={isAngiogramMode ? 0.35 : 0.25} darkness={isAngiogramMode ? 0.75 : 0.55} />
        <SMAA />
      </EffectComposer>
    );
  }

  // Cinematic Mode: N8AO Depth Shading + Selective Vessel Bloom + Subtle Lens Optics
  return (
    <EffectComposer multisampling={0}>
      {/* N8AO: Ambient occlusion for anatomical depth in crevices */}
      <N8AO
        aoRadius={0.45}
        intensity={1.6}
        color="#02040a"
      />
      {/* Bloom only on emissive vessels, not washing out the muscle */}
      <Bloom
        luminanceThreshold={isAngiogramMode ? 0.40 : 0.88}
        luminanceSmoothing={0.22}
        intensity={isAngiogramMode ? 1.35 : 0.55}
        mipmapBlur
      />
      <ChromaticAberration
        offset={isAngiogramMode ? new THREE.Vector2(0.0008, 0.0008) : new THREE.Vector2(0.0004, 0.0004)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={isAngiogramMode ? 0.35 : 0.28} darkness={isAngiogramMode ? 0.8 : 0.6} />
      <SMAA />
    </EffectComposer>
  );
};

export default PostProcessingEffects;
