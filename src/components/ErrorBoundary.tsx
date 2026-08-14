import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React render tree:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xl space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-black font-display">Something went wrong</h2>
            <p className="text-xs text-[#040506] leading-relaxed">
              We encountered a temporary rendering issue. Please refresh the page to restore the catalog.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 bg-[#FF5A00] hover:bg-[#E04F00] text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#FF5A00]/20"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
