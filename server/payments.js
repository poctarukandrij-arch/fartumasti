// Платёжный слой. Реальные пополнения и выплаты выполняются только через
// законного провайдера (ЮKassa) после проверки правовой допустимости модели.
// Без ключей провайдера операции не имитируются: сервер отвечает, что приём
// платежей не подключён.
import crypto from 'node:crypto';
import { db } from './db.js';
import { credit } from './wallet.js';

export const DEPOSIT_MIN_KOP = 10000; // 100 ₽
export const DEPOSIT_MAX_KOP = 3000000; // 30 000 ₽
export const WITHDRAW_MIN_KOP = 50000; // 500 ₽

const PROVIDER = 'yookassa';
const API_BASE = 'https://api.yookassa.ru/v3';

export class PaymentError extends Error {
  constructor(message, code = 'PAYMENT_ERROR', status = 400) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.status = status;
  }
}

export function providerConfig() {
  const shopId = process.env.YOOKASSA_SHOP_ID || '';
  const secret = process.env.YOOKASSA_SECRET_KEY || '';
  const returnUrl = process.env.PAYMENTS_RETURN_URL || '';
  const enabled = Boolean(shopId && secret && returnUrl);
  return { provider: PROVIDER, shopId, secret, returnUrl, enabled };
}

export function paymentsStatus() {
  const cfg = providerConfig();
  return {
    provider: PROVIDER,
    providerTitle: 'ЮKassa',
    depositsEnabled: cfg.enabled,
    payoutsEnabled: Boolean(cfg.enabled && process.env.YOOKASSA_PAYOUTS_ENABLED === 'true'),
    depositMin: DEPOSIT_MIN_KOP,
    depositMax: DEPOSIT_MAX_KOP,
    withdrawMin: WITHDRAW_MIN_KOP,
    notice: cfg.enabled
      ? 'Пополнение проходит через ЮKassa. Вывод обрабатывается вручную после проверки.'
      : 'Приём платежей не подключён: нужны ключи платёжного провайдера (ЮKassa). Баланс можно получить бонусом за регистрацию, покупки и кейсы работают на внутреннем балансе.',
  };
}

function authHeader(cfg) {
  return `Basic ${Buffer.from(`${cfg.shopId}:${cfg.secret}`).toString('base64')}`;
}

function formatRub(kop) {
  return (kop / 100).toFixed(2);
}

function insertPayment({ userId, kind, amount, status, providerId = null, meta = null }) {
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO payments (id, user_id, kind, amount, status, provider, provider_id, meta, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, kind, amount, status, PROVIDER, providerId, meta ? JSON.stringify(meta) : null, Date.now(), Date.now()],
  );
  return id;
}

export async function createDeposit(userId, amountKop, { ip = null } = {}) {
  if (!Number.isInteger(amountKop) || amountKop < DEPOSIT_MIN_KOP || amountKop > DEPOSIT_MAX_KOP) {
    throw new PaymentError(
      `Сумма пополнения — от ${DEPOSIT_MIN_KOP / 100} до ${DEPOSIT_MAX_KOP / 100} ₽`,
      'BAD_AMOUNT',
    );
  }
  const cfg = providerConfig();
  if (!cfg.enabled) {
    throw new PaymentError(
      'Приём платежей не подключён. Добавьте ключи ЮKassa в настройках окружения.',
      'PROVIDER_DISABLED',
      503,
    );
  }
  const idempotenceKey = crypto.randomUUID();
  const paymentId = insertPayment({
    userId,
    kind: 'deposit',
    amount: amountKop,
    status: 'pending',
    meta: { idempotenceKey, ip },
  });

  const response = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
      Authorization: authHeader(cfg),
    },
    body: JSON.stringify({
      amount: { value: formatRub(amountKop), currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: cfg.returnUrl },
      description: 'Пополнение баланса FARTU MASTI',
      metadata: { userId, paymentId },
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.id) {
    db.run('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', ['failed', Date.now(), paymentId]);
    throw new PaymentError(
      payload?.description || 'Платёжный провайдер отклонил запрос. Попробуйте позже.',
      'PROVIDER_ERROR',
      502,
    );
  }
  db.run('UPDATE payments SET provider_id = ?, meta = ?, updated_at = ? WHERE id = ?', [
    payload.id,
    JSON.stringify({ idempotenceKey, confirmationUrl: payload.confirmation?.confirmation_url || null }),
    Date.now(),
    paymentId,
  ]);
  return {
    paymentId,
    providerPaymentId: payload.id,
    confirmationUrl: payload.confirmation?.confirmation_url || null,
    amount: amountKop,
    status: 'pending',
  };
}

