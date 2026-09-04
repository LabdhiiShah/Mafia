import React, { useState } from 'react';

export function ProfileHeader({ profileData, onEditProfile, onSettings }) {
  const user = profileData || (() => {
    try {
      const raw = localStorage.getItem('code_mafia_user');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { username: 'NeoDebugger' };
  })();

  const handleLogout = () => {
    localStorage.removeItem('code_mafia_token');
    localStorage.removeItem('code_mafia_user');
    window.location.href = '/login';
  };

  const currentXp = user.xp || 4850;
  const level = Math.floor(currentXp / 1000) + 1;
  const xpInCurrentLevel = currentXp % 1000;
  const xpPercent = Math.min(100, Math.round((xpInCurrentLevel / 1000) * 100));

  return (
    <div className="flex flex-col md:flex-row gap-6 md:items-end border-4 border-purple-500/40 bg-[#1a0b2e]/90 p-6 shadow-[4px_4px_0_#5a1a9e] font-sans">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative h-24 w-24 border-4 border-purple-400 overflow-hidden bg-purple-950">
          <img 
            src="/sprites/detective.png" 
            alt="Player Avatar" 
            className="w-full h-full object-cover [image-rendering:pixelated]"
          />
          <div className="absolute bottom-1 right-1 h-3 w-3 bg-green-500 border-2 border-purple-950" title="Online" />
        </div>
        
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="font-pixel text-xl sm:text-2xl text-white">{user.username || 'NeoDebugger'}</h1>
            <p className="font-pixel text-[10px] text-purple-300/70 mt-1">ID: #DEV-{(user.id || 8832).toString().slice(0, 6)}</p>
          </div>
          
          <div className="flex items-center gap-2 mt-2 font-pixel text-[10px] text-purple-200">
            <span className="[text-shadow:1px_1px_0_#6d1c96]">Rank: Senior Dev</span>
            <span className="text-purple-400">•</span>
            <span className="text-emerald-400">{user.preferred_language || 'JavaScript'}</span>
            <span className="text-purple-400">•</span>
            <span className="text-amber-300">{user.preferred_difficulty || 'Medium'}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 gap-2 w-full max-w-xs font-mono">
        <div className="flex justify-between items-end text-xs text-purple-200">
          <span className="font-bold">Level {level}</span>
          <span className="text-purple-400 font-bold">{xpInCurrentLevel} / 1000 XP (Total: {currentXp.toLocaleString()})</span>
        </div>
        <div className="h-4 w-full border-2 border-purple-500/40 bg-purple-950 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400 transition-all duration-500" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>
      
      <div className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0">
        <button 
          type="button"
          onClick={onEditProfile}
          className="flex-1 rounded-sm border-2 border-purple-400 bg-purple-600 px-4 py-2 font-pixel text-[10px] text-white hover:bg-purple-500 focus:outline-none cursor-pointer"
        >
          Edit Profile
        </button>
        <button 
          type="button"
          onClick={handleLogout}
          className="flex-1 rounded-sm border-2 border-red-500/50 bg-red-950/40 px-4 py-2 font-pixel text-[10px] text-red-300 hover:bg-red-900/60 hover:text-white focus:outline-none cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
