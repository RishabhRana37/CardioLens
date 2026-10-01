import React from 'react';
import { useAppStore, AppSection } from '../../store/useAppStore';
import { Heart, FileText, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileTabBar: React.FC = () => {
  const { activeSection, setActiveSection, predictions } = useAppStore();

  const tabs: { id: AppSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'heart', label: '3D Heart', icon: Heart },
    { id: 'inputs', label: 'Patient Input', icon: FileText },
    { id: 'metrics', label: 'Metrics & SHAP', icon: BarChart3 },
  ];

  return (
    <div className="md:hidden border-b border-glass-border bg-slate-900/90 backdrop-blur-md px-3 py-1.5 z-30">
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'text-teal-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-mobile-tab-bg"
                  className="absolute inset-0 bg-teal-950/70 border border-teal-500/30 rounded-lg shadow-sm"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'metrics' && predictions && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabBar;
