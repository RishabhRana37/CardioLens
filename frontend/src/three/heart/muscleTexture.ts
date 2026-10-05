import * as THREE from 'three';

let cachedTextures: { normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } | null = null;

/**
 * Creates high-fidelity procedural normal and roughness textures
 * simulating striated, living myocardial muscle fibers with wet organic micro-relief.
 */
export function getOrganicMuscleTextures(): { normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  if (cachedTextures) return cachedTextures;

  const size = 256;
  const canvasNorm = document.createElement('canvas');
  canvasNorm.width = size;
  canvasNorm.height = size;
  const ctxNorm = canvasNorm.getContext('2d');

  const canvasRough = document.createElement('canvas');
  canvasRough.width = size;
  canvasRough.height = size;
  const ctxRough = canvasRough.getContext('2d');

  if (!ctxNorm || !ctxRough) {
    const fallback = new THREE.CanvasTexture(canvasNorm);
    return { normalMap: fallback, roughnessMap: fallback };
  }

  // Generate height field with striated fiber pattern + micro-noise
  const heightData = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Striated directional muscle fiber waves
      const fiber = Math.sin((x * 0.25 + y * 0.08) * Math.PI) * 0.35 +
                    Math.sin((x * 0.5 - y * 0.12) * Math.PI) * 0.15;

      // High-frequency cellular micro-noise
      const noise = (Math.random() - 0.5) * 0.2;
      const swirl = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.1;

      heightData[y * size + x] = fiber + noise + swirl;
    }
  }

  // Compute normals via Sobel filter & fill roughness
  const imgNorm = ctxNorm.createImageData(size, size);
  const imgRough = ctxRough.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const xLeft = (x - 1 + size) % size;
      const xRight = (x + 1) % size;
      const yTop = (y - 1 + size) % size;
      const yBottom = (y + 1) % size;

      // Central difference
      const dx = (heightData[y * size + xRight] - heightData[y * size + xLeft]) * 2.5;
      const dy = (heightData[yBottom * size + x] - heightData[yTop * size + x]) * 2.5;
      const dz = 1.0;

      // Normalize
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;
      const nx = (dx / len) * 0.5 + 0.5;
      const ny = (dy / len) * 0.5 + 0.5;
      const nz = (dz / len) * 0.5 + 0.5;

      // Normal Map (RGB -> XYZ)
      imgNorm.data[idx] = Math.floor(nx * 255);
      imgNorm.data[idx + 1] = Math.floor(ny * 255);
      imgNorm.data[idx + 2] = Math.floor(nz * 255);
      imgNorm.data[idx + 3] = 255;

      // Roughness Map (Greyscale 0.28 to 0.48)
      const h = heightData[y * size + x];
      const roughVal = Math.floor((0.35 + h * 0.1) * 255);
      imgRough.data[idx] = roughVal;
      imgRough.data[idx + 1] = roughVal;
      imgRough.data[idx + 2] = roughVal;
      imgRough.data[idx + 3] = 255;
    }
  }

  ctxNorm.putImageData(imgNorm, 0, 0);
  ctxRough.putImageData(imgRough, 0, 0);

  const normalMap = new THREE.CanvasTexture(canvasNorm);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(6, 6);

  const roughnessMap = new THREE.CanvasTexture(canvasRough);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(6, 6);

  cachedTextures = { normalMap, roughnessMap };
  return cachedTextures;
}
