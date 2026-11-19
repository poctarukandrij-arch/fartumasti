// Игровой движок «Дурак» (подкидной). Чистая серверная логика без сети и БД:
// состояние мутируется только через applyAction, клиент не может влиять на карты.
export const SUITS = ['s', 'h', 'd', 'c'];
export const FULL_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
// Колода 24 карты: с девятки до туза. Колода 52: от двойки до туза.
export const RANKS_24 = ['9', '10', 'J', 'Q', 'K', 'A'];
export const DECK_SIZES = [24, 36, 52];
export const RANKS_BY_SIZE = { 24: RANKS_24, 36: RANKS, 52: FULL_RANKS };
export const SUIT_SYMBOLS = { s: '♠', h: '♥', d: '♦', c: '♣' };
export const SUIT_NAMES = { s: 'пики', h: 'черви', d: 'бубны', c: 'трефы' };

// Старшинство едино для всех колод: 2 < 3 < ... < 10 < J < Q < K < A.
// В колоде 24 карты младшая карта — девятка, старшая — туз.
export const RANK_VALUE = FULL_RANKS.reduce((acc, rank, index) => {
  acc[rank] = index + 2;
  return acc;
}, {});

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
const HAND_SIZE = 6;
const MAX_TABLE = 6;

export class GameError extends Error {
  constructor(message, code = 'GAME_RULE') {
    super(message);
    this.name = 'GameError';
    this.code = code;
  }
}

export function cardId(card) {
  return `${card.suit}${card.rank}`;
}

export function normalizeDeckSize(value) {
  const size = Number(value);
  return DECK_SIZES.includes(size) ? size : 36;
}

export function ranksForDeck(deckSize = 36) {
  return RANKS_BY_SIZE[normalizeDeckSize(deckSize)];
}

export function makeDeck(deckSize = 36) {
  const ranks = ranksForDeck(deckSize);
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of ranks) {
      deck.push({ id: `${suit}${rank}`, suit, rank });
    }
  }
  return deck;
}

