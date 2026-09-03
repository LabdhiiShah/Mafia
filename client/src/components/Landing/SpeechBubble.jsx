import React from 'react';
import { cn } from '../../lib/utils';

export function SpeechBubble({ id, text, side = 'center' }) {
  return (
    <div
      id={id}
      role="status"
      className={cn(
        'pointer-events-none absolute -top-3 w-max max-w-[10rem] origin-bottom animate-pop sm:max-w-[13rem] md:max-w-[16rem] motion-reduce:animate-none',
        side === 'left' && 'left-0 origin-bottom-left',
        side === 'right' && 'right-0 origin-bottom-right',
        side === 'center' && 'left-1/2 -translate-x-1/2',
      )}
    >
      <div className="relative -translate-y-full">
        <p className="rounded-[50%] border-[3px] border-bubble-ink bg-bubble px-6 py-4 text-center font-pixel text-[9px] leading-relaxed text-bubble-ink shadow-[4px_4px_0_var(--color-bubble-ink)] sm:px-7 sm:py-5 sm:text-[10px] md:text-xs">
          {text}
        </p>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={cn(
            'absolute top-full -mt-2 h-5 w-5',
            side === 'left' && 'left-6',
            side === 'right' && 'right-6',
            side === 'center' && 'left-1/2 -translate-x-1/2',
          )}
        >
          <path d="M2 0 L22 0 L10 22 Z" className="fill-bubble-ink" />
          <path d="M6 0 L18 0 L10 15 Z" className="fill-bubble" />
        </svg>
      </div>
    </div>
  );
}
