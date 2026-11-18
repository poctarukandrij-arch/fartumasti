import test from 'node:test';
import assert from 'node:assert/strict';
import { checkMessage, sanitizeMessage } from '../server/filter.js';

test('обычное сообщение проходит', () => {
  assert.equal(checkMessage('привет, как дела').ok, true);
});

test('нецензурная лексика разрешена', () => {
  assert.equal(checkMessage('блин, опять проиграл').ok, true);
});

test('порнографический контент запрещён', () => {
  const result = checkMessage('смотри порно');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'porn');
});

test('политический контент запрещён', () => {
  const result = checkMessage('обсуждаем выборы');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'politics');
});

test('обход через цифры и повторы не работает', () => {
  assert.equal(checkMessage('п0рн0').ok, false);
  assert.equal(checkMessage('пппоооррннноо').ok, false);
});

test('сообщение длиннее 30 символов отклоняется', () => {
  const long = 'а'.repeat(31);
  assert.equal(checkMessage(long).ok, false);
  assert.equal(checkMessage('а'.repeat(30)).ok, true);
});

test('пустое сообщение отклоняется', () => {
  assert.equal(checkMessage('   ').ok, false);
});

test('sanitize убирает управляющие символы', () => {
  assert.equal(sanitizeMessage('привет\u0000\u0007'), 'привет');
});
