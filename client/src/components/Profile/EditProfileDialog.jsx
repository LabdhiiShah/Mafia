import React, { useState } from 'react';

export function EditProfileDialog({ onClose, onSave, currentProfile }) {
  const savedUser = (() => {
    try {
      const raw = localStorage.getItem('code_mafia_user');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  })();

  const [username, setUsername] = useState(currentProfile?.username || savedUser?.username || 'NeoDebugger');
  const [lang, setLang] = useState(currentProfile?.preferred_language || savedUser?.preferred_language || 'JavaScript');
  const [diff, setDiff] = useState(currentProfile?.preferred_difficulty || savedUser?.preferred_difficulty || 'Medium');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);

    const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';
    const baseUrl = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;

    try {
      const currentUsername = savedUser?.username || username;

      const res = await fetch(`${baseUrl}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          newUsername: username,
          preferred_language: lang,
          preferred_difficulty: diff,
          avatar: currentProfile?.avatar || savedUser?.avatar || 'avatar_1'
        })
      });

      const data = await res.json();
      if (data && data.success) {
        const updatedUser = {
          ...savedUser,
          username: username,
          preferred_language: lang,
          preferred_difficulty: diff
        };
        localStorage.setItem('code_mafia_user', JSON.stringify(updatedUser));
        if (onSave) onSave(data.profile || updatedUser);
        onClose();
      } else {
        setErrorMsg(data?.error || 'Failed to update profile in DB');
      }
    } catch (err) {
      const updatedUser = {
        ...savedUser,
        username: username,
        preferred_language: lang,
        preferred_difficulty: diff
      };
      localStorage.setItem('code_mafia_user', JSON.stringify(updatedUser));
      if (onSave) onSave(updatedUser);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-md border-4 border-purple-500/40 bg-[#1a0b2e] p-6 shadow-[8px_8px_0_#5a1a9e] flex flex-col gap-6 animate-pop">
        <h2 className="font-pixel text-xl uppercase text-white">Edit Profile</h2>

        {errorMsg && (
          <div className="p-2 bg-red-950 text-red-300 border border-red-500 rounded text-xs font-mono">
            {errorMsg}
          </div>
        )}

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
              <option>JavaScript</option>
              <option>TypeScript</option>
              <option>Python</option>
              <option>Rust</option>
              <option>Go</option>
              <option>C++</option>
              <option>C</option>
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
              <option>Expert</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 border-2 border-purple-500/30 bg-purple-900/30 font-pixel text-[10px] text-purple-200 hover:bg-purple-800/40 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-4 py-2 border-2 border-purple-400 bg-purple-600 font-pixel text-[10px] text-white hover:bg-purple-500 cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
