/**
 * Coronary Vessel Anchor Points (High-Fidelity 3D Vascular Tree Routing)
 * Hand-calibrated 3D CatmullRom spline control points resting on the epicardial surface.
 */

export interface VesselAnchorConfig {
  main: [number, number, number][];
  branches: [number, number, number][][];
  radius: number;
  taper?: number;
}

export const VESSEL_ANCHORS: Record<'LAD' | 'LCX' | 'RCA', VesselAnchorConfig> = {
  LAD: {
    // Anterior Interventricular Sulcus path (front-center down to apex)
    main: [
      [0.18, 0.46, 0.38],
      [0.22, 0.34, 0.48],
      [0.28, 0.18, 0.58],
      [0.34, 0.02, 0.65],
      [0.42, -0.18, 0.67],
      [0.50, -0.38, 0.68],
      [0.56, -0.54, 0.60],
    ],
    branches: [
      // Diagonal Branch 1 (D1)
      [
        [0.28, 0.18, 0.58],
        [0.46, 0.10, 0.54],
        [0.62, 0.02, 0.42],
      ],
      // Diagonal Branch 2 (D2)
      [
        [0.42, -0.18, 0.67],
        [0.56, -0.22, 0.56],
        [0.68, -0.30, 0.40],
      ],
    ],
    radius: 0.058,
    taper: 0.62,
  },
  LCX: {
    // Left Atrioventricular (Coronary) Sulcus path around obtuse margin
    main: [
      [0.22, 0.42, 0.34],
      [0.36, 0.36, 0.20],
      [0.48, 0.26, 0.02],
      [0.56, 0.14, -0.18],
      [0.58, -0.02, -0.36],
      [0.52, -0.18, -0.52],
      [0.38, -0.34, -0.62],
    ],
    branches: [
      // Obtuse Marginal 1 (OM1)
      [
        [0.48, 0.26, 0.02],
        [0.62, 0.12, 0.05],
        [0.70, -0.08, 0.02],
      ],
      // Obtuse Marginal 2 (OM2)
      [
        [0.58, -0.02, -0.36],
        [0.66, -0.12, -0.32],
        [0.68, -0.28, -0.35],
      ],
    ],
    radius: 0.054,
    taper: 0.65,
  },
  RCA: {
    // Right Atrioventricular Sulcus down the acute margin to posterior crux
    main: [
      [-0.16, 0.42, 0.36],
      [-0.30, 0.34, 0.44],
      [-0.45, 0.20, 0.52],
      [-0.54, 0.02, 0.54],
      [-0.56, -0.18, 0.48],
      [-0.48, -0.38, 0.34],
      [-0.32, -0.52, 0.14],
    ],
    branches: [
      // Conus / SA Nodal Branch
      [
        [-0.30, 0.34, 0.44],
        [-0.20, 0.36, 0.54],
        [-0.08, 0.34, 0.58],
      ],
      // Acute Marginal Branch (AM)
      [
        [-0.56, -0.18, 0.48],
        [-0.46, -0.28, 0.60],
        [-0.32, -0.42, 0.64],
      ],
      // Posterior Descending Artery (PDA)
      [
        [-0.32, -0.52, 0.14],
        [-0.18, -0.58, 0.22],
        [-0.04, -0.62, 0.32],
      ],
    ],
    radius: 0.056,
    taper: 0.65,
  },
};
