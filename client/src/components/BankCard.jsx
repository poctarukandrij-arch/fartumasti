// Коллекционные банковские карты FARTU MASTI.
// Каждая карта — своя палитра и свой фирменный знак (векторные формы, не плоский текст).
import { useId } from 'react';
import { ChestSprite } from './ChestSprite.jsx';

export const BANKS = {
  sber: { name: 'Сбер', rarity: 'legendary', from: '#21A038', to: '#06622B', ink: '#ffffff', accent: '#8ef0b0' },
  tbank: { name: 'Т-Банк', rarity: 'legendary', from: '#FFDD2D', to: '#E0B800', ink: '#101010', accent: '#fff3a8' },
  alfa: { name: 'Альфа-Банк', rarity: 'legendary', from: '#EF3124', to: '#9E1209', ink: '#ffffff', accent: '#ffb0a8' },
  ozon: { name: 'Ozon Банк', rarity: 'rare', from: '#005BFF', to: '#5B21B6', ink: '#ffffff', accent: '#9ec5ff' },
  uralsib: { name: 'Уралсиб', rarity: 'rare', from: '#0B4DA2', to: '#062A5C', ink: '#ffffff', accent: '#ff8a3d' },
  wb: { name: 'WB Банк', rarity: 'rare', from: '#CB11AB', to: '#6A0B8A', ink: '#ffffff', accent: '#ff8ee0' },
  raif: { name: 'Райффайзен', rarity: 'rare', from: '#FEE600', to: '#D6C200', ink: '#111111', accent: '#fff9a8' },
  otp: { name: 'ОТП Банк', rarity: 'common', from: '#009B48', to: '#046B33', ink: '#ffffff', accent: '#9df0bd' },
  sovcom: { name: 'Совкомбанк', rarity: 'common', from: '#0A2973', to: '#04143A', ink: '#ffffff', accent: '#7fb2ff' },
  mts: { name: 'МТС Банк', rarity: 'common', from: '#E30611', to: '#8A030B', ink: '#ffffff', accent: '#ffb3b7' },
};

export const BANK_IDS = Object.keys(BANKS);

export function bankOf(itemId) {
  if (!itemId || !String(itemId).startsWith('bank_')) return null;
  return BANKS[String(itemId).slice(5)] || null;
}

/* ── фирменные знаки ───────────────────────────────────────────────── */

