// Объёмная графика FARTU MASTI: сундуки кейсов, эффекты, эмодзи, колоды, столы.
// Всё нарисовано векторно (SVG с градиентами и бликами) — без внешних файлов и эмодзи-заглушек.
import { useId } from 'react';
import { ChestSprite, chestSprite } from './ChestSprite.jsx';
import { Deck3D, Table3D, Emoji3D, Effect3D } from './Items3D.jsx';

// Предметы магазина рисуются в Items3D.jsx: у каждого свой объёмный рисунок.
export function EffectArt({ id = 'effect_none', size = 56 }) {
  return <Effect3D id={id} size={size} />;
}
export function EmojiArt({ id, size = 34 }) {
  return <Emoji3D id={id} size={size} />;
}
export function DeckArt({ itemId = 'deck_graphite', size = 52 }) {
  return <Deck3D itemId={itemId} size={size} />;
}
export function TableArt({ itemId = 'table_graphite', size = 56 }) {
  return <Table3D itemId={itemId} size={size} />;
}

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

export function TrophyArt({ size = 34, tone = 'gold' }) {
  const u = useIds();
  const palette =
    tone === 'violet'
      ? ['#C9B8FF', '#8B5CF6', '#5B21B6', '#A78BFA']
      : ['#FFF3A6', '#FFC400', '#B9770E', '#FFD84D'];
  return (
    <svg className="art art--trophy" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="12" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={palette[0]} />
          <stop offset="0.5" stopColor={palette[1]} />
          <stop offset="1" stopColor={palette[2]} />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44" rx="12" ry="3" fill="#05030F" opacity="0.45" />
      <path d="M14 7h20v9c0 6.1-4.5 11-10 11S14 22.1 14 16Z" fill={`url(#${u('a')})`} />
      <path d="M14 9h-3.5a6.5 6.5 0 0 0 6.5 8.5M34 9h3.5A6.5 6.5 0 0 1 31 17.5" stroke={palette[3]} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M24 27v7" stroke={palette[3]} strokeWidth="3.2" strokeLinecap="round" />
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
  if (chestSprite(themeId)) return <ChestSprite caseId={themeId} size={size} open={open} />;
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

/* ────────────────────────────── плитки главного экрана ────────────────────────────── */

export function ShopArt({ size = 40 }) {
  const u = useIds();
  return (
    <svg className="art" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="8" y1="10" x2="40" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9D2F2" />
        </linearGradient>
      </defs>
      <path d="M3 6h6l5 20h22l5-15H12" fill="none" stroke="#5B3A12" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M3 6h6l5 20h22l5-15H12" fill="none" stroke={`url(#${u('a')})`} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 12h26l-4 13H16.500z" fill={`url(#${u('a')})`} opacity="0.95" />
      <path d="M17 15h20M18 19h17M19.500 23h13" stroke="#B8AEDC" strokeWidth="1.2" />
      <circle cx="17" cy="35" r="3.600" fill="#FFFFFF" stroke="#5B3A12" strokeWidth="1.600" />
      <circle cx="33" cy="35" r="3.600" fill="#FFFFFF" stroke="#5B3A12" strokeWidth="1.600" />
    </svg>
  );
}

export function WalletArt({ size = 40 }) {
  const u = useIds();
  return (
    <svg className="art" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={u('a')} x1="6" y1="10" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C98A3A" />
          <stop offset="1" stopColor="#7A4414" />
        </linearGradient>
        <linearGradient id={u('b')} x1="30" y1="22" x2="44" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE680" />
          <stop offset="1" stopColor="#E09A12" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="43" rx="17" ry="3" fill="#05030F" opacity="0.4" />
      <path d="M8 14l26-6 2 7z" fill="#E7C27A" stroke="#6B3C10" strokeWidth="1.400" />
      <rect x="5" y="14" width="38" height="27" rx="6" fill={`url(#${u('a')})`} stroke="#4B2A0A" strokeWidth="1.800" />
      <path d="M9 19h30" stroke="#F0C27A" strokeOpacity="0.5" strokeWidth="1.400" strokeDasharray="3 2.400" />
      <rect x="28" y="23" width="17" height="11" rx="4" fill={`url(#${u('b')})`} stroke="#4B2A0A" strokeWidth="1.600" />
      <circle cx="34" cy="28.500" r="2.200" fill="#4B2A0A" />
    </svg>
  );
}
