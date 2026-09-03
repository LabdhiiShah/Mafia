import React, { useState } from 'react';
import { X, Copy, Share2, Play } from 'lucide-react';

export function CreateGameModal({ onClose, onProceedToLobby }) {
  const [mode, setMode] = useState('ONLINE');
  const [players, setPlayers] = useState(8);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [language, setLanguage] = useState('PYTHON');
  const [duration, setDuration] = useState('15 MIN');
  const [intensity, setIntensity] = useState('MEDIUM');
  const [victory, setVictory] = useState('STANDARD');
  const [created, setCreated] = useState(false);
  const [caseCode, setCaseCode] = useState('');

  const getMafiaCount = (p) => {
    if (p <= 5) return 1;
    if (p <= 8) return 2;
    return 3;
  };

  const handleCreate = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCaseCode(code);
    setCreated(true);
  };

  const handleEnterLobby = () => {
    if (onProceedToLobby) {
      onProceedToLobby({ mode, players, difficulty, language, caseCode });
    }
  };

  if (created) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="relative w-full max-w-lg bg-[#1a0b2e] border border-purple-500/40 rounded-lg p-10 text-center shadow-[0_0_80px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-300">
          <button onClick={onClose} className="absolute top-4 right-4 text-purple-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          
          <h2 className="font-pixel text-2xl text-white mb-2 [text-shadow:0_0_15px_rgba(168,85,247,0.6)]">INVESTIGATION CREATED</h2>
          <p className="text-purple-300/60 text-sm mb-12">Waiting for investigators...</p>
          
          <div className="mb-10">
            <span className="text-xs text-purple-400 font-pixel">CASE CODE</span>
            <div className="text-5xl font-pixel tracking-widest text-white mt-4 [text-shadow:0_0_20px_rgba(168,85,247,0.8)]">{caseCode}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-900/30 border border-purple-500/30 text-purple-200 font-pixel text-[10px] rounded-sm hover:bg-purple-800/40 transition-all cursor-pointer">
              <Copy className="w-4 h-4" /> COPY CODE
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-900/30 border border-purple-500/30 text-purple-200 font-pixel text-[10px] rounded-sm hover:bg-purple-800/40 transition-all cursor-pointer">
              <Share2 className="w-4 h-4" /> SHARE
            </button>
            <button onClick={handleEnterLobby} className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 border border-purple-400 text-white font-pixel text-[10px] rounded-sm hover:bg-purple-500 [box-shadow:0_0_15px_rgba(168,85,247,0.5)] transition-all cursor-pointer">
              <Play className="w-4 h-4" /> ENTER LOBBY
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#1a0b2e] border border-purple-500/30 rounded-lg shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-in zoom-in-95 duration-200 my-8 flex flex-col md:flex-row overflow-hidden">
        
        {/* Main Configuration Area */}
        <div className="flex-1 p-8 md:p-10 border-r border-purple-500/20 overflow-y-auto max-h-[85vh] custom-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="font-pixel text-xl text-white mb-2 [text-shadow:0_0_10px_rgba(168,85,247,0.5)]">CREATE INVESTIGATION</h2>
              <p className="text-purple-300/60 text-sm">Configure your game before entering the network.</p>
            </div>
            <button onClick={onClose} className="md:hidden text-purple-400 cursor-pointer"><X className="w-6 h-6" /></button>
          </div>

          <div className="space-y-10">
            {/* Mode */}
            <section>
              <h3 className="font-pixel text-[10px] text-purple-400 mb-4">GAME MODE</h3>
              <div className="flex gap-4">
                {['ONLINE', 'LOCAL'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => setMode(m)}
                    className={`flex-1 py-3 font-pixel text-[10px] rounded-sm border transition-all cursor-pointer ${mode === m ? 'bg-purple-600/30 border-purple-400 text-white [box-shadow:0_0_15px_rgba(168,85,247,0.3)]' : 'bg-black/30 border-purple-900 text-purple-500/70 hover:border-purple-500/50'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </section>

            {/* Players */}
            <section>
              <div className="flex justify-between mb-4">
                <h3 className="font-pixel text-[10px] text-purple-400">PLAYERS</h3>
                <span className="font-pixel text-[10px] text-purple-200">{players} PLAYERS / {getMafiaCount(players)} MAFIA</span>
              </div>
              <input 
                type="range" 
                min="4" max="12" 
                value={players} 
                onChange={(e) => setPlayers(Number(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-[10px] font-pixel text-purple-500/50">
                <span>4</span><span>12</span>
              </div>
            </section>

            {/* Options grids */}
            {[
              { label: 'DIFFICULTY', state: difficulty, set: setDifficulty, opts: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] },
              { label: 'LANGUAGE', state: language, set: setLanguage, opts: ['PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'JAVA', 'C++', 'C#', 'GO', 'RUST'], desc: 'All players use the selected language.' },
              { label: 'DURATION', state: duration, set: setDuration, opts: ['10 MIN', '15 MIN', '20 MIN', '30 MIN'] },
              { label: 'BUG INTENSITY', state: intensity, set: setIntensity, opts: ['LOW', 'MEDIUM', 'HIGH'] },
              { label: 'VICTORY CONDITION', state: victory, set: setVictory, opts: ['STANDARD', 'DEBUG RUSH', 'SURVIVAL'] },
            ].map(group => (
              <section key={group.label}>
                <h3 className="font-pixel text-[10px] text-purple-400 mb-4">{group.label}</h3>
                {group.desc && <p className="text-xs text-purple-300/50 mb-4 -mt-2">{group.desc}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.opts.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => group.set(opt)}
                      className={`py-3 px-2 font-pixel text-[8px] rounded-sm border transition-all cursor-pointer ${group.state === opt ? 'bg-purple-600/30 border-purple-400 text-white [box-shadow:0_0_10px_rgba(168,85,247,0.2)]' : 'bg-black/30 border-purple-900 text-purple-500/70 hover:border-purple-500/50 hover:bg-purple-900/10'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Sticky Summary Area */}
        <div className="w-full md:w-80 bg-[#120722] p-8 md:p-10 flex flex-col h-full md:sticky md:top-0">
          <button onClick={onClose} className="hidden md:block absolute top-6 right-6 text-purple-500/50 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          
          <h3 className="font-pixel text-sm text-purple-300 mb-8 border-b border-purple-500/20 pb-4">INVESTIGATION SUMMARY</h3>
          
          <div className="flex-1 space-y-6">
            {[
              { label: 'MODE', val: mode },
              { label: 'PLAYERS', val: `${players} PLAYERS` },
              { label: 'MAFIA', val: `${getMafiaCount(players)} MAFIA`, color: 'text-red-400' },
              { label: 'DIFFICULTY', val: difficulty },
              { label: 'LANGUAGE', val: language },
              { label: 'DURATION', val: duration },
              { label: 'BUG INTENSITY', val: intensity },
              { label: 'VICTORY', val: victory },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="font-pixel text-[8px] text-purple-500/70">{item.label}</span>
                <span className={`font-pixel text-[10px] ${item.color || 'text-white'}`}>{item.val}</span>
              </div>
            ))}

            <div className="mt-8 p-4 bg-green-900/10 border border-green-500/20 rounded-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse [box-shadow:0_0_8px_#22c55e]" />
                <span className="font-pixel text-[10px] text-green-400">SYSTEM HEALTH: 100%</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-purple-500/20">
            <button 
              onClick={handleCreate}
              className="w-full py-4 bg-purple-600 border border-purple-400 text-white font-pixel text-[12px] rounded-sm hover:bg-purple-500 [box-shadow:0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
            >
              CREATE GAME
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
