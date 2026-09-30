import React from 'react';
import { GlassPanel } from '../common/GlassPanel';
import { SamplePatientSelector } from './SamplePatientSelector';
import { DynamicPatientForm } from './DynamicPatientForm';
import { UserPlus } from 'lucide-react';

export const PatientRail: React.FC = () => {
  return (
    <aside className="w-full lg:w-[340px] xl:w-[370px] flex flex-col gap-3 shrink-0 overflow-y-auto max-h-[calc(100vh-8.2rem)] pr-1">
      {/* Pinned Top Card: Sample Patient Loader */}
      <GlassPanel variant="command" className="space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 flex items-center gap-1.5 font-bold">
            <UserPlus className="w-3.5 h-3.5" /> Zone 1 · Patient Input
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-300 border border-teal-500/20">
            Req 1
          </span>
        </div>

        {/* Load Sample Patient Component */}
        <SamplePatientSelector />
      </GlassPanel>

      {/* Dynamic 55-Feature Form */}
      <GlassPanel variant="default" className="space-y-3 flex-1">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider font-semibold">
            Clinical Feature Vector
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            55 parameters
          </span>
        </div>

        <DynamicPatientForm />
      </GlassPanel>
    </aside>
  );
};

export default PatientRail;
