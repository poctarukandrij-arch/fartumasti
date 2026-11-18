import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Отдельная временная БД: тест не касается рабочей базы и данных пользователей.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fartu-unlimited-'));
process.env.DB_PATH = path.join(tmpDir, 'unlimited.sqlite');
for (const name of [
  'ARCHI_USER_ID',
  'ARCHI_TELEGRAM_ID',
  'BOSS_USER_ID',
  'BOSS_TELEGRAM_ID',
  'TONI_USER_ID',
  'TONI_TELEGRAM_ID',
]) {
  delete process.env[name];
}

const { initDb, db, closeDb, getSetting } = await import('../server/db.js');
const wallet = await import('../server/wallet.js');
const shop = await import('../server/shop.js');

await initDb();

test.after(() => {
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

let seq = 0;
function createUser(username, telegramId = null) {
  seq += 1;
  const tg = telegramId || `unl_${seq}`;
  const now = Date.now();
  db.run(
    'INSERT INTO users (telegram_id, username, first_name, balance, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)',
    [tg, username, username, 0, now, now],
  );
  return db.get('SELECT id FROM users WHERE telegram_id = ?', [tg]).id;
}

const unlimitedFlag = (userId) => Number(db.get('SELECT unlimited FROM users WHERE id = ?', [userId]).unlimited);

test('Archi, boss и toni получают безлимит по внутреннему ID', () => {
  const archi = createUser('Archi');
  const boss = createUser('boss');
  const toni = createUser('toni');
  const other = createUser('RandomGuy');

  const bound = wallet.ensureUnlimitedAccounts();

  assert.equal(bound.archi, archi, 'Archi привязан к своему внутреннему ID');
  assert.equal(bound.boss, boss, 'boss привязан к своему внутреннему ID');
  assert.equal(bound.toni, toni, 'toni привязан к своему внутреннему ID');

  for (const [id, label] of [
    [archi, 'Archi'],
    [boss, 'boss'],
    [toni, 'toni'],
  ]) {
    assert.equal(wallet.isUnlimited(id), true, `${label} имеет безлимитный баланс`);
    assert.equal(unlimitedFlag(id), 1, `флаг безлимита сохранён в базе для ${label}`);
  }

  assert.equal(wallet.isUnlimited(other), false, 'обычный аккаунт безлимит не получает');
});

test('безлимит сохраняется после повторного входа и перезапуска', () => {
  const archi = db.get("SELECT id FROM users WHERE username = 'Archi' COLLATE NOCASE").id;

  // Повторная инициализация при следующем старте сервера (как после logout/login).
  wallet.ensureUnlimitedAccounts();
  wallet.ensureUnlimitedAccounts();

  assert.equal(wallet.isUnlimited(archi), true, 'безлимит не теряется при повторной инициализации');
  assert.equal(Number(getSetting('unlimited_user_archi')), archi, 'внутренний ID закреплён в настройках');
});

test('переименование не снимает и не выдаёт безлимит', () => {
  const boss = db.get("SELECT id FROM users WHERE username = 'boss' COLLATE NOCASE").id;

  db.run('UPDATE users SET username = ? WHERE id = ?', ['BossRenamed', boss]);
  wallet.ensureUnlimitedAccounts();
  assert.equal(wallet.isUnlimited(boss), true, 'переименованный владелец сохраняет безлимит');

  // Другой пользователь берёт освободившееся имя boss — прав он не получает.
  const impostor = createUser('boss');
  wallet.ensureUnlimitedAccounts();

  assert.equal(wallet.isUnlimited(impostor), false, 'чужой аккаунт с именем boss не получает безлимит');
  assert.equal(wallet.isUnlimited(boss), true, 'права остаются у исходного внутреннего ID');
});

test('безлимитные аккаунты не теряют виртуальный баланс на покупках', () => {
  const boss = db.get("SELECT id FROM users WHERE username = 'BossRenamed' COLLATE NOCASE").id;
  const plain = createUser('PlainUser');

  shop.buyItem(boss, 'emoji_fire');
  assert.equal(wallet.balanceOf(boss), 0, 'баланс безлимитного аккаунта не уходит в минус');
  assert.ok(shop.ownsItem(boss, 'emoji_fire'), 'предмет всё равно выдан');

  assert.throws(
    () => shop.buyItem(plain, 'emoji_ice'),
    (error) => error.code === 'INSUFFICIENT_FUNDS',
    'обычный аккаунт без баланса не может купить предмет',
  );
  assert.equal(wallet.balanceOf(plain), 0, 'баланс обычного аккаунта не изменился');
});

test('явный внутренний ID из окружения имеет приоритет над именем', () => {
  const target = createUser('NoNameYet');
  process.env.TONI_USER_ID = String(target);

  const bound = wallet.ensureUnlimitedAccounts();
  delete process.env.TONI_USER_ID;

  assert.equal(bound.toni, target, 'безлимит закреплён за явно указанным внутренним ID');
  assert.equal(wallet.isUnlimited(target), true);
  assert.equal(Number(getSetting('unlimited_user_toni')), target, 'привязка сохранена в настройках');
});
