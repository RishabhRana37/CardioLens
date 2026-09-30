/**
 * CardioTwin Design System Tokens
 * Source of truth for styling, colors, risk gradients, typography, and motion guidelines.
 */

export const TOKENS = {
  colors: {
    // Neutral Slate Scale for Clinical Chrome
    bg: {
      primary: '#090d16',      // Deepest background for 3D canvas
      secondary: '#0f172a',    // Panel base background
      tertiary: '#1e293b',     // Input & secondary card background
      elevated: '#334155',     // Borders and dividers
    },
    // Reserved Risk Palette (Strictly for Risk Visualization, NEVER for decorative elements)
    risk: {
      low: '#16a34a',          // Green: 0.00 - 0.33 (Normal / Low Risk)
      moderate: '#f59e0b',     // Amber: 0.34 - 0.66 (Borderline / Moderate Risk)
      high: '#dc2626',         // Red:   0.67 - 1.00 (Stenotic / High Risk)
    },
    // Clinical Brand Accent
    accent: {
      light: '#2dd4bf',        // Teal 400
      primary: '#0d9488',      // Teal 600
      dark: '#0f766e',         // Teal 700
      glow: 'rgba(13, 148, 136, 0.25)',
    },
    // Text Hierarchy
    text: {
      primary: '#f8fafc',      // Slate 50
      secondary: '#94a3b8',    // Slate 400
      muted: '#64748b',        // Slate 500
      accent: '#2dd4bf',       // Teal 400
    },
    // Glass Surface Tokens
    glass: {
      bg: 'rgba(15, 23, 42, 0.75)',
      bgDeep: 'rgba(9, 13, 22, 0.85)',
      bgSubtle: 'rgba(255, 255, 255, 0.03)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.16)',
    },
  },

  // Typography Settings
  typography: {
    fontSans: 'Inter, system-ui, -apple-system, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    tabularNums: 'font-variant-numeric: tabular-nums',
  },

  // Motion Guidelines
  motion: {
    durationFast: '150ms',
    durationNormal: '300ms',
    durationSlow: '500ms',
    easeClinical: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // Target Anatomical Enums (TC3 / NFR3 single source of truth)
  targets: ['CAD', 'LAD', 'LCX', 'RCA'] as const,
} as const;

/**
 * Continuous Risk Color Interpolator
 * Maps probability [0.0, 1.0] continuously:
 * 0.00 -> Green (#16a34a)
 * 0.50 -> Amber (#f59e0b)
 * 1.00 -> Red   (#dc2626)
 */
export function getRiskColor(probability: number): string {
  const p = Math.max(0, Math.min(1, probability));
  if (p < 0.5) {
    // Lerp Green (#16a34a -> rgb(22, 163, 74)) to Amber (#f59e0b -> rgb(245, 158, 11))
    const factor = p / 0.5;
    const r = Math.round(22 + (245 - 22) * factor);
    const g = Math.round(163 + (158 - 163) * factor);
    const b = Math.round(74 + (11 - 74) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Lerp Amber (#f59e0b -> rgb(245, 158, 11)) to Red (#dc2626 -> rgb(220, 38, 38))
    const factor = (p - 0.5) / 0.5;
    const r = Math.round(245 + (220 - 245) * factor);
    const g = Math.round(158 + (38 - 158) * factor);
    const b = Math.round(11 + (38 - 11) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Returns human-readable risk category tag
 */
export function getRiskCategory(probability: number): { label: string; colorClass: string } {
  if (probability < 0.34) {
    return { label: 'Low Risk / Normal', colorClass: 'text-risk-low' };
  }
  if (probability < 0.67) {
    return { label: 'Moderate Risk', colorClass: 'text-risk-moderate' };
  }
  return { label: 'High Risk / Stenotic', colorClass: 'text-risk-high' };
}
