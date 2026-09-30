import React from 'react';
import { GlassPanel } from '../common/GlassPanel';
import { Sliders, UserPlus, Database } from 'lucide-react';

export const PatientRailPlaceholder: React.FC = () => {
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
        <h2 className="text-base font-semibold text-slate-100">Patient Data & Controls</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Dynamic input schema for 55 clinical parameters across 4 categories, with instant sample patient loading.
        </p>

        {/* Quick Placeholder Actions */}
        <div className="space-y-2 pt-1">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              Load Sample Patient
            </span>
            <span className="text-[10px] font-mono text-slate-400">4 ready</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              What-If Digital Twin Sliders
            </span>
            <span className="text-[10px] font-mono text-amber-300">Live &lt;400ms</span>
          </div>
        </div>
      </GlassPanel>

      {/* Accordion Categories Placeholder */}
      <GlassPanel variant="default" className="space-y-3 flex-1">
        <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
          Schema Feature Groups
        </h3>
        <div className="space-y-2">
          {['Demographic (17 vars)', 'Symptom & Exam (14 vars)', 'ECG Indices (7 vars)', 'Lab & Echo (17 vars)'].map(
            (group, idx) => (
              <div
                key={group}
                className="p-2.5 rounded-lg bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs text-slate-300 hover:border-teal-500/20 transition-colors"
              >
                <span>{group}</span>
                <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
              </div>
            )
          )}
        </div>
      </GlassPanel>
    </aside>
  );
};

export default PatientRailPlaceholder;
