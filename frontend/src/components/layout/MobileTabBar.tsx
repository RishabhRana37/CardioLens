import React from 'react';
import { useAppStore, MobileTab } from '../../store/useAppStore';
import { Heart, User, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileTabBar: React.FC = () => {
  const { activeMobileTab, setActiveMobileTab, predictions } = useAppStore();

  const tabs: { id: MobileTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'heart', label: '3D Heart Stage', icon: Heart },
    { id: 'inputs', label: 'Patient & Controls', icon: User },
    { id: 'results', label: 'Clinical Dashboard', icon: Activity },
  ];

  return (
    <div className="lg:hidden border-b border-glass-border bg-slate-900/90 backdrop-blur-md px-3 py-1.5 z-30">
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMobileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMobileTab(tab.id)}
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
                {tab.id === 'results' && predictions && (
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
