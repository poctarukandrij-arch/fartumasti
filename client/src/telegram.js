// Обёртка над Telegram WebApp: инициализация, haptic-отклик, данные пользователя.
export function tg() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp || null : null;
}

export function initTelegram() {
  const app = tg();
  if (!app) return;
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
}

export function getInitData() {
  return tg()?.initData || '';
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
