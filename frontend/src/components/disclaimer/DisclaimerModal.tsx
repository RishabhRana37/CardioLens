import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Check, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const DisclaimerModal: React.FC = () => {
  const { isDisclaimerModalOpen, disclaimerAcknowledged, closeDisclaimerModal, setDisclaimerAcknowledged } =
    useAppStore();

  // Show modal if user opened it explicitly OR if first-time load (unacknowledged)
  const isOpen = isDisclaimerModalOpen || !disclaimerAcknowledged;

  const handleAcknowledge = () => {
    setDisclaimerAcknowledged(true);
    closeDisclaimerModal();
  };

  const handleClose = () => {
    // If already acknowledged, allow simply closing
    if (disclaimerAcknowledged) {
      closeDisclaimerModal();
    } else {
      // Must acknowledge on first load
      handleAcknowledge();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
            onClick={disclaimerAcknowledged ? handleClose : undefined}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg rounded-2xl bg-slate-900/95 border border-amber-500/30 p-6 sm:p-7 shadow-2xl shadow-black/80 backdrop-blur-xl z-10 space-y-5"
          >
            {/* Hairline highlight */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent rounded-t-2xl" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                      Clinical Safety Notice
                    </h2>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold">
                      Requirement 5
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Important regulatory & usage notice</p>
                </div>
              </div>

              {disclaimerAcknowledged && (
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Close disclaimer modal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Core Legal & Clinical Statement */}
            <div className="rounded-xl bg-slate-950/80 border border-amber-500/20 p-4 space-y-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
              <div className="flex items-start gap-2.5 text-amber-200/90 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>CardioTwin is a decision-support and educational prototype.</strong> Predictions are not a diagnosis and are not a substitute for formal diagnostic imaging (e.g., coronary angiography) or professional medical judgment.
                </p>
              </div>

              <div className="border-t border-white/5 pt-2.5 space-y-2 text-xs text-slate-400">
                <p>
                  • <strong>Model Bounds:</strong> Machine learning algorithms predict statistical likelihood of CAD and vessel stenosis from non-invasive clinical indices.
                </p>
                <p>
                  • <strong>No Direct Patient Treatment:</strong> The What-If digital twin simulates statistical feature relationships; it is not a clinical treatment prescription.
                </p>
                <p>
                  • <strong>Dataset & Benchmark:</strong> Validated on the Z-Alizadeh Sani research dataset with strict target-leakage isolation.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Multimodal AI Hackathon 2026</span>
                <span className="text-slate-600">·</span>
                <span className="text-teal-400 flex items-center gap-0.5">
                  Track A <ExternalLink className="w-3 h-3" />
                </span>
              </div>

              <button
                onClick={handleAcknowledge}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-glow-teal flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>I Understand & Acknowledge</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DisclaimerModal;
