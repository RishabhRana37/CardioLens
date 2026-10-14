import React, { useEffect } from 'react';
import { HeartScene } from '../../three/HeartScene';
import { MinimalPersistentHUD } from '../dashboard/MinimalPersistentHUD';
import { DetailsSlideOverPanel } from '../dashboard/DetailsSlideOverPanel';
import { CoronaryTreeSchematic } from '../common/CoronaryTreeSchematic';
import { useAppStore } from '../../store/useAppStore';

export const SplitViewSection: React.FC = () => {
  const {
    isDetailsOpen,
    setDetailsOpen,
    toggleDetailsOpen,
    setHasActiveDrawer,
    isFocusMode,
  } = useAppStore();

  // Inform CameraController whenever the Details slide-over panel opens or closes
  useEffect(() => {
    setHasActiveDrawer(isDetailsOpen && !isFocusMode);
  }, [isDetailsOpen, isFocusMode, setHasActiveDrawer]);

  return (
    <div className="w-full h-full min-h-[580px] flex-1 flex flex-col lg:flex-row items-stretch gap-3 lg:gap-4 select-none">
      {/* ========================================================================= */}
      {/* PANE 1: LEFT / MAIN 3D CARDIAC DIGITAL TWIN (~56% width on desktop)        */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[56%] xl:w-[58%] h-full relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-slate-950/95 via-[#060912] to-[#030508] shadow-2xl flex flex-col">
        {/* 3D Heart WebGL Canvas Viewport */}
        <div className="absolute inset-0 z-0">
          <HeartScene />
        </div>

        {/* Top-Left Visual Pane Identity Pill */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-md flex items-center gap-1.5 text-[11px] font-mono text-slate-200">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-bold">3D Cardiac Digital Twin</span>
          </div>
        </div>

        {/* Minimal Persistent CAD% + Vessel Chips Overlay (Centered within 3D Pane) */}
        <MinimalPersistentHUD
          position="absolute"
          isDetailsOpen={isDetailsOpen}
          onToggleDetails={toggleDetailsOpen}
        />

        {/* Details Slide-Over Drawer (Toggled on-demand via the Details button) */}
        <DetailsSlideOverPanel
          isOpen={isDetailsOpen}
          onClose={() => setDetailsOpen(false)}
        />
      </div>

      {/* ========================================================================= */}
      {/* PANE 2: RIGHT 2D CORONARY ANGIOGRAM SCHEMATIC (~44% width on desktop)     */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[44%] xl:w-[42%] h-full relative flex flex-col">
        <CoronaryTreeSchematic
          className="h-full flex-1"
          variant="split"
          showTitle={true}
        />
      </div>
    </div>
  );
};

export default SplitViewSection;
