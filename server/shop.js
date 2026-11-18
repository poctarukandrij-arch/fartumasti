// Каталог магазина FARTU MASTI: скины колод, оформление столов, эмодзи, эффекты появления, кейсы.
// Все цены — в копейках. Выдача предметов только на сервере.
import crypto from 'node:crypto';
import { db } from './db.js';
import { credit, debit, WalletError } from './wallet.js';

export const NAME_CHANGE_PRICE = 4900; // 49 ₽
export const WELCOME_BONUS = 25000; // приветственный бонус 250 ₽
export const CASE_REFUND_RATE = 0.3;

export const RARITIES = {
  common: { label: 'Обычный', color: '#8b93a1', order: 0 },
  rare: { label: 'Редкий', color: '#4f8cff', order: 1 },
  epic: { label: 'Эпический', color: '#a855f7', order: 2 },
  legendary: { label: 'Легендарный', color: '#ff4d6d', order: 3 },
};

const DEFAULTS = {
  deck: 'deck_graphite',
  table: 'table_graphite',
  emoji: 'emoji_none',
  effect: 'effect_none',
};

export const ITEMS = [
  // --- Скины колод ---
  { id: 'deck_graphite', type: 'deck', name: 'Графит', rarity: 'common', price: 0, desc: 'Базовая колода: тёмный графит и холодная сталь.', visual: { back: '#22262e', edge: '#3a4150', accent: '#8b93a1' } },
  { id: 'deck_steel', type: 'deck', name: 'Сталь', rarity: 'rare', price: 4900, desc: 'Матовая сталь с тонкой гравировкой.', visual: { back: '#1b2028', edge: '#5c6a80', accent: '#9fb0c8' } },
  { id: 'deck_neon', type: 'deck', name: 'Неон', rarity: 'rare', price: 4900, desc: 'Электрический контур по рубашке карт.', visual: { back: '#101a2c', edge: '#2f6df6', accent: '#4f8cff' } },
  { id: 'deck_ice', type: 'deck', name: 'Лёд', rarity: 'rare', price: 5900, desc: 'Прозрачный лёд с морозным свечением.', visual: { back: '#16232e', edge: '#4fb3d9', accent: '#7fd8f2' } },
  { id: 'deck_crimson', type: 'deck', name: 'Багровый', rarity: 'epic', price: 9900, desc: 'Глубокий багровый оттенок с бархатной текстурой.', visual: { back: '#2a1119', edge: '#8f2740', accent: '#ff4d6d' } },
  { id: 'deck_matrix', type: 'deck', name: 'Матрица', rarity: 'epic', price: 9900, desc: 'Цифровой код, бегущий по рубашке карт.', visual: { back: '#0d1a14', edge: '#1f8a5c', accent: '#3ddc97' } },
  { id: 'deck_void', type: 'deck', name: 'Пустота', rarity: 'legendary', price: 19900, desc: 'Абсолютно чёрная колода с фиолетовым свечением.', visual: { back: '#0a0a12', edge: '#5b3fd6', accent: '#a855f7' } },
  // --- Колоды в стиле банковских карт ---
  { id: 'deck_card_steel', type: 'deck', name: 'Карта «Сталь»', rarity: 'rare', price: 6900, desc: 'Скин колоды в стиле металлической банковской карты.', visual: { back: '#20242c', edge: '#7d8798', accent: '#c3ccd9', cardStyle: true } },
  { id: 'deck_card_signal', type: 'deck', name: 'Карта «Сигнал»', rarity: 'rare', price: 6900, desc: 'Синий градиент и тонкая полоса чипа.', visual: { back: '#132033', edge: '#3f6ea8', accent: '#5b9bff', cardStyle: true } },
  { id: 'deck_card_titan', type: 'deck', name: 'Карта «Титан»', rarity: 'epic', price: 9900, desc: 'Тяжёлый титан с рельефным номером.', visual: { back: '#1a1d24', edge: '#8e96a8', accent: '#dfe6f0', cardStyle: true } },
  { id: 'deck_card_black', type: 'deck', name: 'Карта «Чёрная»', rarity: 'legendary', price: 19900, desc: 'Закрытая премиальная карта без логотипов.', visual: { back: '#07080b', edge: '#3a3f4b', accent: '#ff4d6d', cardStyle: true } },
  // --- Оформление столов ---
  { id: 'table_graphite', type: 'table', name: 'Графит', rarity: 'common', price: 0, desc: 'Базовое оформление стола: тёмный графит.', visual: { felt: ['#15171c', '#0e1013'], line: '#2a2f38' } },
  { id: 'table_emerald', type: 'table', name: 'Изумруд', rarity: 'rare', price: 4900, desc: 'Глубокий зелёный фетр с мягкой подсветкой.', visual: { felt: ['#0e2019', '#08130f'], line: '#1f7a58' } },
  { id: 'table_ocean', type: 'table', name: 'Океан', rarity: 'rare', price: 4900, desc: 'Синий фетр с холодным свечением по краю.', visual: { felt: ['#0d1a2b', '#07101c'], line: '#2f6df6' } },
  { id: 'table_aurora', type: 'table', name: 'Аврора', rarity: 'epic', price: 9900, desc: 'Переливы северного сияния под картами.', visual: { felt: ['#141a2e', '#0a0f1c'], line: '#7c5cff' } },
  { id: 'table_lava', type: 'table', name: 'Магма', rarity: 'epic', price: 9900, desc: 'Тёмный камень с раскалёнными трещинами.', visual: { felt: ['#231110', '#120807'], line: '#d2452f' } },
  { id: 'table_midnight', type: 'table', name: 'Полночь', rarity: 'legendary', price: 19900, desc: 'Полностью чёрный стол с тонкой фиолетовой линией.', visual: { felt: ['#0b0b10', '#050507'], line: '#a855f7' } },
  // --- Эмодзи возле имени ---
  { id: 'emoji_none', type: 'emoji', name: 'Без эмодзи', rarity: 'common', price: 0, desc: 'Чистое имя без значка.', visual: { symbol: '' } },
  { id: 'emoji_fire', type: 'emoji', name: 'Огонь', rarity: 'rare', price: 1900, desc: 'Пламя рядом с именем.', visual: { symbol: '🔥' } },
  { id: 'emoji_ice', type: 'emoji', name: 'Лёд', rarity: 'rare', price: 1900, desc: 'Ледяной кристалл рядом с именем.', visual: { symbol: '❄️' } },
  { id: 'emoji_skull', type: 'emoji', name: 'Череп', rarity: 'epic', price: 2900, desc: 'Череп для тех, кто не боится брать карты.', visual: { symbol: '💀' } },
  { id: 'emoji_snake', type: 'emoji', name: 'Змей', rarity: 'epic', price: 2900, desc: 'Змея — знак холодного расчёта.', visual: { symbol: '🐍' } },
  { id: 'emoji_bolt', type: 'emoji', name: 'Молния', rarity: 'epic', price: 2900, desc: 'Разряд рядом с именем.', visual: { symbol: '⚡' } },
  { id: 'emoji_rocket', type: 'emoji', name: 'Ракета', rarity: 'legendary', price: 3900, desc: 'Быстрый взлёт вверх по статистике.', visual: { symbol: '🚀' } },
  { id: 'emoji_diamond', type: 'emoji', name: 'Алмаз', rarity: 'legendary', price: 4900, desc: 'Холодный алмаз без единого золотого блика.', visual: { symbol: '💎' } },
  // --- Эффекты появления ---
  { id: 'effect_none', type: 'effect', name: 'Без эффекта', rarity: 'common', price: 0, desc: 'Спокойное появление за столом.', visual: { kind: 'none' } },
  { id: 'effect_ripple', type: 'effect', name: 'Волна', rarity: 'rare', price: 2900, desc: 'Круговая волна при появлении.', visual: { kind: 'ripple' } },
  { id: 'effect_glitch', type: 'effect', name: 'Глитч', rarity: 'rare', price: 2900, desc: 'Цифровой сбой при входе за стол.', visual: { kind: 'glitch' } },
  { id: 'effect_lightning', type: 'effect', name: 'Молния', rarity: 'epic', price: 4900, desc: 'Разряд по контуру карточки игрока.', visual: { kind: 'lightning' } },
  { id: 'effect_phoenix', type: 'effect', name: 'Феникс', rarity: 'legendary', price: 7900, desc: 'Огненный след при появлении.', visual: { kind: 'phoenix' } },
];

