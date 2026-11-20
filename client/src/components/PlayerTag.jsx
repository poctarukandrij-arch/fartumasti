import { Emoji3D } from './Items3D.jsx';

/**
 * Имя игрока с выбранным эмодзи.
 * Используется везде, где показывается ник: профиль, стол, рейтинг, списки.
 */
export function PlayerTag({ name, emoji, size = 15, className = '', badge = null }) {
  const symbol = emoji && emoji !== 'emoji_none' ? emoji : '';
  return (
    <span className={`ptag ${className}`.trim()}>
      {symbol ? (
        <span className="ptag__emoji" aria-hidden="true">
          <Emoji3D id={symbol} size={Math.round(size * 1.5)} />
        </span>
      ) : null}
      <span className="ptag__name">{name || 'Игрок'}</span>
      {badge}
    </span>
  );
}

export default PlayerTag;
