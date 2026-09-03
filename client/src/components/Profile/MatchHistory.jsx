import React, { useState } from 'react';

const MATCHES = [
  { id: 'G-1029', date: '2023-10-24', result: 'Win', role: 'Developer', difficulty: 'Hard', lang: 'TypeScript', bugs: 5, tests: 12, duration: '45m', xp: '+250' },
  { id: 'G-1028', date: '2023-10-23', result: 'Loss', role: 'Mafia', difficulty: 'Medium', lang: 'Python', bugs: 1, tests: 3, duration: '20m', xp: '+50' },
  { id: 'G-1027', date: '2023-10-21', result: 'Win', role: 'Mafia', difficulty: 'Easy', lang: 'JavaScript', bugs: 0, tests: 0, duration: '15m', xp: '+300' },
  { id: 'G-1026', date: '2023-10-20', result: 'Win', role: 'Developer', difficulty: 'Hard', lang: 'Rust', bugs: 8, tests: 20, duration: '60m', xp: '+400' },
  { id: 'G-1025', date: '2023-10-18', result: 'Loss', role: 'Developer', difficulty: 'Medium', lang: 'Go', bugs: 2, tests: 5, duration: '30m', xp: '+20' },
];

export function MatchHistory() {
  const [filter, setFilter] = useState('All');

  const filteredMatches = MATCHES.filter(match => {
    if (filter === 'All') return true;
    if (filter === 'Wins' && match.result === 'Win') return true;
    if (filter === 'Losses' && match.result === 'Loss') return true;
    if (filter === 'Developer' && match.role === 'Developer') return true;
    if (filter === 'Mafia' && match.role === 'Mafia') return true;
    return false;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {['All', 'Wins', 'Losses', 'Developer', 'Mafia'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 border-2 border-purple-500/40 font-pixel text-[8px] uppercase cursor-pointer ${filter === f ? 'bg-purple-600 text-white' : 'bg-black/40 text-purple-200 hover:bg-purple-900/40'}`}
          >
            {f}
          </button>
        ))}
      </div>
      
      <div className="overflow-x-auto border-4 border-purple-500/40 bg-[#1a0b2e] shadow-[4px_4px_0_#5a1a9e]">
        <table className="w-full text-left font-pixel text-[8px] sm:text-[10px]">
          <thead className="bg-purple-950 text-purple-300 border-b-4 border-purple-500/40">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Result</th>
              <th className="p-3">Role</th>
              <th className="p-3">Lang</th>
              <th className="p-3">Diff</th>
              <th className="p-3 text-right">XP</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map(match => (
              <tr key={match.id} className="border-b-2 border-purple-500/20 last:border-b-0 hover:bg-purple-900/30 cursor-pointer transition-colors text-white">
                <td className="p-3">{match.id}</td>
                <td className="p-3">
                  <span className={match.result === 'Win' ? 'text-green-400' : 'text-red-400'}>{match.result}</span>
                </td>
                <td className="p-3">{match.role}</td>
                <td className="p-3">{match.lang}</td>
                <td className="p-3">{match.difficulty}</td>
                <td className="p-3 text-right text-purple-300">{match.xp}</td>
              </tr>
            ))}
            {filteredMatches.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-purple-400/60">No matches found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
