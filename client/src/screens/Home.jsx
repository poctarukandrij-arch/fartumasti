import { useState } from 'react';
import { haptic } from '../telegram.js';
import { rub } from '../utils.js';

export default function Home({ me, lobby, connected, send, toast }) {
  const [modal, setModal] = useState(null);
  const [seats, setSeats] = useState(2);
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);

  const online = lobby?.online ?? 0;
  const tables = lobby?.rooms ?? [];
  const active = lobby?.activeTables ?? 0;
  const queueSize = lobby?.queueSize ?? 0;

  const quickSearch = () => {
    haptic('medium');
    send({ type: 'queue:join' });
    setSearching(true);
    toast('Ищем соперника…', 'info');
  };

  const cancelSearch = () => {
    send({ type: 'queue:leave' });
    setSearching(false);
  };

  const createRoom = () => {
    haptic('medium');
    send({ type: 'room:create', maxPlayers: seats });
    setModal(null);
  };

  const joinByCode = () => {
    const value = code.trim();
    if (!value) {
      toast('Введите код стола', 'error');
      return;
    }
    send({ type: 'room:join', roomId: value, code: value });
    setModal(null);
    setCode('');
  };

  return (
    <div className="screen">
      <section className="hero">
        <span className="hero__eyebrow">Онлайн-дурак в Telegram</span>
        <h1 className="hero__title">Стол накрыт</h1>
        <p className="hero__text">
          Живые соперники, голос за столом и честная раздача на сервере. Заходите — партия найдётся за
          несколько секунд.
        </p>
        <div className="hero__stats">
          <div className="stat-chip">
            <b>{online}</b>
            <span>игроков онлайн</span>
          </div>
          <div className="stat-chip">
            <b>{active}</b>
            <span>активных столов</span>
          </div>
          <div className="stat-chip">
            <b>{queueSize}</b>
            <span>в поиске</span>
          </div>
        </div>
      </section>

      {searching ? (
        <div className="panel col">
          <div className="row row--between">
            <div className="row" style={{ gap: 10 }}>
              <span className="spinner spinner--sm" />
              <div>
                <div className="strong">Подбираем соперника</div>
                <div className="hint">Обычно это занимает до 15 секунд</div>
              </div>
            </div>
            <button className="btn btn--ghost btn--sm" type="button" onClick={cancelSearch}>
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn--primary btn--wide btn--play" type="button" onClick={quickSearch}>
          Играть
          <span className="btn__hint">Быстрый поиск соперника</span>
        </button>
      )}

      <div className="grid-2">
        <button className="tile" type="button" onClick={() => setModal('create')}>
          <span className="tile__icon">＋</span>
          <span className="tile__title">Создать стол</span>
          <span className="tile__text">Свой стол на 2–4 игрока</span>
        </button>
        <button className="tile" type="button" onClick={() => setModal('code')}>
          <span className="tile__icon">#</span>
          <span className="tile__title">Войти по коду</span>
          <span className="tile__text">Присоединиться к друзьям</span>
        </button>
      </div>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Доступные столы</h2>
          <span className="pill">{tables.length}</span>
        </div>
        {tables.length === 0 ? (
          <div className="empty">
            <div className="empty__title">Пока нет открытых столов</div>
            <p className="hint">Создайте свой — соперники подтянутся.</p>
          </div>
        ) : (
          <div className="col">
            {tables.map((room) => (
              <div className="table-row" key={room.id}>
                <div className="table-row__main">
                  <div className="table-row__name">{room.name}</div>
                  <div className="hint">
                    владелец {room.ownerName} · {room.players}/{room.maxPlayers} игрока
                  </div>
                </div>
                <button
                  className="btn btn--soft btn--sm"
                  type="button"
                  onClick={() => {
                    haptic('light');
                    send({ type: 'room:join', roomId: room.id });
                  }}
                >
                  Сесть
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Ваш баланс</h2>
        </div>
        <div className="panel row row--between">
          <div>
            <div className="hint">Доступно для игры и покупок</div>
            <div className="balance balance--lg">{rub(me.user.balance)}</div>
          </div>
          <span className={`pill ${connected ? 'pill--live' : ''}`}>
            <span className="dot" style={{ background: connected ? '#37d39b' : '#ff4d6d' }} />
            {connected ? 'связь есть' : 'переподключение'}
          </span>
        </div>
      </section>

      {modal ? (
        <div className="sheet-backdrop" onClick={() => setModal(null)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet__grab" />
            {modal === 'create' ? (
              <>
                <h3 className="sheet__title">Новый стол</h3>
                <p className="hint">Выберите количество игроков</p>
                <div className="seg">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={`seg__item ${seats === count ? 'seg__item--active' : ''}`}
                      onClick={() => setSeats(count)}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <button className="btn btn--primary btn--wide" type="button" onClick={createRoom}>
                  Создать стол
                </button>
              </>
            ) : (
              <>
                <h3 className="sheet__title">Код стола</h3>
                <p className="hint">Попросите код у владельца стола</p>
                <input
                  className="input mono"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 12))}
                  placeholder="например, 7K2QP4"
                  autoCapitalize="characters"
                  autoCorrect="off"
                />
                <button className="btn btn--primary btn--wide" type="button" onClick={joinByCode}>
                  Войти
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
