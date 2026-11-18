// HTTP + WebSocket сервер FARTU MASTI.
// Один процесс отдаёт собранный клиент Mini App, REST API и игровой WebSocket.
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';
import { initDb, db, logError, persistNow } from './db.js';
import {
  verifyInitData,
  validateUsername,
  usernameTaken,
  findUserByTelegramId,
  getUserById,
  createSession,
  destroySession,
  userBySessionToken,
  requireAuth,
  publicUser,
  devLoginEnabled,
} from './auth.js';
import * as shop from './shop.js';
import { credit, debit, listTransactions, listPurchases, WalletError } from './wallet.js';
import {
  createDeposit,
  confirmProviderPayment,
  requestWithdrawal,
  adminListWithdrawals,
  adminResolveWithdrawal,
  userPayments,
  paymentsStatus,
  PaymentError,
} from './payments.js';
import { createRoomManager, RoomError } from './game/rooms.js';
import { GameError } from './game/durak.js';
import * as bot from './bot.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const TURN_TIMEOUT_MS = Number(process.env.TURN_TIMEOUT_MS || 45000);
const ROOT = process.cwd();

function fail(res, status, error, message) {
  return res.status(status).json({ error, message });
}

/** initData приходит в теле запроса или в заголовке (заголовок — URL-encoded). */
function readInitData(req) {
  const fromBody = req.body && typeof req.body.initData === 'string' ? req.body.initData : '';
  if (fromBody) return fromBody;
  const header = req.get('x-telegram-init-data');
  if (!header) return '';
  try {
    return decodeURIComponent(header);
  } catch {
    return header;
  }
}

function mapError(res, error) {
  if (error instanceof WalletError) {
    const status = error.code === 'INSUFFICIENT_FUNDS' ? 402 : 400;
    return fail(res, status, error.code, error.message);
  }
  if (error instanceof PaymentError) {
    return fail(res, error.status || 400, error.code, error.message);
  }
  if (error instanceof RoomError) {
    return fail(res, 400, error.code, error.message);
  }
  if (error instanceof GameError) {
    return fail(res, 400, error.code, error.message);
  }
  logError('error', error.message, error.stack);
  return fail(res, 500, 'SERVER_ERROR', 'Внутренняя ошибка сервера');
}

function publicConfig() {
  return {
    bot: bot.botStatus(),
    payments: paymentsStatus(),
    nameChangePrice: shop.NAME_CHANGE_PRICE,
    welcomeBonus: shop.WELCOME_BONUS,
    chatLimit: 30,
    turnTimeoutMs: TURN_TIMEOUT_MS,
    devLogin: devLoginEnabled(),
  };
}

function userStats(user) {
  const played = user.games_played || 0;
  const wins = user.wins || 0;
  const losses = user.losses || 0;
  return {
    gamesPlayed: played,
    wins,
    losses,
    winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
    balance: user.balance,
  };
}

function userHistory(userId, limit = 50) {
  const rows = db.all(
    `SELECT m.id AS match_id, m.room_id, m.ended_at, m.rounds, m.loser_id, m.players_json,
            r.is_winner, r.place, r.cards_left
       FROM match_results r
       JOIN matches m ON m.id = r.match_id
      WHERE r.user_id = ?
      ORDER BY m.ended_at DESC
      LIMIT ?`,
    [userId, Math.min(Math.max(Number(limit) || 50, 1), 100)],
  );
  return rows.map((row) => {
    let players = [];
    try {
      players = row.players_json ? JSON.parse(row.players_json) : [];
    } catch {
      players = [];
    }
    const loser = players.find((p) => p.userId === row.loser_id) || null;
    return {
      matchId: row.match_id,
      roomId: row.room_id,
      endedAt: row.ended_at,
      rounds: row.rounds,
      isWinner: Boolean(row.is_winner),
      place: row.place,
      cardsLeft: row.cards_left,
      durakName: loser?.name || null,
      players: players.map((p) => p.name),
    };
  });
}

function mePayload(user) {
  return {
    user: publicUser(user),
    stats: userStats(user),
    inventory: shop.inventoryWithItems(user.id),
    equipped: shop.equippedOf(user),
    config: publicConfig(),
  };
}

