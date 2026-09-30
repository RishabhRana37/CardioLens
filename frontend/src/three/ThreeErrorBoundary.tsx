import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[450px] rounded-2xl bg-slate-950/90 border border-amber-500/30 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-glow-red">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-bold text-slate-100">3D Hardware Acceleration Notice</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              WebGL context could not be initialized or encountered a shader error. Switch to Performance mode or reload the canvas.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-all shadow-glow-teal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload 3D Stage</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ThreeErrorBoundary;
