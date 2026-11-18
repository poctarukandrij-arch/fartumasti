import { useState } from 'react';
import { Logo } from '../components/Logo.jsx';
import { rub } from '../utils.js';

const MODES = [
  { id: 'podkidnoy', label: 'Подкидной' },
  { id: 'perevodnoy', label: 'Переводной' },
];

export function Home({ me, lobby, send, toast, inQueue }) {
  const [sheet, setSheet] = useState(null);
  const [seats, setSeats] = useState(2);
  const [mode, setMode] = useState('podkidnoy');
  const [code, setCode] = useState('');

  const online = lobby?.online ?? 0;
  const rooms = lobby?.rooms ?? [];
  const activeTables = lobby?.activeTables ?? 0;
  const unlimited = Boolean(me?.unlimited);

  function quickMatch() {
    if (inQueue) {
      send({ type: 'queue:leave' });
      toast('Поиск соперника отменён');
      return;
    }
    send({ type: 'queue:join' });
    toast('Ищем реального соперника…');
  }

  function createRoom() {
    send({ type: 'room:create', maxPlayers: seats, mode });
    setSheet(null);
  }

  function joinByCode(event) {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) return;
    send({ type: 'room:join', roomId: value });
    setSheet(null);
    setCode('');
  }

  return (
    <div className="screen">
      <section className="hero panel">
        <div className="hero__top">
          <Logo size="md" tagline />
          <span className="chip chip--live">
            <i className="conn__dot" aria-hidden="true" />
            {online} онлайн
          </span>
        </div>

        <h2 className="hero__title">Дурак с реальными игроками</h2>
        <p className="hero__sub">
          Подкидной и переводной. Колода 36 карт, честная раздача на сервере.
        </p>

        <div className="hero__stats">
          <div className="hero__stat">
            <span className="stat__label">Баланс</span>
            <span className={`stat__value ${unlimited ? 'stat__value--accent' : ''}`}>
              {unlimited ? '∞' : rub(me?.balance)}
            </span>
          </div>
          <div className="hero__stat">
            <span className="stat__label">Игроков</span>
            <span className="stat__value">{online}</span>
          </div>
          <div className="hero__stat">
            <span className="stat__label">Столов</span>
            <span className="stat__value">{activeTables}</span>
          </div>
        </div>

        <div className="hero__actions">
          <button type="button" className="btn btn--primary btn--lg btn--wide" onClick={quickMatch}>
            {inQueue ? 'Отменить поиск' : 'Играть'}
            <span className="btn__sub">
              {inQueue ? 'ожидание соперника' : 'быстрый поиск соперника'}
            </span>
          </button>
        </div>
      </section>

      <section className="quick-grid">
        <button type="button" className="quick" onClick={() => setSheet('create')}>
          <span className="quick__ico" aria-hidden="true">＋</span>
          <span className="quick__label">Создать комнату</span>
          <span className="quick__hint">приватный стол</span>
        </button>
        <button type="button" className="quick" onClick={() => setSheet('join')}>
          <span className="quick__ico" aria-hidden="true">#</span>
          <span className="quick__label">Присоединиться</span>
          <span className="quick__hint">по коду комнаты</span>
        </button>
      </section>

      <section className="section">
        <div className="section__head">
          <h3 className="section__title">Доступные столы</h3>
          <span className="section__hint">{rooms.length ? `${rooms.length} открыто` : 'пока пусто'}</span>
        </div>

        {rooms.length === 0 ? (
          <div className="empty">
            Открытых столов нет. Создайте комнату или нажмите «Играть» — соперник подключится сам.
          </div>
        ) : (
          <div className="table-list">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className="table-card"
                onClick={() => send({ type: 'room:join', roomId: room.id })}
              >
                <span className="table-card__art" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="table-card__body">
                  <span className="table-card__title">
                    {room.name}
                    {room.code ? <span className="chip chip--soon">{room.code}</span> : null}
                  </span>
                  <span className="table-card__meta">
                    {room.mode === 'perevodnoy' ? 'Переводной' : 'Подкидной'} · {room.players}/{room.maxPlayers} ·{' '}
                    {room.ownerName}
                  </span>
                </span>
                <span className="btn btn--soft btn--sm">Войти</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {sheet ? (
        <div className="sheet" role="dialog" aria-modal="true" onClick={() => setSheet(null)}>
          <div className="sheet__panel" onClick={(event) => event.stopPropagation()}>
            <span className="sheet__grip" aria-hidden="true" />
            <h3 className="sheet__title">{sheet === 'create' ? 'Новая комната' : 'Вход по коду'}</h3>

            <div className="sheet__body">
              {sheet === 'create' ? (
                <>
                  <span className="field__label">Игроков за столом</span>
                  <div className="segmented" style={{ marginBottom: 14 }}>
                    {[2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={`segmented__btn ${seats === count ? 'segmented__btn--active' : ''}`}
                        onClick={() => setSeats(count)}
                      >
                        {count}
                      </button>
                    ))}
                  </div>

                  <span className="field__label">Режим</span>
                  <div className="segmented" style={{ marginBottom: 18 }}>
                    {MODES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`segmented__btn ${mode === item.id ? 'segmented__btn--active' : ''}`}
                        onClick={() => setMode(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <button type="button" className="btn btn--primary btn--lg btn--wide" onClick={createRoom}>
                    Создать комнату
                  </button>
                  <p className="muted small center" style={{ marginTop: 10 }}>
                    Код комнаты появится на столе — отправьте его другу.
                  </p>
                </>
              ) : (
                <form onSubmit={joinByCode} className="col" style={{ gap: 14 }}>
                  <label className="field">
                    <span className="field__label">Код или название комнаты</span>
                    <input
                      className="input input--code"
                      value={code}
                      onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 12))}
                      placeholder="Например A7K2Q"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                    />
                  </label>
                  <button type="submit" className="btn btn--primary btn--lg btn--wide" disabled={!code.trim()}>
                    Присоединиться
                  </button>
                  <p className="muted small center">Комнату можно найти и в списке столов выше.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Home;
