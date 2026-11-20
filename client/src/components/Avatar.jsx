import { useId } from 'react';

// Мультяшные аватары в стиле референса: кепка, тёмные очки, толстовка.
// Вид определяется именем игрока — без загрузки картинок и внешних файлов.

const SKINS = ['#F6C9A0', '#E9B085', '#D99A6C', '#F2BE96'];
const CAPS = ['#16161d', '#2b3cff', '#e8e8f2', '#7a2cf0', '#d8332a', '#10a35a'];
const HOODS = ['#14141c', '#2a1f55', '#1b2a52', '#3a1a4a', '#202028'];

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function avatarLook(name = '') {
  const h = hash(String(name || '?'));
  return {
    skin: SKINS[h % SKINS.length],
    cap: CAPS[(h >> 3) % CAPS.length],
    hood: HOODS[(h >> 6) % HOODS.length],
    bg: ['#4b2bb8', '#2a49c9', '#7b2fbe', '#1f5fb0'][(h >> 9) % 4],
  };
}

function Head({ look, uid }) {
  const capLight = look.cap === '#e8e8f2' ? '#ffffff' : look.cap;
  return (
    <g>
      <path d="M12 64c1-11 9-17 20-17s19 6 20 17z" fill={look.hood} />
      <path d="M26 47h12l-2 8c-2 2-6 2-8 0z" fill={look.skin} />
      <ellipse cx="32" cy="31" rx="13" ry="15" fill={look.skin} />
      <ellipse cx="19.5" cy="32" rx="2.4" ry="3.4" fill={look.skin} />
      <ellipse cx="44.5" cy="32" rx="2.4" ry="3.4" fill={look.skin} />
      <path d="M17.5 27c0-11 6-17 14.5-17s14.5 6 14.5 17c-4-3-9-4.4-14.5-4.4S21.5 24 17.5 27z" fill={look.cap} />
      <path d="M17.5 27c-.4 3.4 4.4 2.6 14.5 2.6S46.4 30.4 46.5 27c-3.6 1-9 1.7-14.5 1.7s-10.900-.7-14.500-1.700z" fill={look.cap} filter={`url(#${uid}d)`} />
      <path d="M32 11c4 0 8 1.4 10.500 4.600-3-.8-6.500-1.200-10.500-1.200z" fill={capLight} opacity="0.35" />
      <rect x="20" y="29" width="10.200" height="7.200" rx="3.200" fill="#0b0b12" />
      <rect x="33.800" y="29" width="10.200" height="7.200" rx="3.200" fill="#0b0b12" />
      <path d="M30 31.400h3.800" stroke="#0b0b12" strokeWidth="1.600" strokeLinecap="round" />
      <path d="M22 30.600h4.600" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.200" strokeLinecap="round" />
      <path d="M26.500 41c2.800 2.400 8.200 2.400 11 0" stroke="#7a3b22" strokeWidth="1.700" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function Avatar({ name = '', size = 48, ring = 'none', className = '' }) {
  const uid = `av${useId().replace(/[:]/g, '')}`;
  const look = avatarLook(name);
  return (
    <span className={`avatar avatar--${ring} ${className}`.trim()} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={look.bg} />
            <stop offset="1" stopColor="#140a30" />
          </linearGradient>
          <filter id={`${uid}d`} x="-10%" y="-10%" width="120%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.45" />
          </filter>
          <clipPath id={`${uid}c`}>
            <circle cx="32" cy="32" r="32" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid}c)`}>
          <rect width="64" height="64" fill={`url(#${uid}g)`} />
          <circle cx="32" cy="30" r="26" fill="#ffffff" opacity="0.07" />
          <Head look={look} uid={uid} />
        </g>
      </svg>
    </span>
  );
}

// Крупный персонаж для главного экрана: плечи, кепка, очки и две карты в руке.
export function Mascot({ name = 'Артурка', className = '' }) {
  const uid = `mc${useId().replace(/[:]/g, '')}`;
  const look = avatarLook(name);
  return (
    <svg
      className={`mascot ${className}`.trim()}
      viewBox="0 0 220 230"
      role="img"
      aria-label="Игрок FARTU MASTI с картами"
    >
      <defs>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a3a" />
          <stop offset="1" stopColor="#0d0d14" />
        </linearGradient>
        <linearGradient id={`${uid}k`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6c2" />
          <stop offset="1" stopColor="#ffb703" />
        </linearGradient>
        <filter id={`${uid}s`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#05010f" floodOpacity="0.55" />
        </filter>
      </defs>
      <g filter={`url(#${uid}s)`}>
        <path d="M18 230c2-46 38-72 92-72s90 26 92 72z" fill={`url(#${uid}h)`} />
        <path d="M84 160c6 16 20 26 26 26s20-10 26-26c-8-6-18-8-26-8s-18 2-26 8z" fill="#07070c" />
        <path d="M98 158h24v16c-6 6-18 6-24 0z" fill={look.skin} />
        <path d="M98 196l12-9 12 9-12 8z" fill={`url(#${uid}k)`} opacity="0.95" />
        <ellipse cx="110" cy="96" rx="48" ry="56" fill={look.skin} />
        <ellipse cx="62" cy="100" rx="8" ry="12" fill={look.skin} />
        <ellipse cx="158" cy="100" rx="8" ry="12" fill={look.skin} />
        <path d="M60 86c0-38 22-62 50-62s50 24 50 62c-14-10-31-15-50-15s-36 5-50 15z" fill={look.cap} />
        <path d="M58 88c-2 12 16 10 52 10s54 2 52-10c-14 4-32 6-52 6s-38-2-52-6z" fill={look.cap} />
        <path d="M110 27c14 0 27 5 36 15-11-3-23-5-36-5z" fill="#fff" opacity="0.22" />
        <path d="M104 46h12l-6 12z" fill={`url(#${uid}k)`} />
        <rect x="68" y="92" width="38" height="26" rx="11" fill="#08080e" />
        <rect x="114" y="92" width="38" height="26" rx="11" fill="#08080e" />
        <path d="M104 99h12" stroke="#08080e" strokeWidth="5" strokeLinecap="round" />
        <path d="M74 99h16" stroke="#fff" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" />
        <path d="M118 99h12" stroke="#fff" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" />
        <path d="M92 132c10 10 26 10 36 0" stroke="#7a3b22" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M98 134c8 7 16 7 24 0-4 8-20 8-24 0z" fill="#fff" />
      </g>
      <g transform="translate(152 120) rotate(14)">
        <rect x="0" y="0" width="46" height="64" rx="7" fill="#fff" stroke="#d6d0ee" />
        <text x="7" y="18" fontFamily="Nunito, Manrope, sans-serif" fontWeight="900" fontSize="15" fill="#161320">A</text>
        <path d="M23 26c5 5 9 8 9 13a5 5 0 0 1-9 3 5 5 0 0 1-9-3c0-5 4-8 9-13z" fill="#161320" />
      </g>
      <g transform="translate(180 126) rotate(24)">
        <rect x="0" y="0" width="46" height="64" rx="7" fill="#fff" stroke="#d6d0ee" />
        <text x="7" y="18" fontFamily="Nunito, Manrope, sans-serif" fontWeight="900" fontSize="15" fill="#e53a55">K</text>
        <path d="M23 46c-9-7-12-11-12-16a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 5-3 9-12 16z" fill="#e53a55" />
      </g>
      <ellipse cx="170" cy="190" rx="20" ry="14" fill={look.skin} />
    </svg>
  );
}

export default Avatar;
