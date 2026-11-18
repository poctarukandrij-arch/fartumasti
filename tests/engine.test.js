import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  applyAction,
  publicState,
  autoAction,
  beats,
  makeDeck,
  GameError,
} from '../server/game/durak.js';

const players = [
  { userId: 1, name: 'Alpha' },
  { userId: 2, name: 'Bravo' },
];

const fixedRng = (value = 0.37) => () => value;

test('колода содержит 36 уникальных карт', () => {
  const deck = makeDeck();
  assert.equal(deck.length, 36);
  assert.equal(new Set(deck.map((card) => card.id)).size, 36);
});

test('раздача: по 6 карт, козырь, колода сходится', () => {
  const state = createGame(players, fixedRng());
  assert.equal(state.players[0].hand.length, 6);
  assert.equal(state.players[1].hand.length, 6);
  assert.ok(state.trumpSuit, 'козырь определён');
  assert.ok(state.trumpCard, 'карта козыря открыта');
  const total = state.players.reduce((sum, player) => sum + player.hand.length, 0) + state.deck.length;
  assert.equal(total, 36);
  assert.equal(state.attackerIndex, 0);
  assert.equal(state.defenderIndex, 1);
});

test('правила старшинства карт', () => {
  const six = { rank: '6', suit: 's', id: 's6' };
  const seven = { rank: '7', suit: 's', id: 's7' };
  const other = { rank: 'A', suit: 'h', id: 'hA' };
  const trump = { rank: '6', suit: 'd', id: 'd6' };
  assert.equal(beats(seven, six, 'd'), true);
  assert.equal(beats(six, seven, 'd'), false);
  assert.equal(beats(trump, other, 'd'), true);
  assert.equal(beats(other, trump, 'd'), false);
});

test('атака возможна только своей картой и в свой ход', () => {
  const state = createGame(players, fixedRng());
  const attacker = state.players[state.attackerIndex];
  const defender = state.players[state.defenderIndex];

  assert.throws(
    () => applyAction(state, attacker.userId, { type: 'attack', cardId: 'not_a_real_card' }),
    GameError,
  );
  assert.throws(
    () => applyAction(state, defender.userId, { type: 'attack', cardId: defender.hand[0].id }),
    GameError,
  );

  const card = attacker.hand[0];
  applyAction(state, attacker.userId, { type: 'attack', cardId: card.id });
  assert.equal(state.table.length, 1);
  assert.equal(state.table[0].attack.id, card.id);
  assert.equal(state.phase, 'defend');
  assert.equal(state.players[state.defenderIndex].userId, defender.userId);
});

test('защита кроет карту, а взятие забирает карты со стола', () => {
  const state = createGame(players, fixedRng());
  const attacker = state.players[state.attackerIndex];
  const defender = state.players[state.defenderIndex];
  applyAction(state, attacker.userId, { type: 'attack', cardId: attacker.hand[0].id });

  const before = defender.hand.length;
  applyAction(state, defender.userId, { type: 'take' });
  assert.equal(state.table.length, 0);
  assert.ok(defender.hand.length >= before, 'защитник забрал карты');
});

test('сервер не отдаёт чужие карты в состоянии игрока', () => {
  const state = createGame(players, fixedRng());
  const view = publicState(state, 1);
  assert.equal(view.hand.length, 6);
  assert.equal(view.players.find((player) => player.userId === 2).cards, 6);
  assert.equal(
    Object.prototype.hasOwnProperty.call(view.players.find((player) => player.userId === 2), 'hand'),
    false,
  );
});

test('партия доигрывается до определения проигравшего', () => {
  const state = createGame(players, fixedRng());
  let guard = 0;
  while (!state.finished && guard < 5000) {
    const next = autoAction(state);
    if (!next) break;
    applyAction(state, next.userId, next.action);
    guard += 1;
  }
  assert.ok(state.finished, 'партия завершилась');
  assert.ok(state.loserId !== null, 'проигравший определён');
  assert.ok(guard < 5000, 'нет зацикливания');
});

test('выход игрока корректно завершает партию', async () => {
  const { handlePlayerLeft } = await import('../server/game/durak.js');
  const state = createGame(players, fixedRng());
  handlePlayerLeft(state, 2);
  assert.ok(state.finished, 'партия завершена после выхода');
  assert.equal(state.loserId, 2);
});

test('нельзя создать партию с одним игроком', () => {
  assert.throws(() => createGame([players[0]]), GameError);
});
