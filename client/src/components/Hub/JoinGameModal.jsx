import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

export function JoinGameModal({ onClose, onProceedToLobby }) {
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState(() => {
    try {
      const raw = localStorage.getItem('code_mafia_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.username) return u.username;
      }
    } catch (e) {}
    return '';
  });
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 3) return;
    setStatus('connecting');
    setErrorMessage('');
    
    if (onProceedToLobby) {
      const res = await onProceedToLobby({ 
        caseCode: trimmed,
        playerName: playerName.trim() || undefined
      });
      if (res && res.success === false) {
        setStatus('error');
        setErrorMessage(res.error || 'Failed to join room. Please check the room code.');
        return;
      }
    }
  };

  const isValid = code.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1a0b2e] border border-purple-500/30 rounded-lg p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="font-pixel text-xl text-white mb-2 [text-shadow:0_0_10px_rgba(168,85,247,0.5)]">JOIN INVESTIGATION</h2>
          <p className="text-purple-300/60 text-xs font-pixel">Enter developer handle & case code.</p>
        </div>

        {status === 'idle' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-pixel text-purple-400 mb-2 uppercase">Developer Handle</label>
              <input 
                type="text" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter handle (e.g. CyberCoder)"
                className="w-full bg-black/50 border border-purple-500/30 rounded-md px-4 py-3 font-pixel text-xs text-white placeholder-purple-900 focus:outline-none focus:border-purple-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-pixel text-purple-400 mb-2 uppercase">Case Code</label>
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12))}
                placeholder="MAFIA-4921"
                className="w-full bg-black/50 border border-purple-500/30 rounded-md p-4 text-center font-pixel text-xl tracking-[0.2em] text-white placeholder-purple-900 focus:outline-none focus:border-purple-400 focus:[box-shadow:0_0_15px_rgba(168,85,247,0.3)] transition-all"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={onClose}
                className="flex-1 py-3 bg-transparent border border-purple-500/30 text-purple-300 font-pixel text-[10px] rounded-sm hover:bg-purple-900/30 transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button 
                onClick={handleJoin}
                disabled={!isValid}
                className={`flex-1 py-3 font-pixel text-[10px] rounded-sm transition-all cursor-pointer ${
                  isValid 
                    ? 'bg-purple-600 text-white border border-purple-400 [box-shadow:0_0_15px_rgba(168,85,247,0.5)] hover:bg-purple-500' 
                    : 'bg-purple-900/20 text-purple-500/50 border border-purple-900/50 cursor-not-allowed'
                }`}
              >
                JOIN GAME
              </button>
            </div>
          </div>
        )}

        {status === 'connecting' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Search className="w-8 h-8 text-purple-400 animate-pulse" />
            <p className="font-pixel text-[10px] text-purple-300 animate-pulse">Connecting to investigation...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-6 text-center">
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-pixel text-xs">{errorMessage || 'Backend connection required to join this game.'}</p>
            </div>
            <button 
              onClick={() => setStatus('idle')}
              className="px-6 py-3 bg-purple-900/40 border border-purple-500/30 text-purple-200 font-pixel text-[10px] rounded-sm hover:bg-purple-800/50 transition-all cursor-pointer"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
