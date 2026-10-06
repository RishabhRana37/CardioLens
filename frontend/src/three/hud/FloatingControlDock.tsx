import React from 'react';
import { useAppStore, GraphicQuality } from '../../store/useAppStore';
import { VESSEL_LIST } from '../../config/vessels.config';
import {
  Activity,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Compass,
  Cpu,
  Scissors,
  GitCompare,
  Clapperboard,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface FloatingControlDockProps {
  isBeating: boolean;
  onToggleBeating: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
}

export const FloatingControlDock: React.FC<FloatingControlDockProps> = ({
  isBeating,
  onToggleBeating,
  isInspectorOpen,
  onToggleInspector,
}) => {
  const {
    quality,
    setQuality,
    predictions,
    projectionPredictions,
    isProjectionMode,
    selectedVessel,
    selectVessel,
    colorFor,
    isAngiogramMode,
    toggleAngiogramMode,
    isCompareMode,
    toggleCompareMode,
    cameraPreset,
    setCameraPreset,
    isCrossSectionOpen,
    toggleCrossSection,
    playIntro,
    isAudioEnabled,
    toggleAudio,
  } = useAppStore();

  const effectivePredictions = isProjectionMode && projectionPredictions ? projectionPredictions : predictions;
  const cadProb = effectivePredictions?.CAD?.probability ?? 0.2;

  const presets = [
    { id: 'anterior', label: 'ANT', title: 'Anterior View (Front)' },
    { id: 'posterior', label: 'POST', title: 'Posterior View (Back)' },
    { id: 'left', label: 'LAO', title: 'Left Anterior Oblique (LAO)' },
    { id: 'right', label: 'RAO', title: 'Right Anterior Oblique (RAO)' },
    { id: 'apical', label: 'APEX', title: 'Apical View (Bottom Apex)' },
  ] as const;

  const qualities: GraphicQuality[] = ['performance', 'balanced', 'cinematic'];

  return (
    <div className="relative z-20 px-3 py-2 flex items-center justify-center pointer-events-none mt-auto">
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-2xl shadow-2xl text-slate-200 font-mono text-xs pointer-events-auto transition-all">
        {/* 1. Anatomy ⇄ Angiogram Mode Toggle */}
        <button
          onClick={toggleAngiogramMode}
          title="Toggle Angiogram Fluoroscopy Mode (Key: A)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all duration-200 ${
            isAngiogramMode
              ? 'bg-amber-950/90 border-amber-500/80 text-amber-300 shadow-glow-amber ring-1 ring-amber-500/40 animate-pulse'
              : 'bg-slate-900/90 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800/90'
          }`}
        >
          {isAngiogramMode ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Activity className="w-3.5 h-3.5 text-teal-400" />
          )}
          <span>{isAngiogramMode ? 'Angiogram' : 'Anatomy'}</span>
          <kbd className="hidden sm:inline text-[9px] px-1 rounded bg-slate-800/80 border border-white/10 text-slate-400">
            A
          </kbd>
        </button>

        {/* 2. Compare Mode (Side-by-Side Baseline vs What-If) */}
        <button
          onClick={toggleCompareMode}
          title="Toggle Side-by-Side What-If Twin Comparison (Key: C)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all duration-200 ${
            isCompareMode
              ? 'bg-teal-950/90 border-teal-400 text-teal-300 shadow-glow-teal ring-1 ring-teal-400/50'
              : 'bg-slate-900/90 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800/90'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5 text-teal-400" />
          <span>Compare</span>
          <kbd className="hidden sm:inline text-[9px] px-1 rounded bg-slate-800/80 border border-white/10 text-slate-400">
            C
          </kbd>
        </button>

        <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

        {/* 2. Vessel Selector Segmented Pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-900/60 border border-white/5">
          {/* CAD / Whole Heart */}
          <button
            onClick={() => selectVessel(null)}
            title="Whole Heart Overview (Key: 1)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-all duration-150 ${
              selectedVessel === null
                ? 'bg-slate-800 border-teal-500/60 text-teal-300 font-bold shadow-glow-teal'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: colorFor('CAD') }}
            />
            <span>CAD</span>
            <span className="text-[10px] tabular-nums font-semibold" style={{ color: colorFor('CAD') }}>
              {(cadProb * 100).toFixed(0)}%
            </span>
          </button>

          {/* Three Artery Branches */}
          {VESSEL_LIST.map((vKey) => {
            const isSelected = selectedVessel === vKey;
            const prob = predictions?.[vKey]?.probability ?? 0.2;
            const color = colorFor(vKey);

            return (
              <button
                key={vKey}
                onClick={() => selectVessel(vKey)}
                title={`Focus ${vKey} Artery`}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all duration-150 ${
                  isSelected
                    ? 'bg-slate-800 border-teal-500/60 text-white font-bold shadow-glow-teal ring-1 ring-teal-500/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{vKey}</span>
                <span className="text-[10px] tabular-nums font-semibold" style={{ color }}>
                  {(prob * 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Cross-Section Cutaway Toggle */}
        <button
          onClick={toggleCrossSection}
          title={isCrossSectionOpen ? 'Hide Lumen Cross-Section' : 'Show Lumen Cross-Section'}
          disabled={selectedVessel === null}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs transition-all duration-200 ${
            selectedVessel === null
              ? 'opacity-40 cursor-not-allowed border-white/5 text-slate-500 bg-slate-900/40'
              : isCrossSectionOpen
              ? 'bg-teal-950/90 border-teal-400 text-teal-300 font-bold shadow-glow-teal'
              : 'bg-slate-900/90 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">Cutaway</span>
        </button>

        <div className="h-5 w-[1px] bg-white/10 hidden md:block" />

        {/* 4. Anatomical Camera Presets Dock */}
        <div className="hidden lg:flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-900/60 border border-white/5">
          <span className="px-1.5 text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Compass className="w-3 h-3 text-teal-400" />
          </span>
          {presets.map((view) => (
            <button
              key={view.id}
              onClick={() => setCameraPreset(view.id)}
              title={view.title}
              className={`px-1.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                cameraPreset === view.id
                  ? 'bg-teal-950 border border-teal-500 text-teal-300 shadow-glow-teal'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

        {/* 5. Cardiac Rhythm (Beating Toggle) */}
        <button
          onClick={onToggleBeating}
          title={isBeating ? 'Pause Cardiac Rhythm (Spacebar)' : 'Resume Cardiac Rhythm (Spacebar)'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs transition-colors ${
            isBeating
              ? 'bg-slate-900/90 border-white/10 text-teal-300 hover:bg-slate-800'
              : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
          }`}
        >
          {isBeating ? (
            <>
              <Pause className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span className="hidden sm:inline tabular-nums">68 BPM</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Paused</span>
            </>
          )}
        </button>

        {/* 6. Heartbeat Audio Auscultation Toggle */}
        <button
          onClick={toggleAudio}
          title={isAudioEnabled ? 'Mute Heartbeat Audio (Key: M)' : 'Enable Heartbeat Auscultation Audio (Key: M)'}
          className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs transition-colors ${
            isAudioEnabled
              ? 'bg-slate-900/90 border-teal-500/40 text-teal-300 shadow-glow-teal'
              : 'bg-slate-900/90 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {isAudioEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span className="hidden md:inline">Sound</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Mute</span>
            </>
          )}
        </button>

        {/* 6. Graphics Quality Selector */}
        <div className="hidden xl:flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-900/60 border border-white/5">
          <Cpu className="w-3 h-3 text-teal-400 ml-1 mr-0.5" />
          {qualities.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold transition-all ${
                quality === q
                  ? 'bg-teal-950 border border-teal-500 text-teal-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {q.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* 7. Replay Intro Reveal Button */}
        <button
          onClick={playIntro}
          title="Replay Cinematic 3D Intro Sequence"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs transition-colors"
        >
          <Clapperboard className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">Replay</span>
        </button>

        {/* 8. Model Inspector Toggle */}
        <button
          onClick={onToggleInspector}
          title="Toggle 3D Model Inspector (Key: I)"
          className={`p-1.5 rounded-xl border transition-all ${
            isInspectorOpen
              ? 'bg-teal-950 border-teal-400 text-teal-300 shadow-glow-teal'
              : 'bg-slate-900/90 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {/* 9. Camera Reset Button */}
        <button
          onClick={() => {
            selectVessel(null);
            setCameraPreset('anterior');
          }}
          title="Reset Camera Framing"
          className="p-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FloatingControlDock;
