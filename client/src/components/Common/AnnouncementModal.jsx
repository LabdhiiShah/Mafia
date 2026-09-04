import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Volume2, X, AlertTriangle, Shield, Skull, Eye, Award, Zap, Flame, CheckCircle2 } from 'lucide-react';

export default function AnnouncementModal() {
  const { activeAnnouncement, setActiveAnnouncement } = useSocket();
  const [timeLeft, setTimeLeft] = useState(6);

  useEffect(() => {
    if (!activeAnnouncement) return;
    setTimeLeft(6);

    // Play retro arcade Web Audio API sound effect on announcement
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = activeAnnouncement.theme === 'EMERALD' ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(activeAnnouncement.theme === 'EMERALD' ? 587.33 : 220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(activeAnnouncement.theme === 'EMERALD' ? 880 : 110, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveAnnouncement(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAnnouncement, setActiveAnnouncement]);

  if (!activeAnnouncement) return null;

  const getThemeStyles = (theme) => {
    switch (theme) {
      case 'EMERALD':
        return {
          border: 'border-4 border-emerald-400',
          glow: 'shadow-[0_0_50px_rgba(52,211,153,0.5)]',
          badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
          titleColor: 'text-emerald-300',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-300'
        };
      case 'RED':
        return {
          border: 'border-4 border-rose-500',
          glow: 'shadow-[0_0_50px_rgba(244,63,94,0.6)]',
          badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-500/50',
          titleColor: 'text-rose-400',
          btnBg: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-300'
        };
      case 'PURPLE':
        return {
          border: 'border-4 border-purple-500',
          glow: 'shadow-[0_0_50px_rgba(168,85,247,0.6)]',
          badgeBg: 'bg-purple-950/90 text-purple-300 border-purple-500/50',
          titleColor: 'text-purple-300',
          btnBg: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-300'
        };
      case 'AMBER':
        return {
          border: 'border-4 border-amber-400',
          glow: 'shadow-[0_0_50px_rgba(251,191,36,0.6)]',
          badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-500/50',
          titleColor: 'text-amber-300',
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-300'
        };
      default:
        return {
          border: 'border-4 border-cyan-400',
          glow: 'shadow-[0_0_50px_rgba(34,211,238,0.5)]',
          badgeBg: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50',
          titleColor: 'text-cyan-300',
          btnBg: 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-300'
        };
    }
  };

  const themeStyle = getThemeStyles(activeAnnouncement.theme);
  const progressPercent = (timeLeft / 6) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0510]/90 backdrop-blur-md select-none font-sans animate-fade-in">
      {/* CRT Scanline Overlay Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      {/* Main Retro Arcade Announcement Box */}
      <div className={`relative w-full max-w-xl bg-gradient-to-b from-[#1a0b2e] via-[#0a0510] to-[#25003e] ${themeStyle.border} ${themeStyle.glow} rounded-3xl overflow-hidden shadow-2xl`}>
        {/* Retro Header Bar */}
        <div className="px-6 py-3 bg-[#0a0510] border-b-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-pixel text-[10px] tracking-wider text-purple-300">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span>LIVE ROOM BROADCAST</span>
          </div>

          <button
            onClick={() => setActiveAnnouncement(null)}
            className="p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-5">
          {/* Sprite Character / Icon Badge */}
          {activeAnnouncement.sprite ? (
            <div className="relative">
              <img
                src={activeAnnouncement.sprite}
                alt="Character Sprite"
                className="h-28 w-auto [image-rendering:pixelated] animate-bob drop-shadow-[0_4px_0_rgba(0,0,0,0.6)]"
              />
              <span className="absolute -bottom-2 -right-2 text-2xl p-1.5 bg-slate-900 border-2 border-purple-500 rounded-xl shadow">
                {activeAnnouncement.icon || '📢'}
              </span>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl border-2 ${themeStyle.badgeBg} shadow-lg animate-bounce`}>
              <span className="text-4xl">{activeAnnouncement.icon || '📢'}</span>
            </div>
          )}

          {/* Title with Pixel Font & Drop Shadow */}
          <div>
            <h2 className={`font-pixel text-lg sm:text-xl md:text-2xl uppercase tracking-wider ${themeStyle.titleColor} [text-shadow:3px_3px_0_#000]`}>
              {activeAnnouncement.title}
            </h2>
            <div className="w-24 h-1 mx-auto mt-2 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full" />
          </div>

          {/* Retro Speech Bubble Message Box */}
          <div className="w-full bg-[#0a0510]/80 border-2 border-slate-700/80 rounded-2xl p-4 shadow-inner text-center">
            <p className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed">
              {activeAnnouncement.message}
            </p>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 transition-all duration-1000 ease-linear shadow"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Dismiss Action Button */}
          <button
            onClick={() => setActiveAnnouncement(null)}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-pixel text-xs tracking-wider border-2 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${themeStyle.btnBg}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>DISMISS ANNOUNCEMENT ({timeLeft}s)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
