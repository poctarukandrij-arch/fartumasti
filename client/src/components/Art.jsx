// Объёмная графика FARTU MASTI: сундуки кейсов, эффекты, эмодзи, колоды, столы.
// Всё нарисовано векторно (SVG с градиентами и бликами) — без внешних файлов и эмодзи-заглушек.
import { useId } from 'react';

function useIds() {
  const raw = useId().replace(/[:]/g, '');
  return (name) => `fm${raw}${name}`;
}

/* ────────────────────────────── монета ────────────────────────────── */

export function CoinArt({ size = 28 }) {
  const u = useIds();
  return (
    <svg className="art art--coin" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#B79BFF" />
          <stop offset="0.5" stopColor="#7C4DFF" />
          <stop offset="1" stopColor="#4B2CC4" />
        </linearGradient>
        <linearGradient id={u('b')} x1="14" y1="10" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#C9B8FF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#7C4DFF" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="43" rx="13" ry="3.4" fill="#05030F" opacity="0.5" />
      <circle cx="24" cy="23" r="19" fill={`url(#${u('a')})`} />
      <circle cx="24" cy="23" r="19" fill="none" stroke="#E6DCFF" strokeOpacity="0.45" strokeWidth="1.4" />
      <circle cx="24" cy="23" r="14.4" fill={`url(#${u('b')})`} />
      <path
        d="M24 13.6c.9 4.6 2.4 6.1 7 7-4.6.9-6.1 2.4-7 7-.9-4.6-2.4-6.1-7-7 4.6-.9 6.1-2.4 7-7Z"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
      <circle cx="18.6" cy="17" r="3.2" fill="#FFFFFF" opacity="0.35" />
    </svg>
  );
}

/* ────────────────────────────── кристалл ────────────────────────────── */

