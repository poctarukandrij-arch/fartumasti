// Telegram-бот FARTU MASTI: /start с кнопкой запуска Mini App, проверка пользователя,
// настройка меню команд. Токен берётся только из переменных окружения.
const API = 'https://api.telegram.org';

export function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

export function publicAppUrl() {
  return (process.env.PUBLIC_APP_URL || '').replace(/\/+$/, '');
}

export function botStatus() {
  const token = botToken();
  const url = publicAppUrl();
  return {
    configured: Boolean(token),
    webAppUrl: url || null,
    webAppReady: Boolean(url && url.startsWith('https://')),
  };
}

async function call(token, method, payload) {
  const response = await fetch(`${API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const data = await response.json().catch(() => null);
  if (!data?.ok) {
    const description = data?.description || `HTTP ${response.status}`;
    throw new Error(`Telegram API ${method}: ${description}`);
  }
  return data.result;
}

function startKeyboard() {
  const url = publicAppUrl();
  if (!url) return undefined;
  return {
    inline_keyboard: [[{ text: 'Открыть FARTU MASTI', web_app: { url } }]],
  };
}

export function startText(firstName) {
  const name = firstName ? `, ${firstName}` : '';
  return [
    `Привет${name}.`,
    '',
    'FARTU MASTI — подкидной дурак внутри Telegram.',
    'Играй с живыми соперниками, собирай скины колод и оформление стола.',
    '',
    'Нажми кнопку ниже, чтобы открыть приложение.',
  ].join('\n');
}

export async function sendStart(chatId, firstName) {
  const token = botToken();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');
  return call(token, 'sendMessage', {
    chat_id: chatId,
    text: startText(firstName),
    reply_markup: startKeyboard(),
    disable_web_page_preview: true,
  });
}

export async function setupBot() {
  const token = botToken();
  if (!token) return { ok: false, reason: 'TELEGRAM_BOT_TOKEN не задан' };
  const result = { ok: true, webAppUrl: publicAppUrl() || null, commands: false, menuButton: false };
  try {
    await call(token, 'setMyCommands', {
      commands: [
        { command: 'start', description: 'Запустить FARTU MASTI' },
        { command: 'app', description: 'Открыть игру' },
        { command: 'help', description: 'Как играть' },
      ],
    });
    result.commands = true;
  } catch (error) {
    result.commandsError = error.message;
  }
  const url = publicAppUrl();
  if (url && url.startsWith('https://')) {
    try {
      await call(token, 'setChatMenuButton', {
        menu_button: { type: 'web_app', text: 'Играть', web_app: { url } },
      });
      result.menuButton = true;
    } catch (error) {
      result.menuButtonError = error.message;
    }
  }
  return result;
}

export async function handleUpdate(update, { logger = console } = {}) {
  const message = update?.message;
  if (!message) return;
  const chatId = message.chat?.id;
  const text = String(message.text || '');
  const firstName = message.from?.first_name || '';
  if (!chatId) return;
  try {
    if (text.startsWith('/start')) {
      await sendStart(chatId, firstName);
      return;
    }
    if (text.startsWith('/app')) {
      const url = publicAppUrl();
      await call(botToken(), 'sendMessage', {
        chat_id: chatId,
        text: url ? 'Открывай FARTU MASTI.' : 'Приложение ещё не опубликовано: добавьте PUBLIC_APP_URL.',
        reply_markup: startKeyboard(),
      });
      return;
    }
    if (text.startsWith('/help')) {
      await call(botToken(), 'sendMessage', {
        chat_id: chatId,
        text: [
          'Правила простые: подкидной дурак на 2–4 игрока.',
          '• Отбивай карты старшей картой той же масти или козырем.',
          '• Не отбился — забирай карты со стола.',
          '• Первым вышел из партии — победил, последний остаётся в дураках.',
          '',
          'Внутри стола есть чат, эмодзи и голосовая связь.',
        ].join('\n'),
      });
    }
  } catch (error) {
    logger.error?.('[bot] update failed', error.message);
  }
}

export function startPolling({ logger = console } = {}) {
  const token = botToken();
  if (!token) {
    logger.log?.('[bot] TELEGRAM_BOT_TOKEN не задан — бот выключен');
    return { stop() {} };
  }
  let offset = 0;
  let stopped = false;
  let timer = null;

  async function loop() {
    if (stopped) return;
    try {
      const updates = await call(token, 'getUpdates', { offset, timeout: 25, allowed_updates: ['message'] });
      for (const update of updates || []) {
        offset = update.update_id + 1;
        handleUpdate(update, { logger }).catch((error) => logger.error?.('[bot] handler', error.message));
      }
    } catch (error) {
      logger.error?.('[bot] polling', error.message);
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    if (!stopped) timer = setTimeout(loop, 250);
  }

  loop();
  logger.log?.('[bot] long polling started');

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

export async function setWebhook(url, secretToken) {
  const token = botToken();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');
  return call(token, 'setWebhook', {
    url,
    secret_token: secretToken || undefined,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  });
}

export async function deleteWebhook() {
  const token = botToken();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');
  return call(token, 'deleteWebhook', { drop_pending_updates: false });
}
