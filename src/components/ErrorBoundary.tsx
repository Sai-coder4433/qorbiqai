import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Store, CreditCard, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected rendering error occurred.';
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Application Recovery</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {this.props.fallbackTitle || 'Unable to Display This Page'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                {this.props.fallbackMessage ||
                  'The application caught an unexpected display issue. Your account and data are safe. Please reload or return to Pricing.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs font-mono text-slate-700 max-h-32 overflow-y-auto break-all shadow-inner">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <a
                href="/app/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Go to Pricing</span>
              </a>

              <a
                href="/app"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4 text-slate-500" />
                <span>My Shops Hub</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
