import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Отдельная временная БД: тесты не касаются рабочей базы и аккаунтов игроков.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fartu-decks-'));
process.env.DB_PATH = path.join(tmpDir, 'decks-test.sqlite');

const { initDb, db, closeDb } = await import('../server/db.js');
const wallet = await import('../server/wallet.js');
const shop = await import('../server/shop.js');
const durak = await import('../server/game/durak.js');

await initDb();

test.after(() => {
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

let seq = 0;
function createUser(balance = 0) {
  seq += 1;
  const telegramId = `deck_test_${seq}`;
  const name = `DeckTester${seq}`;
  const now = Date.now();
  db.run(
    'INSERT INTO users (telegram_id, username, first_name, balance, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)',
    [telegramId, name, name, balance, now, now],
  );
  const row = db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
  return row;
}

function ranksOf(cards) {
  return [...new Set(cards.map((card) => card.rank))].sort();
}

test('колода 24 карты: только 9, 10, J, Q, K, A и все уникальны', () => {
  const deck = durak.makeDeck(24);
  assert.equal(deck.length, 24);
  assert.equal(new Set(deck.map((card) => card.id)).size, 24);
  assert.deepEqual(ranksOf(deck), ['10', '9', 'A', 'J', 'K', 'Q']);
  assert.ok(!deck.some((card) => ['6', '7', '8'].includes(card.rank)));
  assert.equal(new Set(deck.map((card) => card.suit)).size, 4);
});

test('колода 36 карт: от 6 до туза, без двоек и четвёрок', () => {
  const deck = durak.makeDeck(36);
  assert.equal(deck.length, 36);
  assert.equal(new Set(deck.map((card) => card.id)).size, 36);
  assert.ok(!deck.some((card) => ['2', '3', '4', '5'].includes(card.rank)));
  assert.ok(deck.some((card) => card.rank === '6'));
  assert.ok(deck.some((card) => card.rank === 'A'));
});

test('колода 52 карты: полная, от двойки до туза, без джокеров', () => {
  const deck = durak.makeDeck(52);
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((card) => card.id)).size, 52);
  assert.ok(deck.some((card) => card.rank === '2'));
  assert.equal(new Set(deck.map((card) => card.suit)).size, 4);
});

test('некорректный размер колоды приводится к 36', () => {
  assert.equal(durak.normalizeDeckSize(24), 24);
  assert.equal(durak.normalizeDeckSize(36), 36);
  assert.equal(durak.normalizeDeckSize(52), 52);
  assert.equal(durak.normalizeDeckSize(40), 36);
  assert.equal(durak.normalizeDeckSize('abc'), 36);
  assert.equal(durak.normalizeDeckSize(undefined), 36);
});

test('партия на 24 картах раздаётся только из младших девятошных карт', () => {
  const state = durak.createGame(
    [{ userId: 'a', name: 'A' }, { userId: 'b', name: 'B' }],
    Math.random,
    { mode: 'podkidnoy', deckSize: 24 },
  );
  const all = [...state.players.flatMap((player) => player.hand), ...state.deck];
  assert.equal(all.length, 24);
  assert.ok(all.every((card) => ['9', '10', 'J', 'Q', 'K', 'A'].includes(card.rank)));
  assert.ok(state.players.every((player) => player.hand.length === 6));
  assert.ok(durak.SUITS.includes(state.trumpSuit));
});

test('партия на 52 картах отдаёт игрокам выбранную колоду', () => {
  const state = durak.createGame(
    [{ userId: 'a', name: 'A' }, { userId: 'b', name: 'B' }, { userId: 'c', name: 'C' }],
    Math.random,
    { mode: 'podkidnoy', deckSize: 52 },
  );
  const all = [...state.players.flatMap((player) => player.hand), ...state.deck];
  assert.equal(all.length, 52);
  assert.equal(new Set(all.map((card) => card.id)).size, 52);
  assert.ok(state.players.every((player) => player.hand.length === 6));
});

test('партия на 36 картах остаётся классической', () => {
  const state = durak.createGame(
    [{ userId: 'a', name: 'A' }, { userId: 'b', name: 'B' }],
    Math.random,
    { mode: 'podkidnoy', deckSize: 36 },
  );
  const all = [...state.players.flatMap((player) => player.hand), ...state.deck];
  assert.equal(all.length, 36);
  assert.ok(all.every((card) => !['2', '3', '4', '5'].includes(card.rank)));
});

test('покупка эмодзи выдаёт владение и позволяет его надеть', () => {
  const user = createUser(100000);
  assert.equal(shop.ownsItem(user.id, 'emoji_fire'), false);

  shop.buyItem(user.id, 'emoji_fire');
  assert.equal(shop.ownsItem(user.id, 'emoji_fire'), true);
  assert.ok([...shop.ownedItemIds(user.id)].includes('emoji_fire'));

  shop.equipItem(user.id, 'emoji_fire');
  const fresh = db.get('SELECT * FROM users WHERE id = ?', [user.id]);
  assert.equal(shop.equippedOf(fresh).emoji, 'emoji_fire');
});

test('надеть некупленный предмет нельзя', () => {
  const user = createUser(100000);
  assert.throws(() => shop.equipItem(user.id, 'emoji_diamond'));
  assert.notEqual(shop.equippedOf(db.get('SELECT * FROM users WHERE id = ?', [user.id])).emoji, 'emoji_diamond');
});

test('награда кейса попадает во владение игрока', () => {
  const user = createUser(0);
  wallet.credit(user.id, 500000, 'test_topup', 'пополнение для теста');
  const box = shop.CASES[0];
  const result = shop.openCase(user.id, box.id, () => 0.999);
  assert.ok(box.pool.includes(result.item.id));
  assert.ok([...shop.ownedItemIds(user.id)].includes(result.item.id));
  assert.equal(result.refund || 0, 0);
});

test('надетый предмет переживает повторный вход', () => {
  const user = createUser(100000);
  shop.buyItem(user.id, 'emoji_rocket');
  shop.equipItem(user.id, 'emoji_rocket');
  const again = db.get('SELECT * FROM users WHERE id = ?', [user.id]);
  assert.equal(shop.equippedOf(again).emoji, 'emoji_rocket');
  assert.ok([...shop.ownedItemIds(user.id)].includes('emoji_rocket'));
});
