import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Lightbulb, Shield, Zap, X, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

export default function HintModal({ onClose }) {
  const { room, buyHint, unlockedHints } = useSocket();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!room) return null;

  const teamXp = room.gamification?.teamXp || 0;
  const hintsAvailable = room.gamification?.hintsAvailable ?? 2;

  const handleBuy = async (hintType) => {
    setError(null);
    setLoading(true);
    const res = await buyHint(hintType);
    setLoading(false);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <span className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl">
            <Lightbulb className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-white">DEBUGGING HINT SYSTEM</h2>
            <div className="flex items-center gap-3 text-xs font-mono mt-1">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Team Pool: {teamXp} XP
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">
                Hints Remaining: <strong className="text-white">{hintsAvailable}</strong>/2
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Hint Options Grid */}
        <div className="space-y-3 mb-6">
          {/* Hint 1: Bug Location */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Hint #1: Reveal Bug Location</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold rounded border border-amber-500/30">
                  100 XP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Reveals the specific file name and function area where the active bug is located.
              </p>
            </div>

            <button
              onClick={() => handleBuy('LOCATION')}
              disabled={loading || hintsAvailable <= 0 || teamXp < 100}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition whitespace-nowrap ${
                hintsAvailable <= 0 || teamXp < 100
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40'
              }`}
            >
              Buy (100 XP)
            </button>
          </div>

          {/* Hint 2: Bug Type */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Hint #2: Reveal Bug Type</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold rounded border border-amber-500/30">
                  250 XP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Reveals the exact category of logic flaw (e.g. Inverted Operator, Off-by-one, Tax double-charge).
              </p>
            </div>

            <button
              onClick={() => handleBuy('TYPE')}
              disabled={loading || hintsAvailable <= 0 || teamXp < 250}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition whitespace-nowrap ${
                hintsAvailable <= 0 || teamXp < 250
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40'
              }`}
            >
              Buy (250 XP)
            </button>
          </div>
        </div>

        {/* Unlocked Hints Feed */}
        {unlockedHints.length > 0 && (
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Unlocked Team Hints ({unlockedHints.length})
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
              {unlockedHints.map((h, i) => (
                <div key={i} className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200 font-mono">
                  {h.hintText}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
