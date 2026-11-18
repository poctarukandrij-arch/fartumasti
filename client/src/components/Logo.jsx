// Фирменный знак FARTU MASTI: объёмная масть-карта с градиентом и свечением.
export function LogoMark({ size = 40 }) {
  return (
    <svg
      className="logo__svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="fmMarkA" x1="6" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9C7BFF" />
          <stop offset="0.52" stopColor="#6B51E5" />
          <stop offset="1" stopColor="#2E5BFF" />
        </linearGradient>
        <linearGradient id="fmMarkB" x1="12" y1="10" x2="34" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="0.55" stopColor="#CFE0FF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7FE9FF" stopOpacity="0.35" />
        </linearGradient>
        <filter id="fmGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="1.4" y="1.4" width="45.2" height="45.2" rx="14" fill="#101634" stroke="url(#fmMarkA)" strokeWidth="1.6" />
      <rect x="1.4" y="1.4" width="45.2" height="45.2" rx="14" fill="url(#fmMarkA)" fillOpacity="0.12" />
      <path
        d="M24 8.6c5.9 5 11.4 10.1 11.4 15.6 0 3.9-2.9 6.9-6.7 6.9-1.5 0-2.9-.5-4-1.4.5 3.3 2 5.9 4.4 8.3H18.9c2.4-2.4 3.9-5 4.4-8.3-1.1.9-2.5 1.4-4 1.4-3.8 0-6.7-3-6.7-6.9C12.6 18.7 18.1 13.6 24 8.6Z"
        fill="url(#fmMarkB)"
        filter="url(#fmGlow)"
      />
      <path d="M22.3 15.4h3.4v6.1h-3.4z" fill="#0B1024" opacity="0.35" />
    </svg>
  );
}

export function Logo({ size = 'md', tagline = false }) {
  return (
    <div className={`logo logo--${size}`}>
      <LogoMark size={size === 'lg' ? 56 : size === 'sm' ? 30 : 38} />
      <div className="logo__text">
        <span className="logo__word">
          <span className="logo__part">FARTU</span>
          <span className="logo__part logo__part--accent">MASTI</span>
        </span>
        {tagline ? <span className="logo__tagline">карточная платформа</span> : null}
      </div>
    </div>
  );
}

export default Logo;
