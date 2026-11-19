import test from 'node:test';
import assert from 'node:assert/strict';
import { getCase, shopCatalog } from '../server/shop.js';

const catalog = shopCatalog();
const itemById = (id) => catalog.items.find((item) => item.id === id);

test('в каталоге ровно один кейс банковских карт — «Банковские карты»', () => {
  const bankCases = catalog.cases.filter((box) => box.pool.some((id) => id.startsWith('bank_')));
  assert.equal(bankCases.length, 1, 'должен остаться один кейс банковских карт');
  assert.equal(bankCases[0].id, 'case_bankcards');
  assert.equal(bankCases[0].name, 'Банковские карты');
  // Старый пустой дубль удалён из каталога.
  assert.equal(getCase('case_bank'), null);
});

test('«Банковские карты»: десять карт в трёх уровнях редкости', () => {
  const box = getCase('case_bankcards');
  assert.equal(box.pool.length, 10);

  const byRarity = { legendary: [], rare: [], common: [] };
  for (const id of box.pool) {
    const item = itemById(id);
    assert.ok(item, `предмет ${id} должен существовать`);
    byRarity[item.rarity].push(item.name);
  }

  assert.equal(byRarity.legendary.length, 3);
  assert.equal(byRarity.rare.length, 4);
  assert.equal(byRarity.common.length, 3);

  for (const name of ['Сбер', 'Т-Банк', 'Альфа-Банк']) {
    assert.ok(byRarity.legendary.includes(name), `в редчайших должен быть ${name}`);
  }
});

test('шансы кейса рассчитаны сервером и покрывают весь пул', () => {
  const box = getCase('case_bankcards');
  const entry = catalog.cases.find((item) => item.id === 'case_bankcards');
  assert.equal(entry.dropRates.length, box.pool.length);
  const total = entry.dropRates.reduce((sum, row) => sum + row.rate, 0);
  assert.ok(Math.abs(total - 100) < 1.5, `сумма шансов близка к 100%, получено ${total}`);
});
