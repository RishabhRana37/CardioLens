/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Clinical Command Center Base
        background: {
          DEFAULT: '#090d16',
          secondary: '#0f172a',
          tertiary: '#1e293b',
        },
        // Reserved Risk Palette (Strictly for Risk Visualization)
        risk: {
          low: '#16a34a',       // Green: 0.00 - 0.33
          moderate: '#f59e0b',  // Amber: 0.34 - 0.66
          high: '#dc2626',      // Red:   0.67 - 1.00
        },
        // Brand & Clinical Accent
        accent: {
          light: '#2dd4bf',     // Teal 400
          DEFAULT: '#0d9488',   // Teal 600
          dark: '#0f766e',      // Teal 700
          glow: 'rgba(13, 148, 136, 0.25)',
        },
        // Glass Panel Borders & Hairlines
        glass: {
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.16)',
          bg: 'rgba(15, 23, 42, 0.75)',
          'bg-deep': 'rgba(9, 13, 22, 0.85)',
          'bg-subtle': 'rgba(255, 255, 255, 0.03)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.4)',
        'glass-md': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glass-lg': '0 12px 48px 0 rgba(0, 0, 0, 0.55)',
        'glow-teal': '0 0 20px -3px rgba(13, 148, 136, 0.35)',
        'glow-red': '0 0 20px -3px rgba(220, 38, 38, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
      },
      transitionTimingFunction: {
        'clinical-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