export const CASES = [
  {
    id: 'case_bank',
    name: 'Кейс банковской карты',
    desc: 'Колоды в стиле российских банковских карт. Без логотипов и брендов.',
    price: 14900,
    types: ['deck'],
    pool: ['deck_card_steel', 'deck_card_signal', 'deck_card_titan', 'deck_card_black', 'deck_steel', 'deck_neon', 'deck_crimson', 'deck_void'],
    odds: { common: 40, rare: 34, epic: 20, legendary: 6 },
  },
  {
    id: 'case_table',
    name: 'Кейс оформления стола',
    desc: 'Оформление игрового стола: от изумруда до магмы.',
    price: 12900,
    types: ['table'],
    pool: ['table_emerald', 'table_ocean', 'table_aurora', 'table_lava', 'table_midnight'],
    odds: { common: 35, rare: 38, epic: 21, legendary: 6 },
  },
  {
    id: 'case_emoji',
    name: 'Кейс эмодзи',
    desc: 'Эмодзи рядом с вашим именем за столом.',
    price: 9900,
    types: ['emoji'],
    pool: ['emoji_fire', 'emoji_ice', 'emoji_skull', 'emoji_snake', 'emoji_bolt', 'emoji_rocket', 'emoji_diamond'],
    odds: { common: 30, rare: 40, epic: 22, legendary: 8 },
  },
  {
    id: 'case_effect',
    name: 'Кейс эффектов появления',
    desc: 'Эффекты, с которыми вы появляетесь за столом.',
    price: 11900,
    types: ['effect'],
    pool: ['effect_ripple', 'effect_glitch', 'effect_lightning', 'effect_phoenix'],
    odds: { common: 30, rare: 38, epic: 24, legendary: 8 },
  },
];

