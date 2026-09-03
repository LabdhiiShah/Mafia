import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Shield, Skull, Eye, CheckCircle } from 'lucide-react';

export default function RoleRevealModal() {
  const { myPlayer, timerSeconds } = useSocket();

  if (!myPlayer) return null;

  const isMafia = myPlayer.role === 'MAFIA';
  const isQA = myPlayer.role === 'QA_INSPECTOR';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Countdown Badge */}
        <div className="absolute top-4 right-4 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-400">
          Starts in <span className="text-white font-bold">{timerSeconds}s</span>
        </div>

        {/* Role Icon Header */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-xl ${
              isMafia
                ? 'bg-red-950/40 border-red-500 text-red-500 shadow-red-900/50 mafia-glow'
                : isQA
                ? 'bg-purple-950/40 border-purple-500 text-purple-400 shadow-purple-900/50'
                : 'bg-blue-950/40 border-blue-500 text-blue-400 shadow-blue-900/50'
            }`}
          >
            {isMafia ? (
              <Skull className="w-12 h-12" />
            ) : isQA ? (
              <Eye className="w-12 h-12" />
            ) : (
              <Shield className="w-12 h-12" />
            )}
          </div>
        </div>

        {/* Secret Role Title */}
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">
          CONFIDENTIAL ROLE ASSIGNMENT
        </span>
        <h2
          className={`text-4xl font-extrabold tracking-tight mt-1 mb-3 ${
            isMafia ? 'text-red-500' : isQA ? 'text-purple-400' : 'text-blue-400'
          }`}
        >
          {isMafia ? 'MAFIA SABOTEUR' : isQA ? 'QA INSPECTOR' : 'INNOCENT DEVELOPER'}
        </h2>

        {/* Secret Objective Card */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 mb-6 text-left">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Primary Mission
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {myPlayer.secretObjective}
          </p>

          {isMafia && myPlayer.teammates && myPlayer.teammates.length > 1 && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-xs font-mono text-red-400 font-semibold block mb-1">
                SABOTEUR TEAMMATES:
              </span>
              <div className="flex flex-wrap gap-2">
                {myPlayer.teammates.map((name, i) => (
                  <span key={i} className="px-2.5 py-1 bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-mono rounded-md">
                    💀 {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 font-mono">
          Keep your role secret! Do not let other players see your screen.
        </p>
      </div>
    </div>
  );
}
