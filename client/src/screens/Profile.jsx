import { useState } from 'react';
import { api } from '../api.js';
import { rub } from '../utils.js';
import { MonogramArt, CoinArt, TrophyArt, ChartArt } from '../components/Art.jsx';

const NAME_RE = /^[A-Za-z0-9]{4,12}$/;

export function Profile({ me, stats, onLogout, onWithdraw, refreshMe, toast }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const unlimited = Boolean(me?.unlimited);
  const telegramId = me?.telegramId ?? me?.telegram_id ?? me?.tgId ?? '—';
  const settings = {
    soundEnabled: me?.soundEnabled ?? me?.sound_enabled ?? true,
    notificationsEnabled: me?.notificationsEnabled ?? me?.notifications_enabled ?? true,
  };

  async function saveName(event) {
    event.preventDefault();
    const value = name.trim();
    if (!NAME_RE.test(value)) {
      setError('4–12 символов: латинские буквы и цифры');
      return;
    }
    if ((value.match(/[A-Za-z]/g) || []).length < 3) {
      setError('Минимум 3 буквы');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/profile/name', { method: 'POST', body: { name: value } });
      await refreshMe?.();
      setEditing(false);
      setName('');
      toast('Имя изменено', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(key) {
    const next = { ...settings, [key]: !settings[key] };
    try {
      await api('/profile/settings', { method: 'POST', body: next });
      await refreshMe?.();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div className="screen">
      <div className="fm-section">
        <div>
          <span className="fm-eyebrow">Аккаунт</span>
          <h2 className="fm-title">Профиль</h2>
        </div>
      </div>

      <section className="fm-hero" style={{ padding: '16px 15px' }}>
        <div className="fm-hero__row">
          <span className="fm-hero__art" aria-hidden="true">
            <MonogramArt name={me?.username || '?'} size={58} />
          </span>
          <div className="fm-hero__body">
            <span className="fm-eyebrow">Игрок</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                minWidth: 0,
                marginTop: 2,
              }}
            >
              <span
                className="fm-hero__title"
                style={{
                  fontSize: 21,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}
              >
                {me?.username || 'Игрок'}
              </span>
              {unlimited ? (
                <span className="fm-rarity fm-rarity--legendary" style={{ alignSelf: 'center' }}>
                  ∞ безлимит
                </span>
              ) : null}
            </div>
            <p className="fm-hero__sub">Telegram ID: {telegramId}</p>
          </div>
        </div>

        <div className="fm-hero__stats">
          <div className="fm-hero__stat">
            <b style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CoinArt size={16} />
              {unlimited ? '∞' : rub(me?.balance)}
            </b>
            <span>Баланс</span>
          </div>
          <div className="fm-hero__stat">
            <b>{stats?.wins ?? 0}</b>
            <span>Побед</span>
          </div>
        </div>
      </section>

      <div className="fm-grid" style={{ marginTop: 10 }}>
        <div className="fm-stat">
          <span className="fm-stat__ico" aria-hidden="true">
            <TrophyArt size={24} />
          </span>
          <span className="fm-stat__label">Партии</span>
          <span className="fm-stat__value">{stats?.gamesPlayed ?? 0}</span>
        </div>
        <div className="fm-stat">
          <span className="fm-stat__ico" aria-hidden="true">
            <ChartArt size={24} />
          </span>
          <span className="fm-stat__label">Процент побед</span>
          <span className="fm-stat__value fm-stat__value--violet">{stats?.winRate ?? 0}%</span>
        </div>
      </div>

      <div className="fm-section">
        <span className="fm-section__title">Настройки</span>
      </div>

      <div className="fm-panel fm-panel--tight">
        <div className="fm-list">
          <button
            type="button"
            className="fm-row"
            style={{ cursor: 'pointer', width: '100%', textAlign: 'left' }}
            onClick={() => setEditing((prev) => !prev)}
          >
            <span className="fm-row__ico" aria-hidden="true" style={{ fontSize: 13, fontWeight: 800, color: '#cfd5f6' }}>
              Aa
            </span>
            <span className="fm-row__body">
              <span className="fm-row__title">Имя игрока</span>
              <span className="fm-row__sub">{me?.username || 'не задано'} · смена 49 ₽</span>
            </span>
            <span className="fm-row__value" style={{ color: '#a8b0dc', fontSize: 10.5 }}>
              {editing ? 'закрыть' : 'изменить'}
            </span>
          </button>

          {editing ? (
            <form onSubmit={saveName} style={{ padding: '2px 2px 4px' }}>
              <label className="fm-field" style={{ marginTop: 0 }}>
                <span className="fm-field__label">Новое имя</span>
                <span className="fm-field__box">
                  <input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12));
                      setError('');
                    }}
                    placeholder="Archi"
                    maxLength={12}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <i>4–12</i>
                </span>
              </label>
              {error ? (
                <p className="hint hint--error" style={{ marginTop: 8 }}>
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="fm-cta"
                style={{ marginTop: 10, padding: '12px 16px', fontSize: 13 }}
                disabled={busy || !name.trim()}
              >
                {busy ? 'Сохраняем…' : 'Сменить за 49 ₽'}
              </button>
            </form>
          ) : null}

          <div className="fm-row">
            <span className="fm-row__ico" aria-hidden="true" style={{ fontSize: 15 }}>
              ♪
            </span>
            <span className="fm-row__body">
              <span className="fm-row__title">Звуки игры</span>
              <span className="fm-row__sub">карты, ходы, победа</span>
            </span>
            <button
              type="button"
              className={`fm-switch ${settings.soundEnabled ? 'fm-switch--on' : ''}`}
              role="switch"
              aria-checked={settings.soundEnabled}
              aria-label="Звуки игры"
              onClick={() => toggle('soundEnabled')}
            >
              <i />
            </button>
          </div>

          <div className="fm-row">
            <span className="fm-row__ico" aria-hidden="true" style={{ fontSize: 14 }}>
              ✦
            </span>
            <span className="fm-row__body">
              <span className="fm-row__title">Уведомления</span>
              <span className="fm-row__sub">приглашения и ходы</span>
            </span>
            <button
              type="button"
              className={`fm-switch ${settings.notificationsEnabled ? 'fm-switch--on' : ''}`}
              role="switch"
              aria-checked={settings.notificationsEnabled}
              aria-label="Уведомления"
              onClick={() => toggle('notificationsEnabled')}
            >
              <i />
            </button>
          </div>

          <button
            type="button"
            className="fm-row"
            style={{ cursor: 'pointer', width: '100%', textAlign: 'left' }}
            onClick={onWithdraw}
          >
            <span className="fm-row__ico" aria-hidden="true">
              <CoinArt size={20} />
            </span>
            <span className="fm-row__body">
              <span className="fm-row__title">Вывод средств</span>
              <span className="fm-row__sub">виртуальный баланс · раздел готовится</span>
            </span>
            <span className="fm-row__value" style={{ color: '#8f97c6', fontSize: 10.5 }}>
              Скоро
            </span>
          </button>

          <button
            type="button"
            className="fm-row"
            style={{ cursor: 'pointer', width: '100%', textAlign: 'left' }}
            onClick={onLogout}
          >
            <span className="fm-row__ico" aria-hidden="true" style={{ fontSize: 15 }}>
              ⎋
            </span>
            <span className="fm-row__body">
              <span className="fm-row__title">Выйти</span>
              <span className="fm-row__sub">сессия закроется, прогресс сохранится</span>
            </span>
          </button>
        </div>
      </div>

      <p className="fm-fineprint">
        Баланс виртуальный и не является денежными средствами. Реальные выплаты не подключены.
      </p>
    </div>
  );
}

export default Profile;