export function shuffle(cards, rng = Math.random) {
  const arr = cards.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function beats(card, target, trumpSuit) {
  if (!card || !target) return false;
  if (card.suit === target.suit) return RANK_VALUE[card.rank] > RANK_VALUE[target.rank];
  if (card.suit === trumpSuit && target.suit !== trumpSuit) return true;
  return false;
}

export function isActive(player) {
  return Boolean(player) && !player.out && !player.left;
}

function nextActiveIndex(state, fromIndex, { skipSelf = false } = {}) {
  const total = state.players.length;
  const start = skipSelf ? 1 : 0;
  for (let step = start; step < total + start; step += 1) {
    const idx = (((fromIndex + step) % total) + total) % total;
    if (idx === fromIndex && !skipSelf && step === 0) continue;
    if (isActive(state.players[idx])) return idx;
  }
  return -1;
}

function touch(state) {
  state.lastActionAt = Date.now();
  state.turnStartedAt = Date.now();
  state.version = (state.version || 0) + 1;
}

function lowestCard(hand, trumpSuit) {
  const sorted = hand.slice().sort((a, b) => {
    const aTrump = a.suit === trumpSuit ? 1 : 0;
    const bTrump = b.suit === trumpSuit ? 1 : 0;
    if (aTrump !== bTrump) return aTrump - bTrump;
    if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    return RANK_VALUE[a.rank] - RANK_VALUE[b.rank];
  });
  return sorted[0] || null;
}

function refillHands(state) {
  const total = state.players.length;
  const order = [];
  for (let i = 0; i < total; i += 1) order.push((state.attackerIndex + i) % total);
  const defenderPos = order.indexOf(state.defenderIndex);
  if (defenderPos !== -1) {
    order.splice(defenderPos, 1);
    order.push(state.defenderIndex);
  }
  for (const idx of order) {
    const player = state.players[idx];
    if (player.left) continue;
    while (player.hand.length < HAND_SIZE && state.deck.length > 0) {
      player.hand.push(state.deck.shift());
    }
  }
}

function markOut(state) {
  if (state.deck.length > 0) return;
  for (const player of state.players) {
    if (player.left) continue;
    if (!player.out && player.hand.length === 0) {
      player.out = true;
      player.finishedAt = state.round;
      state.events.push({ type: 'playerOut', userId: player.userId });
    }
  }
}

function finishGame(state, { forcedLoserId = null } = {}) {
  state.finished = true;
  state.phase = 'finished';
  state.turnUserId = null;
  const withCards = state.players.filter((p) => !p.left && p.hand.length > 0);
  if (forcedLoserId != null) {
    // игрок вышел из партии — проигравшим считается он, а не оставшийся за столом
    state.loserId = forcedLoserId;
    state.winners = state.players.filter((p) => !p.left).map((p) => p.userId);
  } else if (withCards.length === 0) {
    state.loserId = null;
    state.winners = state.players.filter((p) => !p.left).map((p) => p.userId);
  } else {
    const loser = withCards.sort((a, b) => b.hand.length - a.hand.length)[0];
    state.loserId = loser.userId;
    state.winners = state.players
      .filter((p) => p.userId !== state.loserId)
      .map((p) => p.userId);
  }
  state.events.push({ type: 'finish', loserId: state.loserId, winners: state.winners });
  touch(state);
}

function startBout(state, attackerIndex) {
  if (state.finished) return;
  const activeCount = state.players.filter(isActive).length;
  if (activeCount <= 1) {
    finishGame(state);
    return;
  }
  let attacker = attackerIndex;
  if (attacker == null || attacker < 0 || !isActive(state.players[attacker])) {
    attacker = nextActiveIndex(state, attackerIndex >= 0 ? attackerIndex : 0, { skipSelf: true });
  }
  if (attacker < 0) {
    finishGame(state);
    return;
  }
  let defender = nextActiveIndex(state, attacker, { skipSelf: true });
  if (defender < 0 || defender === attacker) {
    finishGame(state);
    return;
  }
  // защитник без карт при пустой колоде не может отбиваться
  if (state.players[defender].hand.length === 0) {
    const candidate = nextActiveIndex(state, defender, { skipSelf: true });
    if (candidate < 0 || candidate === attacker) {
      finishGame(state);
      return;
    }
    defender = candidate;
  }
  state.attackerIndex = attacker;
  state.defenderIndex = defender;
  state.boutLimit = Math.max(1, Math.min(MAX_TABLE, state.players[defender].hand.length));
  state.table = [];
  state.phase = 'open';
  state.turnUserId = state.players[attacker].userId;
  touch(state);
}

export const MODES = { PODKIDNOY: 'podkidnoy', PEREVODNOY: 'perevodnoy' };
export const MODE_TITLES = { podkidnoy: 'Подкидной', perevodnoy: 'Переводной' };

export function createGame(playerInfos, rng = Math.random, { mode = MODES.PODKIDNOY, deckSize = 36 } = {}) {
  if (!Array.isArray(playerInfos) || playerInfos.length < MIN_PLAYERS || playerInfos.length > MAX_PLAYERS) {
    throw new GameError(`За столом должно быть от ${MIN_PLAYERS} до ${MAX_PLAYERS} игроков`, 'BAD_PLAYERS');
  }
  const seen = new Set();
  for (const info of playerInfos) {
    if (!info || info.userId == null) throw new GameError('Некорректный игрок', 'BAD_PLAYERS');
    if (seen.has(info.userId)) throw new GameError('Игроки повторяются', 'BAD_PLAYERS');
    seen.add(info.userId);
  }
  const deckCount = normalizeDeckSize(deckSize);
  const deck = shuffle(makeDeck(deckCount), rng);
  const trumpCard = deck[deck.length - 1];
  const state = {
    players: playerInfos.map((info, seat) => ({
      userId: info.userId,
      name: info.name,
      seat,
      hand: [],
      out: false,
      left: false,
      connected: true,
      finishedAt: null,
    })),
    deck,
    deckSize: deckCount,
    trumpCard,
    trumpSuit: trumpCard.suit,
    mode: mode === MODES.PEREVODNOY ? MODES.PEREVODNOY : MODES.PODKIDNOY,
    table: [],
    discardCount: 0,
    attackerIndex: 0,
    defenderIndex: 1,
    boutLimit: MAX_TABLE,
    phase: 'open',
    round: 1,
    events: [],
    finished: false,
    loserId: null,
    winners: [],
    startedAt: Date.now(),
    turnStartedAt: Date.now(),
    lastActionAt: Date.now(),
    turnUserId: null,
    version: 0,
  };

  for (let i = 0; i < HAND_SIZE; i += 1) {
    for (const player of state.players) player.hand.push(state.deck.shift());
  }

  // первым атакует игрок с младшим козырем
  let firstAttacker = -1;
  let bestValue = Infinity;
  state.players.forEach((player, idx) => {
    const trumps = player.hand.filter((c) => c.suit === state.trumpSuit);
    if (!trumps.length) return;
    const min = Math.min(...trumps.map((c) => RANK_VALUE[c.rank]));
    if (min < bestValue) {
      bestValue = min;
      firstAttacker = idx;
    }
  });
  if (firstAttacker < 0) firstAttacker = Math.floor(rng() * state.players.length);

  startBout(state, firstAttacker);
  state.events.push({ type: 'start', trumpSuit: state.trumpSuit, attackerId: state.players[state.attackerIndex].userId });
  return state;
}

function findCard(player, cid) {
  return player.hand.find((c) => c.id === cid) || null;
}

function removeCard(player, cid) {
  const idx = player.hand.findIndex((c) => c.id === cid);
  if (idx === -1) return null;
  return player.hand.splice(idx, 1)[0];
}

function doAttack(state, playerIndex, action) {
  const player = state.players[playerIndex];
  if (playerIndex === state.defenderIndex) {
    throw new GameError('Защищающийся не может подкидывать карты');
  }
  if (state.phase !== 'open') {
    throw new GameError('Сначала нужно отбить текущие карты');
  }
  if (state.table.length === 0 && playerIndex !== state.attackerIndex) {
    throw new GameError('Первую карту выкладывает атакующий');
  }
  if (state.table.length >= state.boutLimit) {
    throw new GameError('Больше карт в этом раунде подкинуть нельзя');
  }
  const card = findCard(player, action.cardId);
  if (!card) throw new GameError('Этой карты нет в руке');
  if (state.table.length > 0) {
    const ranks = new Set(state.table.map((slot) => slot.attack.rank));
    if (!ranks.has(card.rank)) {
      throw new GameError('Подкидывать можно только карты того же достоинства');
    }
  }
  removeCard(player, card.id);
  state.table.push({ attack: card, defend: null });
  state.phase = 'defend';
  state.turnUserId = state.players[state.defenderIndex]?.userId ?? state.turnUserId;
  state.events.push({ type: 'attack', userId: player.userId, card });
  touch(state);
  if (state.players[state.defenderIndex].hand.length === 0 && state.deck.length === 0) {
    // защитнику нечем отбиваться — он берёт карты автоматически
    doTake(state, state.defenderIndex);
  }
  return state.events;
}

function doDefend(state, playerIndex, action) {
  const player = state.players[playerIndex];
  if (playerIndex !== state.defenderIndex) {
    throw new GameError('Отбиваться может только защищающийся');
  }
  if (state.phase !== 'defend') throw new GameError('Сейчас нечего отбивать');
  const slot = action.targetCardId
    ? state.table.find((s) => s.attack.id === action.targetCardId && !s.defend)
    : state.table.find((s) => !s.defend);
  if (!slot) throw new GameError('Не найдено карты для отбивания');
  const card = findCard(player, action.cardId);
  if (!card) throw new GameError('Этой карты нет в руке');
  if (!beats(card, slot.attack, state.trumpSuit)) {
    throw new GameError('Эта карта не бьёт выложенную');
  }
  removeCard(player, card.id);
  slot.defend = card;
  state.events.push({ type: 'defend', userId: player.userId, card, target: slot.attack });
  if (state.table.every((s) => s.defend)) {
    state.phase = 'open';
    state.turnUserId = state.players[state.attackerIndex]?.userId ?? state.turnUserId;
  }
  touch(state);
  return state.events;
}

function transferRank(state) {
  if (!state.table.length) return null;
  if (state.table.some((slot) => slot.defend)) return null;
  const rank = state.table[0].attack.rank;
  return state.table.every((slot) => slot.attack.rank === rank) ? rank : null;
}

/** Можно ли перевести атаку на следующего игрока (только переводной дурак). */
export function canTransfer(state, playerIndex) {
  if (!state || state.finished) return false;
  if (state.mode !== MODES.PEREVODNOY) return false;
  if (state.phase !== 'defend') return false;
  if (playerIndex !== state.defenderIndex) return false;
  if (transferRank(state) == null) return false;
  const next = nextActiveIndex(state, state.defenderIndex, { skipSelf: true });
  if (next < 0) return false;
  const nextPlayer = state.players[next];
  if (!isActive(nextPlayer)) return false;
  // у следующего защитника должно хватить карт, чтобы отбить стол после перевода
  if (nextPlayer.hand.length < state.table.length + 1) return false;
  return true;
}

function doTransfer(state, playerIndex, action) {
  const player = state.players[playerIndex];
  if (playerIndex !== state.defenderIndex) {
    throw new GameError('Перевести атаку может только защищающийся');
  }
  if (state.mode !== MODES.PEREVODNOY) {
    throw new GameError('В подкидном дураке перевод атаки запрещён', 'MODE');
  }
  if (state.phase !== 'defend') throw new GameError('Сейчас нельзя перевести атаку');
  const rank = transferRank(state);
  if (rank == null) throw new GameError('Перевод возможен только картой того же достоинства до отбоя');
  const card = findCard(player, action.cardId);
  if (!card) throw new GameError('Этой карты нет в руке');
  if (card.rank !== rank) throw new GameError('Перевести можно только картой того же достоинства');
  if (!canTransfer(state, playerIndex)) {
    throw new GameError('Перевод невозможен: у следующего игрока недостаточно карт');
  }
  const next = nextActiveIndex(state, state.defenderIndex, { skipSelf: true });
  const nextPlayer = state.players[next];
  removeCard(player, card.id);
  state.table.push({ attack: card, defend: null });
  state.defenderIndex = next;
  state.boutLimit = Math.min(MAX_TABLE, Math.max(state.table.length, nextPlayer.hand.length));
  state.phase = 'defend';
  state.turnUserId = nextPlayer.userId;
  state.events.push({ type: 'transfer', userId: player.userId, card, toUserId: nextPlayer.userId });
  touch(state);
  if (nextPlayer.hand.length === 0 && state.deck.length === 0) doTake(state, next);
  return state.events;
}

function doTake(state, playerIndex) {
  if (playerIndex !== state.defenderIndex) {
    throw new GameError('Взять карты может только защищающийся');
  }
  if (state.phase !== 'defend') throw new GameError('Сейчас нечего забирать');
  const defender = state.players[playerIndex];
  const taken = [];
  for (const slot of state.table) {
    taken.push(slot.attack);
    if (slot.defend) taken.push(slot.defend);
  }
  defender.hand.push(...taken);
  state.events.push({ type: 'take', userId: defender.userId, count: taken.length });
  endBout(state, 'take');
  return state.events;
}

function doEndBout(state, playerIndex) {
  if (playerIndex !== state.attackerIndex) {
    throw new GameError('Закончить раунд может только атакующий');
  }
  if (state.phase !== 'open') throw new GameError('Сначала нужно отбить все карты');
  if (state.table.length === 0) throw new GameError('На столе нет карт');
  state.events.push({ type: 'boutEnd', userId: state.players[playerIndex].userId });
  endBout(state, 'defense');
  return state.events;
}

function endBout(state, mode) {
  if (mode === 'defense') {
    state.discardCount += state.table.length;
    state.table = [];
  } else {
    state.table = [];
  }
  refillHands(state);
  markOut(state);

  if (state.players.filter(isActive).length <= 1) {
    finishGame(state);
    return;
  }

  let nextAttacker;
  if (mode === 'defense') {
    nextAttacker = state.defenderIndex;
  } else {
    nextAttacker = nextActiveIndex(state, state.defenderIndex, { skipSelf: true });
  }
  if (nextAttacker < 0 || !isActive(state.players[nextAttacker])) {
    nextAttacker = nextActiveIndex(state, state.attackerIndex, { skipSelf: true });
  }
  state.round += 1;
  startBout(state, nextAttacker);
}

export function applyAction(state, userId, action) {
  if (!state) throw new GameError('Партия не найдена', 'NO_GAME');
  if (state.finished) throw new GameError('Партия уже завершена', 'GAME_OVER');
  const playerIndex = state.players.findIndex((p) => p.userId === userId);
  if (playerIndex === -1) throw new GameError('Вы не участвуете в этой партии', 'NOT_IN_GAME');
  if (!isActive(state.players[playerIndex])) throw new GameError('Вы уже вышли из игры', 'PLAYER_OUT');
  if (!action || typeof action.type !== 'string') throw new GameError('Некорректное действие');
  switch (action.type) {
    case 'attack':
      return doAttack(state, playerIndex, action);
    case 'defend':
      return doDefend(state, playerIndex, action);
    case 'transfer':
      return doTransfer(state, playerIndex, action);
    case 'take':
      return doTake(state, playerIndex);
    case 'end':
      return doEndBout(state, playerIndex);
    default:
      throw new GameError('Неизвестное действие');
  }
}

export function handlePlayerLeft(state, userId) {
  if (!state || state.finished) return [];
  const idx = state.players.findIndex((p) => p.userId === userId);
  if (idx === -1) return [];
  const player = state.players[idx];
  if (player.left) return [];
  player.left = true;
  player.connected = false;
  state.discardCount += player.hand.length;
  player.hand = [];
  state.events.push({ type: 'left', userId });
  if (state.players.filter(isActive).length <= 1) {
    finishGame(state, { forcedLoserId: userId });
    return state.events;
  }
  if (idx === state.defenderIndex || idx === state.attackerIndex) {
    state.discardCount += state.table.length;
    state.table = [];
    refillHands(state);
    markOut(state);
    const next = nextActiveIndex(state, idx, { skipSelf: true });
    if (next < 0) {
      finishGame(state);
      return state.events;
    }
    state.round += 1;
    startBout(state, next);
  } else if (state.phase === 'defend' && state.table.length && state.table.every((s) => s.defend)) {
    state.phase = 'open';
  }
  touch(state);
  return state.events;
}

export function autoAction(state) {
  if (!state || state.finished) return null;
  if (state.phase === 'defend') {
    const defender = state.players[state.defenderIndex];
    if (!defender) return null;
    return { userId: defender.userId, action: { type: 'take' } };
  }
  const attacker = state.players[state.attackerIndex];
  if (!attacker || !isActive(attacker)) return null;
  if (state.table.length > 0) return { userId: attacker.userId, action: { type: 'end' } };
  const card = lowestCard(attacker.hand, state.trumpSuit);
  if (!card) return null;
  return { userId: attacker.userId, action: { type: 'attack', cardId: card.id } };
}

/** Допустимые ходы для конкретного игрока — клиент только подсвечивает, решает сервер. */
export function legalMoves(state, userId) {
  const result = {
    attack: [],
    defend: [],
    transfer: [],
    canTake: false,
    canEnd: false,
    mustAct: false,
    isAttacker: false,
    isDefender: false,
  };
  if (!state || state.finished) return result;
  const index = state.players.findIndex((p) => p.userId === userId);
  if (index === -1) return result;
  const player = state.players[index];
  if (!isActive(player)) return result;
  result.isAttacker = index === state.attackerIndex;
  result.isDefender = index === state.defenderIndex;

  if (state.phase === 'defend' && result.isDefender) {
    for (const slot of state.table) {
      if (slot.defend) continue;
      for (const card of player.hand) {
        if (beats(card, slot.attack, state.trumpSuit)) {
          result.defend.push({ cardId: card.id, targetCardId: slot.attack.id });
        }
      }
    }
    result.canTake = true;
    if (canTransfer(state, index)) {
      const rank = transferRank(state);
      result.transfer = player.hand.filter((card) => card.rank === rank).map((card) => card.id);
    }
  }

  if (state.phase === 'open' && !result.isDefender) {
    const mayJoin = state.table.length > 0 || result.isAttacker;
    if (mayJoin && state.table.length < state.boutLimit) {
      const ranks = state.table.length ? new Set(state.table.map((slot) => slot.attack.rank)) : null;
      result.attack = player.hand
        .filter((card) => !ranks || ranks.has(card.rank))
        .map((card) => card.id);
    }
    if (result.isAttacker && state.table.length > 0) result.canEnd = true;
  }

  result.mustAct =
    result.attack.length > 0 ||
    result.defend.length > 0 ||
    result.transfer.length > 0 ||
    result.canTake ||
    result.canEnd;
  return result;
}

/** Состояние, безопасное для отправки конкретному игроку. */
export function publicState(state, viewerUserId) {
  const isViewer = (p) => p.userId === viewerUserId;
  const viewer = state.players.find(isViewer);
  const legal = legalMoves(state, viewerUserId);
  return {
    players: state.players.map((p) => ({
      userId: p.userId,
      name: p.name,
      cards: p.hand.length,
      out: Boolean(p.out),
      left: Boolean(p.left),
      connected: p.connected !== false,
      isAttacker: state.players[state.attackerIndex]?.userId === p.userId && !state.finished,
      isDefender: state.players[state.defenderIndex]?.userId === p.userId && !state.finished,
    })),
    hand: viewer ? viewer.hand.slice() : [],
    table: state.table.map((slot) => ({ attack: slot.attack, defend: slot.defend || null })),
    deckCount: state.deck.length,
    trumpCard: state.trumpCard,
    trumpSuit: state.trumpSuit,
    discardCount: state.discardCount,
    phase: state.phase,
    attackerId: state.players[state.attackerIndex]?.userId ?? null,
    defenderId: state.players[state.defenderIndex]?.userId ?? null,
    turnUserId: state.turnUserId,
    boutLimit: state.boutLimit,
    round: state.round,
    finished: state.finished,
    loserId: state.loserId,
    winners: state.winners,
    version: state.version,
    mode: state.mode || MODES.PODKIDNOY,
    legal,
    canAct: legal.mustAct,
  };
}
