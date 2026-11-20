import { useId } from 'react';

const TONES = {
  gold: ['#fff3a6', '#ffc300', '#b9770e', '#e53a55'],
  silver: ['#ffffff', '#c7d2ee', '#7280a8', '#4aa3ff'],
  purple: ['#ffe9a0', '#ffb703', '#a8650a', '#ff4d7a'],
  red: ['#fff0a8', '#ffb703', '#a8650a', '#ff3b4e'],
  green: ['#fff3a6', '#ffc300', '#b9770e', '#3ddc84'],
};

// Корона для карточек комнат, профиля и заголовков.
export function Crown({ size = 48, tone = 'gold', className = '' }) {
  const uid = `cr${useId().replace(/[:]/g, '')}`;
  const [a, b, c, gem] = TONES[tone] || TONES.gold;
  return (
    <svg
      className={`crown ${className}`.trim()}
      width={size}
      height={size * 0.78}
      viewBox="0 0 64 50"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <path
        d="M5 18l14 11L32 6l13 23 14-11-5 28H10z"
        fill={`url(#${uid}g)`}
        stroke={c}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 44h44v4H10z" fill={c} opacity="0.75" />
      <circle cx="5" cy="17" r="3.4" fill={a} stroke={c} strokeWidth="1.2" />
      <circle cx="32" cy="6" r="3.8" fill={a} stroke={c} strokeWidth="1.2" />
      <circle cx="59" cy="17" r="3.4" fill={a} stroke={c} strokeWidth="1.2" />
      <path d="M32 24l6 8-6 8-6-8z" fill={gem} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" />
      <path d="M14 22l5 12" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default Crown;

// Золотая монета со звездой — валюта в шапке и на карточках.
export function GoldCoin({ size = 24 }) {
  const uid = `gc${useId().replace(/[:]/g, '')}`;
  return (
    <svg className="gold-coin" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={uid} x1="6" y1="3" x2="26" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff0a0" />
          <stop offset="0.5" stopColor="#ffc400" />
          <stop offset="1" stopColor="#c97a06" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14.5" fill={`url(#${uid})`} stroke="#8a4b05" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="10.6" fill="none" stroke="#fff6c0" strokeOpacity="0.85" strokeWidth="1.2" />
      <path
        d="M16 8.2l2.2 4.6 5 .6-3.700 3.500.9 5-4.400-2.500-4.400 2.500.9-5-3.700-3.500 5-.6z"
        fill="#fff6c0"
        stroke="#b8700a"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}
