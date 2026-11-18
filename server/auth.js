// Авторизация через Telegram WebApp initData с проверкой подписи на сервере.
import crypto from 'node:crypto';
import { db } from './db.js';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_AUTH_AGE_SEC = 24 * 60 * 60;
const RESERVED_NAMES = new Set([
  'admin', 'administrator', 'support', 'moder', 'moderator', 'root', 'system',
  'fartu', 'masti', 'fartumasti', 'durak', 'bot', 'telegram', 'official',
]);

export function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

export function botConfigured() {
  return botToken().length > 10;
}

export function devLoginEnabled() {
  return process.env.DEV_LOGIN === '1';
}

/**
 * Проверка подписи initData по алгоритму Telegram:
 * secret = HMAC_SHA256("WebAppData", botToken); hash = HMAC_SHA256(secret, data_check_string)
 */
export function verifyInitData(initData, token = botToken()) {
  if (!initData || typeof initData !== 'string') {
    return { ok: false, error: 'Отсутствуют данные Telegram' };
  }
  if (!token) {
    return { ok: false, error: 'Сервер не настроен: не задан токен бота' };
  }
  let params;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false, error: 'Некорректные данные Telegram' };
  }
  const hash = params.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) {
    return { ok: false, error: 'Отсутствует подпись Telegram' };
  }
  params.delete('hash');
  params.delete('signature');
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => [k, v])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: 'Подпись Telegram неверна' };
  }

  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate) return { ok: false, error: 'Нет времени авторизации Telegram' };
  if (Math.abs(Date.now() / 1000 - authDate) > MAX_AUTH_AGE_SEC) {
    return { ok: false, error: 'Данные Telegram устарели, откройте приложение заново' };
  }

  let tgUser = null;
  try {
    tgUser = JSON.parse(params.get('user') || 'null');
  } catch {
    return { ok: false, error: 'Некорректные данные пользователя Telegram' };
  }
  if (!tgUser || !tgUser.id) {
    return { ok: false, error: 'Нет пользователя Telegram' };
  }
  return {
    ok: true,
    telegramId: String(tgUser.id),
    firstName: typeof tgUser.first_name === 'string' ? tgUser.first_name : '',
    tgUsername: typeof tgUser.username === 'string' ? tgUser.username : '',
    authDate,
  };
}

export function validateUsername(name) {
  if (typeof name !== 'string') return 'Имя должно быть текстом';
  const value = name.trim();
  if (value.length < 4 || value.length > 12) return 'Имя должно быть от 4 до 12 символов';
  if (!/^[A-Za-z0-9]+$/.test(value)) return 'Только английские буквы и цифры, без пробелов';
  const letters = (value.match(/[A-Za-z]/g) || []).length;
  if (letters < 3) return 'В имени должно быть минимум 3 буквы';
  if (RESERVED_NAMES.has(value.toLowerCase())) return 'Это имя зарезервировано';
  return null;
}

export function usernameTaken(name, exceptUserId = null) {
  const row = exceptUserId
    ? db.get('SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?', [name, exceptUserId])
    : db.get('SELECT id FROM users WHERE username = ? COLLATE NOCASE', [name]);
  return Boolean(row);
}

export function findUserByTelegramId(telegramId) {
  return db.get('SELECT * FROM users WHERE telegram_id = ?', [String(telegramId)]);
}

export function getUserById(id) {
  return db.get('SELECT * FROM users WHERE id = ?', [id]);
}

export function createSession(userId, source = 'telegram') {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.run(
    'INSERT INTO sessions (token, user_id, source, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    [token, userId, source, now, now + SESSION_TTL_MS],
  );
  return token;
}

export function destroySession(token) {
  if (!token) return;
  db.run('DELETE FROM sessions WHERE token = ?', [token]);
}

export function userBySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const row = db.get(
    `SELECT s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    [token],
  );
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    destroySession(token);
    return null;
  }
  return row;
}

export function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (typeof req.query.token === 'string') return req.query.token;
  return null;
}

/** Express middleware: требует действующую сессию. */
export function requireAuth(req, res, next) {
  const token = extractToken(req);
  const user = userBySessionToken(token);
  if (!user) return res.status(401).json({ error: 'SESSION_INVALID', message: 'Нужна авторизация' });
  if (user.banned) {
    return res.status(403).json({ error: 'USER_BANNED', message: 'Аккаунт заблокирован' });
  }
  db.run('UPDATE users SET last_seen = ? WHERE id = ?', [Date.now(), user.id]);
  req.user = user;
  req.sessionToken = token;
  next();
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    telegramId: user.telegram_id,
    balance: user.balance,
    banned: Boolean(user.banned),
    createdAt: user.created_at,
    soundEnabled: Boolean(user.sound_enabled),
    notificationsEnabled: Boolean(user.notifications_enabled),
    equipped: {
      deck: user.equipped_deck,
      table: user.equipped_table,
      emoji: user.equipped_emoji,
      effect: user.equipped_effect,
    },
    needsUsername: !user.username,
  };
}
