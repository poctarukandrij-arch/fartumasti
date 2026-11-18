// Фильтрация текстового чата: запрет порнографии и политического контента.
// Нецензурные выражения разрешены — мат не блокируется.
const PORN_PATTERNS = [
  'порн', 'порно', 'секс', 'интим', 'эрот', 'минет', 'анал', 'оргазм',
  'вагин', 'пенис', 'голая', 'голые', 'голый', 'обнаж', 'нудист', 'хентай',
  'porn', 'porno', 'xxx', 'nude', 'nudes', 'naked', 'hentai', 'sex', 'sexy',
  'onlyfans', 'инцест', 'педофил', 'шлюх', 'проститут',
];

const POLITICS_PATTERNS = [
  'политик', 'путин', 'навальн', 'зеленск', 'байден', 'трамп', 'макрон',
  'митинг', 'протест', 'война', 'войне', 'войну', 'спецоперац', 'майдан',
  'кремл', 'госдум', 'парламент', 'президент', 'оппозиц', 'выборах', 'выборы',
  'референдум', 'санкц', 'мобилизац', 'путин', 'zа', 'патриот', 'фашист',
  'нацист', 'коммунист', 'либерал', 'пропаганд', 'политрук', 'госдеп',
  'politic', 'putin', 'navalny', 'zelensk', 'biden', 'trump', 'election',
  'protest', 'war', 'ukrain', 'russia', 'nato', 'sanction',
];

const LEET = { '0': 'о', '1': 'и', '3': 'е', '4': 'а', '5': 's', '@': 'а', '$': 's' };

function normalize(text) {
  let value = String(text).toLowerCase();
  value = value.replace(/[0@4aа3е1и5$]/g, (ch) => LEET[ch] ?? ch);
  value = value.replace(/[^a-zа-яё0-9]+/gi, '');
  // схлопываем повторы символов: "ппооорррнннооо" -> "порно"
  value = value.replace(/(.)\1{1,}/g, '$1');
  return value;
}

function matches(value, patterns) {
  return patterns.some((p) => {
    const needle = normalize(p);
    return needle.length > 1 && value.includes(needle);
  });
}

/**
 * @returns {{ok: true} | {ok: false, reason: 'porn'|'politics', message: string}}
 */
export function checkMessage(text) {
  if (typeof text !== 'string') {
    return { ok: false, reason: 'porn', message: 'Сообщение пустое' };
  }
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'porn', message: 'Сообщение пустое' };
  const chars = [...trimmed];
  if (chars.length > 30) {
    return { ok: false, reason: 'porn', message: 'Сообщение длиннее 30 символов' };
  }
  const value = normalize(trimmed);
  if (matches(value, PORN_PATTERNS)) {
    return { ok: false, reason: 'porn', message: 'Сообщение нарушает правила: запрещён контент 18+' };
  }
  if (matches(value, POLITICS_PATTERNS)) {
    return { ok: false, reason: 'politics', message: 'Сообщение нарушает правила: запрещены политические темы' };
  }
  return { ok: true };
}

export function sanitizeMessage(text) {
  // убираем управляющие символы, оставляем текст и эмодзи
  return [...String(text)]
    .filter((ch) => {
      const code = ch.codePointAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim();
}
