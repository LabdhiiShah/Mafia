import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Vote, Skull, Shield, Check, Flame, AlertCircle } from 'lucide-react';

export default function VotingModal() {
  const { room, myPlayer, submitVote, timerSeconds, eliminationResult } = useSocket();
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  if (!room) return null;

  const handleVoteSubmit = () => {
    if (!selectedTarget || hasVoted) return;
    submitVote(selectedTarget);
    setHasVoted(true);
  };

  const alivePlayers = (room?.players || []).filter(p => p && p.isAlive);
  const isAlive = myPlayer?.isAlive;

  // Calculate vote tallies for final reveal
  const voteTallies = new Map();
  let skipVotes = 0;

  if (room.votes) {
    for (const [voterSocket, targetSocket] of room.votes.entries()) {
      if (targetSocket === 'SKIP' || !targetSocket) {
        skipVotes++;
      } else {
        voteTallies.set(targetSocket, (voteTallies.get(targetSocket) || 0) + 1);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
        {/* End of Voting Phase: Reveal Elimination & Final Vote Tallies */}
        {eliminationResult ? (
          <div className="py-6 animate-in zoom-in duration-300">
            {eliminationResult.skipped ? (
              <div>
                <Shield className="w-16 h-16 text-amber-400 mx-auto mb-4 opacity-80" />
                <h3 className="text-3xl font-extrabold text-white">NO ONE WAS ELIMINATED</h3>
                <p className="text-slate-400 text-sm mt-2">
                  The vote ended in a tie or majority skip ({skipVotes} skip votes). Returning to Sprint Phase...
                </p>
              </div>
            ) : (
              <div>
                <Flame className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                <h3 className="text-3xl font-extrabold text-white">
                  {eliminationResult.eliminatedPlayer?.name} WAS ELIMINATED!
                </h3>
                <div className="mt-4 inline-block px-4 py-2 rounded-xl border text-sm font-bold font-mono">
                  {eliminationResult.eliminatedPlayer?.role === 'MAFIA' ? (
                    <span className="text-red-400 bg-red-950/40 border-red-500/30 px-3 py-1 rounded-lg">
                      💀 They were a MAFIA SABOTEUR!
                    </span>
                  ) : (
                    <span className="text-blue-400 bg-blue-950/40 border-blue-500/30 px-3 py-1 rounded-lg">
                      🛡️ They were an INNOCENT DEVELOPER!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Total Vote Breakdown List at the end */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-left">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Final Secret Vote Tally Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                {alivePlayers.map((p) => {
                  const count = voteTallies.get(p.socketId) || 0;
                  return (
                    <div
                      key={p.socketId}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center"
                    >
                      <span className="text-slate-200 font-bold">{p.name}</span>
                      <span className={`px-2.5 py-1 rounded-md border font-bold ${
                        count > 0 ? 'bg-red-950/50 text-red-400 border-red-500/30' : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        🗳️ {count} {count === 1 ? 'Vote' : 'Votes'}
                      </span>
                    </div>
                  );
                })}

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400">Skip Votes</span>
                  <span className="px-2.5 py-1 bg-amber-950/50 text-amber-400 border border-amber-500/30 rounded-md font-bold">
                    🗳️ {skipVotes} Votes
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Voting Phase: Secret Ballot (No vote counts visible while voting!) */
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="text-left">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Vote className="w-4 h-4" /> Secret Voting Round
                </span>
                <h2 className="text-2xl font-black text-white mt-1">Cast Your Vote</h2>
              </div>
              <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm font-bold text-red-400">
                {timerSeconds}s
              </div>
            </div>

            {!isAlive ? (
              <div className="py-8 text-slate-500 text-sm">
                <Skull className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                You were eliminated. You can observe the vote, but cannot participate.
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 mb-6 text-left font-sans">
                  Select the player you suspect of sabotaging the codebase and unit tests (Votes are kept secret until voting finishes):
                </p>

                {/* Player Cards (Secret ballot - no counts shown while voting) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {alivePlayers.map((p) => {
                    const isSelf = p.socketId === myPlayer?.socketId;
                    const isSelected = selectedTarget === p.socketId;

                    return (
                      <button
                        key={p.socketId}
                        disabled={hasVoted}
                        onClick={() => setSelectedTarget(p.socketId)}
                        className={`p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-900/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">👤</span>
                          <div>
                            <span className="font-bold text-sm block">
                              {p.name} {isSelf && '(You)'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                              Developer
                            </span>
                          </div>
                        </div>

                        {isSelected && <Check className="w-5 h-5 text-red-400" />}
                      </button>
                    );
                  })}

                  {/* Skip Option Card */}
                  <button
                    disabled={hasVoted}
                    onClick={() => setSelectedTarget('SKIP')}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                      selectedTarget === 'SKIP'
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-900/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm block">Skip Vote (No Elimination)</span>
                      <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                        Pass current round
                      </span>
                    </div>
                    {selectedTarget === 'SKIP' && <Check className="w-5 h-5 text-amber-400" />}
                  </button>
                </div>

                <button
                  onClick={handleVoteSubmit}
                  disabled={!selectedTarget || hasVoted}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                    hasVoted
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : selectedTarget
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  {hasVoted ? 'Vote Submitted!' : 'Confirm Vote'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
