import React, { useState, useEffect } from 'react';
import { Terminal, Settings, User } from 'lucide-react';

export function Navbar({ onNavigateHome, onOpenProfile }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 ${
        scrolled
          ? 'bg-[#1a0b2e]/80 backdrop-blur-md border-b border-purple-500/20'
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-8">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-white group bg-transparent border-none cursor-pointer"
        >
          <Terminal className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
          <span className="font-pixel text-sm tracking-wider text-purple-100 group-hover:text-white transition-colors [text-shadow:0_0_10px_rgba(168,85,247,0.4)]">
            CODE MAFIA
          </span>
        </button>
        <div className="hidden md:flex items-center gap-6 text-xs font-medium tracking-widest text-purple-200/70 font-pixel">
          <a href="#home" className="hover:text-purple-300 hover:[text-shadow:0_0_8px_rgba(168,85,247,0.5)] transition-all">
            HOME
          </a>
          <a href="#how-it-works" className="hover:text-purple-300 hover:[text-shadow:0_0_8px_rgba(168,85,247,0.5)] transition-all">
            HOW IT WORKS
          </a>
          <a href="#leaderboard" className="hover:text-purple-300 hover:[text-shadow:0_0_8px_rgba(168,85,247,0.5)] transition-all">
            LEADERBOARD
          </a>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse [box-shadow:0_0_8px_#22c55e]" />
          <span className="text-[10px] tracking-widest text-purple-200/70 font-pixel">124 PLAYERS ONLINE</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenProfile}
            className="p-2 rounded-md bg-purple-900/30 border border-purple-500/20 text-purple-300 hover:bg-purple-800/40 hover:text-white hover:border-purple-400/50 transition-all group cursor-pointer"
          >
            <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            className="p-2 rounded-md bg-purple-900/30 border border-purple-500/20 text-purple-300 hover:bg-purple-800/40 hover:text-white hover:border-purple-400/50 transition-all group cursor-pointer"
          >
            <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
}
