import bank from '../assets/chest-bank.webp';
import table from '../assets/chest-table.webp';
import emoji from '../assets/chest-emoji.webp';
import effect from '../assets/chest-effect.webp';

// Иллюстрации сундуков четырёх кейсов (из референса дизайна).
const SPRITES = {
  case_bank: bank,
  case_bankcards: bank,
  case_table: table,
  case_emoji: emoji,
  case_effect: effect,
};

export function chestSprite(caseId) {
  return SPRITES[caseId] || null;
}

export function ChestSprite({ caseId, size = 120, open = false, label = '' }) {
  const src = chestSprite(caseId);
  if (!src) return null;
  return (
    <img
      className={`chest-sprite ${open ? 'chest-sprite--open' : ''}`}
      src={src}
      width={size}
      height={size}
      alt={label}
      aria-hidden={label ? undefined : 'true'}
      draggable="false"
      decoding="async"
    />
  );
}

export default ChestSprite;
