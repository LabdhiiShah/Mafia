import React, { useState } from 'react';

export function ProfileHeader({ onEditProfile, onSettings }) {
  const [user] = useState(() => {
    try {
      const raw = localStorage.getItem('code_mafia_user');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { username: 'NeoDebugger' };
  });

  const handleLogout = () => {
    localStorage.removeItem('code_mafia_token');
    localStorage.removeItem('code_mafia_user');
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:items-end border-4 border-purple-500/40 bg-[#1a0b2e]/90 p-6 shadow-[4px_4px_0_#5a1a9e]">
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
            <p className="font-pixel text-[10px] text-purple-300/70 mt-1">ID: #DEV-8832</p>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="font-pixel text-[10px] text-purple-200 [text-shadow:1px_1px_0_#6d1c96]">Rank: Senior Dev</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 gap-2 w-full max-w-xs">
        <div className="flex justify-between items-end font-pixel text-[10px] text-purple-200">
          <span>Level 42</span>
          <span className="text-purple-400">850 / 1000 XP</span>
        </div>
        <div className="h-4 w-full border-2 border-purple-500/40 bg-purple-950">
          <div className="h-full bg-purple-500" style={{ width: '85%' }} />
        </div>
      </div>
      
      <div className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0">
        <button 
          onClick={onEditProfile}
          className="flex-1 rounded-sm border-2 border-purple-400 bg-purple-600 px-4 py-2 font-pixel text-[10px] text-white hover:bg-purple-500 focus:outline-none cursor-pointer"
        >
          Edit Profile
        </button>
        <button 
          onClick={handleLogout}
          className="flex-1 rounded-sm border-2 border-red-500/50 bg-red-950/40 px-4 py-2 font-pixel text-[10px] text-red-300 hover:bg-red-900/60 hover:text-white focus:outline-none cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
