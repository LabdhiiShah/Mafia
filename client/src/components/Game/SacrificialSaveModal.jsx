import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Flame, ShieldAlert, CheckCircle2, XCircle, Users } from 'lucide-react';

export default function SacrificialSaveModal() {
  const { room, myPlayer, voteSacrificialSave } = useSocket();
  const [hasVoted, setHasVoted] = useState(false);
  const [votedChoice, setVotedChoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detectiveState = room?.detectiveState || {};
  const isPending = detectiveState.sacrificialSavePending;

  // Only living non-Mafia players receive this sacrificial prompt
  const isEligible = myPlayer && myPlayer.role !== 'MAFIA' && myPlayer.isAlive;

  if (!isPending || !isEligible) return null;

  const handleVote = async (acceptSave) => {
    setIsSubmitting(true);
    setVotedChoice(acceptSave);
    await voteSacrificialSave(acceptSave);
    setIsSubmitting(false);
    setHasVoted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md font-sans animate-fade-in">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-950 to-purple-950 border-2 border-purple-500 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.5)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-purple-950/80 border-b border-purple-700/50 flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/30 border border-purple-500/50 rounded-xl animate-pulse">
            <Flame className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <h3 className="font-pixel text-sm text-purple-100 tracking-wider flex items-center gap-2">
              🕯️ SACRIFICIAL RESURRECTION PROMPT
            </h3>
            <p className="text-xs text-purple-300/80 font-mono">
              A Detective has fallen due to an accidental misfire!
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-900 border border-purple-500/30 rounded-xl space-y-2">
            <h4 className="font-bold text-sm text-purple-200 font-mono">
              INNOCENT REVIVE POWER: Choose ONE dead player to bring back to life!
            </h4>
            <p className="text-xs text-slate-300 font-mono">
              <strong className="text-amber-300">NOTE:</strong> Using this revive power <strong className="text-amber-400">replaces your vote</strong> for this voting round. Exactly one choice can be revived.
            </p>
          </div>

          {hasVoted ? (
            <div className="p-4 bg-purple-950/60 border border-purple-500/40 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto animate-bounce" />
              <span className="font-mono text-xs text-purple-200 font-bold block">
                Revive Decision Submitted: {votedChoice === 'DETECTIVE' ? 'REVIVE DETECTIVE' : 'REVIVE INNOCENT DEVELOPER'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Your elimination vote for this round has been replaced by the Revive action.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => handleVote('DETECTIVE')}
                className="p-4 bg-gradient-to-br from-purple-900/80 to-purple-950 hover:from-purple-800 border-2 border-purple-500 rounded-xl text-left transition cursor-pointer group shadow-lg"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-purple-200 font-pixel">REVIVE DETECTIVE</span>
                </div>
                <p className="text-[11px] font-mono text-purple-300/80">
                  Bring the Detective back to life with full investigation powers.
                </p>
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => handleVote('INNOCENT')}
                className="p-4 bg-gradient-to-br from-emerald-900/80 to-emerald-950 hover:from-emerald-800 border-2 border-emerald-500 rounded-xl text-left transition cursor-pointer group shadow-lg"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-emerald-200 font-pixel">REVIVE INNOCENT</span>
                </div>
                <p className="text-[11px] font-mono text-emerald-300/80">
                  Bring the incorrectly killed Innocent Developer back to life.
                </p>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
