import { useMemo, useState } from 'react';
import { rub } from '../utils.js';
import { shareInvite } from '../share.js';
import { Sheet } from '../components/Sheet.jsx';
import { CardsArt, TableArt, GiftArt, CrystalArt, StarArt, TrophyArt, ShopArt, WalletArt } from '../components/Art.jsx';
import { Mascot } from '../components/Avatar.jsx';
import { Crown } from '../components/Crown.jsx';
import { Logo } from '../components/Logo.jsx';

const MODES = [
  { id: 'podkidnoy', label: 'Подкидной' },
  { id: 'perevodnoy', label: 'Переводной' },
];

// Только три стандартные колоды серверного движка. Подписи — без лишнего текста.
const DECKS = [24, 36, 52];

// Входной взнос задаётся вручную: минимум 200 ₽, «без взноса» больше нет.
const MIN_BUYN = 200;

// Уровни комнат — быстрые пресеты входного взноса для создания стола.
// Правила и лимиты те же, что в форме «Новый стол» (минимум 200 ₽, 2–4 игрока).
const TIERS = [
  { id: 'novice', name: 'Новичок', tone: 'green', crown: 'green', buyin: 200 },
  { id: 'amateur', name: 'Любитель', tone: 'blue', crown: 'silver', buyin: 500 },
  { id: 'pro', name: 'Профи', tone: 'purple', crown: 'purple', buyin: 1000 },
  { id: 'elite', name: 'Элита', tone: 'gold', crown: 'red', buyin: 5000 },
];
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

