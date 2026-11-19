// Приглашения через нативный интерфейс Telegram.
// Открываем системный выбор чата Telegram, а не внешний сайт.
import { tg } from './telegram.js';

const BOT = 'Fartumastiibot';

/** Прямая ссылка на Mini App с кодом стола в startapp. */
export function miniAppLink(code = '') {
  const base = `https://t.me/${BOT}`;
  const clean = String(code || '').trim().toUpperCase().slice(0, 12);
  return clean ? `${base}?startapp=${encodeURIComponent(clean)}` : `${base}?startapp=play`;
}

/** Текст приглашения — только по-русски. */
export function inviteText({ code = '', username = '' } = {}) {
  const who = username ? `${username} зовёт тебя` : 'Заходи';
  const table = code ? ` Стол ${code} уже открыт.` : '';
  return `${who} в FARTU MASTI — играем в «Дурака».${table} ${miniAppLink(code)}`;
}

/**
 * Открывает нативное окно «Поделиться» Telegram.
 * Возвращает способ, которым приглашение было отправлено:
 * telegram | native | clipboard | link | cancel.
 */
export async function shareInvite({ code = '', username = '' } = {}) {
  const link = miniAppLink(code);
  const text = inviteText({ code, username });
  const app = tg();

  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  if (app?.openTelegramLink) {
    try {
      app.openTelegramLink(telegramShare);
      return 'telegram';
    } catch {
      /* переходим к резервному способу */
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'FARTU MASTI', text, url: link });
      return 'native';
    } catch (error) {
      if (error && error.name === 'AbortError') return 'cancel';
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'clipboard';
  } catch {
    window.open(telegramShare, '_blank', 'noopener');
    return 'link';
  }
}

export default shareInvite;
