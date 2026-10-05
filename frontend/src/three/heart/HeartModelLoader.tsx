import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { ProceduralHeart } from './ProceduralHeart';
import { CoronaryVessels } from './CoronaryVessels';
import { StenosisPlaqueMarker } from './StenosisPlaqueMarker';
import { getOrganicMuscleTextures } from './muscleTexture';
import {
  VESSELS,
  VesselKey,
  Target,
  registerVesselObject,
} from '../../config/vessels.config';
import { Prediction } from '../../api/types';
import { riskColor3, riskGradient, getRiskTier } from '../colorScale';

export interface InspectedNodeInfo {
  id: string;
  name: string;
  type: string;
  vertexCount: number;
  faceCount: number;
  hasMaterial: boolean;
  center: [number, number, number];
  category: 'LAD' | 'LCX' | 'RCA' | 'VESSEL' | 'VALVE' | 'CHAMBER' | 'MYOCARDIUM' | 'SEPTUM' | 'OTHER';
}

export type ModelMode = 'MODE_A' | 'MODE_B';

interface HeartModelLoaderProps {
  isBeating?: boolean;
  selectedNodeId?: string | null;
  onModelLoaded?: (nodes: InspectedNodeInfo[], mode: ModelMode) => void;
  predictionsOverride?: Record<Target, Prediction> | null;
}

