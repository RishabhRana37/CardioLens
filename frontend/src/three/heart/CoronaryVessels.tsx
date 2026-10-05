import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VesselKey, Target, registerVesselObject } from '../../config/vessels.config';
import { Prediction } from '../../api/types';
import { VESSEL_ANCHORS } from '../../config/vessels.anchors';
import { riskColor3, riskGradient, getRiskTier } from '../colorScale';

/**
 * Generates a tube geometry with a localized stenosis constriction
 * based on predicted probability at the lesion site (t ~ 0.42).
 */
function createStenoticTubeGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number,
  baseRadius: number,
  radialSegments: number,
  probability: number
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const vertexCount = (tubularSegments + 1) * (radialSegments + 1);
  const indexCount = tubularSegments * radialSegments * 6;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = new Uint16Array(indexCount);

  let pOffset = 0;
  let nOffset = 0;
  let uvOffset = 0;
  let iOffset = 0;

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const p = curve.getPointAt(u);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    // Localized stenosis constriction around t = 0.42 (lesion epicenter)
    const stenosisGaussian = Math.exp(-Math.pow(u - 0.42, 2) / 0.015);
    const radiusModulation = 1.0 - (probability * 0.65 * stenosisGaussian);
    const currentRadius = baseRadius * Math.max(0.2, radiusModulation);

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = -Math.cos(theta);

      // Normal vector
      const normal = new THREE.Vector3()
        .addScaledVector(N, cos)
        .addScaledVector(B, sin)
        .normalize();

      normals[nOffset++] = normal.x;
      normals[nOffset++] = normal.y;
      normals[nOffset++] = normal.z;

      // Position
      const pos = new THREE.Vector3()
        .copy(p)
        .addScaledVector(normal, currentRadius);

      positions[pOffset++] = pos.x;
      positions[pOffset++] = pos.y;
      positions[pOffset++] = pos.z;

      uvs[uvOffset++] = u;
      uvs[uvOffset++] = v;
    }
  }

  for (let j = 1; j <= tubularSegments; j++) {
    for (let i = 1; i <= radialSegments; i++) {
      const a = (radialSegments + 1) * (j - 1) + (i - 1);
      const b = (radialSegments + 1) * j + (i - 1);
      const c = (radialSegments + 1) * j + i;
      const d = (radialSegments + 1) * (j - 1) + i;

      indices[iOffset++] = a;
      indices[iOffset++] = b;
      indices[iOffset++] = d;

      indices[iOffset++] = b;
      indices[iOffset++] = c;
      indices[iOffset++] = d;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  return geometry;
}

interface VesselBranchProps {
  vesselKey: VesselKey;
  predictionsOverride?: Record<Target, Prediction> | null;
}

export const VesselBranch: React.FC<VesselBranchProps> = ({
  vesselKey,
  predictionsOverride = null,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const {
    predictions,
    projectionPredictions,
    isProjectionMode,
    selectedVessel,
    selectVessel,
    quality,
    isAngiogramMode,
  } = useAppStore();

  const isSelected = selectedVessel === vesselKey;
  const isWholeHeart = selectedVessel === null;
  const targetConfig = VESSELS[vesselKey];
  const anchorConfig = VESSEL_ANCHORS[vesselKey];

  const effectivePreds =
    predictionsOverride ||
    (isProjectionMode && projectionPredictions ? projectionPredictions : predictions);

  const pred = effectivePreds?.[vesselKey];
  const probability = pred?.probability ?? 0.25;

  // Register in global vessel registry
  useEffect(() => {
    if (groupRef.current) {
      registerVesselObject(vesselKey, groupRef.current);
    }
    return () => {
      registerVesselObject(vesselKey, null);
    };
  }, [vesselKey]);

  // Build main CatmullRom spline tube
  const mainCurve = useMemo(() => {
    const v3Points = anchorConfig.main.map((p) => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(v3Points, false, 'centripetal');
  }, [anchorConfig.main]);

  // Stenotic constricted tube geometry dynamically adapting to probability
  const mainGeometry = useMemo(() => {
    return createStenoticTubeGeometry(mainCurve, 56, anchorConfig.radius, 14, probability);
  }, [mainCurve, anchorConfig.radius, probability]);

  // Build side diagonal / marginal branch geometries
  const branchGeometries = useMemo(() => {
    return anchorConfig.branches.map((bPoints) => {
      const v3 = bPoints.map((p) => new THREE.Vector3(...p));
      const c = new THREE.CatmullRomCurve3(v3, false, 'centripetal');
      return new THREE.TubeGeometry(c, 28, anchorConfig.radius * 0.68, 10, false);
    });
  }, [anchorConfig.branches, anchorConfig.radius]);

  // Reusable Color instances for zero GC per frame
  const currentColor = useRef(new THREE.Color('#16a34a'));
  const currentEmissive = useRef(new THREE.Color('#16a34a'));
  const targetColor = useRef(new THREE.Color('#16a34a'));
  const targetEmissive = useRef(new THREE.Color('#16a34a'));

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    // Read continuous target risk color (green -> amber -> red)
    const rgb = riskColor3(probability);
    targetColor.current.setRGB(rgb.r, rgb.g, rgb.b);
    targetEmissive.current.setRGB(rgb.r, rgb.g, rgb.b);

    // Smooth LERP transition (~400ms)
    const lerpSpeed = delta * 5.0;
    currentColor.current.lerp(targetColor.current, lerpSpeed);
    currentEmissive.current.lerp(targetEmissive.current, lerpSpeed);

    materialRef.current.color.copy(currentColor.current);
    materialRef.current.emissive.copy(currentEmissive.current);

    // Dynamic Emissive Intensity Calculation
    // In Angiogram Mode: intense fluoroscopic glow (2.8 - 4.5)
    // In Whole-Heart (CAD overview): all 3 vessels glow brightly (1.4 - 2.2)
    // When a single vessel is selected: selected vessel is boosted (+1.0), others stay visible at ~1.0
    let intensity: number;

    if (isAngiogramMode) {
      intensity = 2.8 + probability * 1.4;
    } else if (isWholeHeart) {
      intensity = probability > 0.66 ? 2.0 : probability > 0.33 ? 1.5 : 1.2;
    } else if (isSelected) {
      intensity = 2.4 + probability * 0.8;
    } else {
      // Unselected vessel in single-vessel inspection mode
      intensity = 0.9;
    }

    if (isHovered) {
      intensity += 0.6;
    }

    // High-risk vessel soft organic rhythmic pulse
    if (probability > 0.66 && quality !== 'performance') {
      const time = state.clock.getElapsedTime();
      const pulse = Math.sin(time * 4.0) * 0.4 + 0.4;
      intensity += pulse;
    }

    materialRef.current.emissiveIntensity = intensity;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectVessel(isSelected ? null : vesselKey);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  };

  // Tooltip position at the mid-point of the vessel curve
  const tooltipPosition = useMemo(() => {
    const midT = 0.42;
    const pt = mainCurve.getPoint(midT);
    return [pt.x, pt.y + 0.08, pt.z + 0.08] as [number, number, number];
  }, [mainCurve]);

  const riskTier = getRiskTier(probability);

  return (
    <group ref={groupRef} name={`CoronaryBranch_${vesselKey}`}>
      {/* Main Artery Tube Mesh with Stenotic Pinch */}
      <mesh
        ref={meshRef}
        geometry={mainGeometry}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshPhysicalMaterial
          ref={materialRef}
          color="#16a34a"
          emissive="#16a34a"
          emissiveIntensity={1.4}
          roughness={0.22}
          metalness={0.12}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Side Artery Branchlets */}
      {branchGeometries.map((bGeom, idx) => (
        <mesh
          key={idx}
          geometry={bGeom}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <meshPhysicalMaterial
            color={currentColor.current}
            emissive={currentEmissive.current}
            emissiveIntensity={materialRef.current?.emissiveIntensity ?? 1.2}
            roughness={0.22}
            metalness={0.12}
            clearcoat={0.85}
            clearcoatRoughness={0.12}
          />
        </mesh>
      ))}

      {/* Selection Highlight Halo Wireframe */}
      {isSelected && (
        <mesh geometry={mainGeometry} scale={1.25}>
          <meshBasicMaterial
            color="#2dd4bf"
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>
      )}

      {/* Floating Interactive 3D Tooltip (Hover-Only, Occlusion Aware) */}
      {isHovered && (
        <Html
          position={tooltipPosition}
          distanceFactor={7.5}
          center
          occlude="blending"
          pointerEvents="none"
          className="pointer-events-none select-none transition-opacity duration-200"
        >
          <div className="rounded-xl bg-slate-950/95 border border-white/20 p-2.5 shadow-2xl backdrop-blur-xl text-slate-100 font-sans max-w-[210px] space-y-1.5 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
              <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono">
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: riskGradient(probability) }}
                />
                {targetConfig.name} Artery
              </span>
              <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${riskTier.badgeClass}`}>
                {(probability * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-[10px] text-slate-300 font-medium leading-tight">
              {targetConfig.label}
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
              <span>Status:</span>
              <span className="text-slate-200 font-semibold">{pred?.label || 'Calculating'}</span>
            </div>

            {probability > 0.33 && (
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-mono pt-0.5 border-t border-white/5">
                <span>Stenosis:</span>
                <span className="font-bold">{(probability * 100).toFixed(0)}% Occlusion</span>
              </div>
            )}

            <p className="text-[9px] text-teal-300/90 italic border-t border-white/5 pt-1">
              Click to isolate & inspect SHAP drivers
            </p>
          </div>
        </Html>
      )}
    </group>
  );
};

interface CoronaryVesselsProps {
  predictionsOverride?: Record<Target, Prediction> | null;
}

export const CoronaryVessels: React.FC<CoronaryVesselsProps> = ({ predictionsOverride = null }) => {
  return (
    <group name="CoronaryVesselsOverlay">
      <VesselBranch vesselKey="LAD" predictionsOverride={predictionsOverride} />
      <VesselBranch vesselKey="LCX" predictionsOverride={predictionsOverride} />
      <VesselBranch vesselKey="RCA" predictionsOverride={predictionsOverride} />
    </group>
  );
};
