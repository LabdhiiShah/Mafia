import React from 'react';

export function HeroSection({ onCreateClick, onJoinClick, onQuickMatchClick }) {
  return (
    <section id="home" className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center pt-24 overflow-hidden">
      {/* Background glow & particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto space-y-8">
        <p></p>
        <p></p>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-purple-100/90 font-pixel leading-tight [text-shadow:0_0_15px_rgba(168,85,247,0.25)]">
            DEBUG.<br className="md:hidden" /> COLLABORATE.<br className="md:hidden" /> BETRAY.
          </h1>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <p></p>
          <p className="text-lg md:text-xl text-purple-200/90 font-medium tracking-wide">
            The bug isn't your only problem.
          </p>
          <p className="text-sm md:text-base text-purple-300/60 leading-relaxed max-w-xl mx-auto">
            Ship the fix Catch the spy
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-8 w-full sm:w-auto">
          <button 
            type="button"
            onClick={onCreateClick}
            className="w-full sm:w-auto px-8 py-4 font-pixel text-xs tracking-wider text-white bg-purple-600 rounded-sm border-2 border-purple-400 [box-shadow:0_0_20px_rgba(168,85,247,0.6)] hover:bg-purple-500 hover:[box-shadow:0_0_30px_rgba(168,85,247,0.8)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            CREATE GAME
          </button>
          
          <button 
            type="button"
            onClick={onJoinClick}
            className="w-full sm:w-auto px-8 py-4 font-pixel text-xs tracking-wider text-purple-100 bg-black/40 rounded-sm border-2 border-purple-500/50 backdrop-blur-md hover:bg-purple-900/40 hover:border-purple-400 hover:text-white hover:[box-shadow:0_0_15px_rgba(168,85,247,0.4)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            JOIN GAME
          </button>

          <button 
            type="button"
            onClick={onQuickMatchClick}
            className="w-full sm:w-auto px-8 py-4 font-pixel text-xs tracking-wider text-purple-100 bg-black/40 rounded-sm border-2 border-purple-500/50 backdrop-blur-md hover:bg-purple-900/40 hover:border-purple-400 hover:text-white hover:[box-shadow:0_0_15px_rgba(168,85,247,0.4)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            QUICK MATCH
          </button>
        </div>
      </div>
    </section>
  );
}
