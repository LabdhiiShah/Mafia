import React, { useState } from 'react';
import { Trophy, Skull, Shield, Award, Flame, Zap, CheckCircle2, Clock, X, HelpCircle, AlertOctagon } from 'lucide-react';

export default function VictoryStandardsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('victory'); // 'victory' | 'xp' | 'modes'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans animate-fade-in">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-purple-500/60 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-purple-950/70 border-b border-purple-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/30 border border-purple-400/50 rounded-xl">
              <Trophy className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="font-pixel text-sm text-purple-100 tracking-wider flex items-center gap-2">
                GAME RULES & VICTORY STANDARDS
              </h3>
              <p className="text-xs text-purple-300/70 font-mono">
                Code Mafia • Points System, Win Conditions & Modes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('victory')}
            className={`px-4 py-2 text-xs font-mono rounded-t-xl transition flex items-center gap-2 border-t border-x ${
              activeTab === 'victory'
                ? 'bg-slate-900 text-purple-300 border-purple-500/50 font-bold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" /> Standards of Victory
          </button>

          <button
            onClick={() => setActiveTab('xp')}
            className={`px-4 py-2 text-xs font-mono rounded-t-xl transition flex items-center gap-2 border-t border-x ${
              activeTab === 'xp'
                ? 'bg-slate-900 text-emerald-300 border-emerald-500/50 font-bold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" /> Points & XP Rules
          </button>

          <button
            onClick={() => setActiveTab('modes')}
            className={`px-4 py-2 text-xs font-mono rounded-t-xl transition flex items-center gap-2 border-t border-x ${
              activeTab === 'modes'
                ? 'bg-slate-900 text-blue-300 border-blue-500/50 font-bold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-400" /> Victory Modes
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-6">
          {activeTab === 'victory' && (
            <div className="space-y-6">
              {/* Civilian Standard */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                    <Shield className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-300 font-mono">CIVILIAN & DETECTIVE VICTORY STANDARD</h4>
                    <p className="text-[11px] text-emerald-200/80">Civilians win by stabilizing code or eliminating all saboteurs.</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 font-mono pl-4 list-disc">
                  <li>
                    <strong className="text-emerald-400">100% Codebase Fix:</strong> Pass 100% of all unit test suites in the broken codebase during the Sprint Phase.
                  </li>
                  <li>
                    <strong className="text-emerald-400">Mafia Extermination:</strong> Identify and vote out 100% of Mafia saboteurs during Voting Phases.
                  </li>
                </ul>
              </div>

              {/* Mafia Standard */}
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
                    <Skull className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-red-300 font-mono">MAFIA SABOTEUR VICTORY STANDARD</h4>
                    <p className="text-[11px] text-red-200/80">Mafia win by sabotaging code, eliminating developers, or controlling majority votes.</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 font-mono pl-4 list-disc">
                  <li>
                    <strong className="text-red-400">Majority Control:</strong> Equalize or surpass the number of surviving Civilians.
                  </li>
                  <li>
                    <strong className="text-red-400">System Collapse (Time Expired):</strong> Sprint timer expires in the final round without 100% test completion.
                  </li>
                  <li>
                    <strong className="text-red-400">Subcode Mortality:</strong> Eliminate Civilians using the 30-second timed Subcode Outbreak power.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'xp' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono">
                XP & POINTS REWARD SYSTEM
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-400 block">Unit Test Suite Fix</span>
                    <span className="text-[11px] text-slate-400">Passing test suite</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 rounded-lg border border-emerald-800 font-bold">
                    +50 XP
                  </span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-400 block">Risky Test Run</span>
                    <span className="text-[11px] text-slate-400">Pass under risk (-15s penalty on fail)</span>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-950 text-purple-300 rounded-lg border border-purple-800 font-bold">
                    +150 XP
                  </span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-400 block">Subcode Containment</span>
                    <span className="text-[11px] text-slate-400">Fixing a 30s Subcode Outbreak</span>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-950 text-amber-300 rounded-lg border border-amber-800 font-bold">
                    +100 XP
                  </span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-400 block">Correct Mafia Vote</span>
                    <span className="text-[11px] text-slate-400">Voting out a Mafia saboteur</span>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-950 text-blue-300 rounded-lg border border-blue-800 font-bold">
                    +150 XP
                  </span>
                </div>
              </div>

              {/* Multiplier Info */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h5 className="font-bold text-xs text-amber-300 font-mono flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" /> STREAK COMBO MULTIPLIERS
                </h5>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">1st Pass</span>
                    <strong className="text-white">1.0x XP</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-amber-400 block text-[10px]">2 Consecutive</span>
                    <strong className="text-amber-300">1.5x XP</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-rose-400 block text-[10px]">3+ Streak Master</span>
                    <strong className="text-rose-300">2.0x XP 🔥</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modes' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono">
                CONFIGURABLE MATCH VICTORY MODES
              </h4>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 bg-slate-900 border border-purple-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300">STANDARD MODE</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">DEFAULT</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Civilians must pass 100% of unit tests or eliminate all Mafia across 3 rounds.
                  </p>
                </div>

                <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">DEBUG RUSH MODE</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">FAST PACE & 2X XP</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Shorter coding duration (120s) with 2x bonus XP for rapid bug fixes and high intensity.
                  </p>
                </div>

                <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">SURVIVAL MODE</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">HARDCORE</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Civilians win if at least 1 civilian survives 3 rounds of sabotage with at least 80% test pass rate.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-purple-950/50"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