const ITEM_MAP = new Map(ITEMS.map((item) => [item.id, item]));
const CASE_MAP = new Map(CASES.map((item) => [item.id, item]));

export function getItem(itemId) {
  return ITEM_MAP.get(itemId) || null;
}

export function getCase(caseId) {
  return CASE_MAP.get(caseId) || null;
}

export function defaultFor(type) {
  return DEFAULTS[type] || null;
}

export function isDefaultItem(item) {
  return Boolean(item) && item.price === 0 && DEFAULTS[item.type] === item.id;
}

export function shopCatalog() {
  return {
    rarities: RARITIES,
    items: ITEMS.map((item) => ({ ...item, isDefault: isDefaultItem(item) })),
    cases: CASES.map((c) => ({ ...c, odds: c.odds })),
    nameChangePrice: NAME_CHANGE_PRICE,
  };
}

export function ownedItemIds(userId) {
  const rows = db.all('SELECT item_id FROM inventory WHERE user_id = ?', [userId]);
  return new Set(rows.map((row) => row.item_id));
}

export function ownsItem(userId, itemId) {
  const item = getItem(itemId);
  if (!item) return false;
  if (isDefaultItem(item)) return true;
  return Boolean(db.get('SELECT id FROM inventory WHERE user_id = ? AND item_id = ?', [userId, itemId]));
}

function grantItem(userId, itemId, source) {
  db.run(
    'INSERT OR IGNORE INTO inventory (user_id, item_id, source, created_at) VALUES (?, ?, ?, ?)',
    [userId, itemId, source, Date.now()],
  );
}

