import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Отдельная временная БД: тест не касается рабочей базы и данных пользователей.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fartu-shop-'));
process.env.DB_PATH = path.join(tmpDir, 'shop-test.sqlite');

const { initDb, db, closeDb } = await import('../server/db.js');
const wallet = await import('../server/wallet.js');
const shop = await import('../server/shop.js');

await initDb();

test.after(() => {
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

let seq = 0;
function createUser(balance = 0, username = null) {
  seq += 1;
  const telegramId = `test_${seq}`;
  const name = username || `Tester${seq}`;
  const now = Date.now();
  db.run(
    'INSERT INTO users (telegram_id, username, first_name, balance, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)',
    [telegramId, name, name, balance, now, now],
  );
  return db.get('SELECT id FROM users WHERE telegram_id = ?', [telegramId]).id;
}

const emojiCase = shop.getCase('case_emoji');
const emojiPrice = emojiCase.price;
const countOpenings = (userId) =>
  db.get('SELECT COUNT(*) AS n FROM case_openings WHERE user_id = ?', [userId]).n;

test('кейс списывает стоимость и сохраняет результат в базе', () => {
  const user = createUser(emojiPrice * 3);
  const before = wallet.balanceOf(user);

  shop.openCase(user, 'case_emoji', () => 0.42);

  assert.equal(wallet.balanceOf(user), before - emojiPrice, 'стоимость кейса списана ровно один раз');
  assert.equal(countOpenings(user), 1, 'открытие кейса сохранено');

  const purchase = db.get('SELECT * FROM purchases WHERE user_id = ? AND kind = ?', [user, 'case']);
  assert.ok(purchase, 'покупка кейса записана в историю покупок');
  assert.equal(purchase.price, emojiPrice);
});

test('повторный запрос с тем же requestId не начисляет награду второй раз', () => {
  const user = createUser(emojiPrice * 3);
  const first = shop.openCase(user, 'case_emoji', () => 0.11, { requestId: 'req-dup-1' });
  const afterFirst = wallet.balanceOf(user);

  const replay = shop.openCase(user, 'case_emoji', () => 0.95, { requestId: 'req-dup-1' });

  assert.equal(replay.replayed, true, 'сервер помечает повтор как replay');
  assert.equal(replay.id, first.id, 'повтор возвращает то же открытие, а не новое');
  assert.equal(wallet.balanceOf(user), afterFirst, 'баланс не изменился при повторе');
  assert.equal(countOpenings(user), 1, 'второе начисление не создано');
});

test('недостаток баланса не даёт открыть кейс и не портит данные', () => {
  const user = createUser(10);

  assert.throws(() => shop.openCase(user, 'case_emoji'), (error) => error.code === 'INSUFFICIENT_FUNDS');

  assert.equal(wallet.balanceOf(user), 10, 'баланс не изменился');
  assert.equal(countOpenings(user), 0, 'открытие не записано');
});

test('награда кейса всегда берётся из пула этого кейса', () => {
  const user = createUser(emojiPrice * 4);
  const pool = new Set(emojiCase.pool);

  for (const rngValue of [0, 0.33, 0.77, 0.999]) {
    const result = shop.openCase(user, 'case_emoji', () => rngValue);
    if (result.itemId) {
      assert.ok(pool.has(result.itemId), `предмет ${result.itemId} принадлежит пулу кейса`);
    }
  }
});

test('безлимитный аккаунт не теряет виртуальный баланс на кейсах и покупках', () => {
  const user = createUser(0);
  wallet.applyUnlimitedGrant({ userId: user });
  assert.equal(wallet.isUnlimited(user), true);

  shop.openCase(user, 'case_emoji', () => 0.5);
  shop.buyItem(user, 'emoji_fire');

  assert.equal(wallet.balanceOf(user), 0, 'баланс безлимитного аккаунта не уменьшается');
  assert.equal(countOpenings(user), 1, 'награда кейса всё равно выдана');
  assert.ok(shop.ownsItem(user, 'emoji_fire'), 'предмет выдан');

  const spent = db.all('SELECT amount FROM transactions WHERE user_id = ? AND kind IN (?, ?)', [
    user,
    'case',
    'purchase',
  ]);
  assert.ok(spent.length >= 2, 'расходы всё равно зафиксированы в истории операций');
});

test('безлимит привязан к внутреннему ID и не переходит по имени', () => {
  const owner = createUser(0, 'Archi');
  wallet.applyUnlimitedGrant({ userId: owner });

  const other = createUser(0, 'Someone');
  db.run('UPDATE users SET username = ? WHERE id = ?', ['ArchiTwo', other]);

  assert.equal(wallet.isUnlimited(owner), true, 'владелец сохраняет безлимит');
  assert.equal(wallet.isUnlimited(other), false, 'другой аккаунт не получает безлимит');
});

test('покупка колод и столов отключена, эмодзи покупается один раз', () => {
  const user = createUser(200000);

  assert.throws(() => shop.buyItem(user, 'deck_neon'), (error) => error.code === 'SHOP_SOON');
  assert.throws(() => shop.buyItem(user, 'table_aurora'), (error) => error.code === 'SHOP_SOON');

  const bought = shop.buyItem(user, 'emoji_fire');
  assert.equal(bought.balance, 200000 - shop.getItem('emoji_fire').price, 'списание ровно по цене предмета');
  assert.ok(shop.ownsItem(user, 'emoji_fire'));

  assert.throws(() => shop.buyItem(user, 'emoji_fire'), (error) => error.code === 'ITEM_OWNED');
});

test('сервер не даёт увести баланс в минус на любой операции', () => {
  const user = createUser(100);
  assert.throws(() => shop.buyItem(user, 'emoji_fire'), (error) => error.code === 'INSUFFICIENT_FUNDS');
  assert.equal(wallet.balanceOf(user), 100);
});

// ── Кейс «Банковские карты» ────────────────────────────────────────────────
const bankCase = shop.getCase('case_bankcards');
const BANK_TIERS = {
  legendary: ['bank_sber', 'bank_tbank', 'bank_alfa'],
  rare: ['bank_ozon', 'bank_uralsib', 'bank_wb', 'bank_raif'],
  common: ['bank_otp', 'bank_sovcom', 'bank_mts'],
};

test('кейс банковских карт: десять карт в трёх уровнях редкости', () => {
  assert.ok(bankCase, 'кейс существует');
  assert.equal(bankCase.pool.length, 10, 'в кейсе ровно десять карт');
  for (const [rarity, ids] of Object.entries(BANK_TIERS)) {
    for (const id of ids) {
      const item = shop.getItem(id);
      assert.ok(item, `карта ${id} есть в каталоге`);
      assert.equal(item.rarity, rarity, `${id}: редкость ${rarity}`);
      assert.ok(item.name && item.name.length > 1, `${id}: есть название`);
      assert.ok(bankCase.pool.includes(id), `${id} входит в пул кейса`);
    }
  }
  const weights = Object.values(bankCase.odds).reduce((sum, value) => sum + value, 0);
  assert.equal(weights, 100, 'веса редкостей дают 100%');
});

test('шансы кейса банковских карт прозрачны и легендарные реже обычных', () => {
  const catalog = shop.shopCatalog().cases.find((box) => box.id === 'case_bankcards');
  assert.ok(catalog, 'кейс отдаётся в каталоге магазина');
  const total = catalog.dropRates.reduce((sum, entry) => sum + entry.rate, 0);
  assert.ok(Math.abs(total - 100) < 0.6, `сумма шансов близка к 100, получено ${total}`);
  const rate = (id) => catalog.dropRates.find((entry) => entry.id === id).rate;
  for (const id of BANK_TIERS.legendary) {
    assert.ok(rate(id) > 0, `${id}: шанс больше нуля`);
    assert.ok(rate(id) < rate('bank_otp'), `${id} выпадает реже обычной карты`);
  }
});

test('открытие кейса банковских карт выдаёт карту из пула и сохраняет владение', () => {
  const user = createUser(bankCase.price * 3);
  const result = shop.openCase(user, 'case_bankcards', () => 0.5, { requestId: 'bank-open-1' });
  assert.ok(bankCase.pool.includes(result.item.id), 'награда из пула кейса');
  assert.equal(shop.ownsItem(user, result.item.id), true, 'карта попала во владение');

  const replay = shop.openCase(user, 'case_bankcards', () => 0.9, { requestId: 'bank-open-1' });
  assert.equal(replay.replayed, true, 'повтор помечен как replay');
  assert.equal(replay.item.id, result.item.id, 'повтор не выдаёт вторую карту');
});
