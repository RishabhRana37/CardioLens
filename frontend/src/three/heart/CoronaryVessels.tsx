import React, { useRef, useMemo, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { VESSELS, VesselKey } from '../../config/vessels.config';
import { riskColor3, riskGradient, getRiskTier } from '../colorScale';

interface VesselBranchProps {
  vesselKey: VesselKey;
  points: [number, number, number][];
  tubularSegments?: number;
  radius?: number;
  branches?: [number, number, number][][];
}

const VesselBranch: React.FC<VesselBranchProps> = ({
  vesselKey,
  points,
  tubularSegments = 48,
  radius = 0.038,
  branches = [],
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const {
    predictions,
    selectedVessel,
    selectVessel,
    quality,
  } = useAppStore();

  const isSelected = selectedVessel === vesselKey;
  const targetConfig = VESSELS[vesselKey];
  const pred = predictions?.[vesselKey];
  const probability = pred?.probability ?? 0.25;

  // Build main CatmullRom spline tube
  const mainCurve = useMemo(() => {
    const v3Points = points.map((p) => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(v3Points, false, 'centripetal');
  }, [points]);

  const mainGeometry = useMemo(() => {
    return new THREE.TubeGeometry(mainCurve, tubularSegments, radius, 12, false);
  }, [mainCurve, tubularSegments, radius]);

  // Build side diagonal / marginal branch geometries
  const branchGeometries = useMemo(() => {
    return branches.map((bPoints) => {
      const v3 = bPoints.map((p) => new THREE.Vector3(...p));
      const c = new THREE.CatmullRomCurve3(v3, false, 'centripetal');
      return new THREE.TubeGeometry(c, 24, radius * 0.7, 8, false);
    });
  }, [branches, radius]);

  // Reusable Color instances for zero GC per frame
  const currentColor = useRef(new THREE.Color('#16a34a'));
  const currentEmissive = useRef(new THREE.Color('#16a34a'));
  const targetColor = useRef(new THREE.Color('#16a34a'));
  const targetEmissive = useRef(new THREE.Color('#16a34a'));

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    // Read target risk color
    const rgb = riskColor3(probability);
    targetColor.current.setRGB(rgb.r, rgb.g, rgb.b);
    targetEmissive.current.setRGB(rgb.r, rgb.g, rgb.b);

    // Smooth LERP transition (~500ms)
    const lerpSpeed = delta * 4.5;
    currentColor.current.lerp(targetColor.current, lerpSpeed);
    currentEmissive.current.lerp(targetEmissive.current, lerpSpeed);

    materialRef.current.color.copy(currentColor.current);
    materialRef.current.emissive.copy(currentEmissive.current);

    // High risk / Hover / Selected Emissive Intensity Modulation
    const baseIntensity = probability > 0.66 ? 1.8 : probability > 0.33 ? 0.9 : 0.4;
    let finalIntensity = baseIntensity;

    if (isSelected) {
      finalIntensity += 0.8;
    }
    if (isHovered) {
      finalIntensity += 0.6;
    }

    // High-risk vessel soft pulse
    if (probability > 0.66 && quality !== 'performance') {
      const time = state.clock.getElapsedTime();
      const pulse = Math.sin(time * 6) * 0.4 + 0.4;
      finalIntensity += pulse;
    }

    materialRef.current.emissiveIntensity = finalIntensity;
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
    const midT = 0.45;
    const pt = mainCurve.getPoint(midT);
    return [pt.x, pt.y + 0.08, pt.z + 0.08] as [number, number, number];
  }, [mainCurve]);

  const riskTier = getRiskTier(probability);

  return (
    <group>
      {/* Main Artery Tube Mesh */}
      <mesh
        ref={meshRef}
        geometry={mainGeometry}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          ref={materialRef}
          color="#16a34a"
          emissive="#16a34a"
          emissiveIntensity={0.8}
          roughness={0.25}
          metalness={0.15}
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
          <meshStandardMaterial
            color={currentColor.current}
            emissive={currentEmissive.current}
            emissiveIntensity={materialRef.current?.emissiveIntensity ?? 0.8}
            roughness={0.25}
            metalness={0.15}
          />
        </mesh>
      ))}

      {/* Selection Highlight Halo Rings */}
      {isSelected && (
        <mesh geometry={mainGeometry} scale={1.22}>
          <meshBasicMaterial
            color="#2dd4bf"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Floating Interactive 3D Tooltip */}
      {(isHovered || isSelected) && (
        <Html position={tooltipPosition} distanceFactor={8} center pointerEvents="none">
          <div className="rounded-xl bg-slate-950/95 border border-white/20 p-2.5 shadow-2xl backdrop-blur-xl text-slate-100 font-sans min-w-[190px] space-y-1.5 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
              <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: riskGradient(probability) }}
                />
                {targetConfig.name} Artery
              </span>
              <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${riskTier.badgeClass}`}>
                {(probability * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-[11px] text-slate-300 font-medium">
              {targetConfig.label}
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
              <span>Status:</span>
              <span className="text-slate-200 font-semibold">{pred?.label || 'Calculating'}</span>
            </div>

            <p className="text-[9px] text-teal-300/90 italic border-t border-white/5 pt-1">
              Click to isolate & inspect SHAP drivers
            </p>
          </div>
        </Html>
      )}
    </group>
  );
};

export const CORONARY_PATHS = {
  LAD: {
    main: [
      [-0.04, 0.48, 0.38],
      [0.04, 0.34, 0.50],
      [0.08, 0.12, 0.57],
      [0.09, -0.15, 0.58],
      [0.02, -0.42, 0.52],
      [-0.08, -0.68, 0.38],
      [-0.18, -0.88, 0.22],
    ] as [number, number, number][],
    branches: [
      [
        [0.07, 0.18, 0.55],
        [-0.14, 0.05, 0.52],
        [-0.28, -0.15, 0.42],
      ] as [number, number, number][],
    ],
  },
  LCX: {
    main: [
      [-0.12, 0.46, 0.34],
      [-0.32, 0.40, 0.32],
      [-0.52, 0.25, 0.20],
      [-0.64, 0.05, 0.02],
      [-0.60, -0.22, -0.18],
      [-0.44, -0.46, -0.28],
    ] as [number, number, number][],
    branches: [
      [
        [-0.45, 0.32, 0.26],
        [-0.52, 0.10, 0.28],
        [-0.54, -0.18, 0.22],
      ] as [number, number, number][],
    ],
  },
  RCA: {
    main: [
      [0.18, 0.50, 0.36],
      [0.38, 0.40, 0.40],
      [0.54, 0.18, 0.38],
      [0.64, -0.06, 0.28],
      [0.58, -0.32, 0.12],
      [0.44, -0.58, -0.08],
      [0.24, -0.74, -0.18],
    ] as [number, number, number][],
    branches: [
      [
        [0.60, 0.05, 0.32],
        [0.52, -0.15, 0.40],
        [0.38, -0.35, 0.45],
      ] as [number, number, number][],
    ],
  },
};

export const CARDIAC_VEIN_PATHS = {
  greatCardiacVein: [
    [-0.07, 0.44, 0.39],
    [0.01, 0.32, 0.51],
    [0.05, 0.10, 0.58],
    [0.06, -0.16, 0.59],
    [-0.01, -0.44, 0.53],
    [-0.11, -0.70, 0.39],
    [-0.20, -0.90, 0.23],
  ] as [number, number, number][],
  veinBranches: [
    [
      [0.04, 0.15, 0.56],
      [0.18, 0.08, 0.54],
      [0.28, -0.06, 0.46],
    ] as [number, number, number][],
    [
      [-0.01, -0.44, 0.53],
      [-0.18, -0.52, 0.46],
      [-0.26, -0.62, 0.36],
    ] as [number, number, number][],
  ],
};

const GreatCardiacVein: React.FC = () => {
  const mainCurve = useMemo(() => {
    const pts = CARDIAC_VEIN_PATHS.greatCardiacVein.map((p) => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  }, []);

  const mainGeo = useMemo(() => {
    return new THREE.TubeGeometry(mainCurve, 40, 0.024, 10, false);
  }, [mainCurve]);

  const branchGeos = useMemo(() => {
    return CARDIAC_VEIN_PATHS.veinBranches.map((b) => {
      const pts = b.map((p) => new THREE.Vector3(...p));
      const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      return new THREE.TubeGeometry(c, 16, 0.018, 8, false);
    });
  }, []);

  return (
    <group>
      <mesh geometry={mainGeo}>
        <meshPhysicalMaterial
          color="#1e5899"
          roughness={0.35}
          metalness={0.12}
          clearcoat={0.65}
          emissive="#0d3362"
          emissiveIntensity={0.2}
        />
      </mesh>
      {branchGeos.map((geo, idx) => (
        <mesh key={idx} geometry={geo}>
          <meshPhysicalMaterial
            color="#1e5899"
            roughness={0.35}
            metalness={0.12}
            clearcoat={0.65}
            emissive="#0d3362"
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
};

export const CoronaryVessels: React.FC = () => {
  return (
    <group position={[0, -0.1, 0]}>
      {/* Paired Great Cardiac Vein (Anterior Sulcus Blue Vein matching sticker) */}
      <GreatCardiacVein />

      {/* Left Anterior Descending (LAD) */}
      <VesselBranch
        vesselKey="LAD"
        points={CORONARY_PATHS.LAD.main}
        branches={CORONARY_PATHS.LAD.branches}
        radius={0.034}
      />

      {/* Left Circumflex (LCX) */}
      <VesselBranch
        vesselKey="LCX"
        points={CORONARY_PATHS.LCX.main}
        branches={CORONARY_PATHS.LCX.branches}
        radius={0.032}
      />

      {/* Right Coronary Artery (RCA) */}
      <VesselBranch
        vesselKey="RCA"
        points={CORONARY_PATHS.RCA.main}
        branches={CORONARY_PATHS.RCA.branches}
        radius={0.034}
      />
    </group>
  );
};

export default CoronaryVessels;
