import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureField, FeatureGroup } from '../../api/types';
import { FieldControl } from './FieldControl';
import { useAppStore } from '../../store/useAppStore';
import {
  ChevronDown,
  User,
  Stethoscope,
  Activity,
  FlaskConical,
} from 'lucide-react';

interface FeatureGroupAccordionProps {
  group: FeatureGroup;
  fields: FeatureField[];
  defaultOpen?: boolean;
}

export const FeatureGroupAccordion: React.FC<FeatureGroupAccordionProps> = ({
  group,
  fields,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const { patient, baseline } = useAppStore();

  // Calculate count of modified fields in this group
  const modifiedCount = fields.filter((f) => {
    const cur = patient?.[f.name];
    const base = baseline?.[f.name];
    return cur !== undefined && base !== undefined && cur !== base;
  }).length;

  const groupIcons: Record<FeatureGroup, React.FC<{ className?: string }>> = {
    Demographic: User,
    'Symptom & Examination': Stethoscope,
    ECG: Activity,
    'Laboratory & Echo': FlaskConical,
  };

  const Icon = groupIcons[group] || Activity;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/50 overflow-hidden transition-colors">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 text-left transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-200 block truncate">
              {group}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {modifiedCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
              {modifiedCount} modified
            </span>
          )}

          <span className="text-[10px] font-mono text-slate-400">
            {fields.length} vars
          </span>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400 group-hover:text-slate-200"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </button>

      {/* Expandable Fields Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2.5 border-t border-white/5 bg-slate-950/40">
              {fields.map((field) => (
                <FieldControl key={field.name} field={field} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureGroupAccordion;
