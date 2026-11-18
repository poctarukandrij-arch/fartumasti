import { CardBack } from './PlayingCard.jsx';
import { emojiOf, effectOf } from '../catalog.js';

export function Seat({ player, gamePlayer, deckClass, muted, onToggleMute, isSelf }) {
  const cards = gamePlayer?.cards ?? 0;
  const turn = Boolean(gamePlayer?.isAttacker || gamePlayer?.isDefender);
  const classes = ['seat'];
  if (turn) classes.push('seat--turn');
  if (!player.connected) classes.push('seat--offline');
  const aura = effectOf(player.equipped?.effect);
  const emoji = emojiOf(player.equipped?.emoji);

  return (
    <div className={classes.join(' ')}>
      {aura ? <div className={`effect-aura ${aura}`} /> : null}
      {player.mic ? (
        <span className="seat__mic" title="Микрофон включён">
          🎙
        </span>
      ) : null}
      <div className="seat__name">
        <span>{player.username || 'Игрок'}</span>
        {emoji ? <span className="seat__emoji">{emoji}</span> : null}
        {player.isOwner ? <span className="seat__badge">хост</span> : null}
      </div>
      <div className="seat__meta">
        <span>{cards} карт</span>
        {gamePlayer?.isAttacker ? <span>· атакует</span> : null}
        {gamePlayer?.isDefender ? <span>· отбивается</span> : null}
        {gamePlayer?.out ? <span>· вышел</span> : null}
        {!player.connected ? <span>· офлайн</span> : null}
      </div>
      <div className="seat__cards">
        {Array.from({ length: Math.min(cards, 5) }).map((_, index) => (
          <CardBack key={index} deckClass={deckClass} size="xs" />
        ))}
      </div>
      {!isSelf && player.mic ? (
        <button
          type="button"
          className="seat__mute-btn"
          onClick={() => onToggleMute?.(player.userId)}
          aria-label={muted ? 'Включить звук игрока' : 'Заглушить игрока'}
        >
          {muted ? 'вкл' : 'выкл'}
        </button>
      ) : null}
    </div>
  );
}
