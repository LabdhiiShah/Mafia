/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        darkCard: '#1e293b',
        darkBorder: '#334155',
        mafiaRed: '#ef4444',
        devBlue: '#3b82f6',
        qaPurple: '#a855f7',
        'sky-top': '#5a1a9e',
        'sky-bottom': '#f26fd2',
        cloud: '#c87ae8',
        skyline: '#8b2ba6',
        window: '#ffd84a',
        asphalt: '#2a1d3f',
        curb: '#a99fd6',
        sidewalk: '#7b72b3',
        title: '#ffb3f0',
        'title-shadow': '#6d1c96',
        bubble: '#fffaf0',
        'bubble-ink': '#1a1026',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
