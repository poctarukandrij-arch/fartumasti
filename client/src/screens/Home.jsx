import { useMemo, useState } from 'react';
import { rub } from '../utils.js';
import { shareInvite } from '../share.js';

// Пресеты входного взноса в копейках: без взноса, 100 ₽, 500 ₽, 1 000 ₽, 5 000 ₽.
const BUYINS = [
  { value: 0, label: 'Без взноса' },
  { value: 10000, label: '100 ₽' },
  { value: 50000, label: '500 ₽' },
  { value: 100000, label: '1 000 ₽' },
  { value: 500000, label: '5 000 ₽' },
];

const MODES = [
  { id: 'podkidnoy', label: 'Подкидной' },
  { id: 'perevodnoy', label: 'Переводной' },
];

const DECKS = [
  { value: 36, label: '36 карт' },
  { value: 52, label: '52 карты' },
];

function playersOf(room) {
  if (Array.isArray(room?.players)) return room.players.length;
  return Number(room?.players) || 0;
}

function modeLabel(mode) {
  return mode === 'perevodnoy' ? 'Переводной' : 'Подкидной';
}

export function Home({ me, lobby, send, toast, inQueue, onBalance }) {
  const [sheet, setSheet] = useState(null); // 'create' | 'join' | null
  const [players, setPlayers] = useState(2);
  const [mode, setMode] = useState('podkidnoy');
  const [buyn, setBuyn] = useState(0);
  const [deckSize, setDeckSize] = useState(36);
  const [code, setCode] = useState('');

  const rooms = lobby?.rooms || [];
  const online = Number(lobby?.online) || 0;
  const username = me?.username || '';
  const unlimited = Boolean(me?.unlimited);

  const summary = useMemo(() => {
    const stake = buyn > 0 ? rub(buyn) : 'без взноса';
    return `${players} игрока · ${modeLabel(mode)} · ${deckSize} карт · ${stake}`;
  }, [players, mode, buyn, deckSize]);

  function play() {
    if (inQueue) {
      send({ type: 'queue:leave' });
      toast?.('Поиск соперников отменён');
      return;
    }
    send({ type: 'queue:join' });
  }

  function createTable() {
    send({ type: 'room:create', maxPlayers: players, mode, buyn, deckSize });
    setSheet(null);
    toast?.('Стол создаётся…');
  }

  function joinByCode() {
    const value = code.trim().toUpperCase();
    if (value.length < 3) {
      toast?.('Введи код стола');
      return;
    }
    send({ type: 'room:join', roomId: value, code: value });
    setSheet(null);
    setCode('');
  }

  async function invite() {
    const result = await shareInvite({ username });
    if (result === 'clipboard') toast?.('Приглашение скопировано — открой Telegram');
    if (result === 'cancel') toast?.('Отправка отменена');
  }

  return (
    <div className="screen v2">
      <section className="v2-hero">
        <img className="v2-hero__art" src="/art/hero_cards.png" alt="" aria-hidden="true" />
        <span className="v2-hero__rays" aria-hidden="true" />
        <span className="v2-live">
          <span className="v2-live__dot" aria-hidden="true" />
          {online} онлайн
        </span>
        <h1 className="v2-hero__title">Играй в «Дурака»</h1>
        <p className="v2-hero__sub">
          Живые соперники, честные раздачи и стры с реальными игроками.
        </p>
      </section>

      <button
        type="button"
        className={`v2-cta ${inQueue ? 'v2-cta--waitting' : ''}`}
        onClick={play}
      >
        <img className="v2-cta__art" src="/art/bolt.png" alt="" aria-hidden="true" />
        <span className="v2-cta__body">
          <span className="v2-cta__label">{inQueue ? 'Поиск соперника…' : 'Играть'}</span>
          <span className="v2-cta__hint">
            {inQueue ? 'Нажми, чтобы отменить' : 'Быстрый поиск соперника'}
          </span>
        </span>
        <span className="v2-cta__arrow" aria-hidden="true">{inQueue ? '✕' : '›'}</span>
      </button>

      <div className="v2-grid2">
        <button type="button" className="v2-tile" onClick={() => setSheet('create')}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <img className="v2-tile__art" src="/art/cards_fan.png" alt="" aria-hidden="true" />
          <span className="v2-tile__title">Создать стол</span>
          <span className="v2-tile__sub">Взнос, колода и режим</span>
        </button>

        <button type="button" className="v2-tile v2-tile--cyan" onClick={() => setSheet('join')}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <img className="v2-tile__art" src="/art/spade.png" alt="" aria-hidden="true" />
          <span className="v2-tile__title">Присоедниться</span>
          <span className="v2-tile__sub">По коду стола</span>
        </button>
      </div>

      <button type="button" className="v2-tile v2-tile--pink" onClick={invite}>
        <span className="v2-tile__glow" aria-hidden="true" />
        <img className="v2-tile__art" src="/art/gift.png" alt="" aria-hidden="true" />
        <span className="v2-tile__title">Пригласить друга</span>
        <span className="v2-tile__sub">Открыть чаты Telegram и отправить ссылку</span>
      </button>

      <section className="v2-panel">
        <div className="v2-title">
          <span>Открытые столы</span>
          <span className="v2-chip">{rooms.length}</span>
        </div>

        {rooms.length === 0 ? (
          <div className="v2-empty">
            Пока нет открутых столов. Создай свой — и пригласи друга.
          </div>
        ) : (
          <div className="v2-stack">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className="v2-row"
                onClick={() => send({ type: 'room:join', roomId: room.id })}
              >
                <img className="v2-row__art" src="/art/table.png" alt="" aria-hidden="true" />
                <span className="v2-row__body">
                  <span className="v2-row__name">{room.name || `Стол ${room.code || ''}`}</span>
                  <span className="v2-row__meta">
                    {playersOf(room)}/{room.maxPlayers || 2} · {modeLabel(room.mode)} · {room.deckSize || 36} карт
                  </span>
                </span>
                <span className="v2-row__side">
                  <span className="v2-chip v2-chip--mint">
                    {room.buyn > 0 ? rub(room.buyn) : 'бесплатно'}
                  </span>
                  <span className="v2-chip">код {room.code || '—'}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {sheet === 'create' ? (
        <div className="v2-sheet" role="dialog" aria-modal="true" aria-label="Настройки стола">
          <div className="v2-sheet__panel">
            <span className="v2-sheet__grab" aria-hidden="true" />
            <div className="v2-sheet__head">
              <span className="v2-sheet__title">Новый стол</span>
              <button type="button" className="v2-link" onClick={() => setSheet(null)}>Закрыть</button>
            </div>

            <div className="v2-field">
              <span className="v2-field__label">Игроки</span>
              <div className="v2-seg">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`v2-seg__btn ${players === count ? 'is-on' : ''}`}
                    onClick={() => setPlayers(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="v2-field">
              <span className="v2-field__label">Режим</span>
              <div className="v2-seg">
                {MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`v2-seg__btn ${mode === item.id ? 'is-on' : ''}`}
                    onClick={() => setMode(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="v2-field">
              <span className="v2-field__label">Колода</span>
              <div className="v2-seg">
                {DECKS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`v2-seg__btn ${deckSize === item.value ? 'is-on' : ''}`}
                    onClick={() => setDeckSize(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="v2-field">
              <span className="v2-field__label">Входной взнос</span>
              <div className="v2-amounts">
                {BUYINS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`v2-amount ${buyn === item.value ? 'is-on' : ''}`}
                    onClick={() => setBuyn(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="v2-summary">
              <span className="v2-chip">{summary}</span>
              {buyn > 0 ? <span className="v2-chip v2-chip--mint">Банк идёт победителю</span> : null}
              {unlimited ? <span className="v2-chip v2-chip--mint">Безлимит</span> : null}
            </div>

            <button type="button" className="v2-btn v2-btn--primary" onClick={createTable}>
              Создать стол
            </button>
          </div>
        </div>
      ) : null}

      {sheet === 'join' ? (
        <div className="v2-sheet" role="dialog" aria-modal="true" aria-label="Вход по коду">
          <div className="v2-sheet__panel">
            <span className="v2-sheet__grab" aria-hidden="true" />
            <div className="v2-sheet__head">
              <span className="v2-sheet__title">Вход по коду</span>
              <button type="button" className="v2-link" onClick={() => setSheet(null)}>Закрыть</button>
            </div>
            <div className="v2-field">
              <span className="v2-field__label">Код стола</span>
              <input
                className="v2-input"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Например A7K2"
                maxLength={8}
                autoCapitalize="characters"
              />
            </div>
            <button type="button" className="v2-btn v2-btn--primary" onClick={joinByCode}>
              Войти за стол
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Home;