export async function confirmProviderPayment(providerPaymentId) {
  const cfg = providerConfig();
  if (!cfg.enabled) throw new PaymentError('Платёжный провайдер не настроен', 'PROVIDER_DISABLED', 503);
  const row = db.get('SELECT * FROM payments WHERE provider_id = ?', [providerPaymentId]);
  if (!row) throw new PaymentError('Платёж не найден', 'PAYMENT_NOT_FOUND', 404);
  if (row.status === 'succeeded') return { alreadyProcessed: true, amount: row.amount };

  const response = await fetch(`${API_BASE}/payments/${encodeURIComponent(providerPaymentId)}`, {
    headers: { Authorization: authHeader(cfg) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) throw new PaymentError('Не удалось проверить платёж', 'PROVIDER_ERROR', 502);

  if (payload.status !== 'succeeded') {
    db.run('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', [
      payload.status === 'canceled' ? 'canceled' : 'pending',
      Date.now(),
      row.id,
    ]);
    return { alreadyProcessed: false, status: payload.status };
  }

  const paidKop = Math.round(Number(payload.amount?.value || 0) * 100);
  if (paidKop !== row.amount) {
    db.run('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', ['failed', Date.now(), row.id]);
    throw new PaymentError('Сумма платежа не совпадает', 'AMOUNT_MISMATCH', 400);
  }
  if (row.status === 'succeeded') return { alreadyProcessed: true, amount: row.amount };

  db.tx(() => {
    db.run('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', ['succeeded', Date.now(), row.id]);
    credit(row.user_id, row.amount, 'deposit', 'Пополнение баланса', { paymentId: row.id, provider: PROVIDER });
  });
  return { alreadyProcessed: false, status: 'succeeded', amount: row.amount };
}

export function requestWithdrawal(userId, amountKop, { method = 'card', destination = '' } = {}) {
  if (!Number.isInteger(amountKop) || amountKop < WITHDRAW_MIN_KOP) {
    throw new PaymentError(`Минимальная сумма вывода — ${WITHDRAW_MIN_KOP / 100} ₽`, 'BAD_AMOUNT');
  }
  const user = db.get('SELECT balance FROM users WHERE id = ?', [userId]);
  if (!user) throw new PaymentError('Пользователь не найден', 'NO_USER', 404);
  if (user.balance < amountKop) throw new PaymentError('Недостаточно средств на балансе', 'INSUFFICIENT_FUNDS');
  const clean = String(destination || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  if (clean.length < 4) throw new PaymentError('Укажите реквизиты для вывода', 'BAD_DESTINATION');

  return db.tx(() => {
    const paymentId = insertPayment({
      userId,
      kind: 'withdrawal',
      amount: amountKop,
      status: 'pending',
      meta: { method, destination: clean },
    });
    db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [amountKop, userId]);
    const balanceRow = db.get('SELECT balance FROM users WHERE id = ?', [userId]);
    const txId = crypto.randomUUID();
    db.run(
      `INSERT INTO transactions (id, user_id, kind, amount, balance_after, title, status, meta, created_at)
       VALUES (?, ?, 'withdrawal', ?, ?, ?, 'pending', ?, ?)`,
      [
        txId,
        userId,
        -amountKop,
        balanceRow.balance,
        'Заявка на вывод средств',
        JSON.stringify({ paymentId, method }),
        Date.now(),
      ],
    );
    return { paymentId, balance: balanceRow.balance, status: 'pending' };
  });
}

export function adminListWithdrawals(status = 'pending') {
  const rows = db.all(
    'SELECT p.*, u.username, u.telegram_id FROM payments p JOIN users u ON u.id = p.user_id WHERE p.kind = ? AND p.status = ? ORDER BY p.created_at ASC LIMIT 200',
    ['withdrawal', status],
  );
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    username: row.username,
    telegramId: row.telegram_id,
    amount: row.amount,
    status: row.status,
    meta: row.meta ? JSON.parse(row.meta) : null,
    createdAt: row.created_at,
  }));
}

export function adminResolveWithdrawal(paymentId, decision, comment = '') {
  const row = db.get("SELECT * FROM payments WHERE id = ? AND kind = 'withdrawal'", [paymentId]);
  if (!row) throw new PaymentError('Заявка не найдена', 'PAYMENT_NOT_FOUND', 404);
  if (row.status !== 'pending') throw new PaymentError('Заявка уже обработана', 'ALREADY_RESOLVED');

  return db.tx(() => {
    if (decision === 'approve') {
      db.run('UPDATE payments SET status = ?, updated_at = ?, meta = ? WHERE id = ?', [
        'paid',
        Date.now(),
        JSON.stringify({ ...(row.meta ? JSON.parse(row.meta) : {}), comment }),
        row.id,
      ]);
      db.run("UPDATE transactions SET status = 'done' WHERE user_id = ? AND kind = 'withdrawal' AND status = 'pending'", [
        row.user_id,
      ]);
      return { status: 'paid' };
    }
    if (decision === 'reject') {
      db.run('UPDATE payments SET status = ?, updated_at = ?, meta = ? WHERE id = ?', [
        'rejected',
        Date.now(),
        JSON.stringify({ ...(row.meta ? JSON.parse(row.meta) : {}), comment }),
        row.id,
      ]);
      db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [row.amount, row.user_id]);
      db.run("UPDATE transactions SET status = 'rejected' WHERE user_id = ? AND kind = 'withdrawal' AND status = 'pending'", [
        row.user_id,
      ]);
      credit(row.user_id, row.amount, 'withdrawal_refund', 'Возврат по отклонённой заявке на вывод', {
        paymentId: row.id,
      });
      return { status: 'rejected' };
    }
    throw new PaymentError('Неизвестное решение', 'BAD_DECISION');
  });
}

export function userPayments(userId, limit = 30) {
  return db
    .all('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, Math.min(limit, 100)])
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      amount: row.amount,
      status: row.status,
      provider: row.provider,
      createdAt: row.created_at,
      meta: row.meta ? JSON.parse(row.meta) : null,
    }));
}