export function buyItem(userId, itemId) {
  const item = getItem(itemId);
  if (!item) throw new WalletError('Предмет не найден', 'ITEM_NOT_FOUND');
  if (item.price <= 0) throw new WalletError('Этот предмет уже доступен', 'ITEM_FREE');
  if (ownsItem(userId, itemId)) throw new WalletError('Этот предмет уже куплен', 'ITEM_OWNED');
  return db.tx(() => {
    const result = debit(userId, item.price, 'purchase', `Покупка: ${item.name}`, { itemId });
    grantItem(userId, itemId, 'shop');
    db.run('INSERT INTO purchases (user_id, item_id, price, kind, created_at) VALUES (?, ?, ?, ?, ?)', [
      userId,
      itemId,
      item.price,
      'item',
      Date.now(),
    ]);
    return { item, balance: result.balance, txId: result.txId };
  });
}

function pickRarity(odds, rng) {
  const entries = Object.entries(odds);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return entries[entries.length - 1][0];
}

export function openCase(userId, caseId, rng = Math.random) {
  const box = getCase(caseId);
  if (!box) throw new WalletError('Кейс не найден', 'CASE_NOT_FOUND');
  const owned = ownedItemIds(userId);
  const unowned = box.pool.filter((id) => !owned.has(id));
  return db.tx(() => {
    const result = debit(userId, box.price, 'case', `Кейс: ${box.name}`, { caseId });
    db.run('INSERT INTO purchases (user_id, item_id, price, kind, created_at) VALUES (?, ?, ?, ?, ?)', [
      userId,
      caseId,
      box.price,
      'case',
      Date.now(),
    ]);

    if (unowned.length === 0) {
      const refund = Math.floor(box.price * CASE_REFUND_RATE);
      const creditResult = credit(
        userId,
        refund,
        'case_refund',
        `Возврат: все предметы кейса «${box.name}» уже собраны`,
        { caseId },
      );
      return {
        case: box,
        item: null,
        duplicate: true,
        refund,
        balance: creditResult.balance,
      };
    }

    const wantedRarity = pickRarity(box.odds, rng);
    let candidates = unowned.filter((id) => getItem(id)?.rarity === wantedRarity);
    if (candidates.length === 0) candidates = unowned;
    const chosenId = candidates[Math.floor(rng() * candidates.length) % candidates.length];
    const item = getItem(chosenId);
    grantItem(userId, chosenId, `case:${caseId}`);
    return {
      case: box,
      item,
      duplicate: false,
      refund: 0,
      balance: result.balance,
    };
  });
}

export function equipItem(userId, itemId) {
  const item = getItem(itemId);
  if (!item) throw new WalletError('Предмет не найден', 'ITEM_NOT_FOUND');
  if (!ownsItem(userId, itemId)) throw new WalletError('Предмет не куплен', 'ITEM_NOT_OWNED');
  const column = {
    deck: 'equipped_deck',
    table: 'equipped_table',
    emoji: 'equipped_emoji',
    effect: 'equipped_effect',
  }[item.type];
  if (!column) throw new WalletError('Неизвестный тип предмета', 'BAD_ITEM_TYPE');
  db.run(`UPDATE users SET ${column} = ? WHERE id = ?`, [itemId, userId]);
  return item;
}

export function inventoryWithItems(userId) {
  const owned = ownedItemIds(userId);
  for (const id of Object.values(DEFAULTS)) owned.add(id);
  return ITEMS.filter((item) => owned.has(item.id)).map((item) => ({ ...item, isDefault: isDefaultItem(item) }));
}

export function equippedOf(user) {
  return {
    deck: user.equipped_deck || DEFAULTS.deck,
    table: user.equipped_table || DEFAULTS.table,
    emoji: user.equipped_emoji || DEFAULTS.emoji,
    effect: user.equipped_effect || DEFAULTS.effect,
  };
}

export function rollCaseForPreview(caseId, rng = crypto.randomInt(1e9) / 1e9) {
  const box = getCase(caseId);
  if (!box) return null;
  const rarity = pickRarity(box.odds, () => rng);
  const candidates = box.pool.filter((id) => getItem(id)?.rarity === rarity);
  return (candidates[0] && getItem(candidates[0])) || null;
}
