import React, { useState } from 'react';

export function EditProfileDialog({ onClose, onSave }) {
  const [username, setUsername] = useState('NeoDebugger');
  const [lang, setLang] = useState('TypeScript');
  const [diff, setDiff] = useState('Hard');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md border-4 border-purple-500/40 bg-[#1a0b2e] p-6 shadow-[8px_8px_0_#5a1a9e] flex flex-col gap-6 animate-pop">
        <h2 className="font-pixel text-xl uppercase text-white">Edit Profile</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-pixel text-[10px] text-purple-300">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="border-2 border-purple-500/40 bg-black/70 p-3 font-pixel text-[10px] text-white focus:outline-none focus:border-purple-400" 
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-pixel text-[10px] text-purple-300">Preferred Language</label>
            <select 
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="border-2 border-purple-500/40 bg-black/70 p-3 font-pixel text-[10px] text-white focus:outline-none focus:border-purple-400"
            >
              <option>TypeScript</option>
              <option>Python</option>
              <option>Rust</option>
              <option>Go</option>
              <option>JavaScript</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-pixel text-[10px] text-purple-300">Preferred Difficulty</label>
            <select 
              value={diff}
              onChange={e => setDiff(e.target.value)}
              className="border-2 border-purple-500/40 bg-black/70 p-3 font-pixel text-[10px] text-white focus:outline-none focus:border-purple-400"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 mt-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 border-2 border-purple-500/30 bg-purple-900/30 font-pixel text-[10px] text-purple-200 hover:bg-purple-800/40 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (onSave) onSave();
              onClose();
            }}
            className="px-4 py-2 border-2 border-purple-400 bg-purple-600 font-pixel text-[10px] text-white hover:bg-purple-500 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
