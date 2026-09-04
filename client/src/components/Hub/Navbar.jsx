import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, User } from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

export function Navbar({ onNavigateHome, onOpenProfile }) {
  const [scrolled, setScrolled] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);

    fetch(`${API_BASE}/api/stats/online`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.onlinePlayers === 'number') {
          setOnlineCount(data.onlinePlayers);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      fetch(`${API_BASE}/api/stats/online`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.onlinePlayers === 'number') {
            setOnlineCount(data.onlinePlayers);
          }
        })
        .catch(() => {});
    }, 15000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(interval);
    };
  }, []);

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (onNavigateHome) onNavigateHome();
    else navigate('/hub');
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (onOpenProfile) onOpenProfile();
    else navigate('/profile');
  };

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
          onClick={handleHomeClick}
          className="flex items-center gap-2 text-white group bg-transparent border-none cursor-pointer"
        >
          <Terminal className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
          <span className="font-pixel text-sm tracking-wider text-purple-100 group-hover:text-white transition-colors [text-shadow:0_0_10px_rgba(168,85,247,0.4)]">
            CODE MAFIA
          </span>
        </button>
        <div className="hidden md:flex items-center gap-6 text-xs font-medium tracking-widest text-purple-200/70 font-pixel">
          <Link to="/hub" className="hover:text-purple-300 hover:[text-shadow:0_0_8px_rgba(168,85,247,0.5)] transition-all">
            HOME
          </Link>
          <Link to="/how-it-works" className="hover:text-purple-300 hover:[text-shadow:0_0_8px_rgba(168,85,247,0.5)] transition-all">
            HOW IT WORKS
          </Link>
          <Link to="/leaderboard" className="hover:text-purple-300 hover:[text-shadow:0_0_8px_rgba(168,85,247,0.5)] transition-all">
            LEADERBOARD
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse [box-shadow:0_0_8px_#22c55e]" />
          <span className="text-[10px] tracking-widest text-purple-200/70 font-pixel">
            {onlineCount} PLAYERS ONLINE
          </span>
        </div>
        <button
          type="button"
          onClick={handleProfileClick}
          className="p-2 rounded-md bg-purple-900/30 border border-purple-500/20 text-purple-300 hover:bg-purple-800/40 hover:text-white hover:border-purple-400/50 transition-all group cursor-pointer"
        >
          <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </nav>
  );
}
