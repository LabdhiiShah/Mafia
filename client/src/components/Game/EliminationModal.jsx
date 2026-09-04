import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Shield, Flame, ArrowRight } from 'lucide-react';

export default function EliminationModal() {
  const { eliminationResult, clearEliminationResult } = useSocket();
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    if (!eliminationResult) return;

    setCountdown(6);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (clearEliminationResult) clearEliminationResult();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [eliminationResult, clearEliminationResult]);

  if (!eliminationResult) return null;

  const isSkipped = eliminationResult.skipped || !eliminationResult.eliminatedPlayer;
  const player = eliminationResult.eliminatedPlayer;

  const getRoleDisplay = (role) => {
    if (!role) return { label: 'UNKNOWN', badgeColor: 'bg-slate-800/40 border-slate-700 text-slate-300', icon: '❓' };
    const r = role.toUpperCase();
    if (r === 'MAFIA' || r === 'SABOTEUR') {
      return {
        label: 'MAFIA SABOTEUR',
        badgeColor: 'bg-red-950/60 border-red-500/50 text-red-400 [box-shadow:0_0_20px_rgba(239,68,68,0.3)]',
        icon: '💀'
      };
    } else if (r === 'DETECTIVE' || r === 'QA_INSPECTOR') {
      return {
        label: 'DETECTIVE',
        badgeColor: 'bg-purple-950/60 border-purple-500/50 text-purple-400 [box-shadow:0_0_20px_rgba(168,85,247,0.3)]',
        icon: '🕵️'
      };
    } else {
      return {
        label: 'CIVILIAN',
        badgeColor: 'bg-blue-950/60 border-blue-500/50 text-blue-400 [box-shadow:0_0_20px_rgba(59,130,246,0.3)]',
        icon: '🛡️'
      };
    }
  };

  const roleInfo = player ? getRoleDisplay(player.role) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#1a0b2e] border border-purple-500/40 rounded-xl p-8 text-center shadow-[0_0_80px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-300">
        
        {/* Header Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-900/30 border border-purple-500/30 rounded-full mb-6">
          <Flame className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="font-pixel text-[10px] text-purple-300">VOTE RESULT & ELIMINATION</span>
        </div>

        {isSkipped ? (
          <div className="py-4 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="font-pixel text-2xl text-white tracking-wide [text-shadow:0_0_15px_rgba(245,158,11,0.5)]">
              NO ONE WAS ELIMINATED
            </h2>
            <p className="text-purple-300/70 text-xs font-sans max-w-sm mx-auto leading-relaxed">
              The vote resulted in a tie or majority skip. All remaining investigators survive into the next round!
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-5">
            <div className="w-24 h-24 mx-auto rounded-full bg-red-950/40 border border-red-500/50 flex items-center justify-center [box-shadow:0_0_30px_rgba(239,68,68,0.4)] animate-pulse">
              <span className="text-4xl">{roleInfo?.icon || '💀'}</span>
            </div>

            <div>
              <span className="font-pixel text-[10px] text-red-400 tracking-wider">INVESTIGATOR ELIMINATED</span>
              <h2 className="font-pixel text-3xl text-white mt-1 tracking-wider [text-shadow:0_0_20px_rgba(239,68,68,0.6)]">
                {player.name}
              </h2>
            </div>

            <div className="pt-2">
              <span className="text-xs text-purple-300/60 block mb-2 font-pixel text-[9px]">REVEALED IDENTITY</span>
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-md border font-pixel text-xs ${roleInfo?.badgeColor}`}>
                <span>{roleInfo?.icon}</span>
                <span>THEY WERE A {roleInfo?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer & Action Button */}
        <div className="mt-8 pt-6 border-t border-purple-500/20 flex items-center justify-between">
          <span className="font-pixel text-[9px] text-purple-400/60">
            CONTINUING IN {countdown}S...
          </span>
          <button
            onClick={clearEliminationResult}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 border border-purple-400 text-white font-pixel text-[10px] rounded-sm hover:bg-purple-500 [box-shadow:0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
          >
            <span>CONTINUE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
