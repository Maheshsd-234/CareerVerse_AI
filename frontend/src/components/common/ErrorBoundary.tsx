import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl border border-red-100 shadow-xl p-6 sm:p-8 max-w-lg w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>

            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#12122B]">
              {this.props.fallbackTitle || "Something went wrong while rendering this section"}
            </h2>

            <p className="text-xs sm:text-sm font-body text-gray-500 leading-relaxed">
              We encountered an unexpected display state. Don't worry, your progress and route data are safe.
            </p>

            {this.state.error && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-left font-mono text-[11px] text-red-600 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-[#4F46E5] text-white font-display font-bold text-xs hover:bg-[#4338CA] transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Reload Page
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/dashboard";
                }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-[#12122B] font-display font-bold text-xs hover:bg-gray-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Home size={14} /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
