import { emojiOf } from '../catalog.js';

/**
 * Имя игрока с выбранным эмодзи.
 * Используется везде, где показывается ник: профиль, стол, рейтинг, списки.
 */
export function PlayerTag({ name, emoji, size = 15, className = '', badge = null }) {
  const symbol = emojiOf(emoji);
  return (
    <span className={`ptag ${className}`.trim()}>
      {symbol ? (
        <span className="ptag__emoji" style={{ fontSize: `${size}px` }} aria-hidden="true">
          {symbol}
        </span>
      ) : null}
      <span className="ptag__name">{name || 'Игрок'}</span>
      {badge}
    </span>
  );
}

export default PlayerTag;
