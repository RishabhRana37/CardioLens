/**
 * Vessels Configuration (Single Source of Truth - TC3 / NFR3)
 * Authoritative mapping for anatomical model target <-> mesh object <-> camera position <-> color node.
 */

export const VESSELS = {
  LAD: {
    name: 'LAD',
    label: 'Left Anterior Descending',
    meshId: 'artery_LAD',
    camera: [0.8, 0.4, 2.2] as [number, number, number],
    targetLookAt: [0.1, 0.1, 0] as [number, number, number],
    description: 'Supplies the anterior left ventricle, anterior septum, and heart apex ("widowmaker").',
    anatomicalTerritory: 'Anterior / Septal / Apical',
  },
  LCX: {
    name: 'LCX',
    label: 'Left Circumflex',
    meshId: 'artery_LCX',
    camera: [-1.8, 0.6, 1.6] as [number, number, number],
    targetLookAt: [-0.2, 0, 0] as [number, number, number],
    description: 'Supplies the posterolateral left ventricle and anterolateral papillary muscle.',
    anatomicalTerritory: 'Lateral / Posterior LV',
  },
  RCA: {
    name: 'RCA',
    label: 'Right Coronary Artery',
    meshId: 'artery_RCA',
    camera: [1.8, -0.4, 1.8] as [number, number, number],
    targetLookAt: [0.2, -0.1, 0] as [number, number, number],
    description: 'Supplies the right ventricle, inferior left ventricular wall, and SA/AV nodal pacing tissue.',
    anatomicalTerritory: 'Inferior / RV / SA-AV Nodes',
  },
} as const;

export type VesselKey = keyof typeof VESSELS;
export type Target = 'CAD' | VesselKey;

export const TARGET_LIST: Target[] = ['CAD', 'LAD', 'LCX', 'RCA'];
export const VESSEL_LIST: VesselKey[] = ['LAD', 'LCX', 'RCA'];
