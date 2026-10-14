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
    return createStenoticTubeGeometry(mainCurve, 64, anchorConfig.radius, 16, probability);
  }, [mainCurve, anchorConfig.radius, probability]);

  // Localized plaque lesion epicenter coordinates at t = 0.42
  const lesionPoint = useMemo(() => mainCurve.getPointAt(0.42), [mainCurve]);
  const lesionTangent = useMemo(() => mainCurve.getTangentAt(0.42), [mainCurve]);
  const lesionRotation = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, lesionTangent.clone().normalize());
    const euler = new THREE.Euler().setFromQuaternion(quat);
    return [euler.x, euler.y, euler.z] as [number, number, number];
  }, [lesionTangent]);

  // Build side diagonal / marginal branch geometries
  const branchGeometries = useMemo(() => {
    return anchorConfig.branches.map((bPoints) => {
      const v3 = bPoints.map((p) => new THREE.Vector3(...p));
      const c = new THREE.CatmullRomCurve3(v3, false, 'centripetal');
      return new THREE.TubeGeometry(c, 32, anchorConfig.radius * 0.72, 12, false);
    });
  }, [anchorConfig.branches, anchorConfig.radius]);

  // Single shared physical material across main artery tube and side branchlets
  // Ensures trunk and branches update emissive color and glow in perfect synchronization
  const sharedMaterial = useMemo(() => {
    const rgb = riskColor3(probability);
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(rgb.r, rgb.g, rgb.b),
      emissive: new THREE.Color(rgb.r, rgb.g, rgb.b),
      emissiveIntensity: 1.4,
      roughness: 0.16,
      metalness: 0.04,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }, []); // Reusable material instance across frames

  // Reusable Color and Float instances for zero GC per frame
  const initRgb = riskColor3(probability);
  const currentColor = useRef(new THREE.Color(initRgb.r, initRgb.g, initRgb.b));
  const currentEmissive = useRef(new THREE.Color(initRgb.r, initRgb.g, initRgb.b));
  const targetColor = useRef(new THREE.Color(initRgb.r, initRgb.g, initRgb.b));
  const targetEmissive = useRef(new THREE.Color(initRgb.r, initRgb.g, initRgb.b));
  const currentIntensity = useRef<number>(1.4);
  const targetIntensity = useRef<number>(1.4);
  const introStartTime = useRef<number | null>(null);

  const { isIntroPlaying, introKey } = useAppStore();

  useEffect(() => {
    introStartTime.current = null;
  }, [introKey]);

  useFrame((state, delta) => {
    const isIntro = isIntroPlaying && quality !== 'performance';
    let baseIntensity: number;

    if (isIntro) {
      if (introStartTime.current === null) {
        introStartTime.current = state.clock.getElapsedTime();
      }
      const elapsed = state.clock.getElapsedTime() - introStartTime.current;

      // Sequential ignition windows: LAD (0.2s - 0.9s) -> LCX (0.8s - 1.5s) -> RCA (1.4s - 2.1s)
      const schedule: Record<VesselKey, { start: number; duration: number }> = {
        LAD: { start: 0.2, duration: 0.7 },
        LCX: { start: 0.8, duration: 0.7 },
        RCA: { start: 1.4, duration: 0.7 },
      };

      const { start, duration } = schedule[vesselKey];
      const greyColor = new THREE.Color('#334155');
      const rgb = riskColor3(probability);
      const activeColor = new THREE.Color(rgb.r, rgb.g, rgb.b);

      if (elapsed < start) {
        targetColor.current.copy(greyColor);
        targetEmissive.current.setRGB(0.04, 0.06, 0.1);
        baseIntensity = 0.3;
      } else if (elapsed < start + duration) {
        const p = (elapsed - start) / duration;
        const ease = 1 - Math.cos(p * Math.PI * 0.5);
        targetColor.current.copy(greyColor).lerp(activeColor, ease);
        targetEmissive.current.copy(greyColor).lerp(activeColor, ease);
        const flare = Math.sin(p * Math.PI) * 2.2;
        baseIntensity = 0.5 + ease * 2.0 + flare;
      } else {
        targetColor.current.copy(activeColor);
        targetEmissive.current.copy(activeColor);
        baseIntensity = 1.4 + Math.pow(probability, 1.3) * 3.2;
      }
    } else {
      // Direct continuous risk color mapping: green #16a34a -> amber #f59e0b -> red #dc2626
      const rgb = riskColor3(probability);
      targetColor.current.setRGB(rgb.r, rgb.g, rgb.b);
      targetEmissive.current.setRGB(rgb.r, rgb.g, rgb.b);

      // Emissive Intensity scales with risk probability:
      // Low (0.23 LCX): ~1.5 (crisp, clearly green)
      // Mid (0.50): ~2.6 (luminous amber)
      // High (0.94 LAD): ~4.2 (hot red glow that blooms and commands the room!)
      baseIntensity = 1.3 + Math.pow(probability, 1.3) * 3.2;

      if (isAngiogramMode) {
        baseIntensity = 3.2 + probability * 1.8;
      } else if (isSelected) {
        baseIntensity += 0.8;
      } else if (!isWholeHeart) {
        baseIntensity *= 0.88;
      }

      if (isHovered) {
        baseIntensity += 0.5;
      }

      // High-risk vessel organic rhythmic pulse (> 0.60)
      if (probability > 0.60 && quality !== 'performance') {
        const time = state.clock.getElapsedTime();
        const pulse = Math.sin(time * 3.8) * 0.5 + 0.5;
        baseIntensity += pulse * 0.85;
      }
    }

    targetIntensity.current = baseIntensity;

    // Smooth LERP transition (~500ms: delta * 6.0 gives 95% convergence in ~500ms)
    const lerpSpeed = Math.min(1, delta * 6.0);
    currentColor.current.lerp(targetColor.current, lerpSpeed);
    currentEmissive.current.lerp(targetEmissive.current, lerpSpeed);
    currentIntensity.current = THREE.MathUtils.lerp(
      currentIntensity.current,
      targetIntensity.current,
      lerpSpeed
    );

    sharedMaterial.color.copy(currentColor.current);
    sharedMaterial.emissive.copy(currentEmissive.current);
    sharedMaterial.emissiveIntensity = currentIntensity.current;
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
      {/* Main Artery Tube Mesh with Stenotic Constriction */}
      <mesh
        ref={meshRef}
        geometry={mainGeometry}
        material={sharedMaterial}
        renderOrder={10}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* Side Artery Branchlets (Sharing material for synchronous glow) */}
      {branchGeometries.map((bGeom, idx) => (
        <mesh
          key={idx}
          geometry={bGeom}
          material={sharedMaterial}
          renderOrder={9}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      ))}

      {/* Localized Atherosclerotic Plaque Cue at Lesion Site (u ~ 0.42) */}
      {probability > 0.35 && (
        <mesh
          position={[lesionPoint.x, lesionPoint.y, lesionPoint.z]}
          rotation={lesionRotation}
          renderOrder={12}
        >
          <torusGeometry args={[anchorConfig.radius * 0.94, anchorConfig.radius * 0.28, 12, 24]} />
          <meshPhysicalMaterial
            color="#fbbf24"
            emissive="#d97706"
            emissiveIntensity={1.2 + probability * 1.6}
            roughness={0.24}
            metalness={0.12}
            clearcoat={0.92}
            clearcoatRoughness={0.08}
          />
        </mesh>
      )}

      {/* Selection Highlight Halo Wireframe */}
      {isSelected && (
        <mesh geometry={mainGeometry} scale={1.25} renderOrder={15}>
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