export function CrystalArt({ size = 30, tone = 'cyan' }) {
  const u = useIds();
  const tones = {
    cyan: ['#8FF7FF', '#22D3EE', '#0E7490'],
    violet: ['#D6C4FF', '#8B5CF6', '#4C1D95'],
    pink: ['#FFC7E4', '#F472B6', '#9D174D'],
    mint: ['#B9FFE4', '#34D399', '#065F46'],
  }[tone] || ['#8FF7FF', '#22D3EE', '#0E7490'];
  return (
    <svg className="art art--crystal" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="18" y1="3" x2="30" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={tones[0]} />
          <stop offset="0.55" stopColor={tones[1]} />
          <stop offset="1" stopColor={tones[2]} />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44" rx="11" ry="3" fill="#05030F" opacity="0.5" />
      <path d="M24 2.5 34.5 15 30 41 18 41 13.5 15Z" fill={`url(#${u('a')})`} />
      <path d="M24 2.5 24 41 18 41 13.5 15Z" fill="#FFFFFF" fillOpacity="0.2" />
      <path d="M24 2.5 34.5 15 30 41 24 41Z" fill="#000000" fillOpacity="0.16" />
      <path d="M17 12.5 21.5 8.5" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ────────────────────────────── карты ────────────────────────────── */

export function CardsArt({ size = 34 }) {
  const u = useIds();
  return (
    <svg className="art art--cards" width={size} height={size} viewBox="0 0 56 56" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="10" y1="6" x2="34" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9D2FF" />
        </linearGradient>
        <linearGradient id={u('b')} x1="22" y1="12" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9C7BFF" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="50" rx="16" ry="3.6" fill="#05030F" opacity="0.45" />
      <g transform="rotate(-16 24 28)">
        <rect x="10" y="8" width="22" height="32" rx="4" fill={`url(#${u('a')})`} />
        <path d="M21 15.5c2.6 2.3 4.6 4.3 4.6 6.6a2.9 2.9 0 0 1-4.6 2.3 2.9 2.9 0 0 1-4.6-2.3c0-2.3 2-4.3 4.6-6.6Z" fill="#E23B6D" />
      </g>
      <g transform="rotate(13 32 28)">
        <rect x="24" y="10" width="22" height="32" rx="4" fill={`url(#${u('b')})`} />
        <rect x="24" y="10" width="22" height="32" rx="4" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" />
        <path d="M35 18.5c1 5 2.6 6.6 7.6 7.6-5 1-6.6 2.6-7.6 7.6-1-5-2.6-6.6-7.6-7.6 5-1 6.6-2.6 7.6-7.6Z" fill="#FFFFFF" fillOpacity="0.9" />
      </g>
    </svg>
  );
}

export function TrophyArt({ size = 34 }) {
  const u = useIds();
  return (
    <svg className="art art--trophy" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="12" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C9B8FF" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44" rx="12" ry="3" fill="#05030F" opacity="0.45" />
      <path d="M14 7h20v9c0 6.1-4.5 11-10 11S14 22.1 14 16Z" fill={`url(#${u('a')})`} />
      <path d="M14 9h-3.5a6.5 6.5 0 0 0 6.5 8.5M34 9h3.5A6.5 6.5 0 0 1 31 17.5" stroke="#A78BFA" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M24 27v7" stroke="#A78BFA" strokeWidth="3.2" strokeLinecap="round" />
      <rect x="15" y="34" width="18" height="4.6" rx="2.3" fill={`url(#${u('a')})`} />
      <path d="M19 11.5c1.6 3.4 3 5 6.4 6.2" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BoltArt({ size = 30 }) {
  const u = useIds();
  return (
    <svg className="art" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="16" y1="4" x2="32" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#A5F3FC" />
          <stop offset="0.5" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44" rx="10" ry="2.8" fill="#05030F" opacity="0.45" />
      <path d="M28 3 12 27h9l-3 18 18-25h-9.5Z" fill={`url(#${u('a')})`} />
      <path d="M27 6 16 23h7l-1.6 9" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ChartArt({ size = 30 }) {
  const u = useIds();
  return (
    <svg className="art" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="10" y1="34" x2="38" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="0.55" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect x="7" y="27" width="7" height="15" rx="2.6" fill={`url(#${u('a')})`} opacity="0.55" />
      <rect x="18" y="19" width="7" height="23" rx="2.6" fill={`url(#${u('a')})`} opacity="0.8" />
      <rect x="29" y="9" width="7" height="33" rx="2.6" fill={`url(#${u('a')})`} />
      <path d="M8 22 20 13l7 5 10-8" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarArt({ size = 30 }) {
  const u = useIds();
  return (
    <svg className="art" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="14" y1="6" x2="34" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD1E8" />
          <stop offset="0.45" stopColor="#F472B6" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path
        d="M24 4.5 30 17l13.5 1.6-10 9 2.7 13.4L24 34.6 11.8 41 14.5 27.6l-10-9L18 17Z"
        fill={`url(#${u('a')})`}
      />
      <path d="M24 9.5 27.6 17 24 21l-3.6-4Z" fill="#FFFFFF" fillOpacity="0.8" />
    </svg>
  );
}

export function GiftArt({ size = 34 }) {
  const u = useIds();
  return (
    <svg className="art" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="10" y1="16" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id={u('b')} x1="16" y1="6" x2="32" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF9ED2" />
          <stop offset="1" stopColor="#DB2777" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44" rx="13" ry="3" fill="#05030F" opacity="0.45" />
      <rect x="9" y="19" width="30" height="21" rx="4" fill={`url(#${u('a')})`} />
      <rect x="7" y="14" width="34" height="7.5" rx="3" fill={`url(#${u('b')})`} />
      <rect x="21" y="14" width="6" height="26" fill={`url(#${u('b')})`} />
      <path d="M24 14c-4.5 0-7.5-1.8-7.5-4.6C16.5 6.8 18.5 5 21 5c2.6 0 3.8 2.4 3 9Zm0 0c4.5 0 7.5-1.8 7.5-4.6C31.5 6.8 29.5 5 27 5c-2.6 0-3.8 2.4-3 9Z" fill={`url(#${u('b')})`} />
      <rect x="12" y="22" width="4" height="15" rx="2" fill="#FFFFFF" fillOpacity="0.22" />
    </svg>
  );
}

/* ────────────────────────────── сундуки кейсов ────────────────────────────── */

const CHEST_THEMES = {
  case_bank: { a: '#B79BFF', b: '#7C4DFF', c: '#3B1D8F', edge: '#E4D8FF' },
  case_table: { a: '#7BF0C8', b: '#22C55E', c: '#0F5132', edge: '#D6FFEE' },
  case_emoji: { a: '#FFB3DA', b: '#F43F8E', c: '#8B1050', edge: '#FFE1F0' },
  case_effect: { a: '#9DE9FF', b: '#2563EB', c: '#1E1B6B', edge: '#DCF3FF' },
};

function ChestBody({ u, theme }) {
  return (
    <>
      <ellipse cx="60" cy="106" rx="42" ry="8" fill="#05030F" opacity="0.55" />
      {/* корпус */}
      <path
        d="M18 62c0-4 3.2-7 7.2-7h69.6c4 0 7.2 3 7.2 7v30c0 4.4-3.4 8-7.8 8H25.8c-4.4 0-7.8-3.6-7.8-8Z"
        fill={`url(#${u('body')})`}
      />
      {/* крышка */}
      <path
        d="M18 62c0-16 12-28 28-28h28c16 0 28 12 28 28 0 3-2.4 5.4-5.4 5.4H23.4C20.4 67.4 18 65 18 62Z"
        fill={`url(#${u('lid')})`}
      />
      <path
        d="M18 62c0-16 12-28 28-28h28c16 0 28 12 28 28 0 3-2.4 5.4-5.4 5.4H23.4C20.4 67.4 18 65 18 62Z"
        fill="#FFFFFF"
        fillOpacity="0.07"
      />
      {/* металлические полосы */}
      <rect x="34" y="34" width="7" height="66" rx="3.5" fill={`url(#${u('band')})`} opacity="0.95" />
      <rect x="79" y="34" width="7" height="66" rx="3.5" fill={`url(#${u('band')})`} opacity="0.95" />
      <rect x="18" y="66" width="84" height="7" rx="3.5" fill={`url(#${u('band')})`} opacity="0.9" />
      {/* блики */}
      <path d="M26 44c2-7 8-12 15-14" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <rect x="24" y="78" width="5" height="18" rx="2.5" fill="#FFFFFF" fillOpacity="0.16" />
      {/* замок */}
      <rect x="52" y="60" width="16" height="18" rx="4.5" fill={`url(#${u('lock')})`} />
      <rect x="52" y="60" width="16" height="18" rx="4.5" fill="none" stroke={theme.edge} strokeOpacity="0.5" />
      <circle cx="60" cy="68" r="2.6" fill="#120A2E" />
      <rect x="58.8" y="69.5" width="2.4" height="5" rx="1.2" fill="#120A2E" />
    </>
  );
}

export function ChestArt({ theme: themeId = 'case_bank', size = 120, open = false }) {
  const u = useIds();
  const theme = CHEST_THEMES[themeId] || CHEST_THEMES.case_bank;
  return (
    <svg className="art art--chest" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id={u('body')} x1="18" y1="58" x2="102" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={theme.b} />
          <stop offset="0.55" stopColor={theme.c} />
          <stop offset="1" stopColor="#0A0620" />
        </linearGradient>
        <linearGradient id={u('lid')} x1="24" y1="34" x2="96" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={theme.a} />
          <stop offset="0.55" stopColor={theme.b} />
          <stop offset="1" stopColor={theme.c} />
        </linearGradient>
        <linearGradient id={u('band')} x1="34" y1="34" x2="86" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F4F1FF" stopOpacity="0.85" />
          <stop offset="0.6" stopColor={theme.a} stopOpacity="0.55" />
          <stop offset="1" stopColor={theme.c} stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={u('lock')} x1="52" y1="58" x2="68" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor={theme.a} stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id={u('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={theme.a} stopOpacity="0.55" />
          <stop offset="1" stopColor={theme.a} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="60" cy="60" rx="58" ry="52" fill={`url(#${u('glow')})`} opacity={open ? 0.95 : 0.55} />

      {themeId === 'case_bank' ? (
        <g>
          {/* банковская карта, выглядывающая из сундука */}
          <g transform="rotate(-14 60 40)">
            <rect x="40" y="14" width="40" height="26" rx="4.6" fill={`url(#${u('lid')})`} opacity="0.95" />
            <rect x="44" y="22" width="12" height="8" rx="2" fill="#FFFFFF" fillOpacity="0.75" />
            <rect x="44" y="33" width="26" height="2.6" rx="1.3" fill="#FFFFFF" fillOpacity="0.5" />
          </g>
          <circle cx="86" cy="34" r="11" fill={`url(#${u('lid')})`} opacity="0.95" />
          <text x="86" y="39" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FFFFFF" fillOpacity="0.95">₽</text>
        </g>
      ) : null}

      {themeId === 'case_table' ? (
        <g>
          {/* веер карт и фишки */}
          <g transform="rotate(-20 46 34)">
            <rect x="38" y="12" width="18" height="26" rx="3.6" fill="#FFFFFF" />
            <path d="M47 20c1.8 1.6 3.2 3 3.2 4.6a2 2 0 0 1-3.2 1.6 2 2 0 0 1-3.2-1.6c0-1.6 1.4-3 3.2-4.6Z" fill="#E23B6D" />
          </g>
          <g transform="rotate(14 74 34)">
            <rect x="66" y="12" width="18" height="26" rx="3.6" fill="#F4F1FF" />
            <path d="M75 20c1.8 1.6 3.2 3 3.2 4.6a2 2 0 0 1-3.2 1.6 2 2 0 0 1-3.2-1.6c0-1.6 1.4-3 3.2-4.6Z" fill="#1F2937" />
          </g>
          <ellipse cx="60" cy="30" rx="9" ry="4.6" fill={`url(#${u('lid')})`} />
          <ellipse cx="60" cy="26.5" rx="9" ry="4.6" fill={theme.a} opacity="0.9" />
        </g>
      ) : null}

      {themeId === 'case_emoji' ? (
        <g>
          <circle cx="60" cy="32" r="17" fill={`url(#${u('lid')})`} />
          <circle cx="60" cy="32" r="17" fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.6" />
          <circle cx="54" cy="28" r="2.6" fill="#3B0A24" />
          <circle cx="66" cy="28" r="2.6" fill="#3B0A24" />
          <path d="M52.5 36.5c2.6 3.6 12.4 3.6 15 0" stroke="#3B0A24" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <circle cx="45" cy="18" r="2.4" fill={theme.edge} opacity="0.8" />
          <circle cx="76" cy="16" r="3" fill={theme.edge} opacity="0.65" />
        </g>
      ) : null}

      {themeId === 'case_effect' ? (
        <g>
          <circle cx="60" cy="32" r="18" fill={`url(#${u('glow')})`} />
          <circle cx="60" cy="32" r="11" fill={`url(#${u('lid')})`} />
          <circle cx="56.5" cy="28.5" r="3.4" fill="#FFFFFF" fillOpacity="0.75" />
          <path d="M60 8 64 20h-8Z" fill={theme.a} opacity="0.9" />
          <path d="M34 30 40 36 34 42 28 36Z" fill={theme.a} opacity="0.55" />
          <path d="M86 30 92 36 86 42 80 36Z" fill={theme.a} opacity="0.55" />
        </g>
      ) : null}

      <ChestBody u={u} theme={theme} />

      {open ? (
        <g opacity="0.9">
          <path d="M60 8v10M52 12l4 7M68 12l-4 7" stroke={theme.edge} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
  );
}

/* ────────────────────────────── эффекты появления ────────────────────────────── */

export function EffectArt({ id = 'effect_none', size = 56 }) {
  const u = useIds();
  const common = (
    <defs>
      <linearGradient id={u('a')} x1="14" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#C7B6FF" />
        <stop offset="0.5" stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#4338CA" />
      </linearGradient>
      <linearGradient id={u('b')} x1="20" y1="12" x2="44" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#A5F3FC" />
        <stop offset="0.55" stopColor="#22D3EE" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id={u('c')} x1="16" y1="14" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFC7E4" />
        <stop offset="0.55" stopColor="#F472B6" />
        <stop offset="1" stopColor="#9D174D" />
      </linearGradient>
    </defs>
  );

  if (id === 'effect_ripple') {
    return (
      <svg className="art art--effect" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        {common}
        <ellipse cx="32" cy="54" rx="16" ry="3.4" fill="#05030F" opacity="0.4" />
        <circle cx="32" cy="32" r="22" fill="none" stroke={`url(#${u('b')})`} strokeWidth="2.4" opacity="0.45" />
        <circle cx="32" cy="32" r="15.5" fill="none" stroke={`url(#${u('b')})`} strokeWidth="3" opacity="0.75" />
        <circle cx="32" cy="32" r="9" fill={`url(#${u('b')})`} />
        <circle cx="29" cy="29" r="2.6" fill="#FFFFFF" fillOpacity="0.8" />
      </svg>
    );
  }

  if (id === 'effect_glitch') {
    return (
      <svg className="art art--effect" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        {common}
        <ellipse cx="32" cy="55" rx="14" ry="3" fill="#05030F" opacity="0.4" />
        <rect x="16" y="16" width="32" height="32" rx="7" fill={`url(#${u('a')})`} opacity="0.9" />
        <rect x="12" y="22" width="12" height="5" rx="2.5" fill={`url(#${u('b')})`} opacity="0.9" />
        <rect x="38" y="33" width="14" height="5" rx="2.5" fill={`url(#${u('c')})`} opacity="0.9" />
        <rect x="22" y="40" width="16" height="4" rx="2" fill="#FFFFFF" opacity="0.55" />
        <path d="M24 26h7M33 30h6" stroke="#0B0620" strokeWidth="2.6" strokeLinecap="round" opacity="0.65" />
      </svg>
    );
  }

  if (id === 'effect_lightning') {
    return (
      <svg className="art art--effect" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        {common}
        <ellipse cx="32" cy="56" rx="13" ry="3" fill="#05030F" opacity="0.4" />
        <path d="M38 6 18 34h11l-3.5 24L46 28H34.5Z" fill={`url(#${u('b')})`} />
        <path d="M36 10 23 30h8l-1.6 10" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === 'effect_phoenix') {
    return (
      <svg className="art art--effect" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        {common}
        <ellipse cx="32" cy="56" rx="15" ry="3.2" fill="#05030F" opacity="0.4" />
        <path d="M32 10c3 6 4 10 4 14 0 3-1.6 5.4-4 5.4S28 27 28 24c0-4 1-8 4-14Z" fill={`url(#${u('c')})`} />
        <path d="M32 22c6-4 14-4 20 1-6 1-9 4-11 8-3-4-6-6-9-9Z" fill={`url(#${u('a')})`} opacity="0.95" />
        <path d="M32 22c-6-4-14-4-20 1 6 1 9 4 11 8 3-4 6-6 9-9Z" fill={`url(#${u('a')})`} opacity="0.95" />
        <path d="M32 30c4 4 6 9 6 15H26c0-6 2-11 6-15Z" fill={`url(#${u('c')})`} />
        <path d="M32 34c1.6 3 2.4 6.4 2.4 10h-4.8c0-3.6.8-7 2.4-10Z" fill="#FFE9F4" fillOpacity="0.8" />
      </svg>
    );
  }

  return (
    <svg className="art art--effect" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {common}
      <ellipse cx="32" cy="54" rx="14" ry="3" fill="#05030F" opacity="0.35" />
      <circle cx="32" cy="32" r="14" fill="none" stroke="#6B5BA8" strokeWidth="2.4" strokeDasharray="4 5" />
      <path d="M32 24v16M24 32h16" stroke="#6B5BA8" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/* ────────────────────────────── эмодзи-предметы ────────────────────────────── */

const EMOJI_ART = {
  emoji_fire: {
    g: ['#FFD3A5', '#FB7185', '#B91C1C'],
    d: 'M32 6c1 8 7 10 9.5 15.5C44 27 42 32 38 35c1.5-5-1-8-3-9.5.6 5-1.6 8-5 9.5-3.4-1.5-5.6-4.5-5-9.5-2 1.5-4.5 4.5-3 9.5-4-3-6-8-3.5-13.5C21 15 30 14 32 6Z',
  },
  emoji_ice: {
    g: ['#E0F7FF', '#67E8F9', '#1D4ED8'],
    d: 'M32 4l6 12 13-3-8 12 8 12-13-3-6 12-6-12-13 3 8-12-8-12 13 3Z',
  },
  emoji_skull: {
    g: ['#F8FAFF', '#C7CBE0', '#5B5F7A'],
    d: 'M32 6c11 0 18 7.6 18 17 0 6-3 9-6 11v6a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4v-6c-3-2-6-5-6-11C14 13.6 21 6 32 6Z',
  },
  emoji_snake: {
    g: ['#BBF7D0', '#34D399', '#047857'],
    d: 'M44 12c-8-2-16 2-16 8s8 8 8 14-6 10-14 8c-4-1-7-4-7-8 0-3 2-5 5-5s5 2 5 5c0 1-.4 2-1 2.5 2 1 4 .4 4-2 0-4-8-6-8-13S30 4 44 12Z',
  },
  emoji_bolt: {
    g: ['#C7F9FF', '#38BDF8', '#1D4ED8'],
    d: 'M38 4 16 36h12l-4 24 24-32H36Z',
  },
  emoji_rocket: {
    g: ['#FFD9E6', '#F472B6', '#7C3AED'],
    d: 'M32 4c9 6 13 15 13 24l6 8-9 1-3 9-7-7-7 7-3-9-9-1 6-8C19 19 23 10 32 4Z',
  },
  emoji_diamond: {
    g: ['#E4DBFF', '#A78BFA', '#4C1D95'],
    d: 'M32 6 52 22 32 58 12 22Z',
  },
};

export function EmojiArt({ id, size = 34 }) {
  const u = useIds();
  const art = EMOJI_ART[id];
  if (!art) return null;
  return (
    <svg className="art art--emoji" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="14" y1="6" x2="50" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={art.g[0]} />
          <stop offset="0.55" stopColor={art.g[1]} />
          <stop offset="1" stopColor={art.g[2]} />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="57" rx="15" ry="3.2" fill="#05030F" opacity="0.4" />
      <path d={art.d} fill={`url(#${u('a')})`} stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.4" />
      <path d={art.d} fill="none" stroke="#0B0620" strokeOpacity="0.25" strokeWidth="1" transform="translate(0.8 1.2)" />
      {id === 'emoji_skull' ? (
        <>
          <ellipse cx="25.5" cy="26" rx="4.4" ry="5" fill="#221B3A" />
          <ellipse cx="38.5" cy="26" rx="4.4" ry="5" fill="#221B3A" />
          <path d="M28 36h8v7h-8z" fill="#221B3A" opacity="0.6" />
        </>
      ) : null}
      {id === 'emoji_diamond' ? (
        <>
          <path d="M32 6 32 58 12 22Z" fill="#FFFFFF" fillOpacity="0.22" />
          <path d="M20 20h24" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.4" />
        </>
      ) : null}
      {id === 'emoji_rocket' ? (
        <circle cx="32" cy="26" r="5.4" fill="#FFFFFF" fillOpacity="0.85" />
      ) : null}
      {id === 'emoji_snake' ? (
        <circle cx="44" cy="14" r="2.6" fill="#052E1B" />
      ) : null}
    </svg>
  );
}

/* ────────────────────────────── колоды и столы ────────────────────────────── */

const DECK_ART = {
  deck_graphite: ['#8E8AB8', '#4A4670', '#1B1830'],
  deck_neon: ['#C4B5FD', '#7C4DFF', '#2B1160'],
  deck_ice: ['#D6F6FF', '#38BDF8', '#0C4A6E'],
  deck_crimson: ['#FFC9D4', '#F43F5E', '#6B0F24'],
  deck_matrix: ['#C6FFE4', '#22C55E', '#064E3B'],
  deck_void: ['#B9A6FF', '#4C1D95', '#12061F'],
  deck_steel: ['#E7ECF5', '#94A3B8', '#334155'],
  deck_card_steel: ['#E7ECF5', '#94A3B8', '#334155'],
  deck_card_signal: ['#C9F5FF', '#22D3EE', '#0E5C74'],
  deck_card_titan: ['#FFE0C2', '#FB923C', '#7C2D12'],
  deck_card_black: ['#A9A6C4', '#312E45', '#0A0912'],
};

export function DeckArt({ itemId = 'deck_graphite', size = 52 }) {
  const u = useIds();
  const tones = DECK_ART[itemId] || DECK_ART.deck_graphite;
  return (
    <svg className="art art--deck" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="12" y1="10" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={tones[0]} />
          <stop offset="0.5" stopColor={tones[1]} />
          <stop offset="1" stopColor={tones[2]} />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="57" rx="17" ry="3.2" fill="#05030F" opacity="0.4" />
      <rect x="14" y="14" width="34" height="42" rx="6" fill="#0B0820" opacity="0.8" transform="rotate(-9 31 35)" />
      <rect x="17" y="10" width="34" height="42" rx="6" fill={`url(#${u('a')})`} transform="rotate(6 34 31)" />
      <rect x="17" y="10" width="34" height="42" rx="6" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" transform="rotate(6 34 31)" />
      <path
        d="M34 20c1.4 6.6 3.4 8.6 10 10-6.6 1.4-8.6 3.4-10 10-1.4-6.6-3.4-8.6-10-10 6.6-1.4 8.6-3.4 10-10Z"
        fill="#FFFFFF"
        fillOpacity="0.75"
        transform="rotate(6 34 31)"
      />
    </svg>
  );
}

const TABLE_ART = {
  table_graphite: ['#6B688C', '#2A2740', '#12101F'],
  table_emerald: ['#6EE7B7', '#059669', '#052E1F'],
  table_ocean: ['#7DD3FC', '#0284C7', '#062A44'],
  table_aurora: ['#C4B5FD', '#22D3EE', '#1E1B4B'],
  table_lava: ['#FDBA74', '#EA580C', '#451A03'],
  table_midnight: ['#A5B4FC', '#3730A3', '#0B0A24'],
};

export function TableArt({ itemId = 'table_graphite', size = 56 }) {
  const u = useIds();
  const tones = TABLE_ART[itemId] || TABLE_ART.table_graphite;
  return (
    <svg className="art art--tableart" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={u('a')} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor={tones[0]} />
          <stop offset="0.6" stopColor={tones[1]} />
          <stop offset="1" stopColor={tones[2]} />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="55" rx="20" ry="4" fill="#05030F" opacity="0.45" />
      <ellipse cx="32" cy="34" rx="26" ry="17" fill="#120E22" />
      <ellipse cx="32" cy="32" rx="26" ry="17" fill={`url(#${u('a')})`} />
      <ellipse cx="32" cy="32" rx="26" ry="17" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.6" />
      <ellipse cx="32" cy="32" rx="17" ry="10" fill="none" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1.2" strokeDasharray="3 4" />
      <rect x="24" y="24" width="10" height="14" rx="2.2" fill="#FFFFFF" fillOpacity="0.9" transform="rotate(-10 29 31)" />
      <rect x="30" y="26" width="10" height="14" rx="2.2" fill="#FFFFFF" fillOpacity="0.75" transform="rotate(8 35 33)" />
    </svg>
  );
}

/* ────────────────────────────── СБП ────────────────────────────── */

export function SbpMark({ size = 28 }) {
  const u = useIds();
  return (
    <svg className="art art--sbp" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="0.5" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="13" fill={`url(#${u('a')})`} opacity="0.18" />
      <rect x="3" y="3" width="42" height="42" rx="13" fill="none" stroke={`url(#${u('a')})`} strokeWidth="1.6" />
      <path d="M24 9.5 32 17l-8 7.5L16 17Z" fill={`url(#${u('a')})`} opacity="0.55" />
      <path d="M24 21 32 28.5 24 36l-8-7.5Z" fill={`url(#${u('a')})`} />
      <path d="M24 21v15" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.4" />
    </svg>
  );
}

export function Sparkle({ size = 14, tone = '#C4B5FD' }) {
  return (
    <svg className="art art--sparkle" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1c1 5.4 2.6 7 8 8-5.4 1-7 2.6-8 8-1-5.4-2.6-7-8-8 5.4-1 7-2.6 8-8Z" fill={tone} />
    </svg>
  );
}

export function MonogramArt({ name = '?', size = 44 }) {
  const letters = (name || '?').slice(0, 2).toUpperCase();
  return (
    <span className="monogram" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      <span>{letters}</span>
    </span>
  );
}
