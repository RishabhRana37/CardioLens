import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Cpu, Heart } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ThreeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ThreeErrorBoundary] WebGL / R3F Canvas Error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public handlePerformanceMode = () => {
    try {
      useAppStore.getState().setQuality('performance');
    } catch {
      // ignore
    }
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[480px] lg:min-h-[600px] rounded-2xl bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-[#04060a] border border-amber-500/30 flex flex-col items-center justify-center p-6 text-center space-y-5 font-mono relative overflow-hidden">
          {/* Subtle Ambient Red Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />

          {/* 2D Fallback Heart Vector Graphic */}
          <div className="relative w-24 h-24 rounded-3xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-glow-amber">
            <Heart className="w-12 h-12 text-amber-400 fill-amber-400/20" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

          {/* Diagnostic Context */}
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-slate-100">
              WebGL Hardware Acceleration Notice
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              The 3D WebGL context was interrupted or shader compilation exceeded GPU memory limits. Switch to Performance mode to disable heavy screen-space shaders and contact shadows.
            </p>
            {this.state.error && (
              <div className="text-[10px] text-amber-300/80 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5 truncate max-w-sm mx-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
          </div>

          {/* Clear Next Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              onClick={this.handlePerformanceMode}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-glow-teal cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Switch to Performance Mode</span>
            </button>

            <button
              onClick={this.handleReset}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Canvas</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ThreeErrorBoundary;
