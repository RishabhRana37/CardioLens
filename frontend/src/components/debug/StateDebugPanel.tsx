import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TARGET_LIST } from '../../config/vessels.config';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sliders,
  BarChart2,
  Users,
} from 'lucide-react';

export const StateDebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeSubtab, setActiveSubtab] = useState<'predictions' | 'shap' | 'features' | 'patients'>('predictions');

  const {
    patient,
    baseline,
    patients,
    patientSummary,
    predictions,
    explanation,
    selectedVessel,
    status,
    isPredicting,
    loadSample,
    setFeature,
    selectVessel,
    resetWhatIf,
    colorFor,
  } = useAppStore();

  return (
    <div className="fixed bottom-10 right-4 z-40 max-w-md w-full transition-all">
      <div className="rounded-xl bg-slate-950/95 border border-teal-500/30 shadow-2xl backdrop-blur-xl overflow-hidden text-xs">
        {/* Header Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3.5 py-2.5 bg-slate-900/90 flex items-center justify-between cursor-pointer border-b border-white/10 hover:bg-slate-800/80 transition-colors"
        >
          <div className="flex items-center gap-2 text-teal-400 font-mono font-medium">
            <Terminal className="w-4 h-4" />
            <span>Client State & Mock Engine Debugger</span>
            {isPredicting && (
              <span className="flex items-center gap-1 text-[10px] text-amber-300 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Predicting...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/50">
              {status}
            </span>
            <button
              aria-label="Toggle debug drawer"
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Body */}
        {isExpanded && (
          <div className="p-3.5 space-y-3 max-h-[480px] overflow-y-auto">
            {/* Quick Interactive Test Controls */}
            <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                ⚡ Interactive Data Flow Tester
              </span>

              {/* Sample Patient Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                  <Users className="w-3 h-3 text-teal-400" /> Patient:
                </span>
                {patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadSample(p.id)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-slate-200 hover:text-white font-mono text-[10px] transition-colors border border-white/10"
                  >
                    #{p.id}
                  </button>
                ))}
              </div>

              {/* Quick Feature Modifiers */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                  <Sliders className="w-3 h-3 text-amber-400" /> What-If:
                </span>
                <button
                  onClick={() => setFeature('LDL', Number(patient?.LDL || 150) + 25)}
                  className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 font-mono text-[10px] border border-amber-700/40"
                >
                  +25 LDL
                </button>
                <button
                  onClick={() => setFeature('LDL', Math.max(70, Number(patient?.LDL || 150) - 25))}
                  className="px-2 py-0.5 rounded bg-green-950/60 hover:bg-green-900 text-green-300 font-mono text-[10px] border border-green-700/40"
                >
                  -25 LDL
                </button>
                <button
                  onClick={() => setFeature('BP', Number(patient?.BP || 135) + 20)}
                  className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 font-mono text-[10px] border border-amber-700/40"
                >
                  +20 BP
                </button>
                <button
                  onClick={() =>
                    setFeature('Typical Chest Pain', Number(patient?.['Typical Chest Pain'] || 0) === 1 ? 0 : 1)
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[10px] border border-white/10"
                >
                  Toggle Chest Pain ({patient?.['Typical Chest Pain'] === 1 ? '1' : '0'})
                </button>
                <button
                  onClick={resetWhatIf}
                  className="px-2 py-0.5 rounded bg-teal-950/80 hover:bg-teal-900 text-teal-300 font-mono text-[10px] border border-teal-700/50 ml-auto"
                >
                  Reset What-If
                </button>
              </div>

              {/* Vessel Selector Buttons */}
              <div className="flex items-center gap-1.5 pt-1.5">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                  <BarChart2 className="w-3 h-3 text-teal-400" /> Vessel:
                </span>
                <button
                  onClick={() => selectVessel(null)}
                  className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                    selectedVessel === null
                      ? 'bg-teal-600 text-slate-950 font-bold border-teal-400'
                      : 'bg-slate-800 text-slate-300 border-white/10'
                  }`}
                >
                  Whole Heart
                </button>
                {TARGET_LIST.filter((t) => t !== 'CAD').map((t) => (
                  <button
                    key={t}
                    onClick={() => selectVessel(t)}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                      selectedVessel === t
                        ? 'bg-teal-600 text-slate-950 font-bold border-teal-400'
                        : 'bg-slate-800 text-slate-300 border-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtabs for Inspection */}
            <div className="flex border-b border-white/10 gap-2 text-[11px]">
              {(['predictions', 'shap', 'features'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubtab(tab)}
                  className={`pb-1 uppercase font-mono transition-colors ${
                    activeSubtab === tab
                      ? 'text-teal-400 border-b-2 border-teal-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Subtab Content: Predictions */}
            {activeSubtab === 'predictions' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {TARGET_LIST.map((target) => {
                    const pred = predictions?.[target];
                    const hexColor = colorFor(target);
                    return (
                      <div
                        key={target}
                        className="p-2 rounded bg-slate-900 border border-white/10 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 font-mono">{target}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: hexColor }}
                          />
                        </div>
                        <div className="flex items-baseline justify-between text-[11px] font-mono">
                          <span className="text-slate-400">{pred?.label || '---'}</span>
                          <span className="font-bold text-slate-100">
                            {pred ? `${(pred.probability * 100).toFixed(1)}%` : '---'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                          <span>Conf:</span>
                          <span>{pred ? `${(pred.confidence * 100).toFixed(0)}%` : '---'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-teal-300/90 overflow-x-auto border border-white/5">
                  {JSON.stringify(predictions, null, 2)}
                </pre>
              </div>
            )}

            {/* Subtab Content: SHAP Explanation */}
            {activeSubtab === 'shap' && (
              <div className="space-y-2">
                <div className="p-2 rounded bg-slate-900 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-teal-400 font-bold">
                      Target: {explanation?.target || 'CAD'}
                    </span>
                    <span className="text-slate-400">
                      Base: {explanation ? `${(explanation.base_value * 100).toFixed(0)}%` : '---'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic">
                    {explanation?.narrative || 'No explanation computed yet.'}
                  </p>
                </div>

                <div className="space-y-1">
                  {explanation?.contributions.map((c, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded bg-slate-900/80 border border-white/5 flex items-center justify-between text-[10px] font-mono"
                    >
                      <span className="text-slate-300 truncate max-w-[180px]">{c.feature}</span>
                      <span
                        className={
                          c.direction === 'increases' ? 'text-red-400 font-bold' : 'text-green-400 font-bold'
                        }
                      >
                        {c.shap > 0 ? `+${c.shap}` : c.shap}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtab Content: Active Features */}
            {activeSubtab === 'features' && (
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-mono mb-1">
                  Active Patient: {patientSummary || 'None'}
                </div>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto font-mono text-[10px]">
                  {patient &&
                    Object.entries(patient).map(([k, v]) => {
                      const baselineVal = baseline?.[k];
                      const isModified = baselineVal !== undefined && baselineVal !== v;
                      return (
                        <div
                          key={k}
                          className={`p-1 rounded flex justify-between border ${
                            isModified
                              ? 'bg-amber-950/50 border-amber-500/30 text-amber-200'
                              : 'bg-slate-900/60 border-white/5 text-slate-300'
                          }`}
                        >
                          <span className="truncate max-w-[110px]">{k}:</span>
                          <span className="font-bold">{String(v)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StateDebugPanel;
