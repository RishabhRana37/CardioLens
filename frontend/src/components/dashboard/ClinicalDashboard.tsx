import React from 'react';
import { GlassPanel } from '../common/GlassPanel';
import { useAppStore } from '../../store/useAppStore';
import { OverallCadCard } from './OverallCadCard';
import { VesselCardsList } from './VesselCardsList';
import { ShapWaterfallChart } from './ShapWaterfallChart';
import { PhysiologyTable } from './PhysiologyTable';
import {
  Activity,
  ShieldCheck,
  Database,
} from 'lucide-react';

export const ClinicalDashboard: React.FC = () => {
  const {
    patient,
    predictions,
    loadSample,
    patients,
  } = useAppStore();

  // Empty State: No patient loaded yet
  if (!patient && !predictions) {
    return (
      <aside className="w-full lg:w-[380px] xl:w-[410px] flex flex-col gap-4 shrink-0 overflow-y-auto max-h-[calc(100vh-8.2rem)] pl-1">
        <GlassPanel variant="command" className="p-6 text-center space-y-4 my-auto">
          <div className="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto shadow-glow-teal">
            <Activity className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-100">No Patient Loaded</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Load a sample cohort patient or enter clinical parameters in the left panel to calculate CAD probabilities and localized SHAP explanations.
            </p>
          </div>

          <button
            onClick={() => patients.length > 0 && loadSample(patients[0].id)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-semibold text-xs shadow-glow-teal inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Load Sample Patient #101</span>
          </button>
        </GlassPanel>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[380px] xl:w-[410px] flex flex-col gap-3 shrink-0 overflow-y-auto max-h-[calc(100vh-8.2rem)] pl-1">
      {/* 1. Overall CAD Risk Status Card */}
      <OverallCadCard />

      {/* 2. Per-Vessel Status Cards (LAD / LCX / RCA) */}
      <GlassPanel variant="default" className="space-y-3">
        <VesselCardsList />
      </GlassPanel>

      {/* 3. Localized SHAP Explanation & Diverging Bar Chart */}
      <GlassPanel variant="default" className="space-y-3">
        <ShapWaterfallChart />
      </GlassPanel>

      {/* 4. Physiological Biomarker Breakdown */}
      <GlassPanel variant="default" className="space-y-3">
        <PhysiologyTable />

        {/* Model Trust Footnote */}
        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-teal-300 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Stratified 10-Fold CV Validated
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Leakage-Safe
          </span>
        </div>
      </GlassPanel>
    </aside>
  );
};

export default ClinicalDashboard;
