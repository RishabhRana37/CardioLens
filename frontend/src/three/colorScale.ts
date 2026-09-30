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
 * Computes continuous RGB [0..255] interpolation across green -> amber -> red
 */
function interpolateRiskRgb(probability: number): Rgb255 {
  const p = isNaN(probability) ? 0 : Math.max(0, Math.min(1, probability));

  if (p <= 0.5) {
    // Lerp from Green (22, 163, 74) to Amber (245, 158, 11)
    const t = p / 0.5;
    return {
      r: Math.round(22 + (245 - 22) * t),
      g: Math.round(163 + (158 - 163) * t),
      b: Math.round(74 + (11 - 74) * t),
    };
  } else {
    // Lerp from Amber (245, 158, 11) to Red (220, 38, 38)
    const t = (p - 0.5) / 0.5;
    return {
      r: Math.round(245 + (220 - 245) * t),
      g: Math.round(158 + (38 - 158) * t),
      b: Math.round(11 + (38 - 11) * t),
    };
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
