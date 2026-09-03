import React from 'react';

const BUILDINGS = [
  { x: 0, w: 70, h: 150, cols: 2, rows: 5 },
  { x: 80, w: 50, h: 230, antenna: 40, cols: 2, rows: 8 },
  { x: 140, w: 90, h: 120, cols: 3, rows: 4 },
  { x: 245, w: 60, h: 280, antenna: 60, cols: 2, rows: 10 },
  { x: 315, w: 100, h: 170, cols: 4, rows: 6 },
  { x: 430, w: 45, h: 210, cols: 1, rows: 7 },
  { x: 485, w: 120, h: 130, cols: 4, rows: 4 },
  { x: 620, w: 70, h: 320, antenna: 70, cols: 2, rows: 11 },
  { x: 700, w: 55, h: 190, cols: 2, rows: 6 },
  { x: 765, w: 110, h: 140, cols: 4, rows: 5 },
  { x: 890, w: 60, h: 250, antenna: 45, cols: 2, rows: 9 },
  { x: 960, w: 90, h: 160, cols: 3, rows: 5 },
  { x: 1060, w: 50, h: 200, cols: 1, rows: 7 },
  { x: 1120, w: 80, h: 120, cols: 3, rows: 4 },
];

function lit(seed) {
  return (seed * 9301 + 49297) % 233280 / 233280;
}

export function Skyline() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 -400 1200 400"
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      className="absolute inset-x-0 bottom-[12%] h-[50%] w-full text-skyline sm:bottom-[14%] sm:h-[55%] md:bottom-[18%] md:h-[60%]"
    >
      {BUILDINGS.map((b, bi) => {
        const winW = 6;
        const winH = 8;
        const gapX = (b.w - b.cols * winW) / (b.cols + 1);
        const gapY = (b.h - 16 - b.rows * winH) / (b.rows + 1);
        return (
          <g key={b.x}>
            <rect x={b.x} y={-b.h} width={b.w} height={b.h} fill="currentColor" />
            {b.antenna && (
              <>
                <rect x={b.x + b.w / 2 - 2} y={-b.h - b.antenna} width={4} height={b.antenna} fill="currentColor" />
                <rect
                  x={b.x + b.w / 2 - 4}
                  y={-b.h - b.antenna - 6}
                  width={8}
                  height={8}
                  className="animate-blink fill-red-400 motion-reduce:animate-none"
                  style={{ animationDelay: `${(bi * 0.7) % 2.4}s` }}
                />
              </>
            )}
            {Array.from({ length: b.rows }).map((_, r) =>
              Array.from({ length: b.cols }).map((_, c) => {
                const seed = bi * 131 + r * 17 + c * 7;
                const v = lit(seed);
                if (v < 0.35) return null;
                const flicker = v > 0.9;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={b.x + gapX + c * (winW + gapX)}
                    y={-b.h + 8 + gapY + r * (winH + gapY)}
                    width={winW}
                    height={winH}
                    className={
                      flicker
                        ? 'animate-flicker fill-window motion-reduce:animate-none'
                        : 'fill-window'
                    }
                    style={flicker ? { animationDelay: `${(seed % 50) / 10}s` } : undefined}
                    opacity={v > 0.65 ? 1 : 0.6}
                  />
                );
              }),
            )}
          </g>
        );
      })}
    </svg>
  );
}
