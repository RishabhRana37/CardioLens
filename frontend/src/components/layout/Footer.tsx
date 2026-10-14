import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ShieldAlert, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  const { openDisclaimerModal } = useAppStore();

  return (
    <footer className="border-t border-glass-border bg-slate-950/90 backdrop-blur-md py-2.5 px-4 lg:px-6 text-[11px] text-slate-400 z-30 transition-colors">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
        {/* Persistent Condensed Disclaimer */}
        <div className="flex items-center gap-1.5 text-amber-300/90">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Clinical Safety:</strong> Prototype for educational & decision-support only. Not a formal diagnostic device.
          </span>
          <button
            onClick={openDisclaimerModal}
            className="text-amber-400 hover:text-amber-200 underline ml-1 font-medium"
          >
            Details
          </button>
        </div>

        {/* Dataset & Mesh Attribution */}
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-teal-400" />
            Z-Alizadeh Sani Extension (303 pts)
          </span>
          <span>·</span>
          <span>BodyParts3D / Open Biomedical Mesh</span>
          <span>·</span>
          <span className="text-teal-400 font-mono">Track A</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
