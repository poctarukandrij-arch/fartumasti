import { useState } from 'react';
import { rub } from '../utils.js';
import { haptic, openLink } from '../telegram.js';
import {
  CardsArt,
  CoinArt,
  BoltArt,
  GiftArt,
  ChestArt,
  TrophyArt,
  Sparkle,
  MonogramArt,
} from '../components/Art.jsx';

const BOT_LINK = 'https://t.me/Fartumastiibot';
const MODE_LABEL = { podkidnoy: 'Подкидной', perevodnoy: 'Переводной' };

export function Home({ me, lobby, send, toast, inQueue, onBalance }) {
  const [panel, setPanel] = useState(null); // 'create' | 'join' | null
  const [seats, setSeats] = useState(2);
  const [mode, setMode] = useState('podkidnoy');
  const [joinId, setJoinId] = useState('');

  const rooms = lobby?.rooms || [];
  const online = lobby?.online ?? 0;
  const activeTables = lobby?.activeTables ?? 0;
  const queueSize = lobby?.queueSize ?? 0;
  const unlimited = Boolean(me?.unlimited);

  function quickMatch() {
    haptic('light');
    if (inQueue) {
      send({ type: 'queue:leave' });
      return;
    }
    send({ type: 'queue:join' });
  }

  function createRoom() {
    haptic('medium');
    send({ type: 'room:create', maxPlayers: seats, mode });
    setPanel(null);
  }

  function joinRoom(roomId) {
    const value = String(roomId || '').trim();
    if (!value) {
      toast('Введите код стола', 'error');
      return;
    }
    haptic('light');
    send({ type: 'room:join', roomId: value });
    setPanel(null);
    setJoinId('');
  }

  function invite() {
    haptic('light');
    openLink(`https://t.me/share/url?url=${encodeURIComponent(BOT_LINK)}&text=${encodeURIComponent(
      'FARTU MASTI — играем в дурака',
    )}`);
  }

  return (
    <div className="screen">
      {/* ── Баннер ── */}
      <section className="fm-hero">
        <div className="fm-hero__row">
          <span className="fm-hero__art" aria-hidden="true">
            <CardsArt size={64} />
          </span>
          <div className="fm-hero__body">
            <span className="fm-eyebrow">Онлайн-дурак</span>
            <h1 className="fm-hero__title">FARTU MASTI</h1>
            <p className="fm-hero__sub">Играйте с реальными людьми — без ботов</p>
          </div>
        </div>

        <div className="fm-hero__stats">
          <div className="fm-hero__stat">
            <b>{online}</b>
            <span>Онлайн</span>
          </div>
          <div className="fm-hero__stat">
            <b>{activeTables}</b>
            <span>Столов</span>
          </div>
          <div className="fm-hero__stat">
            <b>{queueSize}</b>
            <span>В поиске</span>
          </div>
        </div>
      </section>

      {/* ── Играть ── */}
      <button type="button" className="fm-cta fm-cta--hero" onClick={quickMatch}>
        {inQueue ? 'Ищем соперников…' : 'Играть'}
        <span className="fm-cta__tag">{inQueue ? 'выйти' : 'быстрый поиск'}</span>
      </button>

      {/* ── Быстрые действия ── */}
      <div className="fm-tiles">
        <button
          type="button"
          className="fm-tile"
          onClick={() => {
            haptic('light');
            setPanel(panel === 'create' ? null : 'create');
          }}
        >
          <span className="fm-tile__ico" aria-hidden="true">
            <BoltArt size={22} />
          </span>
          <span className="fm-tile__label">Создать комнату</span>
          <span className="fm-tile__hint">свой стол и правила</span>
        </button>

        <button
          type="button"
          className="fm-tile"
          onClick={() => {
            haptic('light');
            setPanel(panel === 'join' ? null : 'join');
          }}
        >
          <span className="fm-tile__ico" aria-hidden="true">
            <ChestArt theme="case_table" size={24} />
          </span>
          <span className="fm-tile__label">Присоединиться</span>
          <span className="fm-tile__hint">по коду стола</span>
        </button>

        <button type="button" className="fm-tile" onClick={invite}>
          <span className="fm-tile__ico" aria-hidden="true">
            <GiftArt size={22} />
          </span>
          <span className="fm-tile__label">Позвать друзей</span>
          <span className="fm-tile__hint">ссылка в Telegram</span>
        </button>

        <button type="button" className="fm-tile" onClick={onBalance}>
          <span className="fm-tile__ico" aria-hidden="true">
            <CoinArt size={22} />
          </span>
          <span className="fm-tile__label">Баланс</span>
          <span className="fm-tile__hint">{unlimited ? '∞ безлимит' : rub(me?.balance)}</span>
        </button>
      </div>

      {/* ── Создание комнаты ── */}
      {panel === 'create' ? (
        <section className="fm-panel" style={{ marginTop: 10 }}>
          <span className="fm-eyebrow">Новый стол</span>
          <div className="fm-field">
            <span className="fm-field__label">Игроков за столом</span>
            <div className="fm-chips">
              {[2, 3, 4].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`fm-chip ${seats === value ? 'fm-chip--on' : ''}`}
                  onClick={() => setSeats(value)}
                >
                  {value} игрока
                </button>
              ))}
            </div>
          </div>
          <div className="fm-field">
            <span className="fm-field__label">Режим</span>
            <div className="fm-segment">
              {['podkidnoy', 'perevodnoy'].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`fm-segment__btn ${mode === value ? 'fm-segment__btn--on' : ''}`}
                  onClick={() => setMode(value)}
                >
                  {MODE_LABEL[value]}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="fm-cta" style={{ marginTop: 12 }} onClick={createRoom}>
            Создать стол
          </button>
        </section>
      ) : null}

      {/* ── Присоединение ── */}
      {panel === 'join' ? (
        <section className="fm-panel" style={{ marginTop: 10 }}>
          <span className="fm-eyebrow">Вход по коду</span>
          <label className="fm-field">
            <span className="fm-field__label">Код или ID стола</span>
            <span className="fm-field__box">
              <input
                value={joinId}
                onChange={(event) => setJoinId(event.target.value.trim().slice(0, 24))}
                placeholder="Например 4821"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
              />
            </span>
          </label>
          <button
            type="button"
            className="fm-cta"
            style={{ marginTop: 12 }}
            disabled={!joinId}
            onClick={() => joinRoom(joinId)}
          >
            Войти за стол
          </button>
        </section>
      ) : null}

      {/* ── Столы ── */}
      <div className="fm-section">
        <span className="fm-section__title">Доступные столы</span>
        <span className="fm-section__hint">{rooms.length}</span>
      </div>

      {rooms.length === 0 ? (
        <div className="empty">
          Свободных столов нет. Нажмите «Играть» — подберём соперников, или создайте свой стол.
        </div>
      ) : (
        <div className="fm-list">
          {rooms.map((room) => (
            <div key={room.id} className="fm-row">
              <span className="fm-row__ico" aria-hidden="true">
                <MonogramArt name={room.ownerName || '?'} size={30} />
              </span>
              <span className="fm-row__body">
                <span className="fm-row__title">{room.name || `Стол ${room.code || room.id}`}</span>
                <span className="fm-row__sub">
                  {MODE_LABEL[room.mode] || 'Подкидной'} · {room.players}/{room.maxPlayers} ·{' '}
                  {room.ownerName || '—'}
                </span>
              </span>
              <button
                type="button"
                className="fm-row__action"
                disabled={room.players >= room.maxPlayers}
                onClick={() => joinRoom(room.id)}
              >
                {room.players >= room.maxPlayers ? 'полон' : 'Войти'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="fm-panel fm-panel--tight" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden="true">
            <TrophyArt size={26} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="fm-row__title" style={{ display: 'block' }}>
              Только реальные игроки
            </span>
            <span className="fm-row__sub" style={{ display: 'block' }}>
              Ботов нет — соперники живые люди
            </span>
          </span>
          <Sparkle size={14} />
        </div>
      </div>
    </div>
  );
}

export default Home;
