import React, { useState, useEffect } from 'react';
import { X, Radar } from 'lucide-react';

export function QuickMatchModal({ onClose, onProceedToLobby }) {
  const [status, setStatus] = useState('searching');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onProceedToLobby) {
        onProceedToLobby({ quickMatch: true });
      } else {
        setStatus('error');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [onProceedToLobby]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1a0b2e] border border-purple-500/30 rounded-lg p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-in zoom-in-95 duration-200 text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-pixel text-xl text-white mb-8 [text-shadow:0_0_10px_rgba(168,85,247,0.5)]">FINDING INVESTIGATION</h2>

        {status === 'searching' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-6">
            <div className="relative flex items-center justify-center w-16 h-16">
              <Radar className="w-8 h-8 text-purple-400 absolute animate-pulse" />
              <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-ping" />
              <div className="absolute inset-[-10px] border border-purple-500/10 rounded-full animate-ping" style={{ animationDelay: '200ms' }} />
            </div>
            <p className="font-pixel text-[10px] text-purple-300 animate-pulse">Searching for available players...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-8">
            <p className="text-red-400 text-sm">No multiplayer service connected.</p>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-purple-600/20 border border-purple-500/40 text-purple-200 font-pixel text-[10px] rounded-sm hover:bg-purple-600 hover:text-white hover:[box-shadow:0_0_15px_rgba(168,85,247,0.5)] transition-all cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
