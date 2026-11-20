// Объёмная векторная графика предметов магазина: колоды, столы, эмоции, эффекты.
// У каждого предмета собственный рисунок (а не перекраска общего шаблона).
// Анимации — только transform/opacity (см. items3d.css), чтобы не нагружать телефон.
import { useId } from 'react';

function useUid() {
  const raw = useId().replace(/[:]/g, '');
  return (name) => `i3${raw}${name}`;
}

/* ───────────────────────────── КОЛОДЫ ───────────────────────────── */

// Палитра + рисунок рубашки в локальных координатах карты 64×96.
const DECKS = {
  deck_graphite: { c: ['#4a4962', '#23222f', '#121119'], edge: '#aeb0c8' },
  deck_steel: { c: ['#e3e8f2', '#8a94a8', '#434c5e'], edge: '#f4f7fc' },
  deck_neon: { c: ['#101c3f', '#0a1230', '#050a1c'], edge: '#4f8cff' },
  deck_ice: { c: ['#effbff', '#7fd6f5', '#1b6a97'], edge: '#ffffff' },
  deck_crimson: { c: ['#7a1230', '#46091c', '#1c0410'], edge: '#ff7a95' },
  deck_matrix: { c: ['#05190f', '#031009', '#010603'], edge: '#3ddc97' },
  deck_void: { c: ['#241048', '#0c0620', '#030208'], edge: '#a855f7' },
  deck_card_signal: { c: ['#2563c9', '#14397d', '#0a1d45'], edge: '#7fd0ff' },
  deck_card_steel: { c: ['#e3e8f2', '#8a94a8', '#434c5e'], edge: '#f4f7fc' },
  deck_card_titan: { c: ['#7a808f', '#3b3f4a', '#1b1d24'], edge: '#ffb27a' },
  deck_card_black: { c: ['#17171c', '#0a0a0d', '#000000'], edge: '#ff4d6d' },
};