export const HeartModelLoader: React.FC<HeartModelLoaderProps> = ({
  isBeating = true,
  selectedNodeId = null,
  onModelLoaded,
  predictionsOverride = null,
}) => {
  const [loadError, setLoadError] = useState<boolean>(false);
  const [hoveredVessel, setHoveredVessel] = useState<VesselKey | null>(null);

  const {
    predictions,
    projectionPredictions,
    isProjectionMode,
    selectedVessel,
    selectVessel,
    quality,
    isAngiogramMode,
  } = useAppStore();

  const effectivePredictions =
    predictionsOverride ||
    (isProjectionMode && projectionPredictions ? projectionPredictions : predictions);

  const containerRef = useRef<THREE.Group>(null);
  const ladGroupRef = useRef<THREE.Group>(null);
  const lcxGroupRef = useRef<THREE.Group>(null);
  const rcaGroupRef = useRef<THREE.Group>(null);

  // Material and color refs for smooth per-frame animation (zero GC)
  const vesselMaterials = useRef<Record<VesselKey, (THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial)[]>>({
    LAD: [],
    LCX: [],
    RCA: [],
  });

  const myoMaterials = useRef<(THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial)[]>([]);

  const currentColors = useRef<Record<VesselKey, THREE.Color>>({
    LAD: new THREE.Color('#16a34a'),
    LCX: new THREE.Color('#16a34a'),
    RCA: new THREE.Color('#16a34a'),
  });

  const currentEmissives = useRef<Record<VesselKey, THREE.Color>>({
    LAD: new THREE.Color('#16a34a'),
    LCX: new THREE.Color('#16a34a'),
    RCA: new THREE.Color('#16a34a'),
  });

  const currentMyoColor = useRef<THREE.Color>(new THREE.Color('#8d1e2d'));
  const targetMyoColor = useRef<THREE.Color>(new THREE.Color('#8d1e2d'));

  // Attempt to load GLB model with drei useGLTF
  let gltf: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    gltf = useGLTF('/models/heart.glb', true);
  } catch (err) {
    console.warn('[CardioLens 3D] Failed to load /models/heart.glb, falling back to procedural heart:', err);
    if (!loadError) setLoadError(true);
  }

  // Cloned scene, auto-centering / auto-fitting, material upgrade and vessel grouping
  const {
    centeredScene,
    inspectedNodes,
    detectedMode,
    vesselCentroids,
  } = useMemo(() => {
    if (!gltf || !gltf.scene) {
      return {
        centeredScene: null,
        inspectedNodes: [],
        detectedMode: 'MODE_B' as ModelMode,
        vesselCentroids: { LAD: [0.32, 0.05, 0.52], LCX: [0.45, 0.15, -0.25], RCA: [-0.45, -0.15, 0.45] } as Record<VesselKey, [number, number, number]>,
      };
    }

    const sceneClone = gltf.scene.clone(true);

    // Compute bounding box of native raw model in BodyParts3D/DICOM coordinates
    const box = new THREE.Box3().setFromObject(sceneClone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1.0;

    // Target size ~ 2.4 units for ideal camera viewport framing (~70% of screen height)
    const targetScale = 2.4 / maxDimension;

    // Center the raw geometry at (0,0,0)
    sceneClone.position.set(-center.x, -center.y, -center.z);

    // Create oriented root group: Rotate -90 deg on X to align DICOM coordinates with Three.js
    // DICOM +Z (Superior/Aorta) -> Three.js +Y (Up)
    // DICOM -Y (Anterior/LAD)   -> Three.js +Z (Towards Camera / Front)
    // DICOM +X (Patient Left)   -> Three.js +X (Left Ventricle)
    const rootGroup = new THREE.Group();
    rootGroup.name = 'AnatomicalHeartOrientedRoot';
    rootGroup.add(sceneClone);
    rootGroup.rotation.x = -Math.PI / 2;
    rootGroup.scale.set(targetScale, targetScale, targetScale);

    // Helper to transform raw DICOM coordinate to world space
    const transformDicomToWorld = (pt: THREE.Vector3): THREE.Vector3 => {
      const local = pt.clone().sub(center);
      return new THREE.Vector3(local.x, local.z, -local.y).multiplyScalar(targetScale);
    };

    // Get procedural organic muscle textures for living striated normal relief
    const { normalMap: organicNormal, roughnessMap: organicRoughness } = getOrganicMuscleTextures();

    // Traverse scene graph to inspect all meshes & detect coronary vessels
    const nodesInfo: InspectedNodeInfo[] = [];
    const valveRegex = /valve|cusp|leaflet|anulus|scallop/i;
    const ladRegex = VESSELS.LAD.nodePatterns;
    const lcxRegex = VESSELS.LCX.nodePatterns;
    const rcaRegex = VESSELS.RCA.nodePatterns;
    const aortaRegex = /aort/i;
    const pulmonaryRegex = /pulmonary.*(trunk|artery)|proper \[MM607\]/i;
    const veinRegex = /cardiac vein|marginal vein|coronary sinus|vena cava/i;
    const septumRegex = /septum|septal/i;
    const chamberRegex = /atrium|ventricle|auricle|wall/i;

    const vesselAccumulators: Record<VesselKey, { sum: THREE.Vector3; count: number }> = {
      LAD: { sum: new THREE.Vector3(), count: 0 },
      LCX: { sum: new THREE.Vector3(), count: 0 },
      RCA: { sum: new THREE.Vector3(), count: 0 },
    };

    vesselMaterials.current = { LAD: [], LCX: [], RCA: [] };
    myoMaterials.current = [];

    sceneClone.traverse((node: THREE.Object3D) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const geom = mesh.geometry;
        const vCount = geom.attributes.position ? geom.attributes.position.count : 0;
        const fCount = geom.index ? geom.index.count / 3 : Math.floor(vCount / 3);

        geom.computeBoundingBox();
        const meshCenter = geom.boundingBox
          ? geom.boundingBox.getCenter(new THREE.Vector3())
          : new THREE.Vector3();

        const transformedCenter = transformDicomToWorld(meshCenter);
        const name = mesh.name || 'Unnamed_Mesh';
        let category: InspectedNodeInfo['category'] = 'OTHER';

        if (valveRegex.test(name)) {
          category = 'VALVE';
        } else if (ladRegex.test(name)) {
          category = 'LAD';
        } else if (lcxRegex.test(name)) {
          category = 'LCX';
        } else if (rcaRegex.test(name)) {
          category = 'RCA';
        } else if (septumRegex.test(name)) {
          category = 'SEPTUM';
        } else if (chamberRegex.test(name)) {
          category = 'MYOCARDIUM';
        } else if (aortaRegex.test(name) || pulmonaryRegex.test(name) || veinRegex.test(name)) {
          category = 'VESSEL';
        }

        nodesInfo.push({
          id: mesh.uuid,
          name: name,
          type: mesh.type,
          vertexCount: vCount,
          faceCount: fCount,
          hasMaterial: Boolean(mesh.material),
          center: [
            Number(transformedCenter.x.toFixed(2)),
            Number(transformedCenter.y.toFixed(2)),
            Number(transformedCenter.z.toFixed(2)),
          ],
          category,
        });

        // 1. CORONARY ARTERY VESSELS (LAD, LCX, RCA)
        if (category === 'LAD' || category === 'LCX' || category === 'RCA') {
          const vKey = category as VesselKey;
          const mat = new THREE.MeshPhysicalMaterial({
            color: '#16a34a',
            emissive: '#16a34a',
            emissiveIntensity: 0.9,
            roughness: 0.28,
            metalness: 0.12,
            clearcoat: 0.65,
            clearcoatRoughness: 0.15,
            side: THREE.FrontSide,
          });

          mesh.material = mat;
          mesh.userData.vesselKey = vKey;
          mesh.userData.isCoronaryVessel = true;
          mesh.userData.originalMaterial = mat;
          vesselMaterials.current[vKey].push(mat);

          vesselAccumulators[vKey].sum.add(transformedCenter);
          vesselAccumulators[vKey].count++;
        }
        // 2. GREAT ARTERIES: ASCENDING AORTA
        else if (aortaRegex.test(name)) {
          const mat = new THREE.MeshPhysicalMaterial({
            color: '#a84e5b',
            roughness: 0.48,
            metalness: 0.04,
            clearcoat: 0.32,
            clearcoatRoughness: 0.25,
            side: THREE.FrontSide,
          });
          mesh.material = mat;
          mesh.userData.originalMaterial = mat;
          myoMaterials.current.push(mat);
        }
        // 3. GREAT ARTERIES: PULMONARY TRUNK
        else if (pulmonaryRegex.test(name)) {
          const mat = new THREE.MeshPhysicalMaterial({
            color: '#6a2638',
            roughness: 0.50,
            metalness: 0.03,
            clearcoat: 0.30,
            clearcoatRoughness: 0.25,
            side: THREE.FrontSide,
          });
          mesh.material = mat;
          mesh.userData.originalMaterial = mat;
          myoMaterials.current.push(mat);
        }
        // 4. VENOUS VESSELS (CARDIAC VEINS & CORONARY SINUS)
        else if (veinRegex.test(name)) {
          const mat = new THREE.MeshPhysicalMaterial({
            color: '#244062',
            roughness: 0.44,
            metalness: 0.06,
            clearcoat: 0.35,
            clearcoatRoughness: 0.2,
            side: THREE.FrontSide,
          });
          mesh.material = mat;
          mesh.userData.originalMaterial = mat;
          myoMaterials.current.push(mat);
        }
        // 5. VALVES & FIBROUS SKELETON
        else if (category === 'VALVE') {
          const mat = new THREE.MeshStandardMaterial({
            color: '#e2e8f0',
            roughness: 0.42,
            metalness: 0.05,
            side: THREE.FrontSide,
          });
          mesh.material = mat;
          mesh.userData.originalMaterial = mat;
          myoMaterials.current.push(mat as any);
        }
        // 6. LIVING MYOCARDIUM & CHAMBER WALLS (COHERENT SOLID ORGAN)
        else {
          const isAtrium = /atrium|auricle/i.test(name);
          const isSeptum = category === 'SEPTUM';

          const myoColor = isAtrium ? '#922837' : isSeptum ? '#781622' : '#841e2b';

          const mat = new THREE.MeshPhysicalMaterial({
            color: myoColor,
            roughness: 0.54,
            metalness: 0.02,
            clearcoat: 0.32,
            clearcoatRoughness: 0.28,
            transmission: 0, // Solid opaque living tissue (no hollow glass)
            ior: 1.4,
            normalMap: organicNormal,
            normalScale: new THREE.Vector2(0.18, 0.18),
            roughnessMap: organicRoughness,
            side: THREE.FrontSide, // Strict front-face culling
          });

          mesh.material = mat;
          mesh.userData.originalMaterial = mat;
          mesh.userData.baseMyoColor = myoColor;
          myoMaterials.current.push(mat);
        }
      }
    });

    const isModeA =
      vesselMaterials.current.LAD.length > 0 &&
      vesselMaterials.current.LCX.length > 0 &&
      vesselMaterials.current.RCA.length > 0;

    const mode: ModelMode = isModeA ? 'MODE_A' : 'MODE_B';

    // Calculate transformed world-space centroids for tooltips
    const centroids: Record<VesselKey, [number, number, number]> = {
      LAD: [0.32, 0.05, 0.52],
      LCX: [0.45, 0.15, -0.25],
      RCA: [-0.45, -0.15, 0.45],
    };

    (['LAD', 'LCX', 'RCA'] as VesselKey[]).forEach((vKey) => {
      const acc = vesselAccumulators[vKey];
      if (acc.count > 0) {
        const avg = acc.sum.clone().divideScalar(acc.count);
        centroids[vKey] = [
          Number(avg.x.toFixed(3)),
          Number((avg.y + 0.06).toFixed(3)),
          Number((avg.z + 0.06).toFixed(3)),
        ];
      }
    });

    return {
      centeredScene: rootGroup,
      inspectedNodes: nodesInfo,
      detectedMode: mode,
      vesselCentroids: centroids,
    };
  }, [gltf, quality]);

  // Register in global registry for camera framing & queries
  useEffect(() => {
    if (detectedMode === 'MODE_A' && centeredScene) {
      registerVesselObject('CAD', centeredScene);
      if (ladGroupRef.current) registerVesselObject('LAD', ladGroupRef.current);
      if (lcxGroupRef.current) registerVesselObject('LCX', lcxGroupRef.current);
      if (rcaGroupRef.current) registerVesselObject('RCA', rcaGroupRef.current);
    }
  }, [detectedMode, centeredScene]);

  // Log report on mount
  useEffect(() => {
    if (inspectedNodes.length > 0) {
      console.groupCollapsed(
        `%c🫀 [CardioLens 3D] Model Scene Graph Inspection (${inspectedNodes.length} Nodes)`,
        'color: #14b8a6; font-weight: bold; font-size: 13px;'
      );

      console.log(
        `%c>>> DETECTED MODE: ${detectedMode} (${detectedMode === 'MODE_A' ? 'Named Vessels Found' : 'Surface Only'}) <<<`,
        'color: #38bdf8; font-weight: bold; font-size: 14px; background: #0f172a; padding: 4px 8px; border-radius: 4px;'
      );

      const ladNodes = inspectedNodes.filter((n) => n.category === 'LAD');
      const lcxNodes = inspectedNodes.filter((n) => n.category === 'LCX');
      const rcaNodes = inspectedNodes.filter((n) => n.category === 'RCA');
      const otherVessels = inspectedNodes.filter((n) => n.category === 'VESSEL');

      console.log('%c[LAD Meshes]:', 'color: #f43f5e; font-weight: bold;', ladNodes.map((n) => n.name));
      console.log('%c[LCX Meshes]:', 'color: #fb923c; font-weight: bold;', lcxNodes.map((n) => n.name));
      console.log('%c[RCA Meshes]:', 'color: #38bdf8; font-weight: bold;', rcaNodes.map((n) => n.name));
      console.log('%c[Other Vessels]:', 'color: #a855f7; font-weight: bold;', otherVessels.map((n) => n.name));

      console.table(
        inspectedNodes.map((n) => ({
          Name: n.name,
          Category: n.category,
          Vertices: n.vertexCount,
          Faces: n.faceCount,
          'Center (X,Y,Z)': n.center.join(', '),
          'Has Material': n.hasMaterial ? 'Yes' : 'No',
        }))
      );

      console.groupEnd();

      if (onModelLoaded) {
        onModelLoaded(inspectedNodes, detectedMode);
      }
    }
  }, [inspectedNodes, detectedMode, onModelLoaded]);

  // Handle Model Inspector node isolation & Angiogram mode transformations
  useEffect(() => {
    if (!centeredScene) return;

    centeredScene.traverse((node: THREE.Object3D) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const isVessel = mesh.userData.isCoronaryVessel;

        // 1. Inspector Node Highlight
        if (selectedNodeId) {
          if (mesh.uuid === selectedNodeId || mesh.name === selectedNodeId) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: '#38bdf8',
              emissive: '#0284c7',
              emissiveIntensity: 0.8,
              roughness: 0.2,
              metalness: 0.3,
              side: THREE.DoubleSide,
            });
            mesh.visible = true;
          } else {
            mesh.material = new THREE.MeshStandardMaterial({
              color: '#475569',
              roughness: 0.8,
              metalness: 0.1,
              transparent: true,
              opacity: 0.15,
              wireframe: false,
              side: THREE.DoubleSide,
            });
            mesh.visible = true;
          }
        }
        // 2. Angiogram Fluoroscopy Mode: Myocardium melts into translucent smoky glass
        else if (isAngiogramMode) {
          if (isVessel) {
            // Contrast dye radiant vessel
            if (mesh.userData.originalMaterial) {
              mesh.material = mesh.userData.originalMaterial;
            }
            mesh.visible = true;
          } else {
            // Translucent smoky glass myocardium
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: '#060b14',
              roughness: 0.1,
              metalness: 0.1,
              transmission: 0.92,
              thickness: 1.2,
              ior: 1.25,
              attenuationColor: new THREE.Color('#0284c7'),
              attenuationDistance: 0.9,
              transparent: true,
              opacity: 0.18,
              side: THREE.DoubleSide,
            });
            mesh.visible = true;
          }
        }
        // 3. Vessel Isolation Mode (Specific Artery selected)
        else if (selectedVessel) {
          const vKey = mesh.userData.vesselKey as VesselKey | undefined;
          if (vKey === selectedVessel) {
            if (mesh.userData.originalMaterial) {
              mesh.material = mesh.userData.originalMaterial;
            }
            mesh.visible = true;
          } else if (mesh.userData.isCoronaryVessel) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: '#334155',
              roughness: 0.8,
              transparent: true,
              opacity: 0.3,
              side: THREE.DoubleSide,
            });
            mesh.visible = true;
          } else {
            mesh.material = new THREE.MeshStandardMaterial({
              color: '#4a151e',
              roughness: 0.7,
              transparent: true,
              opacity: 0.4,
              side: THREE.DoubleSide,
            });
            mesh.visible = true;
          }
        }
        // 4. Default Whole-Heart Anatomy View
        else {
          if (mesh.userData.originalMaterial) {
            mesh.material = mesh.userData.originalMaterial;
          }
          mesh.visible = true;
        }
      }
    });
  }, [centeredScene, selectedNodeId, selectedVessel, isAngiogramMode]);

  // Per-frame smooth risk color animation & CAD overall tint
  useFrame((state, delta) => {
    if (selectedNodeId) return;

    const lerpSpeed = delta * 4.5;
    const time = state.clock.getElapsedTime();

    // 1. Coronary Artery Vessel Risk Color LERPing (MODE_A)
    if (detectedMode === 'MODE_A') {
      (['LAD', 'LCX', 'RCA'] as VesselKey[]).forEach((vKey) => {
        const mats = vesselMaterials.current[vKey];
        if (!mats || mats.length === 0) return;

        const prob = effectivePredictions?.[vKey]?.probability ?? 0.25;
        const rgb = riskColor3(prob);

        const targetCol = new THREE.Color(rgb.r, rgb.g, rgb.b);
        const curCol = currentColors.current[vKey];
        const curEm = currentEmissives.current[vKey];

        curCol.lerp(targetCol, lerpSpeed);
        curEm.lerp(targetCol, lerpSpeed);

        const isSelected = selectedVessel === vKey;
        const isHovered = hoveredVessel === vKey;

        // In Angiogram Mode: intense fluoroscopic contrast dye luminescence (2.8 - 4.5)
        let intensity = isAngiogramMode ? 2.8 + prob * 1.5 : (prob > 0.66 ? 1.6 : prob > 0.33 ? 0.8 : 0.4);
        if (isSelected) intensity += 0.8;
        if (isHovered) intensity += 0.6;

        // Slow emissive pulse for high-risk vessels (> 0.66)
        if (prob > 0.66 && quality !== 'performance') {
          intensity += Math.sin(time * 3.5) * 0.45 + 0.45;
        }

        mats.forEach((mat) => {
          mat.color.copy(curCol);
          mat.emissive.copy(curEm);
          mat.emissiveIntensity = intensity;
        });
      });
    }

    // 2. Whole-Heart (CAD) Faint Overall Myocardium Tint (when in Anatomy mode)
    if (!isAngiogramMode && selectedVessel === null && myoMaterials.current.length > 0) {
      const cadProb = effectivePredictions?.CAD?.probability ?? 0.2;
      const cadRgb = riskColor3(cadProb);

      targetMyoColor.current.set('#8d1e2d').lerp(new THREE.Color(cadRgb.r, cadRgb.g, cadRgb.b), 0.22);
      currentMyoColor.current.lerp(targetMyoColor.current, lerpSpeed);

      myoMaterials.current.forEach((mat) => {
        mat.color.copy(currentMyoColor.current);
      });
    }
  });

  // Raycasting pointer handlers
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const vKey = mesh.userData.vesselKey as VesselKey | undefined;
    if (vKey) {
      setHoveredVessel(vKey);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredVessel(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const vKey = mesh.userData.vesselKey as VesselKey | undefined;
    if (vKey) {
      selectVessel(selectedVessel === vKey ? null : vKey);
    }
  };

  // Fallback to ProceduralHeart if load failed or empty
  if (loadError || !centeredScene) {
    return (
      <group>
        <ProceduralHeart isBeating={isBeating} />
        <CoronaryVessels />
      </group>
    );
  }

  // Active vessel tooltip info
  const activeTooltipVessel = hoveredVessel || (selectedVessel as VesselKey | null);
  const activeVesselConfig = activeTooltipVessel ? VESSELS[activeTooltipVessel] : null;
  const activePred = activeTooltipVessel ? effectivePredictions?.[activeTooltipVessel] : null;
  const activeProb = activePred?.probability ?? 0.25;
  const activeTier = getRiskTier(activeProb);

  return (
    <group ref={containerRef} name="AnatomicalHeartContainer">
      {/* 3D Scene Mesh with Raycast Handlers */}
      <primitive
        object={centeredScene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* HIGH-CONTRAST 3D CORONARY ARTERY VASCULAR TREE (LAD, LCX, RCA) */}
      <CoronaryVessels predictionsOverride={effectivePredictions} />

      {/* STENOSIS LESION PLAQUE MARKERS & PULSING CONSTRICTION RINGS */}
      <group name="StenosisPlaqueMarkersGroup">
        <StenosisPlaqueMarker vesselKey="LAD" />
        <StenosisPlaqueMarker vesselKey="LCX" />
        <StenosisPlaqueMarker vesselKey="RCA" />
      </group>

      {/* Virtual Target Groups for Registry */}
      <group ref={ladGroupRef} position={vesselCentroids.LAD} name="Target_LAD" />
      <group ref={lcxGroupRef} position={vesselCentroids.LCX} name="Target_LCX" />
      <group ref={rcaGroupRef} position={vesselCentroids.RCA} name="Target_RCA" />

      {/* Floating 3D Tooltip for Hovered / Selected Vessel in MODE_A */}
      {detectedMode === 'MODE_A' && activeTooltipVessel && activeVesselConfig && (
        <Html
          position={vesselCentroids[activeTooltipVessel]}
          distanceFactor={8}
          center
          pointerEvents="none"
        >
          <div className="rounded-xl bg-slate-950/95 border border-white/20 p-2.5 shadow-2xl backdrop-blur-xl text-slate-100 font-sans min-w-[190px] space-y-1.5 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
              <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: riskGradient(activeProb) }}
                />
                {activeVesselConfig.name} Artery
              </span>
              <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${activeTier.badgeClass}`}>
                {(activeProb * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-[11px] text-slate-300 font-medium">
              {activeVesselConfig.label}
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
              <span>Status:</span>
              <span className="text-slate-200 font-semibold">{activePred?.label || 'Calculating'}</span>
            </div>

            {activeProb > 0.33 && (
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-mono pt-0.5 border-t border-white/5">
                <span>Stenosis:</span>
                <span className="font-bold">{(activeProb * 100).toFixed(0)}% Occlusion</span>
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

useGLTF.preload('/models/heart.glb');
