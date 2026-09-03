import React, { useState } from 'react';
import { Sky } from './Sky';
import { Skyline } from './Skyline';
import { Street } from './Street';
import { Character } from './Character';
import { InteractiveCar } from './InteractiveCar';

export function RetroScene({ onEnter }) {
  const [speaker, setSpeaker] = useState(null);

  const toggle = (who) => setSpeaker((current) => (current === who ? null : who));

  return (
    <section
      aria-label="Mafia Debugging - retro game home"
      className="relative flex h-screen min-h-[30rem] w-full flex-col overflow-hidden bg-[#0a0510] selection:bg-purple-500/30"
    >
      {/* Background layers */}
      <Sky />
      <Skyline />

      {/* Title */}
      <header className="relative z-10 flex justify-center px-4 pt-[9vh] sm:pt-[11vh] md:pt-[13vh]">
        <h1 className="text-balance text-center font-pixel text-xl uppercase leading-[1.7] tracking-wide text-title [text-shadow:3px_3px_0_var(--color-title-shadow)] sm:text-3xl sm:[text-shadow:4px_4px_0_var(--color-title-shadow)] md:text-4xl lg:text-5xl">
          Mafia Debugging
        </h1>
      </header>

      {/* Foreground: cast stands directly on the street below */}
      <div className="relative z-10 mt-auto flex flex-col">
        <div
          className="mx-auto flex w-full max-w-6xl items-end justify-between px-4 sm:px-8 md:px-12 lg:px-20"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSpeaker(null);
          }}
        >
          <Character
            id="mafia"
            name="The Mafia boss"
            src="/sprites/mafia.png"
            width={438}
            height={910}
            quote="No one can find me... ha.. ha.."
            isSpeaking={speaker === 'mafia'}
            onToggle={() => toggle('mafia')}
            className="h-24 sm:h-32 md:h-40 lg:h-48"
          />

          <InteractiveCar
            className="h-12 w-auto sm:h-16 md:h-24 lg:h-32 flex-shrink-0"
            onNavigate={(mode) => {
              if (onEnter) onEnter(mode);
            }}
          />

          <Character
            id="detective"
            name="The Detective"
            src="/sprites/detective.png"
            width={378}
            height={786}
            quote="I'll find the chaos maker!"
            isSpeaking={speaker === 'detective'}
            onToggle={() => toggle('detective')}
            className="h-24 sm:h-32 md:h-40 lg:h-48"
          />
        </div>

        <Street />
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center font-pixel text-[8px] text-curb/80 sm:text-[9px]">
        Click a character or sign to begin
      </p>
    </section>
  );
}

export default RetroScene;