function DeckMotif({ id, u }) {
  switch (id) {
    case 'deck_graphite':
      return (
        <>
          <pattern id={u('w')} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="none" />
            <rect width="4" height="8" fill="#ffffff" opacity="0.07" />
            <rect x="4" width="4" height="8" fill="#000000" opacity="0.18" />
          </pattern>
          <rect width="64" height="96" fill={`url(#${u('w')})`} />
          <path d="M32 26 46 48 32 70 18 48Z" fill="none" stroke="#b9bbd2" strokeWidth="1.6" />
          <path d="M32 33 40 48 32 63 24 48Z" fill="#b9bbd2" opacity="0.28" />
          <circle cx="32" cy="48" r="3" fill="#e4e6f4" />
        </>
      );
    case 'deck_steel':
    case 'deck_card_steel':
      return (
        <>
          {Array.from({ length: 24 }, (_, i) => (
            <rect key={i} x="0" y={4 + i * 4} width="64" height="0.7" fill="#ffffff" opacity={i % 3 === 0 ? 0.35 : 0.14} />
          ))}
          <circle cx="32" cy="48" r="17" fill="none" stroke="#3b4456" strokeWidth="2.2" />
          <circle cx="32" cy="48" r="11" fill="#c7cfdf" stroke="#4a5468" strokeWidth="1.4" />
          <path d="M32 40 36 48 32 56 28 48Z" fill="#4a5468" />
          {[[7, 7], [57, 7], [7, 89], [57, 89]].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <circle cx={x} cy={y} r="2.6" fill="#d9deea" stroke="#4a5468" strokeWidth="0.9" />
              <path d={`M${x - 1.6} ${y}h3.2`} stroke="#4a5468" strokeWidth="0.8" />
            </g>
          ))}
        </>
      );
    case 'deck_neon':
      return (
        <>
          <rect x="5" y="5" width="54" height="86" rx="5" fill="none" stroke="#4f8cff" strokeWidth="1.6" filter={`url(#${u('g')})`} />
          <path d="M5 30h14l6 8h14M59 66H45l-6-8H25M32 5v18M32 91V73" fill="none" stroke="#2fd0ff" strokeWidth="1.4" opacity="0.9" />
          {[[19, 30], [39, 38], [45, 66], [25, 58]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="#aef" filter={`url(#${u('g')})`} />
          ))}
          <path d="M32 33 44 40.500v15L32 63 20 55.500v-15Z" fill="#4f8cff" fillOpacity="0.18" stroke="#7fd0ff" strokeWidth="1.8" filter={`url(#${u('g')})`} />
          <circle cx="32" cy="48" r="3.4" fill="#e6f7ff" />
        </>
      );
    case 'deck_ice':
      return (
        <>
          <path d="M0 0 30 22 0 44ZM64 0V38L38 20ZM0 96V60l26 14ZM64 96H36l14-30 14 8ZM30 22 38 20 64 38 40 52 26 74 0 60 0 44Z" fill="#ffffff" opacity="0.32" />
          <path d="M30 22 40 52 26 74M38 20 40 52 64 38" fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0.7" />
          {[0, 60, 120].map((r) => (
            <g key={r} transform={`rotate(${r} 32 48)`}>
              <path d="M32 28v40M28 33l4 4 4-4M28 63l4-4 4 4" fill="none" stroke="#0e5f8d" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          ))}
          <circle cx="32" cy="48" r="3" fill="#ffffff" />
        </>
      );
    case 'deck_crimson':
      return (
        <>
          <pattern id={u('d')} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M8 1c2 3 2 5 0 7-2-2-2-4 0-7ZM8 8c3 2 5 2 7 0-2-2-4-2-7 0ZM8 8c-3 2-5 2-7 0 2-2 4-2 7 0ZM8 8c2 3 2 5 0 7-2-2-2-4 0-7Z" fill="#ff7a95" opacity="0.22" />
          </pattern>
          <rect width="64" height="96" fill={`url(#${u('d')})`} />
          <rect x="4" y="4" width="56" height="88" rx="4" fill="none" stroke="#ff7a95" strokeWidth="1" opacity="0.8" />
          <path d="M32 28c4 6 4 10 0 14 4 0 8 0 12 4-4 2-8 2-12 6 4 4 4 8 0 14-4-6-4-10 0-14-4-4-8-4-12-6 4-4 8-4 12-4-4-4-4-8 0-14Z" fill="#c21c44" stroke="#ff9db1" strokeWidth="1.2" />
          <circle cx="32" cy="48" r="3.6" fill="#ffd3dc" />
        </>
      );
    case 'deck_matrix':
      return (
        <>
          {Array.from({ length: 12 }, (_, i) => {
            const x = 4 + i * 5;
            const len = 3 + ((i * 7) % 9);
            return (
              <g key={i}>
                {Array.from({ length: len }, (__, j) => (
                  <rect
                    key={j}
                    x={x}
                    y={4 + ((i * 13) % 30) + j * 6}
                    width="3"
                    height="4"
                    rx="0.6"
                    fill="#3ddc97"
                    opacity={Math.max(0.12, 1 - (len - j) * 0.13)}
                  />
                ))}
              </g>
            );
          })}
          <rect x="18" y="36" width="28" height="24" rx="3" fill="#010603" stroke="#3ddc97" strokeWidth="1.6" filter={`url(#${u('g')})`} />
          <path d="M23 44h18M23 48h12M23 52h15" stroke="#7affc6" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    case 'deck_void':
      return (
        <>
          <radialGradient id={u('v')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#000" />
            <stop offset="0.55" stopColor="#000" />
            <stop offset="0.7" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          {[30, 24, 18, 12].map((r, i) => (
            <ellipse key={r} cx="32" cy="48" rx={r} ry={r * 0.62} fill="none" stroke="#a855f7" strokeWidth="1.1" opacity={0.25 + i * 0.18} transform={`rotate(${-24 + i * 14} 32 48)`} />
          ))}
          <circle cx="32" cy="48" r="17" fill={`url(#${u('v')})`} />
          <circle cx="32" cy="48" r="7.500" fill="#000" stroke="#c4a1ff" strokeWidth="1.2" />
          {[[10, 14], [52, 20], [48, 80], [14, 74], [24, 8]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.1" fill="#d8c4ff" />
          ))}
        </>
      );
    case 'deck_card_signal':
      return (
        <>
          {[40, 30, 20, 10].map((r) => (
            <path key={r} d={`M64 96a${r + 20} ${r + 20} 0 0 0-${r + 20}-${r + 20}`} fill="none" stroke="#7fd0ff" strokeWidth="1.4" opacity={0.18 + (40 - r) * 0.012} transform="translate(0 -8)" />
          ))}
          <rect x="10" y="30" width="22" height="17" rx="3.500" fill="#e9c872" stroke="#a5843a" strokeWidth="1" />
          <path d="M10 38.500h22M21 30v17" stroke="#a5843a" strokeWidth="0.9" />
          <path d="M40 34c4 3 4 9 0 12M45 31c6 5 6 13 0 18" fill="none" stroke="#e8f6ff" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="10" y="62" width="30" height="2.600" rx="1.300" fill="#e8f6ff" opacity="0.8" />
          <rect x="10" y="68" width="18" height="2.600" rx="1.300" fill="#e8f6ff" opacity="0.5" />
        </>
      );
    case 'deck_card_titan':
      return (
        <>
          <pattern id={u('h')} width="14" height="12" patternUnits="userSpaceOnUse">
            <path d="M3.500 0 10.500 0 14 6 10.500 12 3.500 12 0 6Z" fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="0.8" />
          </pattern>
          <rect width="64" height="96" fill={`url(#${u('h')})`} />
          <path d="M32 24 50 36v24L32 72 14 60V36Z" fill="#2a2d36" stroke="#ffb27a" strokeWidth="1.8" />
          <path d="M32 32 43 39v18L32 64 21 57V39Z" fill="#ffb27a" opacity="0.2" stroke="#ffd2b0" strokeWidth="1" />
          <path d="M24 44h16M24 50h16M24 56h16" stroke="#ffd2b0" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'deck_card_black':
      return (
        <>
          <rect x="4" y="4" width="56" height="88" rx="4" fill="none" stroke="#ff4d6d" strokeWidth="0.9" opacity="0.9" />
          {[[4, 4], [60, 4], [4, 92], [60, 92]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.600" fill="#ff4d6d" />
          ))}
          <circle cx="32" cy="46" r="13" fill="none" stroke="#2c2c34" strokeWidth="2.600" />
          <circle cx="32" cy="46" r="13" fill="none" stroke="#ff4d6d" strokeWidth="1" strokeDasharray="3 5" />
          <rect x="27" y="41" width="10" height="10" rx="2" fill="#18181e" stroke="#ff4d6d" strokeWidth="0.9" />
          <rect x="10" y="76" width="22" height="2.400" rx="1.200" fill="#ff4d6d" opacity="0.7" />
        </>
      );
    default:
      return null;
  }
}

