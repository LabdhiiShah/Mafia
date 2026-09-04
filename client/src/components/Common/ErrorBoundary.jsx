import React from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Code Mafia UI ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/hub';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <h2 className="text-xl font-bold text-white tracking-tight">
              SESSION DISPLAY DESYNCED
            </h2>
            
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              {this.state.error?.message || 'An unexpected state update occurred.'}
            </p>

            <div className="pt-4 flex items-center justify-center gap-3 font-mono text-xs">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Re-Sync Room
              </button>

              <button
                onClick={this.handleHome}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Home className="w-4 h-4" /> Return to Hub
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
