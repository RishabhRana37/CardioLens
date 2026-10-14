/**
 * Risk Color Palette & Gradient Interpolator
 * Reserved strictly for clinical risk probabilities (0.00 - 1.00).
 *
 * Low Risk (0.00 - 0.33):   Green #16a34a (rgb(22, 163, 74))
 * Moderate Risk (0.34 - 0.66): Amber #f59e0b (rgb(245, 158, 11))
 * High Risk / Stenotic (0.67 - 1.00): Red #dc2626 (rgb(220, 38, 38))
 */

export interface RgbColor {
  r: number; // 0.0 - 1.0 (Three.js format)
  g: number; // 0.0 - 1.0
  b: number; // 0.0 - 1.0
}

export interface Rgb255 {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

/**
 * Smooth Hermite interpolation helper (C1 continuous)
 */
function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * Computes continuous RGB [0..255] interpolation across green -> amber -> red
 * Low (<=0.28):  Green #16a34a (rgb(22, 163, 74)) - 23% LCX reads clearly green
 * Mid (~0.50):   Amber #f59e0b (rgb(245, 158, 11))
 * High (>=0.72): Red   #dc2626 (rgb(220, 38, 38)) - 94% LAD reads hot red
 */
function interpolateRiskRgb(probability: number): Rgb255 {
  const p = isNaN(probability) ? 0 : Math.max(0, Math.min(1, probability));
  const green: Rgb255 = { r: 22, g: 163, b: 74 };   // #16a34a
  const amber: Rgb255 = { r: 245, g: 158, b: 11 };  // #f59e0b
  const red: Rgb255 = { r: 220, g: 38, b: 38 };     // #dc2626

  if (p <= 0.28) {
    return green;
  } else if (p <= 0.52) {
    const t = smoothstep(0.28, 0.52, p);
    return {
      r: Math.round(green.r + (amber.r - green.r) * t),
      g: Math.round(green.g + (amber.g - green.g) * t),
      b: Math.round(green.b + (amber.b - green.b) * t),
    };
  } else if (p <= 0.72) {
    const t = smoothstep(0.52, 0.72, p);
    return {
      r: Math.round(amber.r + (red.r - amber.r) * t),
      g: Math.round(amber.g + (red.g - amber.g) * t),
      b: Math.round(amber.b + (red.b - amber.b) * t),
    };
  } else {
    return red;
  }
}

/**
 * Converts RGB [0..255] to Hex string (#RRGGBB)
 */
function rgbToHex({ r, g, b }: Rgb255): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Pure function: Maps probability [0.0, 1.0] -> Hex string
 * e.g., riskGradient(0.0) => "#16a34a", riskGradient(0.5) => "#f59e0b", riskGradient(1.0) => "#dc2626"
 */
export function riskGradient(probability: number): string {
  const rgb = interpolateRiskRgb(probability);
  return rgbToHex(rgb);
}

/**
 * Pure function: Maps probability [0.0, 1.0] -> Three.js friendly RGB object [0.0 - 1.0]
 */
export function riskColor3(probability: number): RgbColor {
  const { r, g, b } = interpolateRiskRgb(probability);
  return {
    r: Number((r / 255).toFixed(4)),
    g: Number((g / 255).toFixed(4)),
    b: Number((b / 255).toFixed(4)),
  };
}

/**
 * Returns formatted rgb(r, g, b) string for CSS
 */
export function riskRgbString(probability: number): string {
  const { r, g, b } = interpolateRiskRgb(probability);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Categorizes risk level with clinical labels and badge styling
 */
export function getRiskTier(probability: number): {
  tier: 'low' | 'moderate' | 'high';
  label: string;
  badgeClass: string;
  colorHex: string;
} {
  const p = isNaN(probability) ? 0 : Math.max(0, Math.min(1, probability));
  const colorHex = riskGradient(p);

  if (p < 0.34) {
    return {
      tier: 'low',
      label: 'Low Risk / Normal',
      badgeClass: 'bg-green-950/80 text-green-300 border border-green-800/50',
      colorHex,
    };
  }
  if (p < 0.67) {
    return {
      tier: 'moderate',
      label: 'Moderate Risk',
      badgeClass: 'bg-amber-950/80 text-amber-300 border border-amber-800/50',
      colorHex,
    };
  }
  return {
    tier: 'high',
    label: 'High Risk / Stenotic',
    badgeClass: 'bg-red-950/80 text-red-300 border border-red-800/50',
    colorHex,
  };
}
