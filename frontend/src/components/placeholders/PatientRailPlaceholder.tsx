import React from 'react';
import { GlassPanel } from '../common/GlassPanel';
import { useAppStore } from '../../store/useAppStore';
import { Sliders, UserPlus, Database, RotateCcw } from 'lucide-react';

export const PatientRailPlaceholder: React.FC = () => {
  const {
    patients,
    currentPatientId,
    loadSample,
    patient,
    baseline,
    setFeature,
    resetWhatIf,
    isPredicting,
    schema,
  } = useAppStore();

  const isModified = Boolean(
    patient &&
      baseline &&
      Object.keys(patient).some((k) => patient[k] !== baseline[k])
  );

  return (
    <aside className="w-full lg:w-[340px] xl:w-[360px] flex flex-col gap-4 shrink-0 overflow-y-auto max-h-[calc(100vh-8.5rem)] pr-1">
      {/* Patient Input Workflow Header */}
      <GlassPanel variant="command" className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Zone 1 · Patient Input
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-300 border border-teal-500/20">
            Req 1
          </span>
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-100">Patient Data & Controls</h2>
          <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
            Select a sample cohort patient or adjust clinical parameters for What-If digital twin simulation.
          </p>
        </div>

        {/* Sample Patient Selector */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            Load Sample Patient ({patients.length} available)
          </label>
          <select
            value={currentPatientId || ''}
            onChange={(e) => loadSample(Number(e.target.value))}
            className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.summary}
              </option>
            ))}
          </select>
        </div>

        {/* Quick What-If Modifiers Preview */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-amber-300 flex items-center gap-1.5 font-medium">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> What-If Sliders
            </span>
            {isModified && (
              <button
                onClick={resetWhatIf}
                className="text-[10px] font-mono text-teal-300 hover:text-teal-200 flex items-center gap-1 underline"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Key Modifiable Sliders */}
          <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-lg border border-white/5 text-xs">
            {/* BP Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Systolic BP:</span>
                <span className="text-slate-100 font-bold">{patient?.BP || 135} mmHg</span>
              </div>
              <input
                type="range"
                min={90}
                max={200}
                value={Number(patient?.BP || 135)}
                onChange={(e) => setFeature('BP', Number(e.target.value))}
                className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* LDL Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">LDL Cholesterol:</span>
                <span className="text-slate-100 font-bold">{patient?.LDL || 154} mg/dL</span>
              </div>
              <input
                type="range"
                min={40}
                max={260}
                value={Number(patient?.LDL || 154)}
                onChange={(e) => setFeature('LDL', Number(e.target.value))}
                className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Fasting Blood Sugar Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Fasting Glucose (FBS):</span>
                <span className="text-slate-100 font-bold">{patient?.FBS || 112} mg/dL</span>
              </div>
              <input
                type="range"
                min={60}
                max={300}
                value={Number(patient?.FBS || 112)}
                onChange={(e) => setFeature('FBS', Number(e.target.value))}
                className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {isPredicting && (
              <div className="text-[10px] font-mono text-amber-300 text-center animate-pulse pt-1">
                Recalculating digital twin risk &lt;400ms...
              </div>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* Schema Feature Groups Breakdown */}
      <GlassPanel variant="default" className="space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            Clinical Feature Registry
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            {schema?.total_features || 55} total
          </span>
        </div>

        <div className="space-y-2">
          {schema?.groups.map((group) => {
            const count = schema.features.filter((f) => f.group === group).length;
            return (
              <div
                key={group}
                className="p-2.5 rounded-lg bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs text-slate-300 hover:border-teal-500/20 transition-colors"
              >
                <span>{group}</span>
                <span className="text-[10px] font-mono text-teal-400">{count} features</span>
              </div>
            );
          }) || (
            <div className="text-xs text-slate-400">Loading schema...</div>
          )}
        </div>
      </GlassPanel>
    </aside>
  );
};

export default PatientRailPlaceholder;
