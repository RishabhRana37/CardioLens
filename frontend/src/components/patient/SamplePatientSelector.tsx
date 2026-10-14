import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Database,
  Shuffle,
  ShieldCheck,
} from 'lucide-react';

export const SamplePatientSelector: React.FC = () => {
  const {
    patients,
    currentPatientId,
    loadSample,
    isPredicting,
    status,
  } = useAppStore();

  // Find active patient summary object to retrieve ground truth dataset labels
  const activePatientObj = patients.find((p) => p.id === currentPatientId);

  const handleRandomSample = () => {
    if (patients.length === 0) return;
    const available = patients.filter((p) => p.id !== currentPatientId);
    const pick = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : patients[0];
    loadSample(pick.id);
  };

  return (
    <div className="space-y-3">
      {/* Header with Title & Quick Shuffle */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="sample-patient-select"
          className="text-xs font-mono uppercase tracking-wider text-teal-400 flex items-center gap-1.5 font-semibold"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Load Sample Patient</span>
        </label>

        <button
          onClick={handleRandomSample}
          title="Load a random cohort patient"
          className="text-[11px] font-mono text-slate-400 hover:text-teal-300 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 border border-white/10 hover:border-teal-500/30 transition-all"
        >
          <Shuffle className="w-3 h-3 text-teal-400" />
          <span>Random</span>
        </button>
      </div>

      {/* Prominent Custom Dropdown */}
      <div className="relative">
        <select
          id="sample-patient-select"
          value={currentPatientId || ''}
          onChange={(e) => loadSample(Number(e.target.value))}
          disabled={status === 'loading' || isPredicting}
          className="w-full bg-slate-900/95 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-medium shadow-inner focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition-all cursor-pointer disabled:opacity-50"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200 py-1">
              {p.summary}
            </option>
          ))}
        </select>
      </div>

      {/* Dataset Reference Ground-Truth Badge (Clearly Marked as Reference Only) */}
      {activePatientObj && (
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-teal-500/20 space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                Dataset Reference:
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  activePatientObj.actual_cad === 'CAD'
                    ? 'bg-red-950/80 text-red-300 border border-red-800/50'
                    : 'bg-green-950/80 text-green-300 border border-green-800/50'
                }`}
              >
                Cath: {activePatientObj.actual_cad}
              </span>
            </div>

            {/* Per-Vessel Ground Truth Reference Badges */}
            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
              {activePatientObj.actual_lad && (
                <span title={`LAD Cath: ${activePatientObj.actual_lad}`}>
                  LAD:{activePatientObj.actual_lad === 'Stenotic' ? '🔴' : '🟢'}
                </span>
              )}
              {activePatientObj.actual_lcx && (
                <span title={`LCX Cath: ${activePatientObj.actual_lcx}`}>
                  LCX:{activePatientObj.actual_lcx === 'Stenotic' ? '🔴' : '🟢'}
                </span>
              )}
              {activePatientObj.actual_rca && (
                <span title={`RCA Cath: ${activePatientObj.actual_rca}`}>
                  RCA:{activePatientObj.actual_rca === 'Stenotic' ? '🔴' : '🟢'}
                </span>
              )}
            </div>
          </div>

          <p className="text-[9px] text-slate-400 italic flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-400 shrink-0" />
            <span>Cath labels excluded from inputs (zero target leakage).</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SamplePatientSelector;
