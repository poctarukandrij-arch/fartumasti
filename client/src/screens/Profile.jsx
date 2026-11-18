import { useState } from 'react';
import { api } from '../api.js';
import { rub, initials } from '../utils.js';

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
      <section className="profile-hero panel">
        <span className="monogram" aria-hidden="true">{initials(me?.username)}</span>
        <div className="profile-hero__meta">
          <span className="profile-hero__name">
            {me?.username || 'Игрок'}
            {unlimited ? <span className="badge badge--unlimited">∞</span> : null}
          </span>
          <span className="small muted">Telegram ID: {telegramId}</span>
          <span className="balance-chip" style={{ marginTop: 8 }}>
            <span className="balance-chip__coin" aria-hidden="true">₽</span>
            <span className="num">{unlimited ? '∞' : rub(me?.balance)}</span>
          </span>
        </div>
      </section>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat__label">Партии</span>
          <span className="stat__value">{stats?.gamesPlayed ?? 0}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Победы</span>
          <span className="stat__value stat__value--accent">{stats?.wins ?? 0}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Процент побед</span>
          <span className="stat__value">{stats?.winRate ?? 0}%</span>
        </div>
      </div>

      <section className="section">
        <div className="section__head">
          <h3 className="section__title">Профиль</h3>
        </div>
        <div className="panel panel--flush">
          <button type="button" className="list__row" onClick={() => setEditing((prev) => !prev)}>
            <span className="list__ico" aria-hidden="true">Aa</span>
            <span className="list__body">
              <span className="list__title">Имя игрока</span>
              <span className="list__sub">{me?.username || 'не задано'} · смена 49 ₽</span>
            </span>
            <span className="list__value">{editing ? 'закрыть' : 'изменить'}</span>
          </button>

          {editing ? (
            <form onSubmit={saveName} className="col" style={{ gap: 10, padding: '4px 14px 16px' }}>
              <input
                className="input input--name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12));
                  setError('');
                }}
                placeholder="Новое имя"
                maxLength={12}
                autoComplete="off"
                spellCheck={false}
              />
              {error ? <div className="hint hint--error">{error}</div> : null}
              <button type="submit" className="btn btn--primary btn--sm" disabled={busy || !name.trim()}>
                {busy ? 'Сохраняем…' : 'Сменить за 49 ₽'}
              </button>
            </form>
          ) : null}

          <div className="settings-row">
            <span className="list__body">
              <span className="settings-row__label">Звуки игры</span>
              <span className="settings-row__hint">карты, ходы, победа</span>
            </span>
            <button
              type="button"
              className={`switch ${settings.soundEnabled ? 'switch--on' : ''}`}
              role="switch"
              aria-checked={settings.soundEnabled}
              aria-label="Звуки игры"
              onClick={() => toggle('soundEnabled')}
            >
              <i />
            </button>
          </div>

          <div className="settings-row">
            <span className="list__body">
              <span className="settings-row__label">Уведомления</span>
              <span className="settings-row__hint">приглашения и ходы</span>
            </span>
            <button
              type="button"
              className={`switch ${settings.notificationsEnabled ? 'switch--on' : ''}`}
              role="switch"
              aria-checked={settings.notificationsEnabled}
              aria-label="Уведомления"
              onClick={() => toggle('notificationsEnabled')}
            >
              <i />
            </button>
          </div>

          <button type="button" className="list__row" onClick={onWithdraw}>
            <span className="list__ico" aria-hidden="true">₽</span>
            <span className="list__body">
              <span className="list__title">Вывод средств</span>
              <span className="list__sub">виртуальный баланс · раздел готовится</span>
            </span>
            <span className="chip chip--soon">Скоро</span>
          </button>

          <button type="button" className="list__row" onClick={onLogout}>
            <span className="list__ico" aria-hidden="true">⎋</span>
            <span className="list__body">
              <span className="list__title">Выйти</span>
              <span className="list__sub">сессия закроется, прогресс сохранится</span>
            </span>
          </button>
        </div>
      </section>

      <p className="muted small center">
        Баланс виртуальный и не является денежными средствами. Реальные выплаты не подключены.
      </p>
    </div>
  );
}

export default Profile;
