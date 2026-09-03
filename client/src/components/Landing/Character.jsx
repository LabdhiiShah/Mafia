import React from 'react';
import { cn } from '../../lib/utils';
import { SpeechBubble } from './SpeechBubble';

export function Character({
  id,
  name,
  src,
  width,
  height,
  quote,
  isSpeaking,
  onToggle,
  className,
}) {
  const bubbleId = `${id}-bubble`;
  return (
    <div className="relative flex flex-col items-center">
      {isSpeaking && <SpeechBubble id={bubbleId} text={quote} />}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isSpeaking}
        aria-describedby={isSpeaking ? bubbleId : undefined}
        aria-label={`${name}. Click to hear what they say.`}
        className={cn(
          'group block cursor-pointer outline-none transition-transform hover:-translate-y-1 focus-visible:-translate-y-1',
          isSpeaking && 'animate-wiggle',
          className,
        )}
      >
        <img
          src={src}
          alt={name}
          width={width}
          height={height}
          className="h-full w-auto animate-bob [image-rendering:pixelated] drop-shadow-[0_4px_0_rgba(0,0,0,0.35)] motion-reduce:animate-none"
        />
        <span className="sr-only">{name}</span>
      </button>
    </div>
  );
}
