import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FeatureGroupAccordion } from './FeatureGroupAccordion';
import { FieldControl } from './FieldControl';
import {
  Search,
  Sparkles,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

export const DynamicPatientForm: React.FC = () => {
  const {
    schema,
    patient,
    baseline,
    predictImmediate,
    resetWhatIf,
    isPredicting,
    status,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Check if any feature differs from baseline
  const isModified = useMemo(() => {
    if (!patient || !baseline) return false;
    return Object.keys(patient).some((k) => patient[k] !== baseline[k]);
  }, [patient, baseline]);

  // Filter features based on search query
  const filteredFeatures = useMemo(() => {
    if (!schema) return [];
    if (!searchQuery.trim()) return null; // Null means render by group
    const q = searchQuery.toLowerCase();
    return schema.features.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.group.toLowerCase().includes(q)
    );
  }, [schema, searchQuery]);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    await predictImmediate();
  };

  if (!schema) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center text-xs text-slate-400 space-y-2">
        <RefreshCw className="w-4 h-4 animate-spin text-teal-400 mx-auto" />
        <p>Loading clinical feature schema...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handlePredict} className="space-y-3">
      {/* Search Filter Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Filter 55 clinical parameters (e.g. LDL, BP)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[11px] font-mono"
          >
            Clear
          </button>
        )}
      </div>

      {/* Action Bar: Predict (Primary) + Reset */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPredicting || status === 'loading'}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-semibold text-xs shadow-glow-teal flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isPredicting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Predicting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Predict Risk & Color Heart</span>
            </>
          )}
        </button>

        {isModified && (
          <button
            type="button"
            onClick={resetWhatIf}
            title="Reset all modified values to baseline"
            className="py-2 px-3 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-mono flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Accordion Groups List OR Search Results */}
      {filteredFeatures !== null ? (
        // Search Results List
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 px-1">
            <span>Search Results:</span>
            <span>{filteredFeatures.length} found</span>
          </div>
          {filteredFeatures.length > 0 ? (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredFeatures.map((field) => (
                <FieldControl key={field.name} field={field} />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500">
              No features match &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      ) : (
        // Standard 4-Category Accordions
        <div className="space-y-2 pt-1">
          {schema.groups.map((group, idx) => {
            const groupFields = schema.features.filter((f) => f.group === group);
            return (
              <FeatureGroupAccordion
                key={group}
                group={group}
                fields={groupFields}
                defaultOpen={idx === 0 || idx === 1}
              />
            );
          })}
        </div>
      )}
    </form>
  );
};

export default DynamicPatientForm;
