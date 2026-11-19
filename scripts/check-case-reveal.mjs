// Проверка кейса: анимация обязана показать именно ту награду, которую выдал сервер.
// Скрипт сам поднимает сервер на временной БД, готовит аккаунт через API,
// открывает кейс в интерфейсе и сравнивает текст на экране с ответом /api/shop/case.
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

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${path} → ${res.status} ${data?.message || data?.error || ''}`);
  return data;
}

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

  // Аккаунт готовим заранее: при первом входе сервер требует задать имя.
  const auth = await api('/api/auth/telegram', {
    method: 'POST',
    body: { devUserId: 'archi', devName: 'Archi', token: '' },
  });
  const token = auth.token;
  if (!token) throw new Error('сервер не выдал токен входа');
  if (auth.user?.needsUsername) {
    await api('/api/auth/name', { method: 'POST', body: { name: 'Archi' }, token });
  }

  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript((value) => {
    try { localStorage.setItem('fartu_token', value); } catch { /* приватный режим */ }
  }, token);
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

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.topbar', { timeout: 30000 });

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

  if (!process.exitCode) {
    await page.getByRole('button', { name: 'Забрать' }).click();
    await page.waitForSelector('.v2-case-card', { timeout: 10000 });
    console.log(`PASS: награда «${shown}» совпадает с ответом сервера, оверлей закрывается кнопкой «Забрать»`);
  }
} catch (error) {
  fail(error.message);
  if (browser) {
    for (const page of browser.contexts().flatMap((ctx) => ctx.pages())) {
      try {
        const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400);
        console.error(`ЭКРАН: ${text}`);
      } catch { /* страница уже закрыта */ }
    }
  }
} finally {
  await browser?.close().catch(() => {});
  server.kill();
}
