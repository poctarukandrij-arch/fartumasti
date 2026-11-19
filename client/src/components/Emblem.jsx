// Фирменный знак FARTU MASTI: светящийся герб с двумя картами.
// Заменяет тигра на главном экране. Чистая векторная графика, без масок-животных.
import { useId } from 'react';

export function EmblemArt({ size = 132, className = '' }) {
  const raw = useId().replace(/[:]/g, '');
  const id = (name) => `em${raw}${name}`;

  return (
    <svg
      className={`fm-emblem-svg ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      role="img"
      aria-label="FARTU MASTI"
    >
      <defs>
        <radialGradient id={id('halo')} cx="50%" cy="46%" r="52%">
          <stop offset="0%" stopColor="#c4a2ff" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#7c3aed" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3be8ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('rim')} x1="12%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stopColor="#8b5cff" />
          <stop offset="45%" stopColor="#3be8ff" />
          <stop offset="100%" stopColor="#ff4d8d" />
        </linearGradient>
        <linearGradient id={id('plate')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#241046" />
          <stop offset="52%" stopColor="#150829" />
          <stop offset="100%" stopColor="#0a0418" />
        </linearGradient>
        <linearGradient id={id('cardA')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.97" />
          <stop offset="100%" stopColor="#cbb8f5" stopOpacity="0.82" />
        </linearGradient>
        <linearGradient id={id('cardB')} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f6f1ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#a8dcff" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={id('shine')} x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={id('soft')} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* мягкое свечение позади герба */}
      <circle cx="80" cy="74" r="74" fill={`url(#${id('halo')})`} opacity="0.9" />
      <ellipse cx="80" cy="140" rx="46" ry="8" fill="#0a0418" opacity="0.55" filter={`url(#${id('soft')})`} />

      {/* лучи */}
      <g opacity="0.28" stroke={`url(#${id('rim')})`} strokeWidth="1.4" strokeLinecap="round">
        <path d="M80 6v12" />
        <path d="M26 26l8 8" />
        <path d="M134 26l-8 8" />
        <path d="M14 80h12" />
        <path d="M134 80h12" />
      </g>

      {/* щит */}
      <path
        d="M80 20l44 14v34c0 26-18 44-44 54-26-10-44-28-44-54V34l44-14z"
        fill={`url(#${id('plate')})`}
        stroke={`url(#${id('rim')})`}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M80 28l36 11.5v28c0 21-14.5 36-36 44.5-21.5-8.5-36-23.5-36-44.5v-28L80 28z"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.14"
        strokeWidth="1"
      />

      {/* две скрещённые карты */}
      <g transform="rotate(-16 80 82)">
        <rect x="58" y="46" width="42" height="60" rx="6" fill={`url(#${id('cardA')})`} />
        <rect x="58" y="46" width="42" height="60" rx="6" fill={`url(#${id('shine')})`} />
        <path d="M79 62l5.5 9.5L79 81l-5.5-9.5L79 62z" fill="#7c3aed" opacity="0.9" />
        <text x="65" y="60" fontSize="10" fontWeight="800" fill="#4a2f86" fontFamily="Manrope, sans-serif">A</text>
      </g>
      <g transform="rotate(14 80 82)">
        <rect x="64" y="50" width="42" height="60" rx="6" fill={`url(#${id('cardB')})`} />
        <rect x="64" y="50" width="42" height="60" rx="6" fill={`url(#${id('shine')})`} />
        <path d="M85 68l6 10.5L85 89l-6-10.5L85 68z" fill="#1e6fd6" opacity="0.9" />
        <text x="72" y="64" fontSize="10" fontWeight="800" fill="#22406e" fontFamily="Manrope, sans-serif">A</text>
      </g>

      {/* блики */}
      <g fill="#ffffff" opacity="0.85">
        <path d="M118 52l1.6 4.6 4.6 1.6-4.6 1.6-1.6 4.6-1.6-4.6-4.6-1.6 4.6-1.6L118 52z" />
        <path d="M42 64l1.2 3.4 3.4 1.2-3.4 1.2-1.2 3.4-1.2-3.4-3.4-1.2 3.4-1.2L42 64z" opacity="0.7" />
        <circle cx="80" cy="118" r="2.2" />
      </g>
    </svg>
  );
}

export default EmblemArt;
