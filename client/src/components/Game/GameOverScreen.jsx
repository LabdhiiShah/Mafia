import React, { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import confetti from 'canvas-confetti';
import { Trophy, Skull, Shield, CheckCircle2, RotateCcw, Award } from 'lucide-react';

export default function GameOverScreen() {
  const { room, myPlayer } = useSocket();

  useEffect(() => {
    if (room?.winner === 'DEVELOPERS') {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [room?.winner]);

  if (!room) return null;

  const isDevWin = room.winner === 'DEVELOPERS';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 relative">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Banner */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${
                isDevWin
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-emerald-900/50'
                  : 'bg-red-950/40 border-red-500 text-red-500 shadow-red-900/50 mafia-glow'
              }`}
            >
              {isDevWin ? <Trophy className="w-10 h-10" /> : <Skull className="w-10 h-10" />}
            </div>
          </div>

          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">
            MATCH RESOLUTION
          </span>
          <h1
            className={`text-5xl font-black tracking-tight mt-1 mb-2 ${
              isDevWin ? 'text-emerald-400' : 'text-red-500'
            }`}
          >
            {isDevWin ? 'DEVELOPERS VICTORY!' : 'MAFIA SABOTAGE SUCCESSFUL!'}
          </h1>
          <p className="text-slate-300 text-sm max-w-xl mx-auto font-sans leading-relaxed">
            {room.winningReason}
          </p>
        </div>

        {/* Role Reveal Grid */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" /> Full Role Roster & Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {room.players.map((p) => {
              const isMafia = p.role === 'MAFIA';
              const isQA = p.role === 'QA_INSPECTOR';

              return (
                <div
                  key={p.socketId}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isMafia
                      ? 'bg-red-950/20 border-red-500/40 text-red-300'
                      : isQA
                      ? 'bg-purple-950/20 border-purple-500/40 text-purple-300'
                      : 'bg-blue-950/20 border-blue-500/40 text-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{isMafia ? '💀' : isQA ? '👁️' : '🛡️'}</span>
                    <div>
                      <span className="font-bold text-sm block text-white">{p.name}</span>
                      <span className="text-xs font-mono font-semibold">{p.role}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      p.isAlive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {p.isAlive ? 'SURVIVED' : 'ELIMINATED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Post-Match Actions */}
        <div className="pt-6 border-t border-slate-800 flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-blue-900/30"
          >
            <RotateCcw className="w-4 h-4" /> Play Another Match
          </button>
        </div>
      </div>
    </div>
  );
}
