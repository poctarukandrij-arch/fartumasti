const SUIT_SYMBOL = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_RED = { h: true, d: true };

export function suitSymbol(suit) {
  return SUIT_SYMBOL[suit] || '?';
}

export function cardLabel(card) {
  return card ? `${card.rank}${SUIT_SYMBOL[card.suit] || ''}` : '';
}

export function isRed(card) {
  return Boolean(card && SUIT_RED[card.suit]);
}

export function rub(kopecks) {
  const value = Number(kopecks || 0) / 100;
  return `${value.toLocaleString('ru-RU', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} ₽`;
}

export function shortDate(ts) {
  if (!ts) return '—';
  const date = new Date(ts);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
    ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'только что';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин назад`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч назад`;
  return shortDate(ts);
}

export function initials(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