export function Home({ me, lobby, send, toast, inQueue, onRules, onInventory, onSupport, onBalance, onTab }) {
  const [sheet, setSheet] = useState(null); // 'create' | 'join' | null
  const [players, setPlayers] = useState(2);
  const [mode, setMode] = useState('podkidnoy');
  const [buyin, setBuyin] = useState('500');
  const [deckSize, setDeckSize] = useState(36);
  const [visibility, setVisibility] = useState('public');
  const [code, setCode] = useState('');
  const [view, setView] = useState('main'); // 'main' | 'rooms'

  const rooms = lobby?.rooms || [];
  const online = Number(lobby?.online) || 0;
  const username = me?.username || '';
  const unlimited = Boolean(me?.unlimited);

  const buyinValue = useMemo(() => Number(String(buyin).replace(/[^\d]/g, '')) || 0, [buyin]);
  const buyinValid = buyinValue >= MIN_BUYN && buyinValue <= MAX_BUYN;

  const visibilityLabel = visibility === 'private' ? 'Приватный стол' : 'Открытый стол';
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
    send({ type: 'room:create', maxPlayers: players, mode, buyn: buyinValue * 100, deckSize, visibility });
    setSheet(null);
    toast?.(visibility === 'private' ? 'Приватный стол создаётся…' : 'Стол создаётся…');
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

  function pickTier(tier) {
    setBuyin(String(tier.buyin));
    setSheet('create');
  }

  async function invite() {
    const result = await shareInvite({ username });
    if (result === 'clipboard') toast?.('Приглашение скопировано — открой Telegram');
    if (result === 'cancel') toast?.('Отправка отменена');
  }

  const openTables = (
    <section className="v2-panel rd-panel">
      <div className="v2-title">
        <span>Открытые столы</span>
        <span className="v2-chip">{rooms.length}</span>
      </div>

      {rooms.length === 0 ? (
        <div className="v2-empty">Пока нет открытых столов. Создай свой — и пригласи друга.</div>
      ) : (
        <div className="v2-stack">
          {rooms.map((room) => {
            const stake = Number(room.buyIn ?? room.buyn) || 0;
            return (
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
                  <span className="v2-chip v2-chip--mint">{stake > 0 ? rub(stake) : 'бесплатно'}</span>
                  <span className="v2-chip">код {room.code || '—'}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );

  const sheets = (
    <>
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
          <span className="v2-field__label">Доступ</span>
          <div className="v2-seg">
            <button
              type="button"
              className={`v2-seg__btn ${visibility === 'public' ? 'is-on' : ''}`}
              onClick={() => setVisibility('public')}
            >
              Открытый стол
            </button>
            <button
              type="button"
              className={`v2-seg__btn ${visibility === 'private' ? 'is-on' : ''}`}
              onClick={() => setVisibility('private')}
            >
              Приватный стол
            </button>
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
          <span className="v2-chip">{visibilityLabel}</span>
          {buyinValid ? <span className="v2-chip v2-chip--mint">Банк идёт победителю</span> : null}
          {unlimited ? <span className="v2-chip v2-chip--mint">Безлимит</span> : null}
        </div>
        {visibility === 'private' ? (
          <p className="fm-note">Приватный стол не виден в списке. Гости заходят по коду приглашения.</p>
        ) : null}
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
        subtitle="Публичный код стола или код приглашения приватного стола"
      >
        <div className="v2-field">
          <span className="v2-field__label">Код стола или приглашения</span>
          <input
            className="v2-input"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Например A7K2Q9"
            maxLength={8}
            autoCapitalize="characters"
          />
        </div>
        <button type="button" className="v2-btn v2-btn--primary" style={{ width: '100%' }} onClick={joinByCode}>
          Войти за стол
        </button>
      </Sheet>
    </>
  );

  if (view === 'rooms') {
    return (
      <div className="v2 v3-home rd-rooms">
        <div className="rd-subhead">
          <button type="button" className="rd-back" onClick={() => setView('main')} aria-label="Назад">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <h1 className="rd-subhead__title">Выбор комнаты</h1>
        </div>

        <div className="rd-tiers">
          {TIERS.map((tier) => (
            <article key={tier.id} className={`rd-tier rd-tier--${tier.tone}`}>
              <span className="rd-tier__name">{tier.name}</span>
              <span className="rd-tier__crown">
                <Crown size={70} tone={tier.crown} />
              </span>
              <span className="rd-tier__price">от {tier.buyin.toLocaleString('ru-RU')} ₽</span>
              <span className="rd-tier__players">Игроков: 2–4</span>
              <button type="button" className="rd-btn rd-btn--gold rd-tier__play" onClick={() => pickTier(tier)}>
                Играть
              </button>
            </article>
          ))}
        </div>

        <div className="rd-quick">
          <button type="button" className="rd-btn rd-btn--violet" onClick={() => setSheet('create')}>
            Свой стол
          </button>
          <button type="button" className="rd-btn rd-btn--violet" onClick={() => setSheet('join')}>
            По коду
          </button>
        </div>

        {openTables}
        {sheets}
      </div>
    );
  }

  return (
    <div className="v2 v3-home rd-home">
      <section className="rd-hero">
        <span className="rd-hero__glow" aria-hidden="true" />
        <span className="rd-hero__deco rd-hero__deco--a" aria-hidden="true">♠</span>
        <span className="rd-hero__deco rd-hero__deco--b" aria-hidden="true">♥</span>
        <span className="rd-hero__deco rd-hero__deco--c" aria-hidden="true">♣</span>
        <div className="rd-hero__text">
          <Logo size="lg" />
          <span className="rd-ribbon">Играй вместе с друзьями!</span>
          <span className="v2-live rd-live">
            <span className="v2-live__dot" aria-hidden="true" />
            {online} онлайн
          </span>
        </div>
        <Mascot name={username || 'Игрок'} className="rd-hero__mascot" />
      </section>

      <div className="rd-trio">
        <button type="button" className="rd-trio__tile rd-trio__tile--violet" onClick={() => setView('rooms')}>
          <span className="rd-trio__art" aria-hidden="true">
            <TrophyArt size={46} />
          </span>
          <span className="rd-trio__label">Игровые комнаты</span>
        </button>
        <button type="button" className="rd-trio__tile rd-trio__tile--gold" onClick={() => onTab?.('shop')}>
          <span className="rd-trio__art" aria-hidden="true">
            <ShopArt size={46} />
          </span>
          <span className="rd-trio__label">Магазин</span>
        </button>
        <button type="button" className="rd-trio__tile rd-trio__tile--blue" onClick={onBalance}>
          <span className="rd-trio__art" aria-hidden="true">
            <WalletArt size={46} />
          </span>
          <span className="rd-trio__label">Кошелёк</span>
        </button>
      </div>

      <button type="button" className={`rd-play ${inQueue ? 'rd-play--waiting' : ''}`} onClick={play}>
        <span className="rd-play__icon" aria-hidden="true">{inQueue ? '✕' : '▶'}</span>
        <span className="rd-play__label">{inQueue ? 'Поиск соперника…' : 'Играть'}</span>
      </button>
      {inQueue ? <p className="rd-play__hint">Нажми, чтобы отменить поиск</p> : null}

      <div className="v2-grid2 rd-actions">
        <button type="button" className="v2-tile" onClick={() => setSheet('create')}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <span className="v2-tile__art v3-icon" aria-hidden="true">
            <CardsArt size={52} />
          </span>
          <span className="v2-tile__title">Создать стол</span>
          <span className="v2-tile__sub">Взнос, колода и режим</span>
        </button>

        <button type="button" className="v2-tile v2-tile--cyan" onClick={() => setSheet('join')}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <span className="v2-tile__art v3-icon" aria-hidden="true">
            <TableArt itemId="table_ocean" size={52} />
          </span>
          <span className="v2-tile__title">Присоединиться</span>
          <span className="v2-tile__sub">По коду стола</span>
        </button>

        <button type="button" className="v2-tile v2-tile--pink" onClick={invite}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <span className="v2-tile__art v3-icon" aria-hidden="true">
            <GiftArt size={50} />
          </span>
          <span className="v2-tile__title">Пригласить друга</span>
          <span className="v2-tile__sub">Ссылка в Telegram</span>
        </button>

        <button type="button" className="v2-tile v2-tile--mint" onClick={onInventory}>
          <span className="v2-tile__glow" aria-hidden="true" />
          <span className="v2-tile__art v3-icon" aria-hidden="true">
            <StarArt size={48} />
          </span>
          <span className="v2-tile__title">Инвентарь</span>
          <span className="v2-tile__sub">Колоды, столы, эмодзи</span>
        </button>
      </div>

      {openTables}

      <div className="v2-grid2 rd-actions">
        <button type="button" className="v2-row" onClick={onRules}>
          <span className="v2-row__art v3-icon" aria-hidden="true">
            <CrystalArt size={34} tone="violet" />
          </span>
          <span className="v2-row__body">
            <span className="v2-row__name">Правила игры</span>
            <span className="v2-row__meta">Как бить и подкидывать</span>
          </span>
        </button>
        <button type="button" className="v2-row" onClick={onSupport}>
          <span className="v2-row__art v3-icon" aria-hidden="true">
            <CrystalArt size={34} tone="mint" />
          </span>
          <span className="v2-row__body">
            <span className="v2-row__name">Поддержка</span>
            <span className="v2-row__meta">Вопросы и ошибки</span>
          </span>
        </button>
      </div>

      {sheets}
    </div>
  );
}

export default Home;
