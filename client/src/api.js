const TOKEN_KEY = 'fartu_token';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'error';
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* приватный режим */
  }
}

export async function api(path, options = {}) {
  const { method = 'GET', body, token = getToken(), signal } = options;
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError('Нет связи с сервером', 0, 'network');
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Некорректный ответ сервера' };
    }
  }

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/telegram') setToken('');
    throw new ApiError(data.error || 'Ошибка запроса', res.status, data.code);
  }
  return data;
}
