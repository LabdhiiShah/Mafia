import React, { useState, useEffect } from 'react';
import { Trophy, Award, Crown, Shield, Skull, Zap } from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

const MOCK_TOP3 = [
  { username: 'CyberNinja', avatar: 'avatar_1', total_games: 42, dev_wins: 28, mafia_wins: 10, total_wins: 38 },
  { username: 'HackerCat', avatar: 'avatar_2', total_games: 35, dev_wins: 22, mafia_wins: 8, total_wins: 30 },
  { username: 'GhostCoder', avatar: 'avatar_4', total_games: 30, dev_wins: 18, mafia_wins: 7, total_wins: 25 }
];

export function TopLeaderboardSection() {
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/leaderboard`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Fill remaining top 3 slots with mock data if less than 3
          const combined = [...data];
          while (combined.length < 3) {
            combined.push(MOCK_TOP3[combined.length]);
          }
          setTopPlayers(combined.slice(0, 3));
        } else {
          setTopPlayers(MOCK_TOP3);
        }
        setLoading(false);
      })
      .catch(() => {
        setTopPlayers(MOCK_TOP3);
        setLoading(false);
      });
  }, []);

  const p1 = topPlayers[0] || MOCK_TOP3[0];
  const p2 = topPlayers[1] || MOCK_TOP3[1];
  const p3 = topPlayers[2] || MOCK_TOP3[2];

  return (
    <section id="leaderboard" className="relative py-20 px-4 max-w-6xl mx-auto border-t border-purple-500/20">
      {/* Section Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[10px] tracking-widest text-amber-300 border border-amber-500/30 bg-amber-900/30 rounded-full font-pixel">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          HALL OF FAME // TOP INVESTIGATORS
        </div>
        <h2 className="font-pixel text-3xl md:text-5xl text-white tracking-wider [text-shadow:0_0_25px_rgba(245,158,11,0.5)]">
          TOP 3 PLAYERS LEADERBOARD
        </h2>
        <p className="text-purple-300/60 text-sm max-w-xl mx-auto font-sans leading-relaxed">
          The highest ranking developers and covert saboteurs in Code Mafia history.
        </p>
      </div>

      {/* Podium Top 3 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto pt-8">
        
        {/* 2ND PLACE (SILVER) - Left */}
        <div className="order-2 md:order-1 p-6 bg-[#170a2c] border border-slate-400/40 rounded-lg text-center shadow-xl hover:-translate-y-1 transition-all [box-shadow:0_0_25px_rgba(148,163,184,0.15)]">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 border-2 border-slate-300 flex items-center justify-center text-3xl shadow-md">
              🐱‍💻
            </div>
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-slate-200 text-slate-950 font-pixel text-[10px] font-bold rounded-full border border-slate-400">
              2ND
            </span>
          </div>

          <h3 className="font-pixel text-lg text-white mb-1 truncate">{p2.username}</h3>
          <span className="font-pixel text-[9px] text-slate-300 block mb-4">SILVER MEDALIST</span>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-700/50 font-pixel text-[10px]">
            <div className="p-2 bg-black/40 rounded border border-slate-700">
              <span className="text-slate-400 block text-[8px]">TOTAL WINS</span>
              <span className="text-slate-200 text-sm font-bold">{p2.total_wins || (p2.dev_wins + p2.mafia_wins)}</span>
            </div>
            <div className="p-2 bg-black/40 rounded border border-slate-700">
              <span className="text-slate-400 block text-[8px]">MATCHES</span>
              <span className="text-slate-200 text-sm font-bold">{p2.total_games}</span>
            </div>
          </div>
        </div>

        {/* 1ST PLACE (GOLD) - Center Elevated */}
        <div className="order-1 md:order-2 p-8 bg-[#210c3d] border-2 border-amber-400/60 rounded-lg text-center shadow-2xl hover:-translate-y-2 transition-all [box-shadow:0_0_40px_rgba(245,158,11,0.3)] md:-translate-y-4 relative">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-slate-950 font-pixel text-[10px] font-bold rounded-full border border-amber-300 flex items-center gap-1 shadow-lg">
            <Crown className="w-3.5 h-3.5 fill-current" /> 1ST PLACE CHAMPION
          </div>

          <div className="relative inline-block mb-4 mt-2">
            <div className="w-24 h-24 mx-auto rounded-full bg-slate-900 border-4 border-amber-400 flex items-center justify-center text-4xl shadow-xl [box-shadow:0_0_20px_rgba(245,158,11,0.4)]">
              🥷
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-amber-400 text-slate-950 font-pixel text-[9px] font-bold rounded-full">
              GOLD
            </span>
          </div>

          <h3 className="font-pixel text-2xl text-white mb-1 truncate [text-shadow:0_0_10px_rgba(245,158,11,0.6)]">{p1.username}</h3>
          <span className="font-pixel text-[10px] text-amber-400 block mb-6">SUPREME LEADERBOARD CHAMPION</span>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-amber-500/30 font-pixel text-[10px]">
            <div className="p-3 bg-black/50 rounded border border-amber-500/40">
              <span className="text-amber-300/70 block text-[8px]">TOTAL WINS</span>
              <span className="text-amber-400 text-base font-bold">{p1.total_wins || (p1.dev_wins + p1.mafia_wins)}</span>
            </div>
            <div className="p-3 bg-black/50 rounded border border-amber-500/40">
              <span className="text-amber-300/70 block text-[8px]">MATCHES PLAYED</span>
              <span className="text-amber-400 text-base font-bold">{p1.total_games}</span>
            </div>
          </div>
        </div>

        {/* 3RD PLACE (BRONZE) - Right */}
        <div className="order-3 p-6 bg-[#170a2c] border border-amber-700/40 rounded-lg text-center shadow-xl hover:-translate-y-1 transition-all [box-shadow:0_0_25px_rgba(180,83,9,0.15)]">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 border-2 border-amber-600 flex items-center justify-center text-3xl shadow-md">
              👻
            </div>
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-700 text-white font-pixel text-[10px] font-bold rounded-full border border-amber-500">
              3RD
            </span>
          </div>

          <h3 className="font-pixel text-lg text-white mb-1 truncate">{p3.username}</h3>
          <span className="font-pixel text-[9px] text-amber-500 block mb-4">BRONZE CONTENDER</span>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-amber-800/50 font-pixel text-[10px]">
            <div className="p-2 bg-black/40 rounded border border-amber-800/40">
              <span className="text-amber-400/60 block text-[8px]">TOTAL WINS</span>
              <span className="text-amber-300 text-sm font-bold">{p3.total_wins || (p3.dev_wins + p3.mafia_wins)}</span>
            </div>
            <div className="p-2 bg-black/40 rounded border border-amber-800/40">
              <span className="text-amber-400/60 block text-[8px]">MATCHES</span>
              <span className="text-amber-300 text-sm font-bold">{p3.total_games}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