function Mark({ bank, ink }) {
  switch (bank) {
    case 'sber':
      return (
        <g fill="none" stroke={ink} strokeWidth="4.6" strokeLinecap="round">
          <path d="M8 30c9-9 24-7 28 4" />
          <path d="M14 22c7-5 16-3 19 4" opacity="0.75" />
          <circle cx="33" cy="36" r="3.4" fill={ink} stroke="none" />
        </g>
      );
    case 'tbank':
      return (
        <g>
          <path d="M4 6h30l6 8-21 24L-2 14l6-8z" fill={ink} />
          <path d="M10 14h18M19 14v20" stroke="#FFDD2D" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'alfa':
      return (
        <g>
          <path d="M16 4l16 34h-8.5l-3-7H11l-3 7H0L16 4z" fill={ink} />
          <path d="M9.5 26h13l-3.4-8h-6.2l-3.4 8z" fill="#EF3124" opacity="0.92" />
        </g>
      );
    case 'ozon':
      return (
        <g fill="none" stroke={ink} strokeWidth="4.4">
          <circle cx="14" cy="20" r="11" />
          <circle cx="30" cy="20" r="7" opacity="0.8" />
        </g>
      );
    case 'uralsib':
      return (
        <g>
          <path d="M2 34L16 6l14 28h-8L16 20l-6 14H2z" fill={ink} />
          <path d="M26 10c9 4 13 12 12 24" fill="none" stroke="#FF8A3D" strokeWidth="4.4" strokeLinecap="round" />
        </g>
      );
    case 'wb':
      return (
        <g fill={ink}>
          <path d="M2 8h6l3.5 15L15 8h6l3.5 15L28 8h6l-6 26h-6l-4-14-4 14H8L2 8z" />
        </g>
      );
    case 'raif':
      return (
        <g>
          <path d="M4 30V8h12c5 0 8 3 8 7s-3 7-8 7H10" fill="none" stroke={ink} strokeWidth="4.4" strokeLinecap="round" />
          <path d="M18 22l10 8" stroke={ink} strokeWidth="4.4" strokeLinecap="round" />
          <path d="M2 4h30" stroke={ink} strokeWidth="3" opacity="0.55" />
        </g>
      );
    case 'otp':
      return (
        <g>
          <rect x="0" y="6" width="34" height="26" rx="6" fill="none" stroke={ink} strokeWidth="3.4" />
          <path d="M6 25V13l6 7 6-7v12" fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
        </g>
      );
    case 'sovcom':
      return (
        <g>
          <circle cx="16" cy="20" r="13" fill="none" stroke={ink} strokeWidth="3.6" />
          <path d="M24 12c-9-3-14 3-12 8s11 4 11 9-7 6-12 2" fill="none" stroke={ink} strokeWidth="3.6" strokeLinecap="round" />
        </g>
      );
    case 'mts':
      return (
        <g>
          <rect x="0" y="6" width="34" height="26" rx="5" fill={ink} />
          <path d="M6 26V14l5 6 5-6v12M22 14v12M28 14v12" fill="none" stroke="#E30611" strokeWidth="3.2" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

/* ── карта ─────────────────────────────────────────────────────────── */

export function BankCardArt({ itemId, size = 168, className = '' }) {
  const key = String(itemId || '').startsWith('bank_') ? String(itemId).slice(5) : String(itemId || '');
  const bank = BANKS[key] || BANKS.sber;
  const raw = useId().replace(/[:]/g, '');
  const id = (name) => `bk${raw}${name}`;
  const height = Math.round((size * 188) / 300);

  return (
    <svg
      className={`fm-bankcard ${className}`.trim()}
      width={size}
      height={height}
      viewBox="0 0 300 188"
      role="img"
      aria-label={bank.name}
    >
      <defs>
        <linearGradient id={id('base')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bank.from} />
          <stop offset="58%" stopColor={bank.to} />
          <stop offset="100%" stopColor="#07030f" />
        </linearGradient>
        <linearGradient id={id('sheen')} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="46%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="52%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id('glow')} cx="82%" cy="12%" r="70%">
          <stop offset="0%" stopColor={bank.accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={bank.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('chip')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6e7a8" />
          <stop offset="50%" stopColor="#c9a94f" />
          <stop offset="100%" stopColor="#8d7327" />
        </linearGradient>
      </defs>

      <rect x="1" y="1" width="298" height="186" rx="18" fill={`url(#${id('base')})`} stroke="rgba(255,255,255,0.22)" />
      <rect x="1" y="1" width="298" height="186" rx="18" fill={`url(#${id('glow')})`} />
      <rect x="1" y="1" width="298" height="186" rx="18" fill={`url(#${id('sheen')})`} />
      <rect x="10" y="10" width="280" height="168" rx="13" fill="none" stroke="rgba(255,255,255,0.13)" />

      {/* чип и бесконтактная оплата */}
      <g transform="translate(24 40)">
        <rect width="34" height="26" rx="5" fill={`url(#${id('chip')})`} />
        <path d="M0 9h34M0 17h34M11 0v26M23 0v26" stroke="rgba(0,0,0,0.35)" strokeWidth="1.1" />
      </g>
      <g transform="translate(66 42)" fill="none" stroke={bank.ink} strokeOpacity="0.7" strokeWidth="2.2" strokeLinecap="round">
        <path d="M0 6a9 9 0 010 14" />
        <path d="M6 3a15 15 0 010 20" />
        <path d="M12 0a21 21 0 010 26" />
      </g>

      {/* фирменный знак */}
      <g transform="translate(232 34) scale(1.15)">
        <Mark bank={key} ink={bank.ink} />
      </g>

      {/* номер и подпись */}
      <g fill={bank.ink} fillOpacity="0.9" fontFamily="Manrope, sans-serif" fontSize="15" letterSpacing="2.4">
        <text x="24" y="118">••••  ••••  ••••</text>
      </g>
      <text
        x="24"
        y="152"
        fill={bank.ink}
        fontFamily="Unbounded, Manrope, sans-serif"
        fontSize="19"
        fontWeight="800"
        letterSpacing="0.4"
      >
        {bank.name}
      </text>
      <text x="24" y="170" fill={bank.ink} fillOpacity="0.62" fontFamily="Manrope, sans-serif" fontSize="9.5" letterSpacing="2.2">
        FARTU MASTI · COLLECT
      </text>

      {/* голограмма */}
      <circle cx="262" cy="140" r="17" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.4)" />
      <path d="M252 140h20M262 130v20M255 133l14 14M269 133l-14 14" stroke={bank.ink} strokeOpacity="0.55" strokeWidth="1.2" />
    </svg>
  );
}

// Сундук кейса «Банковские карты»: иллюстрация из дизайн-референса.
export function BankCaseArt({ size = 132 }) {
  return <ChestSprite caseId="case_bankcards" size={size} label="Кейс банковских карт" />;
}

export default BankCardArt;
