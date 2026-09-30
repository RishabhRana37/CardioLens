import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { ProceduralHeart } from './heart/ProceduralHeart';
import { CoronaryVessels } from './heart/CoronaryVessels';
import { CameraController } from './heart/CameraController';
import { PostProcessingEffects } from './heart/PostProcessingEffects';
import { ThreeErrorBoundary } from './ThreeErrorBoundary';
import { VESSEL_LIST } from '../config/vessels.config';
import {
  RotateCcw,
  Heart,
  Play,
  Pause,
  ZoomIn,
  MousePointerClick,
  RefreshCw,
  Box,
} from 'lucide-react';

export const HeartScene: React.FC = () => {
  const [isBeating, setIsBeating] = useState<boolean>(true);

  const {
    quality,
    predictions,
    selectedVessel,
    selectVessel,
    colorFor,
    isPredicting,
  } = useAppStore();

  const dpr = quality === 'cinematic' ? 2 : quality === 'balanced' ? 1.5 : 1;
  const activeColor = colorFor(selectedVessel || 'CAD');
  const cadProb = predictions?.CAD?.probability ?? 0.2;

  return (
    <div className="relative w-full h-full min-h-[540px] lg:min-h-[660px] rounded-2xl bg-gradient-to-b from-slate-950/95 via-[#060912] to-[#030508] border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between group">
      {/* Background Radial Glow Stage */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${activeColor} 0%, transparent 65%)`,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-30" />

      {/* Top Floating Stage HUD */}
      <div className="relative z-20 p-3.5 sm:p-4 flex items-start justify-between gap-2 pointer-events-none">
        {/* Stage Status Chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 border border-white/10 backdrop-blur-md text-xs font-mono text-slate-300 shadow-glass-sm pointer-events-auto">
          <Box className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-semibold text-slate-200">R3F 3D Stage</span>
          <span className="text-slate-600">|</span>
          <span className="text-teal-300 capitalize">{quality} Mode</span>
          {isPredicting && (
            <span className="flex items-center gap-1 text-amber-400 pl-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Recolor...
            </span>
          )}
        </div>

        {/* Action Controls Overlay */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Beating Toggle */}
          <button
            onClick={() => setIsBeating(!isBeating)}
            title={isBeating ? 'Pause Heartbeat' : 'Resume Heartbeat'}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors backdrop-blur-md text-xs font-mono flex items-center gap-1"
          >
            {isBeating ? (
              <>
                <Pause className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">68 BPM</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Paused</span>
              </>
            )}
          </button>

          {/* Whole Heart View / Reset */}
          <button
            onClick={() => selectVessel(null)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all backdrop-blur-md flex items-center gap-1.5 ${
              selectedVessel === null
                ? 'bg-teal-950/90 border-teal-500/50 text-teal-300 font-semibold shadow-glow-teal'
                : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-teal-400" />
            <span>Whole Heart</span>
          </button>

          {/* Camera Reset */}
          <button
            onClick={() => selectVessel(null)}
            title="Reset Orbit Camera"
            className="p-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors backdrop-blur-md"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="absolute inset-0 z-10">
        <ThreeErrorBoundary>
          <Canvas
            dpr={dpr}
            camera={{ position: [0, 0.4, 3.8], fov: 45 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
            }}
          >
            {/* Lighting Rig */}
            <ambientLight intensity={0.45} />
            <directionalLight position={[4, 5, 4]} intensity={1.5} color="#ffffff" />
            <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#94a3b8" />
            <directionalLight position={[0, -3, -4]} intensity={2.2} color="#0d9488" />

            {/* Subtle Studio Environment */}
            <Environment preset="city" />

            {/* Suspended Heart Mesh & Interactive Vessels */}
            <Suspense fallback={null}>
              <Float
                speed={isBeating ? 1.2 : 0}
                rotationIntensity={0.15}
                floatIntensity={0.2}
                floatingRange={[-0.05, 0.05]}
              >
                <ProceduralHeart isBeating={isBeating} />
                <CoronaryVessels />
              </Float>
            </Suspense>

            {/* Ground Contact Shadow (Bypassed in performance mode) */}
            {quality !== 'performance' && (
              <ContactShadows
                position={[0, -1.35, 0]}
                opacity={0.55}
                scale={5.5}
                blur={2.4}
                far={4}
                color="#000000"
              />
            )}

            {/* Orbit Camera Controller */}
            <CameraController />

            {/* Cinematic / Balanced Postprocessing */}
            <PostProcessingEffects />
          </Canvas>
        </ThreeErrorBoundary>
      </div>

      {/* Floating Center Quick Vessel Selector Pills */}
      <div className="relative z-20 px-4 py-2 flex items-center justify-center pointer-events-none mt-auto">
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-glass-md pointer-events-auto">
          {/* Whole Heart CAD Indicator */}
          <button
            onClick={() => selectVessel(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 ${
              selectedVessel === null
                ? 'bg-slate-900 border-teal-500/50 text-teal-300 font-bold shadow-glow-teal ring-1 ring-teal-500/30'
                : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-colors duration-300"
              style={{ backgroundColor: colorFor('CAD') }}
            />
            <span>CAD</span>
            <span className="text-[11px] tabular-nums font-semibold" style={{ color: colorFor('CAD') }}>
              {(cadProb * 100).toFixed(0)}%
            </span>
          </button>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Three Coronary Artery Branches */}
          {VESSEL_LIST.map((vKey) => {
            const isSelected = selectedVessel === vKey;
            const prob = predictions?.[vKey]?.probability ?? 0.2;
            const color = colorFor(vKey);

            return (
              <button
                key={vKey}
                onClick={() => selectVessel(vKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 ${
                  isSelected
                    ? 'bg-slate-900 border-teal-500/60 text-white font-bold shadow-glow-teal scale-105 ring-1 ring-teal-500/40'
                    : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-colors duration-300"
                  style={{ backgroundColor: color }}
                />
                <span>{vKey}</span>
                <span className="text-[11px] tabular-nums font-semibold" style={{ color }}>
                  {(prob * 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom HUD Legend & Persistent Canvas Disclaimer */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 border-t border-white/10 bg-slate-950/70 backdrop-blur-md pointer-events-none">
        {/* Continuous Risk Color Spectrum Legend */}
        <div className="w-full sm:w-64 space-y-1 pointer-events-auto">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span className="text-risk-low font-semibold">0.00 Normal</span>
            <span className="text-risk-moderate font-semibold">0.50 Borderline</span>
            <span className="text-risk-high font-semibold">1.00 Stenotic</span>
          </div>
          <div className="h-2 rounded-full bg-gradient-to-r from-risk-low via-risk-moderate to-risk-high shadow-inner border border-white/10" />
        </div>

        {/* Interaction Guide */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pointer-events-auto">
          <span className="flex items-center gap-1">
            <MousePointerClick className="w-3.5 h-3.5 text-teal-400" /> Click artery to isolate
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <ZoomIn className="w-3.5 h-3.5 text-teal-400" /> Orbit & zoom
          </span>
        </div>

        {/* Canvas Disclaimer Watermark */}
        <div className="text-[10px] font-mono text-slate-400 pointer-events-auto hidden xl:block">
          ⚠ Educational & Decision Support Only
        </div>
      </div>
    </div>
  );
};

export default HeartScene;
