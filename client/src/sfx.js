/**
 * Звук прокрутки кейса на WebAudio: без внешних файлов и сетевых запросов.
 * Тики замедляются вместе с рулеткой, в конце — короткий победный аккорд.
 * Всё создаётся по клику пользователя, поэтому автозапуск не блокируется.
 */
function audioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    return new Ctx();
  } catch {
    return null;
  }
}

function blip(ctx, at, freq, gainValue, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(gainValue, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

/**
 * Запускает тики на время прокрутки. Возвращает функцию остановки.
 * @param {number} durationMs длительность рулетки
 * @param {number} totalTicks сколько тиков успеть
 */
export function playCaseSpin(durationMs = 6400, totalTicks = 46) {
  const ctx = audioContext();
  if (!ctx) return () => {};

  const start = ctx.currentTime + 0.02;
  const seconds = Math.max(1, durationMs / 1000);

  // Интервалы растягиваются к концу — рулетка визуально и звуково замедляется.
  const weights = Array.from({ length: totalTicks }, (_, index) => 1 + (index / totalTicks) * 2.6);
  const sum = weights.reduce((acc, value) => acc + value, 0);
  let cursor = start;
  weights.forEach((weight, index) => {
    const progress = index / totalTicks;
    blip(ctx, cursor, 880 - progress * 300, 0.055 + progress * 0.02, 0.05);
    cursor += (weight / sum) * seconds;
  });

  // Низкий гул под тиками.
  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = 'sine';
  drone.frequency.setValueAtTime(110, start);
  drone.frequency.linearRampToValueAtTime(160, start + seconds);
  droneGain.gain.setValueAtTime(0.0001, start);
  droneGain.gain.linearRampToValueAtTime(0.05, start + 0.4);
  droneGain.gain.linearRampToValueAtTime(0.0001, start + seconds);
  drone.connect(droneGain).connect(ctx.destination);
  drone.start(start);
  drone.stop(start + seconds + 0.1);

  return () => {
    try {
      ctx.close();
    } catch {
      /* контекст уже закрыт */
    }
  };
}

/** Победный аккорд в момент показа награды. */
export function playCaseWin() {
  const ctx = audioContext();
  if (!ctx) return () => {};
  const start = ctx.currentTime + 0.02;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
    blip(ctx, start + index * 0.09, freq, 0.075, 0.5);
  });
  return () => {
    try {
      ctx.close();
    } catch {
      /* контекст уже закрыт */
    }
  };
}
