import React from 'react';

export function Street() {
  return (
    <div aria-hidden="true" className="flex w-full flex-col">
      {/* Curb highlight */}
      <div className="h-1.5 bg-curb sm:h-2" />
      {/* Sidewalk with pixel paving seams */}
      <div className="h-5 bg-sidewalk bg-[repeating-linear-gradient(90deg,transparent_0_46px,var(--color-curb)_46px_48px)] sm:h-7 md:h-9" />
      {/* Curb shadow */}
      <div className="h-1 bg-asphalt/60 sm:h-1.5" />
      {/* Asphalt */}
      <div className="relative h-14 bg-asphalt sm:h-20 md:h-28 lg:h-32">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,var(--color-window)_0_28px,transparent_28px_56px)] opacity-70 sm:h-1.5" />
      </div>
    </div>
  );
}
