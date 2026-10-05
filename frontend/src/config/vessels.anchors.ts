/**
 * Coronary Vessel Anchor Points (MODE_B: Surface-Only Tube Routing)
 * Hand-tunable 3D CatmullRom spline control points routing over the myocardial surface.
 */

export interface VesselAnchorConfig {
  main: [number, number, number][];
  branches: [number, number, number][][];
  radius: number;
  taper?: number;
}

export const VESSEL_ANCHORS: Record<'LAD' | 'LCX' | 'RCA', VesselAnchorConfig> = {
  LAD: {
    // Anterior Interventricular Sulcus path
    main: [
      [-0.04, 0.48, 0.38],
      [0.04, 0.34, 0.50],
      [0.08, 0.12, 0.57],
      [0.09, -0.15, 0.58],
      [0.02, -0.42, 0.52],
      [-0.08, -0.68, 0.38],
      [-0.18, -0.88, 0.22],
    ],
    branches: [
      // Diagonal Branch 1 (D1)
      [
        [0.07, 0.18, 0.55],
        [-0.14, 0.05, 0.52],
        [-0.28, -0.15, 0.42],
      ],
      // Diagonal Branch 2 (D2)
      [
        [0.03, -0.32, 0.53],
        [-0.12, -0.48, 0.46],
      ],
    ],
    radius: 0.038,
    taper: 0.65,
  },
  LCX: {
    // Left Atrioventricular (Coronary) Sulcus path around obtuse margin
    main: [
      [-0.12, 0.46, 0.34],
      [-0.32, 0.40, 0.32],
      [-0.52, 0.25, 0.20],
      [-0.64, 0.05, 0.02],
      [-0.60, -0.22, -0.18],
      [-0.44, -0.46, -0.28],
    ],
    branches: [
      // Obtuse Marginal (OM1)
      [
        [-0.45, 0.32, 0.26],
        [-0.52, 0.10, 0.28],
        [-0.54, -0.18, 0.22],
      ],
    ],
    radius: 0.035,
    taper: 0.7,
  },
  RCA: {
    // Right Atrioventricular Sulcus down the acute margin to posterior crux
    main: [
      [0.10, 0.44, 0.35],
      [0.34, 0.38, 0.32],
      [0.52, 0.22, 0.24],
      [0.60, 0.00, 0.12],
      [0.55, -0.25, -0.05],
      [0.38, -0.48, -0.16],
      [0.18, -0.62, -0.22],
    ],
    branches: [
      // Acute Marginal Branch (AM)
      [
        [0.58, 0.08, 0.18],
        [0.52, -0.12, 0.30],
        [0.38, -0.35, 0.34],
      ],
      // Posterior Descending Artery (PDA)
      [
        [0.18, -0.62, -0.22],
        [0.08, -0.72, -0.10],
        [-0.04, -0.80, 0.05],
      ],
    ],
    radius: 0.036,
    taper: 0.65,
  },
};
