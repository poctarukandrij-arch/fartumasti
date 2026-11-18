// Оригинальная графика FARTU MASTI: объёмные сундуки, кейсы, кристаллы.
// Всё нарисовано в SVG с градиентами и свечением — без сторонних изображений.
import { useId } from 'react';

function Glow({ id, color }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b" />
      <feFlood floodColor={color} floodOpacity="0.7" result="c" />
      <feComposite in="c" in2="b" operator="in" result="g" />
      <feMerge>
        <feMergeNode in="g" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

const CASE_THEMES = {
  case_bank: { a: '#7FD9FF', b: '#3E6BFF', c: '#2A3A8F', glow: '#4ED6FF', label: '₽' },
  case_table: { a: '#C3A8FF', b: '#6B51E5', c: '#2B2560', glow: '#9C7BFF', label: '♠' },
  case_emoji: { a: '#FFC2E4', b: '#C05CFF', c: '#4A1F63', glow: '#FF5D9E', label: '☺' },
  case_effect: { a: '#A8FFE4', b: '#2FBFA0', c: '#123C38', glow: '#4BE3B0', label: '✦' },
};

export function ChestArt({ theme = 'case_table', size = 92 }) {
  const uid = useId().replace(/[:]/g, '');
  const t = CASE_THEMES[theme] || CASE_THEMES.case_table;
  const body = `cb${uid}`;
  const lid = `cl${uid}`;
  const gl = `cg${uid}`;

  return (
    <svg width={size} height={size * 0.92} viewBox="0 0 100 92" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={body} x1="18" y1="40" x2="84" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={t.b} />
          <stop offset="0.55" stopColor={t.c} />
          <stop offset="1" stopColor="#0A0E22" />
        </linearGradient>
        <linearGradient id={lid} x1="14" y1="18" x2="86" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={t.a} />
          <stop offset="0.5" stopColor={t.b} />
          <stop offset="1" stopColor={t.c} />
        </linearGradient>
        <Glow id={gl} color={t.glow} />
      </defs>

      <ellipse cx="50" cy="84" rx="34" ry="5" fill="#000" opacity="0.45" />
      <ellipse cx="50" cy="45" rx="40" ry="30" fill={t.glow} opacity="0.14" />

      <rect x="18" y="44" width="64" height="36" rx="8" fill={`url(#${body})`} stroke={t.a} strokeOpacity="0.45" strokeWidth="1.2" />
      <rect x="24" y="50" width="52" height="24" rx="5" fill="#05070F" opacity="0.35" />

      <path d="M16 44c0-13 8-22 34-22s34 9 34 22Z" fill={`url(#${lid})`} stroke={t.a} strokeOpacity="0.6" strokeWidth="1.2" filter={`url(#${gl})`} />
      <path d="M22 40c1-9 9-15 28-15s27 6 28 15" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.4" fill="none" />

      <rect x="42" y="50" width="16" height="18" rx="4" fill="#0A0E22" opacity="0.75" />
      <rect x="47" y="55" width="6" height="10" rx="3" fill={t.a} opacity="0.95" />
      <circle cx="50" cy="46" r="4.5" fill={t.a} opacity="0.9" filter={`url(#${gl})`} />

      <path d="M50 8l2.6 5.6 6.1.8-4.5 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.5-4.2 6.1-.8Z" fill={t.a} opacity="0.9" />
      <text x="50" y="35" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" opacity="0.9" fontFamily="Unbounded, sans-serif">
        {t.label}
      </text>
    </svg>
  );
}

export function CoinArt({ size = 18 }) {
  const uid = useId().replace(/[:]/g, '');
  const g = `coin${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={g} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#E8F3FF" />
          <stop offset="0.45" stopColor="#7FA8FF" />
          <stop offset="1" stopColor="#3348D6" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${g})`} stroke="#BFD4FF" strokeOpacity="0.6" strokeWidth="1" />
      <path d="M12 6.5v11M9.4 9.2h4a1.9 1.9 0 0 1 0 3.8h-3.6a1.9 1.9 0 0 0 0 3.8h4.2" stroke="#0B1030" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CrystalArt({ size = 64 }) {
  const uid = useId().replace(/[:]/g, '');
  const g = `cr${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="14" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7DAFF" />
          <stop offset="0.42" stopColor="#9C7BFF" />
          <stop offset="1" stopColor="#2E5BFF" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="56" rx="18" ry="4" fill="#000" opacity="0.4" />
      <path d="M32 4l16 18-16 34-16-34Z" fill={`url(#${g})`} stroke="#D8CCFF" strokeOpacity="0.6" strokeWidth="1.2" />
      <path d="M32 4v52M16 22h32" stroke="#0B1030" strokeOpacity="0.22" strokeWidth="1" />
      <path d="M22 20l10-12 6 8-6 16Z" fill="#fff" opacity="0.18" />
    </svg>
  );
}

export function CardFanArt({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <g transform="rotate(-18 32 34)">
        <rect x="10" y="14" width="26" height="36" rx="4" fill="#141B3C" stroke="#9C7BFF" strokeOpacity="0.6" />
      </g>
      <g transform="rotate(-4 32 34)">
        <rect x="19" y="12" width="26" height="36" rx="4" fill="#1B2450" stroke="#7FD9FF" strokeOpacity="0.55" />
      </g>
      <g transform="rotate(12 32 34)">
        <rect x="28" y="14" width="26" height="36" rx="4" fill="#0E1430" stroke="#C3A8FF" strokeOpacity="0.7" />
        <path d="M41 24c2.6 2.3 5 4.6 5 7 0 1.7-1.3 3-3 3-.7 0-1.3-.2-1.8-.6.2 1.5.9 2.6 2 3.7h-4.4c1.1-1.1 1.8-2.2 2-3.7-.5.4-1.1.6-1.8.6-1.7 0-3-1.3-3-3 0-2.4 2.4-4.7 5-7Z" fill="#C3A8FF" opacity="0.9" />
      </g>
    </svg>
  );
}

export function SparkArt({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l2 6.5L20.5 11 14 13l-2 7-2-7-6.5-2L10 8.5Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export const CASE_ART = CASE_THEMES;