function DeckFace({ id, u, glossy = true }) {
  const d = DECKS[id] || DECKS.deck_graphite;
  return (
    <>
      <linearGradient id={u('base')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={d.c[0]} />
        <stop offset="0.55" stopColor={d.c[1]} />
        <stop offset="1" stopColor={d.c[2]} />
      </linearGradient>
      <clipPath id={u('clip')}>
        <rect width="64" height="96" rx="7" />
      </clipPath>
      <g clipPath={`url(#${u('clip')})`}>
        <rect width="64" height="96" fill={`url(#${u('base')})`} />
        <DeckMotif id={id} u={u} />
        {glossy ? <path d="M0 0H64V30C44 40 20 36 0 52Z" fill="#fff" opacity="0.11" /> : null}
      </g>
      <rect width="64" height="96" rx="7" fill="none" stroke={d.edge} strokeOpacity="0.85" strokeWidth="1.6" />
      <rect x="1.500" y="1.500" width="61" height="93" rx="5.500" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="0.8" />
    </>
  );
}

export function Deck3D({ itemId = 'deck_graphite', size = 52 }) {
  const u = useUid();
  return (
    <span className="i3 i3--deck" style={{ width: size, height: size }} data-item={itemId}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <defs>
          <filter id={u('g')} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="50" cy="94" rx="30" ry="4.500" fill="#000" opacity="0.45" />
        <g className="i3__card i3__card--back" transform="translate(14 9) rotate(-11 32 48) scale(0.86)">
          <rect x="3" y="4" width="64" height="96" rx="7" fill="#000" opacity="0.45" />
          <DeckFace id={itemId} u={(n) => u(`b${n}`)} glossy={false} />
          <rect width="64" height="96" rx="7" fill="#000" opacity="0.38" />
        </g>
        <g className="i3__card i3__card--front" transform="translate(26 5) rotate(5 32 48) scale(0.9)">
          <rect x="3" y="5" width="64" height="96" rx="7" fill="#000" opacity="0.5" />
          <DeckFace id={itemId} u={(n) => u(`f${n}`)} />
        </g>
      </svg>
    </span>
  );
}

/* ───────────────────────────── СТОЛЫ ───────────────────────────── */

const TABLES = {
  table_graphite: { rim: ['#8a8aa6', '#3a3950', '#1b1a28'], felt: ['#34344a', '#17171f'], glow: '#8e8ab8' },
  table_emerald: { rim: ['#f0d58a', '#b08a2e', '#5b4310'], felt: ['#18a06f', '#07311f'], glow: '#34e0a0' },
  table_ocean: { rim: ['#e6f6ff', '#6fb6e6', '#1b4f80'], felt: ['#1f7fcf', '#082a52'], glow: '#4fc3ff' },
  table_aurora: { rim: ['#d9ccff', '#7c5cff', '#2a1f66'], felt: ['#1b2250', '#0a0e26'], glow: '#9d7cff' },
  table_lava: { rim: ['#6a3a2e', '#2d1713', '#120806'], felt: ['#2a1410', '#0f0605'], glow: '#ff6a2e' },
  table_midnight: { rim: ['#c79bff', '#6a35c4', '#1c0b3a'], felt: ['#0d0d16', '#030306'], glow: '#a855f7' },
};

function TableSurface({ id, u }) {
  switch (id) {
    case 'table_graphite':
      return (
        <>
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M${14 + i * 7} 62 ${34 + i * 7} 18`} stroke="#fff" strokeOpacity="0.045" strokeWidth="1.6" />
          ))}
          <ellipse cx="60" cy="38" rx="30" ry="15" fill="none" stroke="#8e8ab8" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2 3" />
        </>
      );
    case 'table_emerald':
      return (
        <>
          <pattern id={u('f')} width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.55" fill="#fff" opacity="0.13" />
          </pattern>
          <ellipse cx="60" cy="38" rx="46" ry="26" fill={`url(#${u('f')})`} />
          <ellipse cx="60" cy="38" rx="31" ry="16" fill="none" stroke="#f0d58a" strokeOpacity="0.7" strokeWidth="1" />
          <path d="M60 30 63 38 60 46 57 38Z" fill="#f0d58a" opacity="0.8" />
        </>
      );
    case 'table_ocean':
      return (
        <>
          {[24, 34, 44, 54].map((y, i) => (
            <path key={y} d={`M16 ${y}q11 -7 22 0t22 0t22 0t22 0`} fill="none" stroke="#e6f6ff" strokeOpacity={0.5 - i * 0.07} strokeWidth="1.5" strokeLinecap="round" />
          ))}
          <circle cx="40" cy="30" r="1.4" fill="#fff" />
          <circle cx="82" cy="46" r="1.2" fill="#fff" />
        </>
      );
    case 'table_aurora':
      return (
        <>
          <linearGradient id={u('au1')} x1="0" x2="1">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="0.5" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#7c5cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={u('au2')} x1="0" x2="1">
            <stop offset="0" stopColor="#c084fc" stopOpacity="0" />
            <stop offset="0.5" stopColor="#c084fc" />
            <stop offset="1" stopColor="#34e0a0" stopOpacity="0" />
          </linearGradient>
          <path d="M14 46C34 22 52 56 74 30s28-4 34 2" fill="none" stroke={`url(#${u('au1')})`} strokeWidth="6" opacity="0.8" strokeLinecap="round" />
          <path d="M18 56C40 34 60 62 84 40s20-4 26-2" fill="none" stroke={`url(#${u('au2')})`} strokeWidth="4" opacity="0.7" strokeLinecap="round" />
          {[[30, 24], [50, 18], [88, 24], [96, 46], [40, 54], [70, 56]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="0.9" fill="#fff" />
          ))}
        </>
      );
    case 'table_lava':
      return (
        <>
          <path d="M30 36 44 30 54 40 66 28 80 40 92 32M54 40 50 52 62 58M80 40 84 52" fill="none" stroke="#ff6a2e" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 36 44 30 54 40 66 28 80 40 92 32M54 40 50 52 62 58M80 40 84 52" fill="none" stroke="#ffd36a" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
          {[[38, 48], [72, 24], [94, 46], [26, 28]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.3" fill="#ffb066" />
          ))}
        </>
      );
    case 'table_midnight':
      return (
        <>
          {[[30, 24], [48, 16], [76, 20], [92, 36], [88, 52], [44, 54], [24, 42], [64, 58]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.2 : 0.8} fill="#e8d6ff" opacity="0.9" />
          ))}
          <path d="M46 30a10 10 0 1 0 10 14 8 8 0 1 1-10-14Z" fill="#c79bff" opacity="0.85" transform="translate(30 -2)" />
          <ellipse cx="60" cy="38" rx="34" ry="18" fill="none" stroke="#a855f7" strokeOpacity="0.75" strokeWidth="1" />
        </>
      );
    default:
      return null;
  }
}

