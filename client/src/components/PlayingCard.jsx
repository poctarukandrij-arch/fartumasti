import { suitSymbol, isRed } from '../utils.js';

export function PlayingCard({ card, size = 'md', faceDown = false, deckClass = '', selected, disabled, onClick }) {
  const sizeClass = size === 'sm' ? 'playing-card--sm' : size === 'xs' ? 'playing-card--xs' : '';
  const classes = ['playing-card', sizeClass];
  if (isRed(card)) classes.push('playing-card--red');
  if (faceDown) {
    classes.push('playing-card--back', deckClass);
  } else if (onClick) {
    classes.push('playing-card--selectable');
  }
  if (selected) classes.push('playing-card--selected');
  if (disabled) classes.push('playing-card--disabled');

  if (faceDown) {
    return <div className={classes.filter(Boolean).join(' ')} aria-hidden="true" />;
  }

  if (!card) {
    return <div className={classes.filter(Boolean).join(' ')} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className={classes.filter(Boolean).join(' ')}
      onClick={onClick || undefined}
      disabled={disabled}
      aria-label={`${card.rank} ${suitSymbol(card.suit)}`}
    >
      <span className="playing-card__rank">{card.rank}</span>
      <span className="playing-card__center">{suitSymbol(card.suit)}</span>
      <span className="playing-card__suit">{suitSymbol(card.suit)}</span>
    </button>
  );
}

export function CardBack({ deckClass = '', size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'playing-card--sm' : size === 'xs' ? 'playing-card--xs' : '';
  return (
    <div
      className={['playing-card', 'playing-card--back', sizeClass, deckClass].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  );
}
