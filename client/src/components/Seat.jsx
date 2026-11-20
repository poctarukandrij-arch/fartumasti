import { emojiOf } from '../catalog.js';
import { Avatar } from './Avatar.jsx';

// Место игрока за овальным столом: аватар, имя, число карт и статус хода.
export function Seat({ player, slot = 'top', isMe, isTurn, deckClass, waiting = false }) {
  const classes = ['seat', `seat--${slot}`];
  if (isMe) classes.push('seat--me');
  if (isTurn) classes.push('seat--turn');
  if (player.out || player.left) classes.push('seat--out');
  if (player.connected === false) classes.push('seat--offline');

  const cards = Math.max(0, Number(player.cards) || 0);
  const emoji = emojiOf(player.equipped?.emoji);
  const name = player.name || player.username || 'Игрок';
  const fan = Math.min(cards, 4);

  return (
    <div className={classes.join(' ')}>
      {!waiting && !isMe && fan > 0 ? (
        <span className={`seat__fan ${deckClass || ''}`} aria-hidden="true">
          {Array.from({ length: fan }).map((_, index) => (
            <i key={index} style={{ '--k': index, '--m': fan }} />
          ))}
        </span>
      ) : null}
      <span className="seat__ava">
        <Avatar name={name} size={58} ring={isTurn ? 'gold' : 'blue'} />
        <span className={`seat__dot ${player.connected === false ? '' : 'seat__dot--on'}`} aria-hidden="true" />
        {player.mic ? <span className="seat__mic" aria-label="микрофон включён" /> : null}
      </span>
      <span className="seat__plate">
        <span className="seat__name">
          {emoji ? <span className="seat__emoji" aria-hidden="true">{emoji}</span> : null}
          {name}
        </span>
        <span className="seat__meta">
          {waiting
            ? player.ready
              ? 'готов ✓'
              : 'ждём'
            : player.isAttacker
            ? `${cards} к. · атака`
            : player.isDefender
            ? `${cards} к. · защита`
            : `${cards} к.`}
          {player.connected === false ? ' · офлайн' : ''}
        </span>
      </span>
    </div>
  );
}

export default Seat;
