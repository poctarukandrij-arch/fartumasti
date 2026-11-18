// Обёртка над Telegram WebApp: инициализация, haptic-отклик, данные пользователя.
let readyCalled = false;

export function tg() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp || null : null;
}

export function initTelegram() {
  const app = tg();
  if (!app) return false;
  if (readyCalled) return true;
  readyCalled = true;
  try {
    app.ready();
    app.expand();
    app.disableVerticalSwipes?.();
    app.setHeaderColor?.('#0a0b0d');
    app.setBackgroundColor?.('#0a0b0d');
    app.setBottomBarColor?.('#0a0b0d');
    app.enableClosingConfirmation?.();
  } catch {
    /* старые версии клиента */
  }
  return true;
}

/**
 * Telegram кладёт подписанный initData в URL-хэш (tgWebAppData) ещё до загрузки SDK.
 * Читать его безопасно: подлинность всё равно проверяет сервер по HMAC-подписи.
 * Это спасает iOS WebView, где внешний скрипт SDK может не загрузиться.
 */
export function initDataFromHash() {
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash || '';
  if (hash.length < 2) return '';
  let raw = '';
  try {
    raw = new URLSearchParams(hash.slice(1)).get('tgWebAppData') || '';
  } catch {
    return '';
  }
  if (!raw) return '';
  const candidates = [raw];
  try {
    candidates.push(decodeURIComponent(raw));
  } catch {
    /* значение уже декодировано */
  }
  return candidates.find((value) => value.includes('hash=')) || '';
}

export function getInitData() {
  const fromSdk = tg()?.initData || '';
  if (fromSdk) return fromSdk;
  return initDataFromHash();
}

/** Ждёт появления initData: на iOS SDK инициализируется позже, чем стартует React. */
export async function waitForInitData({ timeoutMs = 6000, intervalMs = 150 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    initTelegram();
    const value = getInitData();
    if (value) return value;
    if (Date.now() >= deadline) return '';
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export function telegramUser() {
  return tg()?.initDataUnsafe?.user || null;
}

export function haptic(type = 'light') {
  const app = tg();
  if (!app?.HapticFeedback) return;
  try {
    if (type === 'success' || type === 'error' || type === 'warning') {
      app.HapticFeedback.notificationOccurred(type);
    } else {
      app.HapticFeedback.impactOccurred(type);
    }
  } catch {
    /* без вибрации */
  }
}

export function openLink(url) {
  const app = tg();
  if (app?.openLink) app.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

export function closeApp() {
  const app = tg();
  if (app?.close) app.close();
}
