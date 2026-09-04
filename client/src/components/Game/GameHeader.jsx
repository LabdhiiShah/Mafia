import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import HintModal from './HintModal';
import VictoryStandardsModal from './VictoryStandardsModal';
import { Shield, Skull, Clock, CheckCircle2, XCircle, Users, Eye, HelpCircle, Lightbulb, Zap, Flame, Trophy, Star } from 'lucide-react';

export default function GameHeader() {
  const { room, myPlayer, timerSeconds, testResults } = useSocket();
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showVictoryStandards, setShowVictoryStandards] = useState(false);

  if (!room) return null;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPhaseBadge = () => {
    switch (room.status) {
      case 'CODING_PHASE':
        return { label: 'Sprint Phase (Coding)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'DISCUSSION_PHASE':
        return { label: 'Discussion & Code Review', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'VOTING_PHASE':
        return { label: 'Voting & Elimination', color: 'bg-red-500/10 text-red-400 border-red-500/30 font-bold' };
      default:
        return { label: room.status, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const phaseInfo = getPhaseBadge();

  const totalTests = testResults?.total || 0;
  const passedTests = testResults?.passed || 0;
  const passRate = testResults?.passRate || 0;

  const teamXp = room.gamification?.teamXp || 300;
  const playerStreak = myPlayer?.streak || 0;

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4 select-none relative z-30">
      {showHintModal && (
        <HintModal onClose={() => setShowHintModal(false)} />
      )}

      {showVictoryStandards && (
        <VictoryStandardsModal onClose={() => setShowVictoryStandards(false)} />
      )}

      {/* Left: Brand & Phase */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-red-600/20 text-red-500 rounded-lg border border-red-500/30">
            <Skull className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white">CODE MAFIA</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-purple-400 font-mono font-bold">ROUND {room.round}</span>
              {room.settings?.challengeName && (
                <span className="text-[10px] text-slate-300 font-mono truncate max-w-[200px]">
                  • {room.settings.challengeName} ({room.settings.difficulty || 'Easy'})
                </span>
              )}
            </div>
          </div>
        </div>

        <span className={`text-xs px-3 py-1 rounded-full border font-mono ${phaseInfo.color}`}>
          {phaseInfo.label}
        </span>
      </div>

      {/* Center: Phase Timer & Gamification Tickers */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="font-mono text-xl font-bold tracking-widest text-white">
            {formatTimer(timerSeconds)}
          </span>
        </div>

        {/* Team XP & Player Individual XP */}
        <div className="hidden md:flex items-center gap-2 font-mono text-xs font-bold">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-current text-amber-400" /> TEAM: {teamXp} XP
          </span>

          <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-xl flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" /> MY SCORE: {myPlayer?.xp || 0} XP
          </span>

          {playerStreak > 1 && (
            <span className="px-3 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-xl flex items-center gap-1 animate-bounce">
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-current" /> {playerStreak}x STREAK!
            </span>
          )}
        </div>

        {/* Test Pass Rate Progress Meter */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {passRate === 100 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-slate-400">Tests:</span>
            <span className="font-bold text-white">{passedTests}/{totalTests}</span>
            <span className={`text-xs ${passRate === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              ({passRate}%)
            </span>
          </div>

          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                passRate === 100 ? 'bg-emerald-500' : passRate > 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${passRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right: Rules Button, Hint Button & Role Card */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowVictoryStandards(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold font-mono transition cursor-pointer"
          title="View Victory Standards, Points Rules & Modes"
        >
          <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Rules & Victory Standards</span>
        </button>

        <button
          onClick={() => setShowHintModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold font-mono transition cursor-pointer"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Buy Hint</span>
        </button>

        {myPlayer ? (
          <div className="relative">
            <button
              onClick={() => setShowRoleInfo(!showRoleInfo)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition ${
                myPlayer.role === 'MAFIA'
                  ? 'bg-red-950/40 border-red-500/50 text-red-400 hover:bg-red-900/40'
                  : myPlayer.role === 'DETECTIVE' || myPlayer.role === 'QA_INSPECTOR'
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-400 hover:bg-purple-900/40'
                  : 'bg-blue-950/40 border-blue-500/50 text-blue-400 hover:bg-blue-900/40'
              }`}
            >
              {myPlayer.role === 'MAFIA' ? '💀 MAFIA' : (myPlayer.role === 'DETECTIVE' || myPlayer.role === 'QA_INSPECTOR') ? '🕵️ DETECTIVE' : '🛡️ CIVILIAN'}
              <HelpCircle className="w-3.5 h-3.5 opacity-60" />
            </button>

            {showRoleInfo && (
              <div className="absolute right-0 top-11 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-left">
                <div className="font-bold text-xs uppercase tracking-wider mb-1 text-white">
                  Your Role: {myPlayer.role}
                </div>
                <p className="text-xs text-slate-300 leading-normal font-sans">
                  {myPlayer.secretObjective}
                </p>
                {myPlayer.badges && myPlayer.badges.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-amber-400 font-bold block mb-1">UNLOCKED BADGES:</span>
                    <div className="flex flex-wrap gap-1">
                      {myPlayer.badges.map((b, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-white">
                          🏆 {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-500/50 bg-blue-950/40 text-blue-400 text-xs font-bold font-mono">
            🛡️ DEVELOPER
          </div>
        )}
      </div>
    </header>
  );
}
