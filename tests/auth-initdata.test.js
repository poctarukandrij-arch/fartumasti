import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { verifyInitData } from '../server/auth.js';

const TOKEN = '7000000001:TEST-TOKEN-FOR-UNIT-TESTS';

function sign({ user = { id: 42, first_name: 'Test' }, authDate = Math.floor(Date.now() / 1000), token = TOKEN, includeSignatureInCheck = false } = {}) {
  const params = new URLSearchParams({
    query_id: 'AAHtest',
    user: JSON.stringify(user),
    auth_date: String(authDate),
  });
  params.set('signature', 'a'.repeat(86));
  const checkString = [...params.entries()]
    .filter(([key]) => (includeSignatureInCheck ? key !== 'hash' : key !== 'signature'))
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  params.set('hash', crypto.createHmac('sha256', secret).update(checkString).digest('hex'));
  return params.toString();
}

test('корректная подпись принимается', () => {
  const result = verifyInitData(sign(), TOKEN);
  assert.equal(result.ok, true);
  assert.equal(result.telegramId, '42');
});

test('вариант с signature в data-check-string тоже принимается', () => {
  const result = verifyInitData(sign({ includeSignatureInCheck: true }), TOKEN);
  assert.equal(result.ok, true);
});

test('подмена пользователя отклоняется', () => {
  const initData = sign();
  const tampered = initData.replace(encodeURIComponent('"id":42'), encodeURIComponent('"id":43'));
  const result = verifyInitData(tampered, TOKEN);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'AUTH_BAD_SIGNATURE');
});

test('чужой токен отклоняется', () => {
  const result = verifyInitData(sign({ token: '123:OTHER' }), TOKEN);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'AUTH_BAD_SIGNATURE');
});

test('устаревший auth_date отклоняется', () => {
  const result = verifyInitData(sign({ authDate: Math.floor(Date.now() / 1000) - 3 * 86400 }), TOKEN);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'AUTH_EXPIRED');
});

test('пустой initData даёт отдельный код', () => {
  assert.equal(verifyInitData('', TOKEN).code, 'AUTH_NO_DATA');
  assert.equal(verifyInitData('   ', TOKEN).code, 'AUTH_NO_DATA');
});

test('отсутствующий токен бота даёт отдельный код', () => {
  assert.equal(verifyInitData(sign(), '').code, 'AUTH_NOT_CONFIGURED');
});

test('initData без hash отклоняется', () => {
  const result = verifyInitData('query_id=AAHtest&auth_date=1&user=%7B%22id%22%3A1%7D', TOKEN);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'AUTH_NO_SIGNATURE');
});

test('initData без пользователя отклоняется', () => {
  const result = verifyInitData(sign({ user: { first_name: 'NoId' } }), TOKEN);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'AUTH_NO_USER');
});
