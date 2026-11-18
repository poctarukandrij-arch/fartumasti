import { suitSymbol, isRed, cardLabel } from '../utils.js';

export function PlayingCard({
  card,
  size = 'md',
  faceDown = false,
  deckClass = '',
  selected = false,
  disabled = false,
  onClick,
}) {
  const classes = ['playing-card'];
  if (size === 'sm') classes.push('playing-card--sm');
  if (size === 'xs') classes.push('playing-card--xs');
  if (faceDown) {
    classes.push('playing-card--back');
    if (deckClass) classes.push(deckClass);
  } else if (isRed(card)) {
    classes.push('playing-card--red');
  }
  if (onClick && !disabled) classes.push('playing-card--selectable');
  if (selected) classes.push('playing-card--selected');
  if (disabled) classes.push('playing-card--disabled');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={onClick && !disabled ? onClick : undefined}
      disabled={!onClick || disabled}
      aria-label={faceDown ? 'Закрытая карта' : cardLabel(card)}
    >
      {faceDown ? null : (
        <>
          <span className="playing-card__rank">{card.rank}</span>
          <span className="playing-card__center">{suitSymbol(card.suit)}</span>
          <span className="playing-card__suit">{suitSymbol(card.suit)}</span>
        </>
      )}
    </button>
  );
}

export function CardBack({ deckClass = '', size = 'sm' }) {
  const classes = ['playing-card', 'playing-card--back'];
  if (size === 'sm') classes.push('playing-card--sm');
  if (size === 'xs') classes.push('playing-card--xs');
  if (deckClass) classes.push(deckClass);
  return <span className={classes.join(' ')} aria-hidden="true" />;
}

export default PlayingCard;
