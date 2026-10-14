import React from 'react';
import { GlassPanel } from '../common/GlassPanel';
import { SamplePatientSelector } from '../patient/SamplePatientSelector';
import { DynamicPatientForm } from '../patient/DynamicPatientForm';
import { WhatIfPanel } from '../whatif/WhatIfPanel';
import { UserPlus, Sparkles, FileText } from 'lucide-react';

export const PatientInputSection: React.FC = () => {
  return (
    <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 overflow-y-auto max-h-[calc(100vh-8.5rem)] pr-1">
      {/* Left Column (5 Cols): Patient Profile Loader & What-If Digital Twin */}
      <div className="lg:col-span-5 space-y-4">
        {/* Sample Patient Loader */}
        <GlassPanel variant="command" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 flex items-center gap-1.5 font-bold">
              <UserPlus className="w-4 h-4" /> 1. Select Patient Profile
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-900/40 text-teal-300 border border-teal-500/20 font-semibold">
              8 Cohort Profiles
            </span>
          </div>
          <SamplePatientSelector />
        </GlassPanel>

        {/* What-If Live Simulator Workbench */}
        <GlassPanel variant="default" className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-300 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-teal-400" /> 2. What-If Digital Twin Simulator
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Modifiable Risk Factors
            </span>
          </div>
          <WhatIfPanel />
        </GlassPanel>
      </div>

      {/* Right Column (7 Cols): Comprehensive 55-Parameter Clinical Feature Vector */}
      <div className="lg:col-span-7 space-y-4">
        <GlassPanel variant="default" className="space-y-3 h-full flex flex-col">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-mono uppercase text-slate-200 tracking-wider font-bold">
                3. Full Clinical Feature Vector
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
              55 Parameters · Categorized
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Complete multi-modal input vector encompassing demographics, cardiovascular symptoms, 12-lead ECG findings, laboratory blood panels, and echocardiographic function.
          </p>

          <div className="flex-1">
            <DynamicPatientForm />
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