export function Table3D({ itemId = 'table_graphite', size = 56 }) {
  const u = useUid();
  const t = TABLES[itemId] || TABLES.table_graphite;
  const w = size * 1.34;
  return (
    <span className="i3 i3--table" style={{ width: w, height: size }} data-item={itemId}>
      <svg viewBox="0 0 120 90" width={w} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={u('rim')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={t.rim[0]} />
            <stop offset="0.5" stopColor={t.rim[1]} />
            <stop offset="1" stopColor={t.rim[2]} />
          </linearGradient>
          <radialGradient id={u('felt')} cx="0.5" cy="0.4" r="0.75">
            <stop offset="0" stopColor={t.felt[0]} />
            <stop offset="1" stopColor={t.felt[1]} />
          </radialGradient>
          <radialGradient id={u('glow')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.6" stopColor={t.glow} stopOpacity="0" />
            <stop offset="1" stopColor={t.glow} stopOpacity="0.55" />
          </radialGradient>
          <clipPath id={u('cl')}>
            <ellipse cx="60" cy="38" rx="46" ry="26" />
          </clipPath>
        </defs>
        <ellipse cx="60" cy="52" rx="58" ry="30" fill={t.glow} opacity="0.16" />
        <ellipse cx="60" cy="78" rx="46" ry="7" fill="#000" opacity="0.5" />
        {/* толщина столешницы */}
        <path d="M4 40v9c0 15 26 26 56 26s56-11 56-26v-9Z" fill={t.rim[2]} />
        <path d="M4 40v9c0 15 26 26 56 26s56-11 56-26v-9Z" fill="#000" opacity="0.25" />
        <ellipse cx="60" cy="40" rx="56" ry="31" fill={`url(#${u('rim')})`} />
        <ellipse cx="60" cy="40" rx="56" ry="31" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
        <ellipse cx="60" cy="38" rx="48" ry="27.500" fill="#000" opacity="0.5" />
        <ellipse cx="60" cy="38" rx="46" ry="26" fill={`url(#${u('felt')})`} />
        <g clipPath={`url(#${u('cl')})`}>
          <TableSurface id={itemId} u={u} />
          <ellipse cx="60" cy="38" rx="46" ry="26" fill={`url(#${u('glow')})`} />
          <path d="M14 30C34 10 86 6 106 28 86 18 34 20 14 30Z" fill="#fff" opacity="0.1" />
        </g>
        {/* карты и фишки для масштаба */}
        <g className="i3__props">
          <rect x="50" y="30" width="11" height="15" rx="2" fill="#fff" transform="rotate(-14 55 37)" opacity="0.96" />
          <rect x="58" y="31" width="11" height="15" rx="2" fill="#eef" transform="rotate(10 63 38)" />
          <ellipse cx="82" cy="46" rx="5" ry="2.600" fill={t.glow} />
          <ellipse cx="82" cy="44.500" rx="5" ry="2.600" fill="#fff" opacity="0.85" />
        </g>
      </svg>
    </span>
  );
}

/* ───────────────────────────── ЭМОЦИИ ───────────────────────────── */

function EmojiBody({ id, u }) {
  const grad = (name, stops, vertical = true) => (
    <linearGradient id={u(name)} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 1}>
      {stops.map(([o, c], i) => (
        <stop key={i} offset={o} stopColor={c} />
      ))}
    </linearGradient>
  );
  switch (id) {
    case 'emoji_fire':
      return (
        <>
          <defs>
            {grad('o', [[0, '#ff3d2e'], [0.55, '#ff8a1f'], [1, '#ffcf3a']])}
            {grad('m', [[0, '#ff9a1f'], [1, '#ffe27a']])}
            {grad('i', [[0, '#ffe27a'], [1, '#ffffff']])}
          </defs>
          <g className="i3__flame">
            <path d="M32 3c2 10 11 14 14 24 3 10-2 22-14 27C20 49 15 38 18 28c1.500 5 4.500 6 6 5-2-9 2-14 5-20 1-3 2-6 3-10Z" fill={`url(#${u('o')})`} />
            <path d="M32 20c1 7 8 10 10 18 1.800 7-2 14-10 16-8-2-12-9-10-16 1 3 3 4 4 3-1-6 2-9 4-13 1.500-3 2-5 2-8Z" fill={`url(#${u('m')})`} />
            <path d="M32 36c1 4 5 6 5 11 0 4-2.500 6.500-5 7-2.500-.5-5-3-5-7 0-3 2-4 3-6 1 1.500 1.500 1 2-5Z" fill={`url(#${u('i')})`} />
          </g>
          <path d="M23 24c-1 4 0 7 2 9" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.600" fill="none" strokeLinecap="round" />
          <circle className="i3__spark i3__spark--a" cx="14" cy="22" r="1.800" fill="#ffd36a" />
          <circle className="i3__spark i3__spark--b" cx="50" cy="16" r="1.500" fill="#ff9a3a" />
          <circle className="i3__spark i3__spark--c" cx="52" cy="38" r="1.200" fill="#ffd36a" />
        </>
      );
    case 'emoji_ice':
      return (
        <>
          <defs>
            {grad('a', [[0, '#f4fdff'], [0.5, '#7fdcff'], [1, '#2a7ad0']])}
            {grad('b', [[0, '#c9f1ff'], [1, '#1d5fc0']])}
          </defs>
          {[0, 60, 120, 180, 240, 300].map((r) => (
            <path key={r} d="M32 32 29.500 8 32 3 34.500 8Z" fill={`url(#${u('a')})`} stroke="#eaffff" strokeOpacity="0.8" strokeWidth="0.8" transform={`rotate(${r} 32 32)`} />
          ))}
          {[30, 90, 150, 210, 270, 330].map((r) => (
            <path key={r} d="M32 32 30 17 32 14 34 17Z" fill="#aee8ff" opacity="0.85" transform={`rotate(${r} 32 32)`} />
          ))}
          <path d="M32 20 43 26v12L32 44 21 38V26Z" fill={`url(#${u('b')})`} stroke="#fff" strokeOpacity="0.85" strokeWidth="1" />
          <path d="M32 20 43 26 32 32 21 26Z" fill="#fff" opacity="0.65" />
          <path d="M32 32v12L21 38V26Z" fill="#fff" opacity="0.18" />
          <circle className="i3__spark i3__spark--a" cx="50" cy="12" r="1.500" fill="#fff" />
          <circle className="i3__spark i3__spark--b" cx="12" cy="48" r="1.300" fill="#cfeeff" />
        </>
      );
    case 'emoji_skull':
      return (
        <>
          <defs>
            <radialGradient id={u('a')} cx="0.4" cy="0.3" r="0.9">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.6" stopColor="#d9dcf0" />
              <stop offset="1" stopColor="#8a8fb4" />
            </radialGradient>
          </defs>
          <path d="M32 5C17 5 9 15 9 27c0 8 4 13 9 16v8c0 2.500 2 4.500 4.500 4.500h19c2.500 0 4.500-2 4.500-4.500v-8c5-3 9-8 9-16C55 15 47 5 32 5Z" fill={`url(#${u('a')})`} stroke="#5a5f86" strokeWidth="1.400" />
          <path d="M18 24c0-4 3.500-7 7.500-7s7.500 3 7.500 8-3.500 8-7.500 8-7.500-4-7.500-9ZM46 24c0-4-3.500-7-7.500-7S31 20 31 25s3.500 8 7.500 8 7.500-4 7.500-9Z" fill="#1a1530" />
          <path d="M32 33 28 42h8Z" fill="#1a1530" />
          <path d="M22 47v8M27 48v9M32 48v9M37 48v9M42 47v8" stroke="#5a5f86" strokeWidth="1.600" strokeLinecap="round" />
          <circle className="i3__eye" cx="26" cy="25" r="2" fill="#a855f7" />
          <circle className="i3__eye" cx="38" cy="25" r="2" fill="#a855f7" />
          <path d="M14 14c4-5 9-7 14-7" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      );
    case 'emoji_snake':
      return (
        <>
          <defs>
            {grad('a', [[0, '#9bf5c6'], [0.5, '#22b573'], [1, '#07603e']], false)}
          </defs>
          <path className="i3__coil" d="M46 50C34 56 16 52 17 42c1-9 24-5 30-14 4-6-2-14-12-14-9 0-14 6-12 12" fill="none" stroke="#04301f" strokeWidth="11" strokeLinecap="round" />
          <path className="i3__coil" d="M46 50C34 56 16 52 17 42c1-9 24-5 30-14 4-6-2-14-12-14-9 0-14 6-12 12" fill="none" stroke={`url(#${u('a')})`} strokeWidth="8.500" strokeLinecap="round" />
          <path d="M46 50C34 56 16 52 17 42c1-9 24-5 30-14 4-6-2-14-12-14-9 0-14 6-12 12" fill="none" stroke="#d7ffe9" strokeOpacity="0.5" strokeWidth="2.600" strokeDasharray="1 5" strokeLinecap="round" />
          <ellipse cx="22" cy="23" rx="8.500" ry="7" fill={`url(#${u('a')})`} stroke="#04301f" strokeWidth="1.200" transform="rotate(-18 22 23)" />
          <circle cx="19" cy="21" r="2.200" fill="#fff7a8" />
          <circle cx="19.500" cy="21" r="1" fill="#10121c" />
          <path className="i3__tongue" d="M14 28l-6 3m6-3-5-5m5 5-7 0" stroke="#ff3b5c" strokeWidth="1.600" strokeLinecap="round" fill="none" />
        </>
      );
    case 'emoji_bolt':
      return (
        <>
          <defs>
            {grad('a', [[0, '#ffffff'], [0.4, '#8fe8ff'], [1, '#2a6bff']])}
            {grad('b', [[0, '#e8fbff'], [1, '#52b6ff']])}
            <radialGradient id={u('hb')}><stop offset="0.3" stopColor="#4fc3ff" stopOpacity="0.9" /><stop offset="1" stopColor="#4fc3ff" stopOpacity="0" /></radialGradient>
          </defs>
          <circle className="i3__halo" cx="32" cy="32" r="30" fill={`url(#${u("hb")})`} />
          <path d="M39 2 14 36h14l-5 26 28-38H35Z" fill="#0d2a7a" transform="translate(1.500 2)" opacity="0.6" />
          <path d="M39 2 14 36h14l-5 26 28-38H35Z" fill={`url(#${u('a')})`} stroke="#eaffff" strokeWidth="1.200" strokeLinejoin="round" />
          <path d="M37 9 22 33h12l-3 15" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M44 24 31 40" stroke="#1d5fff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
          <circle className="i3__spark i3__spark--a" cx="12" cy="18" r="1.600" fill="#bfefff" />
          <circle className="i3__spark i3__spark--b" cx="52" cy="46" r="1.600" fill="#bfefff" />
        </>
      );
    case 'emoji_rocket':
      return (
        <>
          <defs>
            {grad('a', [[0, '#ffffff'], [0.5, '#dfe3f6'], [1, '#8a93c4']], false)}
            {grad('f', [[0, '#ffe27a'], [0.5, '#ff8a1f'], [1, '#ff3d2e']])}
            {grad('r', [[0, '#ff7aa8'], [1, '#c01a5a']])}
          </defs>
          <g className="i3__fly">
            <path className="i3__plume" d="M32 50c-6 4-7 9-5 12 2-1 3-1 5-4 2 3 3 3 5 4 2-3 1-8-5-12Z" fill={`url(#${u('f')})`} />
            <path d="M32 50c-3 2-3.500 5-2.500 7 1-1 1.500-1.500 2.500-3 1 1.500 1.500 2 2.500 3 1-2 .5-5-2.500-7Z" fill="#fff6c8" />
            <path d="M20 38 10 48l1 6 10-4ZM44 38l10 10-1 6-10-4Z" fill={`url(#${u('r')})`} stroke="#6a0f36" strokeWidth="0.9" />
            <path d="M32 3C42 11 46 22 45 36l-4 12H23l-4-12C18 22 22 11 32 3Z" fill={`url(#${u('a')})`} stroke="#5b628f" strokeWidth="1.200" />
            <path d="M32 3C37 7 41 12 43 18H21c2-6 6-11 11-15Z" fill={`url(#${u('r')})`} />
            <circle cx="32" cy="28" r="6.500" fill="#1a1f4a" stroke="#c9d0f5" strokeWidth="2" />
            <circle cx="32" cy="28" r="4.200" fill="#4fc3ff" />
            <circle cx="30" cy="26" r="1.500" fill="#fff" />
            <path d="M24 41h16" stroke="#5b628f" strokeOpacity="0.6" strokeWidth="1.200" />
          </g>
          <circle className="i3__spark i3__spark--a" cx="12" cy="30" r="1.400" fill="#fff" />
          <circle className="i3__spark i3__spark--b" cx="54" cy="24" r="1.600" fill="#ffd36a" />
        </>
      );
    case 'emoji_diamond':
      return (
        <>
          <defs>
            {grad('a', [[0, '#f0e8ff'], [0.5, '#b08cff'], [1, '#5b2bd6']])}
            {grad('b', [[0, '#ffffff'], [1, '#c4a8ff']])}
          </defs>
          <path d="M14 22 22 8h20l8 14-18 38Z" fill={`url(#${u('a')})`} stroke="#f4eeff" strokeWidth="1.200" strokeLinejoin="round" />
          <path d="M14 22h36L32 60Z" fill="#5b2bd6" opacity="0.28" />
          <path d="M14 22 22 8l10 14ZM50 22 42 8 32 22Z" fill={`url(#${u('b')})`} opacity="0.95" />
          <path d="M22 8h20l-10 14Z" fill="#fff" opacity="0.8" />
          <path d="M14 22h18L32 60ZM50 22H32l0 38Z" fill="#7a4cf0" opacity="0.35" />
          <path d="M14 22 32 60M50 22 32 60M22 8 32 22 42 8" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.9" />
          <path className="i3__glint" d="M44 5v10M39 10h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle className="i3__spark i3__spark--b" cx="10" cy="48" r="1.500" fill="#e4d6ff" />
        </>
      );
    default:
      return null;
  }
}

export function Emoji3D({ id, size = 34 }) {
  const u = useUid();
  if (!id) return null;
  return (
    <span className="i3 i3--emoji" style={{ width: size, height: size }} data-item={id}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <ellipse cx="32" cy="60" rx="15" ry="2.800" fill="#000" opacity="0.4" />
        <EmojiBody id={id} u={u} />
      </svg>
    </span>
  );
}

/* ───────────────────────────── ЭФФЕКТЫ ───────────────────────────── */

export function Effect3D({ id = 'effect_none', size = 56 }) {
  const u = useUid();
  return (
    <span className="i3 i3--effect" style={{ width: size, height: size }} data-item={id}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <defs>
          <radialGradient id={u('orb')} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#7fd6ff" />
            <stop offset="1" stopColor="#1d5fc0" />
          </radialGradient>
          <radialGradient id={u('hl')}><stop offset="0.3" stopColor="#4f8cff" stopOpacity="0.9" /><stop offset="1" stopColor="#4f8cff" stopOpacity="0" /></radialGradient>
          <radialGradient id={u('hp')}><stop offset="0.3" stopColor="#ff7a2e" stopOpacity="0.9" /><stop offset="1" stopColor="#ff7a2e" stopOpacity="0" /></radialGradient>
          <radialGradient id={u('pn')} cx="0.5" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="0.5" stopColor="#ff9a2e" />
            <stop offset="1" stopColor="#d6361f" />
          </radialGradient>
        </defs>
        <ellipse cx="32" cy="58" rx="14" ry="2.600" fill="#000" opacity="0.4" />
        {id === 'effect_ripple' ? (
          <>
            {[0, 1, 2].map((i) => (
              <ellipse key={i} className={`i3__ring i3__ring--${i}`} cx="32" cy="34" rx="12" ry="6.500" fill="none" stroke="#7fd6ff" strokeWidth="2.200" />
            ))}
            <ellipse cx="32" cy="34" rx="13" ry="7" fill="#1d5fc0" opacity="0.35" />
            <circle cx="32" cy="27" r="8.500" fill={`url(#${u('orb')})`} stroke="#eaffff" strokeOpacity="0.7" strokeWidth="1" />
            <ellipse cx="29" cy="24" rx="3" ry="2" fill="#fff" opacity="0.85" />
          </>
        ) : null}
        {id === 'effect_glitch' ? (
          <>
            <rect className="i3__slice i3__slice--c" x="14" y="14" width="36" height="36" rx="6" fill="#22d3ee" opacity="0.55" />
            <rect className="i3__slice i3__slice--m" x="14" y="14" width="36" height="36" rx="6" fill="#f472b6" opacity="0.55" />
            <rect x="14" y="14" width="36" height="36" rx="6" fill="#1a1740" stroke="#c4b5fd" strokeWidth="1.400" />
            <circle cx="32" cy="26" r="6" fill="#c4b5fd" />
            <path d="M20 46c2-8 8-10 12-10s10 2 12 10Z" fill="#c4b5fd" />
            <rect className="i3__bar i3__bar--a" x="12" y="22" width="40" height="3.500" fill="#22d3ee" />
            <rect className="i3__bar i3__bar--b" x="12" y="36" width="40" height="3" fill="#f472b6" />
            {[[8, 12], [54, 18], [52, 50], [10, 46]].map(([x, y], i) => (
              <rect key={i} className={`i3__px i3__px--${i}`} x={x} y={y} width="4" height="4" fill={i % 2 ? '#f472b6' : '#22d3ee'} />
            ))}
          </>
        ) : null}
        {id === 'effect_lightning' ? (
          <>
            <circle cx="32" cy="32" r="30" fill={`url(#${u("hl")})`} className="i3__halo" />
            <circle cx="32" cy="32" r="9" fill={`url(#${u('orb')})`} stroke="#eaffff" strokeWidth="1" />
            {[
              'M32 23 28 14 33 10 27 2',
              'M40 28 50 24 47 18 58 14',
              'M24 38 14 42 18 48 8 54',
              'M38 40 42 50 37 54 41 62',
            ].map((d, i) => (
              <g key={i} className={`i3__bolt i3__bolt--${i}`}>
                <path d={d} fill="none" stroke="#2a6bff" strokeWidth="3.600" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                <path d={d} fill="none" stroke="#f4ffff" strokeWidth="1.600" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}
          </>
        ) : null}
        {id === 'effect_phoenix' ? (
          <>
            <circle cx="32" cy="34" r="30" fill={`url(#${u("hp")})`} className="i3__halo" />
            <path className="i3__wing i3__wing--l" d="M30 30C20 22 10 22 4 28c6 0 9 3 11 6-4 0-7 2-8 5 6-2 12-1 18 1Z" fill={`url(#${u('pn')})`} stroke="#ffe27a" strokeWidth="0.8" />
            <path className="i3__wing i3__wing--r" d="M34 30c10-8 20-8 26-2-6 0-9 3-11 6 4 0 7 2 8 5-6-2-12-1-18 1Z" fill={`url(#${u('pn')})`} stroke="#ffe27a" strokeWidth="0.8" />
            <path d="M32 18c3 3 4 6 4 9 0 5-2 9-4 11-2-2-4-6-4-11 0-3 1-6 4-9Z" fill={`url(#${u('pn')})`} />
            <path d="M32 36c5 5 6 11 3 18-1-3-2-4-3-4s-2 1-3 4c-3-7-2-13 3-18Z" fill="#ffcf3a" opacity="0.95" />
            <circle cx="32" cy="22" r="1.200" fill="#2a0a05" />
            <path d="M32 16 36 12" stroke="#ffe27a" strokeWidth="1.600" strokeLinecap="round" />
            {[[16, 46], [48, 44], [24, 54], [40, 56], [32, 8]].map(([x, y], i) => (
              <circle key={i} className={`i3__ember i3__ember--${i}`} cx={x} cy={y} r="1.500" fill="#ffd36a" />
            ))}
          </>
        ) : null}
        {id === 'effect_none' || !id ? (
          <>
            <circle cx="32" cy="32" r="16" fill="none" stroke="#6b5ba8" strokeWidth="2" strokeDasharray="4 5" />
            <circle cx="32" cy="27" r="5" fill="#6b5ba8" opacity="0.7" />
            <path d="M22 42c2-6 6-8 10-8s8 2 10 8Z" fill="#6b5ba8" opacity="0.7" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

/* ───────────────────────────── 3D-ПОДАЧА НАГРАДЫ ───────────────────────────── */

const RARITY_FX = {
  common: { n: 6, hue: '#9aa4c4' },
  rare: { n: 14, hue: '#66b0ff' },
  epic: { n: 22, hue: '#c27bff' },
  legendary: { n: 34, hue: '#ffb52a' },
  mythic: { n: 40, hue: '#ff5a5a' },
};

const PARTICLES = Array.from({ length: 40 }, (_, i) => {
  const a = (i / 40) * Math.PI * 2 + (i % 3) * 0.37;
  const d = 90 + ((i * 37) % 90);
  return { id: i, x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8 - 20, s: 0.6 + ((i * 13) % 10) / 10, delay: (i * 53) % 700 };
});

/**
 * Объёмная презентация награды: камера «наезжает», предмет вращается на подставке,
 * сверху свет, снизу отражение. Тип (колода/стол/эмоция/эффект) и редкость
 * задают разный сценарий — см. data-атрибуты и items3d.css.
 */
export function Reward3D({ type = 'deck', rarity = 'common', name = '', children }) {
  const fx = RARITY_FX[rarity] || RARITY_FX.common;
  return (
    <div className={`rd3 rd3--${type}`} data-rarity={rarity} style={{ '--rd3-hue': fx.hue }}>
      <span className="rd3__beam" aria-hidden="true" />
      <span className="rd3__rays" aria-hidden="true" />
      <span className="rd3__spot" aria-hidden="true" />
      <div className="rd3__cam">
        <div className="rd3__turn">
          <div className="rd3__item">{children}</div>
          <span className="rd3__sweep" aria-hidden="true" />
        </div>
      </div>
      <span className="rd3__floor" aria-hidden="true" />
      <span className="rd3__mirror" aria-hidden="true" />
      <span className="rd3__ring rd3__ring--a" aria-hidden="true" />
      <span className="rd3__ring rd3__ring--b" aria-hidden="true" />
      <span className="rd3__dust" aria-hidden="true">
        {PARTICLES.slice(0, fx.n).map((p) => (
          <i key={p.id} style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--s': p.s, '--d': `${p.delay}ms` }} />
        ))}
      </span>
      <div className="rd3__name" aria-label={name}>
        {Array.from(name).map((ch, i) => (
          <span key={i} style={{ '--i': i }} aria-hidden="true">
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
