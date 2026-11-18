import { CardBack } from './PlayingCard.jsx';

export function Seat({ player, gamePlayer, deckClass, muted, onToggleMute, isSelf }) {
  const cards = gamePlayer?.cards ?? 0;
  const turn = Boolean(gamePlayer?.isAttacker || gamePlayer?.isDefender);
  const classes = ['seat'];
  if (turn) classes.push('seat--turn');
  if (!player.connected) classes.push('seat--offline');
  const effect = player.equipped?.effect;
  const auraClass =
    effect === 'effect_aura_violet'
      ? 'effect-aura effect-aura--violet'
      : effect === 'effect_aura_ember'
        ? 'effect-aura effect-aura--ember'
        : effect === 'effect_aura_frost'
          ? 'effect-aura effect-aura--frost'
          : effect && effect !== 'effect_none'
            ? 'effect-aura'
            : '';

  return (
    <div className={classes.join(' ')}>
      {auraClass ? <div className={auraClass} /> : null}
      {player.mic ? <span className="seat__mic" title="Микрофон включён">🎙</span> : null}
      <div className="seat__name">
        <span>{player.username || 'Игрок'}</span>
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
        >
          {muted ? 'вкл' : 'mute'}
        </button>
      ) : null}
    </div>
  );
}
