// Проверка кейса: анимация обязана показать именно ту награду, которую выдал сервер.
// Скрипт сам поднимает сервер на свободном порту с временной БД, открывает кейс
// через интерфейс и сравнивает текст на экране с телом ответа /api/shop/case.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    return require('/opt/appjet/browser/node_modules/playwright/index.js');
  }
}

const { chromium } = loadPlaywright();
const PORT = Number(process.env.CASE_CHECK_PORT || 3211);
const DB = `/tmp/case-reveal-check-${process.pid}.sqlite`;
const BASE = `http://127.0.0.1:${PORT}`;

for (const suffix of ['', '-wal', '-shm']) {
  try { fs.unlinkSync(`${DB}${suffix}`); } catch { /* файла ещё нет */ }
}

const server = spawn(process.execPath, ['server/index.js'], {
  env: { ...process.env, DEV_LOGIN: '1', DB_PATH: DB, PORT: String(PORT) },
  stdio: 'ignore',
});

let browser;
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};

try {
  let ready = false;
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) { ready = true; break; }
    } catch { /* сервер ещё поднимается */ }
    await sleep(500);
  }
  if (!ready) throw new Error('сервер не поднялся');

  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  let serverAward = null;
  page.on('response', async (response) => {
    if (!response.url().includes('/shop/case') || response.request().method() !== 'POST') return;
    try {
      const body = await response.json();
      serverAward = body?.refund ? 'Дубликат' : body?.item?.name || null;
    } catch { /* тело уже прочитано */ }
  });

  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  // Панель тестового входа появляется после ожидания initData (~6 c).
  await page.waitForSelector('#dev-id', { timeout: 25000 });
  await page.fill('#dev-id', 'archi');
  await page.fill('#dev-name', 'Archi');
  await page.getByRole('button', { name: 'Войти в тестовом режиме' }).click();
  await page.waitForSelector('.bottomnav', { timeout: 20000 });

  await page.getByRole('button', { name: 'Магазин', exact: true }).click();
  await page.getByRole('tab', { name: 'Кейсы' }).click();
  const firstCase = page.locator('.v2-case-card').first();
  await firstCase.getByRole('button', { name: 'Открыть' }).click();

  // Сундук: зарядка → раскрытие → показ награды.
  await page.waitForSelector('.v2-opener__reward-name', { timeout: 20000 });
  const shown = (await page.locator('.v2-opener__reward-name').first().innerText()).trim();

  if (!shown) fail('на экране нет названия награды');
  if (!serverAward) fail('не удалось прочитать награду из ответа сервера');
  else if (shown !== serverAward) fail(`на экране «${shown}», сервер выдал «${serverAward}»`);
  if (pageErrors.length) fail(`ошибки страницы: ${pageErrors.join(' | ')}`);
  if (consoleErrors.length) console.warn(`консоль: ${consoleErrors.slice(0, 3).join(' | ')}`);

  if (!process.exitCode) {
    await page.getByRole('button', { name: 'Забрать' }).click();
    await page.waitForSelector('.v2-case-card', { timeout: 10000 });
    console.log(`PASS: награда «${shown}» совпадает с ответом сервера, оверлей закрывается кнопкой «Забрать»`);
  }
} catch (error) {
  fail(error.message);
  if (browser) {
    const pages = browser.contexts().flatMap((ctx) => ctx.pages());
    for (const p of pages) {
      try {
        const text = (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400);
        console.error(`ЭКРАН: ${text}`);
      } catch { /* страница уже закрыта */ }
    }
  }
} finally {
  await browser?.close().catch(() => {});
  server.kill();
}
