// Финансовое ядро: баланс, транзакции, атомарные списания и начисления.
// Суммы — только целые копейки, у каждой операции уникальный идентификатор.
import crypto from 'node:crypto';
import { db } from './db.js';

export class WalletError extends Error {
  constructor(message, code = 'WALLET_ERROR') {
    super(message);
    this.name = 'WalletError';
    this.code = code;
  }
}

export function balanceOf(userId) {
  const row = db.get('SELECT balance FROM users WHERE id = ?', [userId]);
  return row ? row.balance : 0;
}

function insertTx(userId, kind, amount, title, status, meta) {
  const user = db.get('SELECT balance FROM users WHERE id = ?', [userId]);
  if (!user) throw new WalletError('Пользователь не найден', 'NO_USER');
  const txId = crypto.randomUUID();
  db.run(
    `INSERT INTO transactions (id, user_id, kind, amount, balance_after, title, status, meta, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [txId, userId, kind, amount, user.balance, title, status, meta ? JSON.stringify(meta) : null, Date.now()],
  );
  return { txId, balance: user.balance };
}

export function credit(userId, amount, kind, title, meta = null, status = 'done') {
  if (!Number.isInteger(amount) || amount <= 0) throw new WalletError('Некорректная сумма', 'BAD_AMOUNT');
  return db.tx(() => {
    db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);
    return insertTx(userId, kind, amount, title, status, meta);
  });
}

export function debit(userId, amount, kind, title, meta = null) {
  if (!Number.isInteger(amount) || amount <= 0) throw new WalletError('Некорректная сумма', 'BAD_AMOUNT');
  return db.tx(() => {
    const user = db.get('SELECT balance FROM users WHERE id = ?', [userId]);
    if (!user) throw new WalletError('Пользователь не найден', 'NO_USER');
    if (user.balance < amount) throw new WalletError('Недостаточно средств на балансе', 'INSUFFICIENT_FUNDS');
    db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);
    return insertTx(userId, kind, -amount, title, 'done', meta);
  });
}

export function listTransactions(userId, limit = 50, kind = null) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const rows = kind
    ? db.all(
        'SELECT * FROM transactions WHERE user_id = ? AND kind = ? ORDER BY created_at DESC LIMIT ?',
        [userId, kind, safeLimit],
      )
    : db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [
        userId,
        safeLimit,
      ]);
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    amount: row.amount,
    balanceAfter: row.balance_after,
    title: row.title,
    status: row.status,
    meta: row.meta ? JSON.parse(row.meta) : null,
    createdAt: row.created_at,
  }));
}

export function listPurchases(userId, limit = 50) {
  return db
    .all('SELECT * FROM purchases WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [
      userId,
      Math.min(Math.max(Number(limit) || 50, 1), 200),
    ])
    .map((row) => ({
      id: row.id,
      itemId: row.item_id,
      price: row.price,
      kind: row.kind,
      createdAt: row.created_at,
    }));
}
