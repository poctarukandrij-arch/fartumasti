import { useMemo, useState } from 'react';
import { rub } from '../utils.js';
import { shareInvite } from '../share.js';
import { Sheet } from '../components/Sheet.jsx';
import { BoltArt, CardsArt, TableArt, GiftArt, CrystalArt, StarArt } from '../components/Art.jsx';
import { EmblemArt } from '../components/Emblem.jsx';

const MODES = [
  { id: 'podkidnoy', label: 'Подкидной' },
  { id: 'perevodnoy', label: 'Переводной' },
];

// Только три стандартные колоды серверного движка. Подписи — без лишнего текста.
const DECKS = [24, 36, 52];

// Входной взнос задаётся вручную: минимум 200 ₽, «без взноса» больше нет.
const MIN_BUYN = 200;
const MAX_BUYN = 500000;

function deckLabel(size) {
  if (size === 24) return '24 карты';
  if (size === 52) return '52 карты';
  return '36 карт';
}

function playersOf(room) {
  if (Array.isArray(room?.players)) return room.players.length;
  return Number(room?.players) || 0;
}

function modeLabel(mode) {
  return mode === 'perevodnoy' ? 'Переводной' : 'Подкидной';
}

export function Home({ me, lobby, send, toast, inQueue, onRules, onInventory, onSupport }) {
  const [sheet, setSheet] = useState(null); // 'create' | 'join' | null
  const [players, setPlayers] = useState(2);
  const [mode, setMode] = useState('podkidnoy');
  const [buyin, setBuyin] = useState('500');
  const [deckSize, setDeckSize] = useState(36);
  const [code, setCode] = useState('');

  const rooms = lobby?.rooms || [];
  const online = Number(lobby?.online) || 0;
  const username = me?.username || '';
  const unlimited = Boolean(me?.unlimited);

  const buyinValue = useMemo(() => Number(String(buyin).replace(/[^\d]/g, '')) || 0, [buyin]);
  const buyinValid = buyinValue >= MIN_BUYN && buyinValue <= MAX_BUYN;

  const summary = `${players} игрока · ${modeLabel(mode)} · ${deckLabel(deckSize)} · ${rub(buyinValue * 100)}`;

  function play() {
    if (inQueue) {
      send({ type: 'queue:leave' });
      toast?.('Поиск соперников отменён');
      return;
    }
    send({ type: 'queue:join' });
  }

  function createTable() {
    if (!buyinValid) {
      toast?.(`Взнос должен быть от ${MIN_BUYN} до ${MAX_BUYN.toLocaleString('ru-RU')} ₽`, 'error');
      return;
    }
    send({ type: 'room:create', maxPlayers: players, mode, buyn: buyinValue * 100, deckSize });
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
    <div className="v2 v3-home">
      <section className="v2-hero v3-hero">
        <span className="v2-hero__rays" aria-hidden="true" />
        <span className="fm-emblem__glow" aria-hidden="true" />
        <span className="fm-emblem" aria-hidden="true">
          <EmblemArt size={126} />
        </span>
        <span className="v2-live">
          <span className="v2-live__dot" aria-hidden="true" />
          {online} онлайн
        </span>
        <h1 className="v2-hero__title v3-hero__title">Играй в «Дурака»</h1>
        <p className="v2-hero__sub v3-hero__sub">Живые соперники и честные раздачи.</p>
      </section>

      <button type="button" className={`v2-cta ${inQueue ? 'v2-cta--waiting' : ''}`} onClick={play}>
        <span className="v2-cta__art v3-icon" aria-hidden="true">
          <BoltArt size={50} />
        </span>
        <span className="v2-cta__body">
          <span className="v2-cta__label">{inQueue ? 'Поиск соперника…' : 'Играть'}</span>
          <span className="v2-cta__hint">{inQueue ? 'Нажми, чтобы отменить' : 'Быстрый поиск соперника'}</span>
        </span>
        <span className="v2-cta__arrow" aria-hidden="true">{inQueue ? '✕' : '›'}</span>
      </button>

      <div className="v2-grid2">
        <button type="button" className="v2-tile" onClick={() => setSheet('create')}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <span className="v2-tile__art v3-icon" aria-hidden="true">
            <CardsArt size={56} />
          </span>
          <span className="v2-tile__title">Создать стол</span>
          <span className="v2-tile__sub">Взнос, колода и режим</span>
        </button>

        <button type="button" className="v2-tile v2-tile--cyan" onClick={() => setSheet('join')}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <span className="v2-tile__art v3-icon" aria-hidden="true">
            <TableArt itemId="table_ocean" size={56} />
          </span>
          <span className="v2-tile__title">Присоединиться</span>
          <span className="v2-tile__sub">По коду стола</span>
        </button>
      </div>

      <button type="button" className="v2-tile v2-tile--pink" onClick={invite}>
        <span className="v2-tile__glow" aria-hidden="true" />
        <span className="v2-tile__art v3-icon" aria-hidden="true">
          <GiftArt size={54} />
        </span>
        <span className="v2-tile__title">Пригласить друга</span>
        <span className="v2-tile__sub">Открыть чаты Telegram и отправить ссылку</span>
      </button>

      <div className="v2-grid2">
        <button type="button" className="v2-tile v2-tile--violet" onClick={onRules}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <span className="v2-tile__art v3-icon" aria-hidden="true">
            <CrystalArt size={50} tone="violet" />
          </span>
          <span className="v2-tile__title">Правила игры</span>
          <span className="v2-tile__sub">Как бить и подкидывать</span>
        </button>

        <button type="button" className="v2-tile v2-tile--mint" onClick={onInventory}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <span className="v2-tile__art v3-icon" aria-hidden="true">
            <StarArt size={50} />
          </span>
          <span className="v2-tile__title">Инвентарь</span>
          <span className="v2-tile__sub">Колоды, столы, эмодзи</span>
        </button>
      </div>

      <section className="v2-panel">
        <div className="v2-title">
          <span>Открытые столы</span>
          <span className="v2-chip">{rooms.length}</span>
        </div>

        {rooms.length === 0 ? (
          <div className="v2-empty">Пока нет открытых столов. Создай свой — и пригласи друга.</div>
        ) : (
          <div className="v2-stack">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className="v2-row"
                onClick={() => send({ type: 'room:join', roomId: room.id })}
              >
                <span className="v2-row__art v3-icon" aria-hidden="true">
                  <TableArt itemId={room.equippedTable || 'table_graphite'} size={38} />
                </span>
                <span className="v2-row__body">
                  <span className="v2-row__name">{room.name || `Стол ${room.code || ''}`}</span>
                  <span className="v2-row__meta">
                    {playersOf(room)}/{room.maxPlayers || 2} · {modeLabel(room.mode)} ·{' '}
                    {deckLabel(Number(room.deckSize) || 36)}
                  </span>
                </span>
                <span className="v2-row__side">
                  <span className="v2-chip v2-chip--mint">{room.buyn > 0 ? rub(room.buyn) : 'бесплатно'}</span>
                  <span className="v2-chip">код {room.code || '—'}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <button type="button" className="v2-row" onClick={onSupport}>
        <span className="v2-row__art v3-icon" aria-hidden="true">
          <CrystalArt size={34} tone="mint" />
        </span>
        <span className="v2-row__body">
          <span className="v2-row__name">Поддержка</span>
          <span className="v2-row__meta">Вопросы, ошибки и предложения</span>
        </span>
        <span className="v2-row__side">
          <span className="v2-chip">›</span>
        </span>
      </button>

      <Sheet
        open={sheet === 'create'}
        onClose={() => setSheet(null)}
        label="Настройки стола"
        title="Новый стол"
        subtitle="Настройки увидит каждый, кто сядет за стол"
      >
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
            {DECKS.map((size) => (
              <button
                key={size}
                type="button"
                className={`v2-seg__btn ${deckSize === size ? 'is-on' : ''}`}
                onClick={() => setDeckSize(size)}
                aria-label={`Колода ${size} карты`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="v2-field">
          <span className="v2-field__label">Входной взнос, ₽</span>
          <input
            className="v2-input"
            inputMode="numeric"
            value={buyin}
            onChange={(event) => setBuyin(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
            placeholder={String(MIN_BUYN)}
            aria-label="Входной взнос в рублях"
          />
        </div>

        <div className="v2-summary">
          <span className="v2-chip">{summary}</span>
          {buyinValid ? <span className="v2-chip v2-chip--mint">Банк идёт победителю</span> : null}
          {unlimited ? <span className="v2-chip v2-chip--mint">Безлимит</span> : null}
        </div>
        {buyinValid ? null : (
          <p className="fm-note">Минимальный взнос — {MIN_BUYN} ₽.</p>
        )}

        <button type="button" className="v2-btn v2-btn--primary" style={{ width: '100%' }} onClick={createTable}>
          Создать стол
        </button>
      </Sheet>

      <Sheet
        open={sheet === 'join'}
        onClose={() => setSheet(null)}
        label="Вход по коду"
        title="Вход по коду"
        subtitle="Код показан в карточке стола"
      >
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
        <button type="button" className="v2-btn v2-btn--primary" style={{ width: '100%' }} onClick={joinByCode}>
          Войти за стол
        </button>
      </Sheet>
    </div>
  );
}

export default Home;
