import React from 'react';
import { GlassPanel } from '../common/GlassPanel';
import { useAppStore } from '../../store/useAppStore';
import { OverallCadCard } from './OverallCadCard';
import { VesselCardsList } from './VesselCardsList';
import { CoronaryTreeSchematic } from '../common/CoronaryTreeSchematic';
import { CohortContextView } from './CohortContextView';
import { ShapWaterfallChart } from './ShapWaterfallChart';
import { PhysiologyTable } from './PhysiologyTable';
import { BrandedEmptyState } from '../common/BrandedEmptyState';
import { staggerContainer, fadeSlideUp } from '../../tokens/motion';
import {
  ShieldCheck,
  Database,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ClinicalDashboard: React.FC = () => {
  const {
    patient,
    predictions,
    loadSample,
    patients,
    currentPatientId,
  } = useAppStore();

  // Empty State: No patient loaded yet
  if (!patient && !predictions) {
    return (
      <aside className="w-full lg:w-[380px] xl:w-[410px] flex flex-col gap-4 shrink-0 overflow-y-auto max-h-[calc(100vh-8.2rem)] pl-1">
        <BrandedEmptyState
          type="no-patient"
          title="No Patient Profile Loaded"
          description="Load a cohort patient or enter clinical parameters in the left panel to calculate multi-vessel CAD risk and localized SHAP explanations."
          primaryActionLabel="Load Patient #101"
          onPrimaryAction={() => patients.length > 0 && loadSample(patients[0].id)}
          icon={<Database className="w-7 h-7 text-teal-400" />}
        />
      </aside>
    );
  }

  return (
    <motion.aside
      key={`dashboard-patient-${currentPatientId ?? 'custom'}`}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="w-full lg:w-[380px] xl:w-[410px] flex flex-col gap-3 shrink-0 overflow-y-auto max-h-[calc(100vh-8.2rem)] pl-1"
    >
      {/* 1. Overall CAD Risk Status Card */}
      <motion.div variants={fadeSlideUp}>
        <OverallCadCard />
      </motion.div>

      {/* 2. 2D Coronary Tree Cath-Lab Map */}
      <motion.div variants={fadeSlideUp}>
        <CoronaryTreeSchematic showTitle={true} />
      </motion.div>

      {/* 3. Per-Vessel Status Cards (LAD / LCX / RCA) */}
      <motion.div variants={fadeSlideUp}>
        <GlassPanel variant="default" className="space-y-3">
          <VesselCardsList />
        </GlassPanel>
      </motion.div>

      {/* 3. Localized SHAP Explanation & Diverging Bar Chart */}
      <motion.div variants={fadeSlideUp}>
        <GlassPanel variant="default" className="space-y-3">
          <ShapWaterfallChart />
        </GlassPanel>
      </motion.div>

      {/* 4. Cohort Context & Population Distribution Benchmarks */}
      <motion.div variants={fadeSlideUp}>
        <CohortContextView showTitle={true} />
      </motion.div>

      {/* 5. Physiological Biomarker Breakdown */}
      <motion.div variants={fadeSlideUp}>
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
      </motion.div>
    </motion.aside>
  );
};

export default ClinicalDashboard;
