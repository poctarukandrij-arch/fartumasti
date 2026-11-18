// Клиентские визуальные соответствия предметов магазина.
export const EMOJI_SYMBOLS = {
  emoji_fire: '🔥',
  emoji_ice: '❄️',
  emoji_skull: '💀',
  emoji_snake: '🐍',
  emoji_bolt: '⚡',
  emoji_rocket: '🚀',
  emoji_diamond: '💎',
};

export const DECK_CLASSES = {
  deck_graphite: 'deck-back--graphite',
  deck_neon: 'deck-back--neon',
  deck_ice: 'deck-back--frost',
  deck_crimson: 'deck-back--ember',
  deck_matrix: 'deck-back--matrix',
  deck_void: 'deck-back--void',
  deck_steel: 'deck-back--steel',
  deck_card_steel: 'deck-back--steel',
  deck_card_signal: 'deck-back--signal',
  deck_card_titan: 'deck-back--titan',
  deck_card_black: 'deck-back--black',
};

export const TABLE_CLASSES = {
  table_graphite: 'felt--graphite',
  table_emerald: 'felt--emerald',
  table_ocean: 'felt--ocean',
  table_aurora: 'felt--aurora',
  table_lava: 'felt--lava',
  table_midnight: 'felt--midnight',
};

export function deckClassOf(itemId) {
  return DECK_CLASSES[itemId] || 'deck-back--graphite';
}

export function tableClassOf(itemId) {
  return TABLE_CLASSES[itemId] || 'felt--graphite';
}

export function emojiOf(itemId) {
  return EMOJI_SYMBOLS[itemId] || '';
}

export function effectOf(itemId) {
  if (!itemId || itemId === 'effect_none') return '';
  return `aura--${itemId.replace('effect_', '')}`;
}
