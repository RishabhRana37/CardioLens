import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../api';
import { Target, Prediction } from '../../api/types';
import { riskGradient } from '../../three/colorScale';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Calendar,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export type ProjectionScenario = 'improve' | 'worsen';

interface HorizonPoint {
  year: number;
  label: string;
  CAD: number;
  LAD: number;
  LCX: number;
  RCA: number;
  features: Record<string, number | string>;
  predictions: Record<Target, Prediction>;
}

export const ProjectionPanel: React.FC = () => {
  const {
    patient,
    setProjectionPredictions,
    setProjectionMode,
    isProjectionMode,
    setFeature,
  } = useAppStore();

  const [scenario, setScenario] = useState<ProjectionScenario>('improve');
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [horizonData, setHorizonData] = useState<HorizonPoint[]>([]);
  const [isComputing, setIsComputing] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute 0-5 Year Trajectory on patient / scenario change
  useEffect(() => {
    if (!patient) return;

    let isMounted = true;
    setIsComputing(true);

    const computeTrajectory = async () => {
      const points: HorizonPoint[] = [];
      const baseFeatures = { ...patient };

      for (let yr = 0; yr <= 5; yr++) {
        const stepFeatures = { ...baseFeatures };
        const factor = yr / 5; // 0.0 to 1.0 progression

        if (scenario === 'improve') {
          // Improve Scenario Deltas
          // LDL: towards 70 mg/dL
          const baseLdl = Number(baseFeatures.LDL ?? 150);
          stepFeatures.LDL = Math.max(70, Math.round(baseLdl - (baseLdl - 70) * factor));

          // BP: towards 115 mmHg
          const baseBp = Number(baseFeatures.BP ?? 140);
          stepFeatures.BP = Math.max(115, Math.round(baseBp - (baseBp - 115) * factor));

          // TG: towards 120 mg/dL
          const baseTg = Number(baseFeatures.TG ?? 180);
          stepFeatures.TG = Math.max(120, Math.round(baseTg - (baseTg - 120) * factor));

          // HDL: towards 55 mg/dL
          const baseHdl = Number(baseFeatures.HDL ?? 38);
          stepFeatures.HDL = Math.min(55, Math.round(baseHdl + (55 - baseHdl) * factor));

          // FBS: towards 85 mg/dL
          const baseFbs = Number(baseFeatures.FBS ?? 115);
          stepFeatures.FBS = Math.max(85, Math.round(baseFbs - (baseFbs - 85) * factor));

          // Smoking cessation by year 1
          if (yr >= 1 && baseFeatures['Current Smoker']) {
            stepFeatures['Current Smoker'] = 0;
            stepFeatures['Ex-Smoker'] = 1;
          }

          // BMI improvement
          const baseBmi = Number(baseFeatures.BMI ?? 28);
          stepFeatures.BMI = Math.max(22.5, Number((baseBmi - 0.5 * yr).toFixed(1)));
        } else {
          // Worsen Scenario Deltas
          // LDL: progressive escalation (+12 mg/dL / yr)
          const baseLdl = Number(baseFeatures.LDL ?? 150);
          stepFeatures.LDL = Math.min(260, Math.round(baseLdl + 14 * yr));

          // BP: progressive hypertension (+5 mmHg / yr)
          const baseBp = Number(baseFeatures.BP ?? 135);
          stepFeatures.BP = Math.min(185, Math.round(baseBp + 5.5 * yr));

          // TG: escalation (+15 mg/dL / yr)
          const baseTg = Number(baseFeatures.TG ?? 175);
          stepFeatures.TG = Math.min(380, Math.round(baseTg + 18 * yr));

          // HDL: decline (-1.5 mg/dL / yr)
          const baseHdl = Number(baseFeatures.HDL ?? 38);
          stepFeatures.HDL = Math.max(22, Math.round(baseHdl - 1.8 * yr));

          // FBS: diabetic progression (+6 mg/dL / yr)
          const baseFbs = Number(baseFeatures.FBS ?? 110);
          stepFeatures.FBS = Math.min(230, Math.round(baseFbs + 7 * yr));

          // Continued smoking / symptomatic chest pain emergence
          if (yr >= 2) {
            stepFeatures['Typical Chest Pain'] = 1;
          }

          // BMI increase
          const baseBmi = Number(baseFeatures.BMI ?? 27.5);
          stepFeatures.BMI = Math.min(36, Number((baseBmi + 0.6 * yr).toFixed(1)));
        }

        try {
          const res = await api.predict(stepFeatures);
          points.push({
            year: yr,
            label: yr === 0 ? 'Now' : `Yr ${yr}`,
            CAD: Number((res.predictions.CAD?.probability ?? 0.25).toFixed(3)),
            LAD: Number((res.predictions.LAD?.probability ?? 0.2).toFixed(3)),
            LCX: Number((res.predictions.LCX?.probability ?? 0.2).toFixed(3)),
            RCA: Number((res.predictions.RCA?.probability ?? 0.2).toFixed(3)),
            features: stepFeatures,
            predictions: res.predictions,
          });
        } catch (e) {
          console.error('[ProjectionPanel] Step predict error:', e);
        }
      }

      if (isMounted) {
        setHorizonData(points);
        setIsComputing(false);
      }
    };

    computeTrajectory();

    return () => {
      isMounted = false;
    };
  }, [patient, scenario]);

  // Sync active year's predictions to 3D heart scene
  useEffect(() => {
    if (horizonData.length > 0 && selectedYear < horizonData.length) {
      const activePoint = horizonData[selectedYear];
      if (activePoint && activePoint.predictions) {
        setProjectionPredictions(activePoint.predictions);
      }
    }
  }, [selectedYear, horizonData, setProjectionPredictions]);

  // Handle Play/Pause animation timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setSelectedYear((prev) => {
          if (prev >= 5) {
            return 0; // Loop around
          }
          return prev + 1;
        });
      }, 1200);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Cleanup projection mode on unmount
  useEffect(() => {
    return () => {
      setProjectionMode(false);
      setProjectionPredictions(null);
    };
  }, [setProjectionMode, setProjectionPredictions]);

  const currentPoint = horizonData[selectedYear] || horizonData[0];
  const startPoint = horizonData[0];

  const cadDelta = currentPoint && startPoint ? currentPoint.CAD - startPoint.CAD : 0;
  const ladDelta = currentPoint && startPoint ? currentPoint.LAD - startPoint.LAD : 0;
  const rcaDelta = currentPoint && startPoint ? currentPoint.RCA - startPoint.RCA : 0;

  // Apply current projected state as working What-If model
  const handleApplyToWhatIf = () => {
    if (!currentPoint) return;
    Object.entries(currentPoint.features).forEach(([k, v]) => {
      setFeature(k, v);
    });
  };

  if (!patient) {
    return (
      <div className="p-4 text-center text-slate-400 font-mono text-xs">
        Load a patient profile to explore longitudinal model risk projections.
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {/* 1. Header & Mandatory Clinical Caveat Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-mono uppercase text-slate-100 font-bold tracking-wider">
              5-Year Horizon Risk Projection
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isComputing && (
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Evaluating
              </span>
            )}
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                isProjectionMode
                  ? 'bg-teal-950 text-teal-300 border-teal-500/40 shadow-glow-teal animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-white/10'
              }`}
            >
              <Sparkles className="w-3 h-3 text-teal-400" />
              3D Heart Synced
            </span>
          </div>
        </div>

        {/* Regulatory Safety Framing: NOT A PROGNOSIS */}
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] font-mono space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Illustrative projection from the model's learned relationships — not a clinical prognosis.</span>
          </div>
          <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
            Illustrates how the gradient-boosted trees respond to simulated factor trajectories. Not an individualized survival or longitudinal prognosis.
          </p>
        </div>
      </div>

      {/* 2. Scenario Switcher */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
          Select Trend Scenario:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setScenario('improve');
              setSelectedYear(0);
            }}
            className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
              scenario === 'improve'
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-glow-teal ring-1 ring-emerald-400/40'
                : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="text-[11px]">If Factors Improve</div>
              <div className="text-[9px] text-emerald-400 font-normal">Optimal control & cessation</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setScenario('worsen');
              setSelectedYear(0);
            }}
            className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
              scenario === 'worsen'
                ? 'bg-rose-950/80 border-rose-400 text-rose-300 shadow-glow-red ring-1 ring-rose-400/40'
                : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <div className="text-left">
              <div className="text-[11px]">If Factors Worsen</div>
              <div className="text-[9px] text-rose-400 font-normal">Metabolic & BP escalation</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Recharts Longitudinal Risk Trajectory Plot */}
      <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            Projected Risk Probability Curves
          </span>
          <span className="text-[10px] text-slate-400">0 → 5 Years</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={horizonData} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                stroke="#334155"
              />
              <YAxis
                domain={[0, 1]}
                ticks={[0, 0.25, 0.5, 0.75, 1.0]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                stroke="#334155"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-950/95 border border-white/20 text-xs font-mono shadow-2xl backdrop-blur-md space-y-1">
                        <div className="font-bold text-slate-100 border-b border-white/10 pb-1">
                          Horizon: {label}
                        </div>
                        {payload.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between gap-3 text-[11px]">
                            <span style={{ color: entry.color }} className="font-bold">
                              {entry.name}:
                            </span>
                            <span className="tabular-nums text-slate-200 font-semibold">
                              {(Number(entry.value) * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '4px' }}
              />
              {/* Active Year Reference Line Marker */}
              <ReferenceLine
                x={horizonData[selectedYear]?.label || 'Now'}
                stroke="#14b8a6"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="CAD"
                name="CAD Composite"
                stroke="#2dd4bf"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2dd4bf' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="LAD"
                name="LAD"
                stroke="#f43f5e"
                strokeWidth={1.8}
                dot={{ r: 2.5, fill: '#f43f5e' }}
              />
              <Line
                type="monotone"
                dataKey="LCX"
                name="LCX"
                stroke="#fb923c"
                strokeWidth={1.8}
                dot={{ r: 2.5, fill: '#fb923c' }}
              />
              <Line
                type="monotone"
                dataKey="RCA"
                name="RCA"
                stroke="#38bdf8"
                strokeWidth={1.8}
                dot={{ r: 2.5, fill: '#38bdf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Interactive Timeline Slider & Scrubber */}
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Timeline Horizon:</span>
            <span className="font-bold text-teal-300 text-sm">
              {selectedYear === 0 ? 'Now (Baseline)' : `Year ${selectedYear} Forecast`}
            </span>
          </div>

          {/* Play / Pause Animation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                isPlaying
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow-glow-amber'
                  : 'bg-teal-950 text-teal-300 border border-teal-500/40 hover:bg-teal-900'
              }`}
              title={isPlaying ? 'Pause timeline animation' : 'Animate 5-year trajectory on 3D Heart'}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlaying ? 'Pause' : 'Play 3D'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSelectedYear(0);
              }}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-white/10"
              title="Reset Timeline to Now"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={selectedYear}
          onChange={(e) => {
            setIsPlaying(false);
            setSelectedYear(Number(e.target.value));
          }}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
        />

        {/* Segmented Year Quick Buttons */}
        <div className="grid grid-cols-6 gap-1">
          {[0, 1, 2, 3, 4, 5].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSelectedYear(yr);
              }}
              className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                selectedYear === yr
                  ? 'bg-teal-600 text-white shadow-glow-teal'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {yr === 0 ? 'Now' : `Yr ${yr}`}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Live Delta Metrics at Selected Horizon */}
      {currentPoint && (
        <div className="p-3 rounded-2xl bg-slate-950/85 border border-white/10 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-slate-400 text-[10px]">Horizon Status (Yr {selectedYear}):</span>
            <div className="flex items-center gap-1.5">
              {cadDelta <= -0.01 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  CAD Risk {(cadDelta * 100).toFixed(0)}%
                </span>
              ) : cadDelta >= 0.01 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  CAD Risk +{(cadDelta * 100).toFixed(0)}%
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                  Baseline Reference
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold">LAD Artery</span>
              <div className="text-sm font-bold" style={{ color: riskGradient(currentPoint.LAD) }}>
                {(currentPoint.LAD * 100).toFixed(0)}%
              </div>
              <span className={`text-[9px] ${ladDelta < 0 ? 'text-emerald-400' : ladDelta > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {ladDelta < 0 ? `−${Math.abs(ladDelta * 100).toFixed(0)}%` : ladDelta > 0 ? `+${(ladDelta * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold">LCX Artery</span>
              <div className="text-sm font-bold" style={{ color: riskGradient(currentPoint.LCX) }}>
                {(currentPoint.LCX * 100).toFixed(0)}%
              </div>
              <span className="text-[9px] text-slate-400">
                {(currentPoint.LCX * 100).toFixed(0)}%
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold">RCA Artery</span>
              <div className="text-sm font-bold" style={{ color: riskGradient(currentPoint.RCA) }}>
                {(currentPoint.RCA * 100).toFixed(0)}%
              </div>
              <span className={`text-[9px] ${rcaDelta < 0 ? 'text-emerald-400' : rcaDelta > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {rcaDelta < 0 ? `−${Math.abs(rcaDelta * 100).toFixed(0)}%` : rcaDelta > 0 ? `+${(rcaDelta * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Action button: load this horizon point into working What-If */}
          {selectedYear > 0 && (
            <button
              type="button"
              onClick={handleApplyToWhatIf}
              className="w-full py-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-500/40 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 mt-2 shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Load Year {selectedYear} Features into What-If Simulator</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectionPanel;
