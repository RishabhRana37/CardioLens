import * as THREE from 'three';
import { VESSEL_ANCHORS, VesselAnchorConfig } from './vessels.anchors';

/**
 * Vessels Configuration (Single Source of Truth)
 * Authoritative mapping for Target <-> Node Names (MODE_A) <-> Spline Anchors (MODE_B) <-> Lesion Anchors <-> Camera Framing.
 */

export interface VesselDefinition {
  name: 'LAD' | 'LCX' | 'RCA';
  label: string;
  meshId: string;
  camera: [number, number, number];
  targetLookAt: [number, number, number];
  description: string;
  anatomicalTerritory: string;
  nodePatterns: RegExp;
  nodeNames: string[];
  anchors: VesselAnchorConfig;
  lesionAnchor: [number, number, number];
}

export const VESSELS: Record<'LAD' | 'LCX' | 'RCA', VesselDefinition> = {
  LAD: {
    name: 'LAD',
    label: 'Left Anterior Descending',
    meshId: 'artery_LAD',
    camera: [0.8, 0.4, 2.2],
    targetLookAt: [0.1, 0.1, 0],
    description: 'Supplies the anterior left ventricle, anterior septum, and heart apex ("widowmaker").',
    anatomicalTerritory: 'Anterior / Septal / Apical',
    nodePatterns: /lad|anterior.*descend|anterior.*interventricular|((?=.*left)(?=.*anterior)(?=.*(artery|branch|vessel)))/i,
    nodeNames: [
      'Trunk of anterior interventricular branch of left coronary artery [MM420]',
      'Trunk of anterior interventricular branch of left coronary artery [MM424]',
      'Trunk of anterior interventricular branch of left coronary artery [MM425]',
      'Diagonal branch of anterior descending branch of left coronary artery [MM422]',
      'Second left anterior branch of anterior interventricular branch of left coronary artery [MM423]',
      'Third left anterior branch of anterior interventricular branch of left coronary artery [MM432]',
      'Anterior septal branch of anterior interventricular artery [MM431]',
      'Anterior septal branch of anterior interventricular artery [MM433]',
      'Anterior septal branch of anterior interventricular artery [MM434]',
      'Anterior division of left branch of atrioventricular bundle [MM469]',
    ],
    anchors: VESSEL_ANCHORS.LAD,
    lesionAnchor: [0.08, 0.05, 0.54],
  },
  LCX: {
    name: 'LCX',
    label: 'Left Circumflex',
    meshId: 'artery_LCX',
    camera: [-1.8, 0.6, 1.6],
    targetLookAt: [-0.2, 0, 0],
    description: 'Supplies the posterolateral left ventricle and anterolateral papillary muscle.',
    anatomicalTerritory: 'Lateral / Posterior LV',
    nodePatterns: /lcx|circumflex|left.*circ/i,
    nodeNames: [
      'Trunk of circumflex branch of left coronary artery [MM426]',
      'Trunk of circumflex branch of left coronary artery [MM429]',
      'First posterior ventricular branch of circumflex coronary artery [MM428]',
    ],
    anchors: VESSEL_ANCHORS.LCX,
    lesionAnchor: [-0.52, 0.22, 0.22],
  },
  RCA: {
    name: 'RCA',
    label: 'Right Coronary Artery',
    meshId: 'artery_RCA',
    camera: [1.8, -0.4, 1.8],
    targetLookAt: [0.2, -0.1, 0],
    description: 'Supplies the right ventricle, inferior left ventricular wall, and SA/AV nodal pacing tissue.',
    anatomicalTerritory: 'Inferior / RV / SA-AV Nodes',
    nodePatterns: /rca|right.*coronary/i,
    nodeNames: [
      'Trunk of right coronary artery [MM436]',
      'Trunk of right coronary artery [MM439]',
      'Trunk of right coronary artery [MM556]',
      'First anterior ventricular branch of right coronary artery [MM437]',
      'Marginal branch of right coronary artery [MM440]',
      'Conus branch of right coronary artery [MM441]',
      'Sinoatrial nodal branch of right coronary artery [MM438]',
      'Atrioventricular node branch of right coronary artery [MM443]',
      'First posterior ventricular branch of right coronary artery [MM444]',
      'Anterior atrial branch of right coronary artery [MM445]',
    ],
    anchors: VESSEL_ANCHORS.RCA,
    lesionAnchor: [0.55, 0.12, 0.22],
  },
};

export type VesselKey = keyof typeof VESSELS;
export type Target = 'CAD' | VesselKey;

export const TARGET_LIST: Target[] = ['CAD', 'LAD', 'LCX', 'RCA'];
export const VESSEL_LIST: VesselKey[] = ['LAD', 'LCX', 'RCA'];

// Global 3D Object Registry for both MODE_A and MODE_B
const vesselObjectRegistry = new Map<Target, THREE.Object3D>();

export function registerVesselObject(target: Target, obj: THREE.Object3D | null): void {
  if (obj) {
    vesselObjectRegistry.set(target, obj);
  } else {
    vesselObjectRegistry.delete(target);
  }
}

export function getVesselObject(target: Target): THREE.Object3D | null {
  return vesselObjectRegistry.get(target) || null;
}
