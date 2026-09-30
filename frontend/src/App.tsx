import React, { useEffect, useState } from 'react';
import { GlassPanel } from './components/common/GlassPanel';
import { api, isMockActive } from './api';
import { HealthResponse, FeatureSchema, SamplePatientSummary, Target } from './api/types';
import { TOKENS, getRiskColor } from './tokens';
import {
  Activity,
  Heart,
  ShieldAlert,
  Server,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [schema, setSchema] = useState<FeatureSchema | null>(null);
  const [patients, setPatients] = useState<SamplePatientSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadFoundationData() {
      try {
        setLoading(true);
        const [healthRes, schemaRes, patientsRes] = await Promise.all([
          api.getHealth(),
          api.getSchema(),
          api.getPatients(),
        ]);
        setHealth(healthRes);
        setSchema(schemaRes);
        setPatients(patientsRes);
      } catch (err) {
        console.error('Foundation boot error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFoundationData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100 selection:bg-accent/30 selection:text-teal-200">
      {/* Top Clinical Header Bar */}
      <header className="sticky top-0 z-50 border-b border-glass-border bg-background/90 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand Logotype */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-glow-teal border border-teal-400/30">
              <Heart className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-teal-300 bg-clip-text text-transparent">
                  CardioTwin
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800/60 tracking-wider">
                  v1.0 MVP
                </span>
              </div>
              <p className="text-xs text-slate-400">Explainable Cardiac Digital Twin</p>
            </div>
          </div>

          {/* System Status Chips */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Systems Nominal Chip */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/40 border border-teal-500/30 text-teal-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className={loading ? "animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" : "animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"}></span>
                <span className={loading ? "relative inline-flex rounded-full h-2 w-2 bg-amber-500" : "relative inline-flex rounded-full h-2 w-2 bg-teal-500"}></span>
              </span>
              <span className="font-medium tracking-wide">
                {loading ? 'Initializing Engine...' : 'Systems Nominal'}
              </span>
            </div>

            {/* API Mode Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300 font-mono text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span>API: {isMockActive ? 'Mock Engine' : 'Live Backend'}</span>
            </div>
          </div>
        </div>

        {/* Mandatory Top Clinical Disclaimer Banner (Req 5) */}
        <div className="max-w-7xl mx-auto mt-2.5 px-3 py-1.5 rounded-lg bg-amber-950/30 border border-amber-500/25 flex items-center gap-2 text-amber-200/90 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="leading-tight">
            <strong>Clinical Safety Disclaimer:</strong> CardioTwin is an educational and decision-support prototype. Predictions are not a formal medical diagnosis.
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Welcome Hero / Foundation Status */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono tracking-wider uppercase">
            <Activity className="w-4 h-4" />
            <span>Foundational Core Initialized</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-50">
            Cardiovascular Digital Twin Console
          </h1>
          <p className="text-slate-400 max-w-3xl leading-relaxed text-sm sm:text-base">
            Foundation and architecture initialized strictly per <code className="text-teal-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-white/10">PRD_Frontend.md</code> and <code className="text-teal-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-white/10">PRD_Master.md</code>. Featuring mock-first API contracts, clinical glassmorphic surfaces, and continuous risk gradients.
          </p>
        </section>

        {/* Diagnostic Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: API Layer & Health */}
          <GlassPanel variant="command" className="flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-teal-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> API Contract
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-teal-900/50 text-teal-300 border border-teal-500/30">
                  READY
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100">Unified CardioApi Layer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mock-first typed contract with instant data generation for schema, predictions, SHAP watermarks, and model metrics.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Engine Status:</span>
              <span className="text-teal-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {health?.status.toUpperCase() || 'CONNECTING'}
              </span>
            </div>
          </GlassPanel>

          {/* Card 2: Z-Alizadeh Sani Schema Engine */}
          <GlassPanel variant="default" className="flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Clinical Schema
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-white/10">
                  {schema?.total_features || 55} Features
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100">Z-Alizadeh Sani Extension</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                4 clinical categories (Demographic, Symptom & Exam, ECG, Lab/Echo). Leakage-free target exclusion enforced.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Sample Cohort:</span>
              <span className="text-slate-200">{patients.length} Pre-loaded Patients</span>
            </div>
          </GlassPanel>

          {/* Card 3: 3D Anatomical Mapping Enums */}
          <GlassPanel variant="default" className="flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Anatomical Enums
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-white/10">
                  NFR3 / TC3
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100">Coronary Tree Targets</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Shared canonical targets: <strong className="text-slate-200">CAD · LAD · LCX · RCA</strong> mapped seamlessly across model keys and 3D nodes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5">
              {(TOKENS.targets as readonly Target[]).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/90 text-teal-300 border border-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Design System & Reserved Risk Palette Preview */}
        <GlassPanel variant="elevated" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                Reserved Risk Gradient & Token Architecture
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Continuous risk color mapping strictly reserved for clinical stenosis & CAD probability visualization.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 self-start sm:self-auto border border-white/10">
              Inter · Tabular Nums
            </span>
          </div>

          {/* Risk Color Gradient Spectrum */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="text-risk-low flex items-center gap-1 font-semibold">
                ● 0.00 Low Risk (Green #16a34a)
              </span>
              <span className="text-risk-moderate flex items-center gap-1 font-semibold">
                ● 0.50 Moderate Risk (Amber #f59e0b)
              </span>
              <span className="text-risk-high flex items-center gap-1 font-semibold">
                ● 1.00 Stenotic / High Risk (Red #dc2626)
              </span>
            </div>
            <div className="h-4 rounded-full bg-gradient-to-r from-risk-low via-risk-moderate to-risk-high shadow-inner border border-white/10" />
          </div>

          {/* Sample Interpolation Points */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[0.12, 0.42, 0.68, 0.89].map((prob) => {
              const color = getRiskColor(prob);
              return (
                <div
                  key={prob}
                  className="p-3 rounded-lg bg-slate-950/70 border border-white/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">Prob:</span>
                    <span className="font-mono font-bold text-sm tabular-nums text-slate-100">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      {color}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </main>

      {/* Persistent Clinical Disclaimer Footer (Req 5) */}
      <footer className="border-t border-glass-border bg-background/95 py-4 px-4 lg:px-8 text-center text-xs text-slate-400 space-y-1">
        <p>
          CardioTwin · Built for the Multimodal AI Hackathon 2026 (Track A: Cardiovascular Risk Visualization)
        </p>
        <p className="text-slate-400 text-[11px]">
          Dataset Credit: Extension of Z-Alizadeh Sani (UCI / Kaggle) · Anatomical Mesh: BodyParts3D / Open-source Biomedical Assets
        </p>
      </footer>
    </div>
  );
};

export default App;
