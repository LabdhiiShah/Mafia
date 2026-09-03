import React, { useState } from 'react';

export function InteractiveCar({ className, onNavigate }) {
  const [isDriving, setIsDriving] = useState(null);

  const handleNavigation = (destination) => {
    if (isDriving) return;
    setIsDriving(destination);
    setTimeout(() => {
      if (onNavigate) {
        onNavigate(destination);
      }
    }, 1500);
  };

  let transformStyle = 'translateX(0)';
  if (isDriving === 'login') {
    transformStyle = 'translateX(-150vw)';
  } else if (isDriving === 'signup') {
    transformStyle = 'translateX(150vw)';
  }

  const DroneSign = ({ type, label }) => {
    const isThisDriving = isDriving === type;
    const isOtherDriving = isDriving && isDriving !== type;

    return (
      <div
        className={`absolute top-0 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-300 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]
        ${type === 'login' ? 'right-[110%]' : 'left-[110%]'}
        ${!isDriving ? 'animate-drone-float' : ''}
        ${isOtherDriving ? 'opacity-0 scale-90' : 'opacity-100'}
      `}
      >
        {/* Drone Body */}
        <div className="w-12 h-3 bg-[#0a0a0a] border-t border-purple-400/40 border-b border-purple-900/40 border-x border-purple-500/30 rounded-[2px] flex justify-between items-center px-1 relative z-20 shadow-[0_0_20px_rgba(126,34,206,0.5)] ring-1 ring-black/50">
          <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-100 [box-shadow:0_0_6px_#ef4444,0_0_2px_#fff]" />
          <div
            className="w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-100 [box-shadow:0_0_6px_#a855f7,0_0_2px_#fff]"
            style={{ animationDelay: '500ms' }}
          />
        </div>

        {/* Swinging Cables & Sign */}
        <div className={`flex flex-col items-center origin-top ${!isDriving ? 'animate-drone-swing' : ''}`}>
          <svg className="w-14 h-8 -mt-0.5 relative z-10 drop-shadow-[0_0_2px_rgba(168,85,247,0.8)]" viewBox="0 0 56 32">
            <line x1="28" y1="0" x2="8" y2="32" stroke="rgba(168,85,247,0.7)" strokeWidth="1.5" />
            <line x1="28" y1="0" x2="28" y2="32" stroke="rgba(168,85,247,0.7)" strokeWidth="1.5" />
            <line x1="28" y1="0" x2="48" y2="32" stroke="rgba(168,85,247,0.7)" strokeWidth="1.5" />
          </svg>

          {/* Sign Board */}
          <button
            type="button"
            onClick={() => handleNavigation(type)}
            disabled={!!isDriving}
            className={`relative z-30 font-pixel text-[8px] sm:text-[10px] px-3 py-2 rounded-sm border transition-all duration-300 pointer-events-auto whitespace-nowrap
              ${
                !isDriving
                  ? 'text-purple-100 font-bold bg-purple-950/80 border-purple-400/60 [box-shadow:0_0_15px_rgba(126,34,206,0.6)] [text-shadow:0_0_8px_rgba(168,85,247,0.9)] hover:scale-105 hover:bg-purple-900/90 hover:border-purple-300/80 hover:[box-shadow:0_0_25px_rgba(168,85,247,0.8)] cursor-pointer'
                  : ''
              }
              ${
                isThisDriving
                  ? 'text-white font-bold bg-purple-600 border-purple-300 [box-shadow:0_0_35px_rgba(168,85,247,1)] scale-110 [text-shadow:0_0_10px_#fff]'
                  : ''
              }
            `}
          >
            {isThisDriving ? 'NAVIGATING...' : label}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative flex items-center justify-center ${className || ''}`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes drone-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes drone-swing {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        .animate-drone-float { animation: drone-float 3.5s ease-in-out infinite; }
        .animate-drone-swing { animation: drone-swing 2.5s ease-in-out infinite; }
      `,
        }}
      />

      {/* LEFT DRONE SIGN */}
      <DroneSign type="login" label="LOGIN" />

      {/* The Car */}
      <div
        className="transition-transform duration-[1500ms] ease-in w-full h-full relative z-10"
        style={{ transform: transformStyle }}
      >
        <img
          src="/sprites/car.png"
          alt="A black 1940s gangster sedan parked on the street"
          width={956}
          height={360}
          className="w-full h-full object-contain [image-rendering:pixelated] drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]"
        />
      </div>

      {/* RIGHT DRONE SIGN */}
      <DroneSign type="signup" label="SIGN UP" />
    </div>
  );
}