export async function buildServer() {
  await initDb();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'microphone=(self), camera=()');
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' https://telegram.org",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss:",
        "frame-ancestors https://web.telegram.org https://*.telegram.org",
      ].join('; '),
    );
    next();
  });

  const server = http.createServer(app);
  const sockets = new Map(); // userId(string) -> Set<ws>

  function sendToUser(userId, payload) {
    const set = sockets.get(String(userId));
    if (!set) return;
    const data = JSON.stringify(payload);
    for (const ws of set) {
      if (ws.readyState === 1) {
        try {
          ws.send(data);
        } catch (error) {
          logError('warn', `send failed: ${error.message}`);
        }
      }
    }
  }

  const rooms = createRoomManager({
    sendToUser,
    onlineUserIds: () => [...sockets.keys()].map((id) => Number(id)),
    turnTimeoutMs: TURN_TIMEOUT_MS,
    logger: console,
    onMatchFinished: ({ result, matchId }) => {
      console.log(`[match] ${matchId} завершён, дурак: ${result?.loserName || '—'}`);
    },
  });

  // ---------------- REST API ----------------

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      uptime: Math.round(process.uptime()),
      online: sockets.size,
      rooms: rooms.rooms.size,
      bot: bot.botStatus().configured,
      payments: paymentsStatus().depositsEnabled,
    });
  });

  app.get('/api/config', (req, res) => {
    res.json(publicConfig());
  });

  app.post('/api/auth/telegram', async (req, res) => {
    try {
      const { devUserId, devName } = req.body || {};
      const initData = readInitData(req);
      let telegram;
      if (devLoginEnabled() && !initData && devUserId) {
        telegram = {
          telegramId: `dev_${String(devUserId).slice(0, 20)}`,
          firstName: String(devName || 'Тест').slice(0, 32),
          tgUsername: '',
        };
      } else {
        const check = verifyInitData(initData);
        if (!check.ok) {
          // Только код причины: initData, подпись и данные пользователя в логи не попадают.
          console.warn('[auth] initData отклонён:', check.code, 'present:', Boolean(initData));
          return fail(res, 401, check.code, check.error);
        }
        telegram = check;
      }

      let user = findUserByTelegramId(telegram.telegramId);
      let isNew = false;
      if (!user) {
        const now = Date.now();
        const inserted = db.run(
          `INSERT INTO users (telegram_id, first_name, balance, created_at, last_seen, updated_at)
           VALUES (?, ?, 0, ?, ?, ?)`,
          [telegram.telegramId, telegram.firstName || '', now, now, now],
        );
        user = getUserById(inserted.lastInsertRowid);
        isNew = true;
        if (user) {
          credit(user.id, shop.WELCOME_BONUS, 'bonus', 'Приветственный бонус');
          user = getUserById(user.id);
        }
      } else {
        db.run('UPDATE users SET last_seen = ?, first_name = ? WHERE id = ?', [
          Date.now(),
          telegram.firstName || user.first_name || '',
          user.id,
        ]);
        user = getUserById(user.id);
      }
      if (!user) return fail(res, 500, 'USER_CREATE_FAILED', 'Не удалось создать профиль');
      if (user.banned) return fail(res, 403, 'USER_BANNED', 'Аккаунт заблокирован');

      const token = createSession(user.id);
      res.json({ token, isNew, ...mePayload(user) });
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    destroySession(req.sessionToken);
    res.json({ ok: true });
  });

  app.get('/api/me', requireAuth, (req, res) => {
    try {
      res.json(mePayload(getUserById(req.user.id)));
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/auth/name', requireAuth, (req, res) => {
    try {
      if (req.user.username) {
        return fail(res, 400, 'NAME_ALREADY_SET', `Имя уже задано. Смена имени — ${shop.NAME_CHANGE_PRICE / 100} ₽`);
      }
      const { name } = req.body || {};
      const error = validateUsername(name);
      if (error) return fail(res, 400, 'BAD_NAME', error);
      if (usernameTaken(name.trim())) return fail(res, 409, 'NAME_TAKEN', 'Это имя уже занято');
      db.run('UPDATE users SET username = ?, updated_at = ? WHERE id = ?', [name.trim(), Date.now(), req.user.id]);
      res.json(mePayload(getUserById(req.user.id)));
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/profile/name', requireAuth, (req, res) => {
    try {
      const { name } = req.body || {};
      const error = validateUsername(name);
      if (error) return fail(res, 400, 'BAD_NAME', error);
      const next = name.trim();
      if ((req.user.username || '').toLowerCase() === next.toLowerCase()) {
        return fail(res, 400, 'NAME_SAME', 'Новое имя совпадает с текущим');
      }
      if (usernameTaken(next, req.user.id)) return fail(res, 409, 'NAME_TAKEN', 'Это имя уже занято');
      db.tx(() => {
        debit(req.user.id, shop.NAME_CHANGE_PRICE, 'name_change', 'Смена имени', { newName: next });
        db.run('UPDATE users SET username = ?, updated_at = ? WHERE id = ?', [next, Date.now(), req.user.id]);
        db.run('INSERT INTO name_changes (user_id, old_name, new_name, price, created_at) VALUES (?, ?, ?, ?, ?)', [
          req.user.id,
          req.user.username || null,
          next,
          shop.NAME_CHANGE_PRICE,
          Date.now(),
        ]);
      });
      res.json(mePayload(getUserById(req.user.id)));
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/profile/settings', requireAuth, (req, res) => {
    try {
      const { soundEnabled, notificationsEnabled } = req.body || {};
      db.run('UPDATE users SET sound_enabled = ?, notifications_enabled = ?, updated_at = ? WHERE id = ?', [
        soundEnabled ? 1 : 0,
        notificationsEnabled ? 1 : 0,
        Date.now(),
        req.user.id,
      ]);
      res.json(mePayload(getUserById(req.user.id)));
    } catch (error) {
      mapError(res, error);
    }
  });

  app.get('/api/lobby', requireAuth, (req, res) => {
    res.json({ lobby: rooms.lobbyPayload(), room: rooms.roomForUser(req.user.id) });
  });

  app.get('/api/shop', requireAuth, (req, res) => {
    const owned = [...shop.ownedItemIds(req.user.id)];
    for (const id of Object.values({ deck: 'deck_graphite', table: 'table_graphite', emoji: 'emoji_none', effect: 'effect_none' })) {
      if (!owned.includes(id)) owned.push(id);
    }
    res.json({
      ...shop.shopCatalog(),
      owned,
      balance: req.user.balance,
      equipped: shop.equippedOf(req.user),
    });
  });

  app.post('/api/shop/buy', requireAuth, (req, res) => {
    try {
      const { itemId } = req.body || {};
      const result = shop.buyItem(req.user.id, String(itemId || ''));
      res.json({ ...result, owned: [...shop.ownedItemIds(req.user.id)], balance: result.balance });
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/shop/case', requireAuth, (req, res) => {
    try {
      const { caseId } = req.body || {};
      const result = shop.openCase(req.user.id, String(caseId || ''));
      res.json({
        ...result,
        owned: [...shop.ownedItemIds(req.user.id)],
        inventory: shop.inventoryWithItems(req.user.id),
      });
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/shop/equip', requireAuth, (req, res) => {
    try {
      const { itemId } = req.body || {};
      const item = shop.equipItem(req.user.id, String(itemId || ''));
      res.json({ item, equipped: shop.equippedOf(getUserById(req.user.id)) });
    } catch (error) {
      mapError(res, error);
    }
  });

  app.get('/api/inventory', requireAuth, (req, res) => {
    res.json({
      items: shop.inventoryWithItems(req.user.id),
      equipped: shop.equippedOf(req.user),
      balance: req.user.balance,
    });
  });

  app.get('/api/stats', requireAuth, (req, res) => {
    try {
      const user = getUserById(req.user.id);
      res.json({
        stats: userStats(user),
        history: userHistory(user.id, 50),
        transactions: listTransactions(user.id, 50),
        purchases: listPurchases(user.id, 50),
      });
    } catch (error) {
      mapError(res, error);
    }
  });

  app.get('/api/wallet', requireAuth, (req, res) => {
    try {
      const user = getUserById(req.user.id);
      res.json({
        balance: user.balance,
        transactions: listTransactions(user.id, 60),
        purchases: listPurchases(user.id, 60),
        payments: userPayments(user.id, 30),
        paymentsStatus: paymentsStatus(),
      });
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/wallet/deposit', requireAuth, async (req, res) => {
    try {
      const amount = Number(req.body?.amount);
      if (!Number.isInteger(amount)) return fail(res, 400, 'BAD_AMOUNT', 'Сумма должна быть целым числом копеек');
      const result = await createDeposit(req.user.id, amount, { ip: req.ip });
      res.json(result);
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/wallet/withdraw', requireAuth, (req, res) => {
    try {
      const amount = Number(req.body?.amount);
      if (!Number.isInteger(amount)) return fail(res, 400, 'BAD_AMOUNT', 'Сумма должна быть целым числом копеек');
      const result = requestWithdrawal(req.user.id, amount, {
        method: String(req.body?.method || 'card').slice(0, 24),
        destination: req.body?.destination,
      });
      res.json(result);
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/payments/sync', requireAuth, async (req, res) => {
    try {
      const pending = db.all(
        "SELECT provider_id FROM payments WHERE user_id = ? AND kind = 'deposit' AND status = 'pending' AND provider_id IS NOT NULL ORDER BY created_at DESC LIMIT 5",
        [req.user.id],
      );
      const results = [];
      for (const row of pending) {
        try {
          results.push(await confirmProviderPayment(row.provider_id));
        } catch (error) {
          results.push({ error: error.code || 'ERROR' });
        }
      }
      const user = getUserById(req.user.id);
      res.json({ results, balance: user.balance, payments: userPayments(user.id, 20) });
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/payments/webhook/yookassa', async (req, res) => {
    try {
      const event = req.body?.event;
      const providerId = req.body?.object?.id;
      if (typeof providerId !== 'string' || !providerId) {
        return res.status(200).json({ ok: true, ignored: true });
      }
      if (event === 'payment.succeeded' || event === 'payment.waiting_for_capture') {
        const result = await confirmProviderPayment(providerId);
        return res.json({ ok: true, ...result });
      }
      res.json({ ok: true, ignored: true });
    } catch (error) {
      logError('error', `webhook: ${error.message}`, error.stack);
      res.status(200).json({ ok: false });
    }
  });

  // ---------------- Админ ----------------

  function requireAdmin(req, res, next) {
    const token = process.env.ADMIN_TOKEN || '';
    if (token.length < 8) {
      return fail(res, 503, 'ADMIN_DISABLED', 'Админ-доступ не настроен: задайте ADMIN_TOKEN');
    }
    const provided = String(req.headers['x-admin-token'] || req.query.admin_token || '');
    const a = Buffer.from(provided);
    const b = Buffer.from(token);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return fail(res, 401, 'ADMIN_DENIED', 'Неверный токен администратора');
    }
    next();
  }

  app.get('/api/admin/overview', requireAdmin, (req, res) => {
    const users = db.get('SELECT COUNT(*) AS c FROM users');
    const banned = db.get('SELECT COUNT(*) AS c FROM users WHERE banned = 1');
    const matches = db.get("SELECT COUNT(*) AS c FROM matches WHERE status = 'finished'");
    const deposits = db.get("SELECT COALESCE(SUM(amount),0) AS s FROM payments WHERE kind = 'deposit' AND status = 'succeeded'");
    const pending = db.get("SELECT COUNT(*) AS c FROM payments WHERE kind = 'withdrawal' AND status = 'pending'");
    res.json({
      users: users?.c || 0,
      banned: banned?.c || 0,
      matches: matches?.c || 0,
      deposits: deposits?.s || 0,
      pendingWithdrawals: pending?.c || 0,
      online: sockets.size,
      rooms: rooms.adminRooms(),
      bot: bot.botStatus(),
      payments: paymentsStatus(),
    });
  });

  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const query = String(req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = query
      ? db.all(
          `SELECT * FROM users WHERE username LIKE ? OR telegram_id LIKE ? ORDER BY created_at DESC LIMIT ?`,
          [`%${query}%`, `%${query}%`, limit],
        )
      : db.all('SELECT * FROM users ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json({
      users: rows.map((user) => ({
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        balance: user.balance,
        banned: Boolean(user.banned),
        banReason: user.ban_reason,
        gamesPlayed: user.games_played,
        wins: user.wins,
        losses: user.losses,
        createdAt: user.created_at,
        lastSeen: user.last_seen,
      })),
    });
  });

  app.post('/api/admin/users/:id/ban', requireAdmin, (req, res) => {
    try {
      const id = Number(req.params.id);
      const banned = Boolean(req.body?.banned);
      const reason = String(req.body?.reason || '').slice(0, 200);
      db.run('UPDATE users SET banned = ?, ban_reason = ?, updated_at = ? WHERE id = ?', [
        banned ? 1 : 0,
        banned ? reason || 'Нарушение правил' : null,
        Date.now(),
        id,
      ]);
      if (banned) {
        db.run('DELETE FROM sessions WHERE user_id = ?', [id]);
        sendToUser(id, { type: 'error', message: 'Аккаунт заблокирован' });
        rooms.adminCloseRoom(rooms.userRoom.get(id) || '', 'Стол закрыт: аккаунт заблокирован');
      }
      res.json({ ok: true });
    } catch (error) {
      mapError(res, error);
    }
  });

  app.post('/api/admin/users/:id/balance', requireAdmin, (req, res) => {
    try {
      const id = Number(req.params.id);
      const amount = Number(req.body?.amount);
      if (!Number.isInteger(amount) || amount === 0) return fail(res, 400, 'BAD_AMOUNT', 'Сумма должна быть целым числом');
      const comment = String(req.body?.comment || 'Корректировка администратором').slice(0, 120);
      const result =
        amount > 0
          ? credit(id, amount, 'admin_credit', comment)
          : debit(id, -amount, 'admin_debit', comment);
      res.json(result);
    } catch (error) {
      mapError(res, error);
    }
  });

  app.get('/api/admin/rooms', requireAdmin, (req, res) => {
    res.json({ rooms: rooms.adminRooms() });
  });

  app.post('/api/admin/rooms/:id/close', requireAdmin, (req, res) => {
    const closed = rooms.adminCloseRoom(req.params.id, String(req.body?.reason || 'Стол закрыт администратором'));
    res.json({ ok: closed });
  });

  app.get('/api/admin/withdrawals', requireAdmin, (req, res) => {
    res.json({ withdrawals: adminListWithdrawals(String(req.query.status || 'pending')) });
  });

  app.post('/api/admin/withdrawals/:id', requireAdmin, (req, res) => {
    try {
      const result = adminResolveWithdrawal(req.params.id, String(req.body?.decision || ''), String(req.body?.comment || ''));
      res.json(result);
    } catch (error) {
      mapError(res, error);
    }
  });

  app.get('/api/admin/chat-logs', requireAdmin, (req, res) => {
    const rows = db.all('SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 200');
    res.json({ logs: rows });
  });

  app.get('/api/admin/errors', requireAdmin, (req, res) => {
    const rows = db.all('SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 100');
    res.json({ errors: rows });
  });

  // ---------------- WebSocket ----------------

  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 96 * 1024 });

  wss.on('connection', (ws, req) => {
    let user = null;
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      user = userBySessionToken(token);
    } catch {
      user = null;
    }
    if (!user) {
      ws.close(4001, 'unauthorized');
      return;
    }
    if (user.banned) {
      ws.close(4003, 'banned');
      return;
    }

    const key = String(user.id);
    if (!sockets.has(key)) sockets.set(key, new Set());
    sockets.get(key).add(ws);

    const bucket = { tokens: 40, updated: Date.now() };
    function takeToken() {
      const now = Date.now();
      bucket.tokens = Math.min(40, bucket.tokens + ((now - bucket.updated) / 1000) * 20);
      bucket.updated = now;
      if (bucket.tokens < 1) return false;
      bucket.tokens -= 1;
      return true;
    }

    const freshUser = getUserById(user.id) || user;
    const room = rooms.onConnect(freshUser);
    ws.send(
      JSON.stringify({
        type: 'hello',
        user: publicUser(freshUser),
        stats: userStats(freshUser),
        lobby: rooms.lobbyPayload(),
        room,
        config: publicConfig(),
      }),
    );

    ws.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!message || typeof message.type !== 'string') return;
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', t: Date.now() }));
        return;
      }
      if (!takeToken()) {
        ws.send(JSON.stringify({ type: 'error', message: 'Слишком много действий. Подождите секунду' }));
        return;
      }
      const currentUser = getUserById(user.id);
      if (!currentUser || currentUser.banned) {
        ws.close(4003, 'banned');
        return;
      }
      try {
        switch (message.type) {
          case 'sync': {
            ws.send(
              JSON.stringify({
                type: 'hello',
                user: publicUser(currentUser),
                stats: userStats(currentUser),
                lobby: rooms.lobbyPayload(),
                room: rooms.roomForUser(currentUser.id),
                config: publicConfig(),
              }),
            );
            break;
          }
          case 'queue:join':
            rooms.joinQueue(currentUser);
            break;
          case 'queue:leave':
            rooms.leaveQueue(currentUser.id);
            break;
          case 'room:create':
            rooms.createRoom(currentUser, { maxPlayers: Number(message.maxPlayers) || 2 });
            break;
          case 'room:join':
            rooms.joinRoom(currentUser, String(message.roomId || ''));
            break;
          case 'room:leave':
            rooms.leaveRoom(currentUser.id);
            break;
          case 'room:start':
            rooms.startGame(rooms.rooms.get(rooms.userRoom.get(currentUser.id)));
            break;
          case 'room:ready':
            rooms.setReady(currentUser.id);
            break;
          case 'game:action':
            rooms.handleAction(currentUser.id, message.action);
            break;
          case 'chat':
            rooms.chat(currentUser.id, message.text, 'text');
            break;
          case 'chat:emoji':
            rooms.chat(currentUser.id, message.symbol, 'emoji');
            break;
          case 'voice:mic':
            rooms.setMic(currentUser.id, Boolean(message.mic));
            break;
          case 'voice:signal':
            rooms.voiceSignal(currentUser.id, Number(message.to), message.data);
            break;
          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Неизвестная команда' }));
        }
      } catch (error) {
        if (error instanceof RoomError || error instanceof GameError || error instanceof WalletError) {
          ws.send(JSON.stringify({ type: 'error', message: error.message, code: error.code }));
        } else {
          logError('error', `ws: ${error.message}`, error.stack);
          ws.send(JSON.stringify({ type: 'error', message: 'Внутренняя ошибка сервера' }));
        }
      }
    });

    ws.on('close', () => {
      const set = sockets.get(key);
      if (set) {
        set.delete(ws);
        if (set.size === 0) sockets.delete(key);
      }
      if (!sockets.has(key)) rooms.onDisconnect(user.id);
    });

    ws.on('error', (error) => {
      logError('warn', `ws error: ${error.message}`);
    });
  });

  // ---------------- Статика ----------------

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(ROOT, 'admin', 'index.html'));
  });

  const distDir = path.join(ROOT, 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api|ws|admin).*/, (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res
        .status(200)
        .type('html')
        .send('<!doctype html><meta charset="utf-8"><title>FARTU MASTI</title><p>Клиент не собран. Выполните npm run build.</p>');
    });
  }

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) return fail(res, 404, 'NOT_FOUND', 'Метод не найден');
    res.status(404).type('text').send('Не найдено');
  });

  app.use((error, req, res, next) => {
    logError('error', error.message, error.stack);
    if (res.headersSent) return next(error);
    fail(res, 500, 'SERVER_ERROR', 'Внутренняя ошибка сервера');
  });

  const ticker = setInterval(() => {
    try {
      rooms.tick();
    } catch (error) {
      logError('error', `tick: ${error.message}`, error.stack);
    }
  }, 2000);
  if (typeof ticker.unref === 'function') ticker.unref();

  rooms.restore();

  return { app, server, rooms, wss, sockets };
}

export async function main() {
  const { server } = await buildServer();
  server.listen(PORT, HOST, () => {
    console.log(`[fartu] сервер запущен на http://${HOST}:${PORT}`);
  });

  const botPolling = process.env.BOT_POLLING !== '0' && process.env.NODE_ENV !== 'test';
  if (botPolling && bot.botStatus().configured) {
    bot
      .setupBot()
      .then((result) => {
        console.log('[bot] настройка:', JSON.stringify(result));
      })
      .catch((error) => console.error('[bot] setup failed', error.message));
    bot.startPolling({ logger: console });
  }

  const shutdown = () => {
    console.log('[fartu] остановка сервера');
    persistNow();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('unhandledRejection', (reason) => {
    logError('error', `unhandledRejection: ${reason}`, reason?.stack);
  });
  process.on('uncaughtException', (error) => {
    logError('error', `uncaughtException: ${error.message}`, error.stack);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('[fartu] не удалось запустить сервер:', error);
    process.exit(1);
  });
}
