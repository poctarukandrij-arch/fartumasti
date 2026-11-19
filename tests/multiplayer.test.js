// Интеграционный тест мультиплеера: настоящий сервер, настоящая SQLite-база,
// два отдельных авторизованных игрока и реальные WebSocket-сообщения.
// Проверяем именно то, что было сломано: вход второго игрока за стол первого.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WebSocket } from 'ws';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fartu-mp-'));
process.env.DB_PATH = path.join(tmpDir, 'mp.sqlite');
process.env.DEV_LOGIN = '1';
process.env.NODE_ENV = 'test';
process.env.BOT_POLLING = '0';
delete process.env.TELEGRAM_BOT_TOKEN;

const { buildServer } = await import('../server/index.js');
const wallet = await import('../server/wallet.js');

const { server, wss } = await buildServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

async function login(devUserId, devName) {
  const res = await fetch(`${base}/api/auth/telegram`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ devUserId, devName }),
  });
  assert.equal(res.status, 200, 'dev-авторизация должна проходить');
  const data = await res.json();
  assert.ok(data.token, 'сервер должен выдать токен сессии');
  return data.token;
}

/** Клиент WebSocket с ожиданием конкретных сообщений. */
function client(token) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${encodeURIComponent(token)}`);
  const seen = [];
  const consumed = new WeakSet();
  const waiters = [];

  ws.on('message', (raw) => {
    let msg = null;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    seen.push(msg);
    for (let i = waiters.length - 1; i >= 0; i -= 1) {
      const waiter = waiters[i];
      if (waiter.pred(msg)) {
        waiters.splice(i, 1);
        clearTimeout(waiter.timer);
        consumed.add(msg);
        waiter.resolve(msg);
      }
    }
  });
  ws.on('error', () => {});

  function waitFor(pred, label, timeout = 5000) {
    const already = seen.find((msg) => !consumed.has(msg) && pred(msg));
    if (already) {
      consumed.add(already);
      return Promise.resolve(already);
    }
    return new Promise((resolve, reject) => {
      const waiter = { pred, resolve };
      waiter.timer = setTimeout(() => {
        const index = waiters.indexOf(waiter);
        if (index >= 0) waiters.splice(index, 1);
        reject(new Error(`не дождались: ${label}`));
      }, timeout);
      waiters.push(waiter);
    });
  }

  const ready = new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });

  return {
    ws,
    seen,
    ready,
    waitFor,
    send(obj) {
      ws.send(JSON.stringify(obj));
    },
    errors() {
      return seen.filter((msg) => msg.type === 'error');
    },
    close() {
      try {
        ws.close();
      } catch {
        /* уже закрыт */
      }
    },
  };
}

/** Авторизованный игрок с балансом, достаточным для взноса. */
async function player(key) {
  const token = await login(key, key);
  const conn = client(token);
  await conn.ready;
  const hello = await conn.waitFor((msg) => msg.type === 'hello', `hello ${key}`);
  wallet.credit(hello.user.id, 1_000_000, 'test', 'Тестовое начисление');
  return { conn, user: hello.user, token };
}

async function createTable(conn, extra = {}) {
  conn.send({
    type: 'room:create',
    maxPlayers: 2,
    mode: 'podkidnoy',
    buyn: 20000,
    deckSize: 36,
    visibility: 'public',
    ...extra,
  });
  const msg = await conn.waitFor(
    (item) => item.type === 'room' && item.room?.status === 'waiting',
    'стол создан',
  );
  return msg.room;
}

test.after(() => {
  try {
    wss.close();
  } catch {
    /* уже закрыт */
  }
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('второй игрок входит за открытый стол первого по коду', async () => {
  const a = await player('pubA');
  const room = await createTable(a.conn);
  assert.ok(room.code, 'у стола должен быть код');
  assert.equal(room.visibility, 'public');

  const b = await player('pubB');
  b.conn.send({ type: 'room:join', roomId: room.code });

  const bSees = await b.conn.waitFor(
    (msg) => msg.type === 'room' && msg.room?.players?.length === 2,
    'B видит себя за столом',
  );
  const aSees = await a.conn.waitFor(
    (msg) => msg.type === 'room' && msg.room?.players?.length === 2,
    'A видит второго игрока',
  );

  assert.equal(bSees.room.id, room.id, 'оба игрока за одним столом');
  assert.equal(aSees.room.id, room.id);
  assert.deepEqual(
    bSees.room.players.map((p) => p.userId).sort(),
    aSees.room.players.map((p) => p.userId).sort(),
  );
  // Главная регрессия: раньше здесь приходило «Внутренняя ошибка сервера».
  assert.deepEqual(b.conn.errors(), [], 'вход не должен возвращать ошибку сервера');
  assert.equal(bSees.room.players.filter((p) => p.userId === b.user.id).length, 1, 'одно место на игрока');

  a.conn.close();
  b.conn.close();
});

test('приватный стол: без кода приглашения вход запрещён, с кодом — разрешён', async () => {
  const a = await player('prvA');
  const room = await createTable(a.conn, { visibility: 'private' });
  assert.equal(room.visibility, 'private');
  assert.ok(room.inviteCode, 'у приватного стола есть код приглашения');
  assert.notEqual(room.inviteCode, room.code, 'код приглашения отличается от публичного кода');

  // Приватный стол не виден в лобби другим игрокам.
  const watcher = await player('prvWatch');
  const lobby = await watcher.conn.waitFor((msg) => msg.type === 'lobby', 'лобби');
  const visible = (lobby.lobby?.rooms || []).some((item) => item.id === room.id);
  assert.equal(visible, false, 'приватный стол не должен попадать в список открытых');

  // Чужой игрок по публичному коду не проходит.
  const b = await player('prvB');
  b.conn.send({ type: 'room:join', roomId: room.code });
  const denied = await b.conn.waitFor((msg) => msg.type === 'error', 'отказ по приватному столу');
  assert.equal(denied.code, 'PRIVATE_ROOM');

  // С кодом приглашения — проходит.
  b.conn.send({ type: 'room:join', roomId: room.code, inviteCode: room.inviteCode });
  const joined = await b.conn.waitFor(
    (msg) => msg.type === 'room' && msg.room?.players?.length === 2,
    'B вошёл по приглашению',
  );
  assert.equal(joined.room.id, room.id);
  assert.equal(joined.room.visibility, 'private');

  a.conn.close();
  b.conn.close();
  watcher.conn.close();
});

test('полный стол и несуществующий стол дают понятные ошибки', async () => {
  const a = await player('fullA');
  const room = await createTable(a.conn);
  const b = await player('fullB');
  b.conn.send({ type: 'room:join', roomId: room.code });
  await b.conn.waitFor((msg) => msg.type === 'room' && msg.room?.players?.length === 2, 'B за столом');

  const c = await player('fullC');
  c.conn.send({ type: 'room:join', roomId: room.code });
  const full = await c.conn.waitFor((msg) => msg.type === 'error', 'отказ: стол занят');
  assert.equal(full.code, 'ROOM_FULL');
  assert.match(full.message, /мест/i);

  c.conn.send({ type: 'room:join', roomId: 'ZZZZZ' });
  const missing = await c.conn.waitFor(
    (msg) => msg.type === 'error' && msg.code === 'ROOM_NOT_FOUND',
    'отказ: стола нет',
  );
  assert.equal(missing.code, 'ROOM_NOT_FOUND');

  a.conn.close();
  b.conn.close();
  c.conn.close();
});

test('переподключение не создаёт дубль игрока за столом', async () => {
  const a = await player('recA');
  const room = await createTable(a.conn);
  a.conn.close();

  const again = client(a.token);
  await again.ready;
  const hello = await again.waitFor((msg) => msg.type === 'hello', 'hello после переподключения');
  assert.ok(hello.room, 'игрок возвращается за свой стол');
  assert.equal(hello.room.id, room.id);
  const mine = hello.room.players.filter((p) => p.userId === a.user.id);
  assert.equal(mine.length, 1, 'игрок не должен дублироваться');

  again.close();
});
