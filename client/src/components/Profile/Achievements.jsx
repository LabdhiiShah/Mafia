import React from 'react';

const ACHIEVEMENTS = [
  { id: 'first-fix', name: 'First Fix', desc: 'Fixed the first bug', unlocked: true },
  { id: 'bug-hunter', name: 'Bug Hunter', desc: 'Fixed 25 bugs', unlocked: true },
  { id: 'debug-master', name: 'Debug Master', desc: 'Fixed 100 bugs', unlocked: false },
  { id: 'test-crusher', name: 'Test Crusher', desc: 'Passed 50 tests', unlocked: true },
  { id: 'survivor', name: 'Survivor', desc: 'Survived multiple Mafia rounds', unlocked: true },
  { id: 'detective', name: 'Detective', desc: 'Correctly identified Mafia players', unlocked: false },
  { id: 'mastermind', name: 'Mastermind', desc: 'Won multiple Mafia games', unlocked: false },
  { id: 'clean-code', name: 'Clean Code', desc: 'Completed a game with minimal regressions', unlocked: true },
  { id: 'speed-debugger', name: 'Speed Debugger', desc: 'Fixed a bug within a short time', unlocked: false },
  { id: 'team-player', name: 'Team Player', desc: 'Won multiple developer games', unlocked: true },
];

export function Achievements() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {ACHIEVEMENTS.map(ach => (
        <div 
          key={ach.id} 
          className={`flex flex-col items-center justify-center text-center p-4 border-2 border-purple-500/40 ${ach.unlocked ? 'bg-[#2a1d3f]' : 'bg-black/40 opacity-50 grayscale'} shadow-[4px_4px_0_#5a1a9e]`}
        >
          <div className="w-12 h-12 mb-2 bg-purple-900/50 rounded-full border-2 border-purple-400 flex items-center justify-center text-xl">
            {ach.unlocked ? '🏆' : '🔒'}
          </div>
          <h4 className="font-pixel text-[8px] sm:text-[10px] text-white mb-1 leading-tight">{ach.name}</h4>
          <p className="font-pixel text-[6px] sm:text-[8px] text-purple-300/70 leading-tight">{ach.desc}</p>
        </div>
      ))}
    </div>
  );
}
