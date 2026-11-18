import { emojiOf } from '../catalog.js';

// Карточка игрока за столом: имя, эмодзи, карты в руке, статус хода.
export function Seat({ player, isMe, isTurn, deckClass }) {
  const classes = ['seat'];
  if (isMe) classes.push('seat--me');
  if (isTurn) classes.push('seat--turn');
  if (player.out || player.left) classes.push('seat--out');
  if (player.connected === false) classes.push('seat--offline');

  const cards = Math.max(0, Number(player.cards) || 0);
  const emoji = emojiOf(player.equipped?.emoji);

  return (
    <div className={classes.join(' ')}>
      <span className="seat__mono" aria-hidden="true">
        {(player.name || '?').slice(0, 2).toUpperCase()}
      </span>
      <span className="seat__body">
        <span className="seat__name">
          {emoji ? <span className="seat__emoji" aria-hidden="true">{emoji}</span> : null}
          {player.name || 'Игрок'}
          {isMe ? <span className="seat__badge">вы</span> : null}
        </span>
        <span className="seat__meta">
          <span className="seat__cards" aria-hidden="true">
            {Array.from({ length: Math.min(cards, 6) }).map((_, index) => (
              <i key={index} />
            ))}
          </span>
          {cards} к.
          {player.isAttacker ? <span className="seat__badge">атака</span> : null}
          {player.isDefender ? <span className="seat__badge seat__badge--def">защита</span> : null}
          {player.connected === false ? <span>· офлайн</span> : null}
          {player.mic ? <span className="seat-dot seat-dot--on" aria-label="микрофон включён" /> : null}
        </span>
      </span>
    </div>
  );
}

export default Seat;
