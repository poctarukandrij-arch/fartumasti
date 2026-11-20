import trophy from '../assets/trophy.webp';
import cart from '../assets/cart.webp';
import wallet from '../assets/wallet.webp';
import crownGreen from '../assets/crown-green.webp';
import crownBlue from '../assets/crown-blue.webp';
import crownPurple from '../assets/crown-purple.webp';
import crownGold from '../assets/crown-gold.webp';
import navHome from '../assets/nav-home.webp';
import navProfile from '../assets/nav-profile.webp';
import navRating from '../assets/nav-rating.webp';
import coin from '../assets/coin.webp';
import gear from '../assets/gear.webp';
import hero from '../assets/hero.webp';

// Иллюстрации интерфейса, вырезанные из дизайн-референса.
export const REF_ICONS = {
  trophy,
  cart,
  wallet,
  crownGreen,
  crownBlue,
  crownPurple,
  crownGold,
  navHome,
  navProfile,
  navRating,
  coin,
  gear,
  hero,
};

export function RefIcon({ name, height = 32, className = '', alt = '' }) {
  const src = REF_ICONS[name];
  if (!src) return null;
  return (
    <img
      className={`ref-icon ${className}`.trim()}
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      style={{ height }}
      draggable="false"
      decoding="async"
    />
  );
}

export default RefIcon;
