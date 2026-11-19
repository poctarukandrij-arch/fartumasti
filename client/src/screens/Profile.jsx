import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { rub } from '../utils.js';
import { PlayerTag } from '../components/PlayerTag.jsx';
import { shareInvite } from '../share.js';

const num = (value) => Number(value) || 0;

export function Profile({ me, stats, onLogout, onWithdraw, onInventory, refreshMe, toast }) {
  const [name, setName] = useState(me?.username || '');
  const [busy, setBusy] = useState(false);
  const [sound, setSound] = useState(me?.soundEnabled !== false);
  const [notify, setNotify] = useState(me?.notificationsEnabled !== false);
  const [equipped, setEquipped] = useState(me?.equipped || null);

  useEffect(() => {
    let alive = true;
    api('/shop')
      .then((data) => {
        if (alive) setEquipped(data?.equipped || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const unlimited = Boolean(me?.unlimited);
  const balance = num(me?.balance);
  const hasName = Boolean(me?.username);
  const telegramId = me?.telegramId || '—';

  const games = num(stats?.gamesPlayed ?? stats?.games ?? me?.stats?.gamesPlayed);
  const wins = num(stats?.wins ?? me?.stats?.wins);
  const losses = num(stats?.losses ?? me?.stats?.losses);

  async function saveName() {
    const value = name.trim();
    if (!hasName) {
      toast?.('Имя задаётся на экране входа');
      return;
    }
    if (value === me?.username) {
      toast?.('Это твоё текущее имя');
      return;
    }
    setBusy(true);
    try {
      await api('/profile/name', { method: 'POST', body: { name: value } });
      refreshMe?.();
      toast?.('Имя обновлено', 'success');
    } catch (error) {
      toast?.(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(next) {
    setBusy(true);
    try {
      await api('/profile/settings', {
        method: 'POST',
        body: { soundEnabled: sound, notificationsEnabled: notify, ...next },
      });
      refreshMe?.();
    } catch (error) {
      toast?.(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function invite() {
    const result = await shareInvite({ username: me?.username || '' });
    if (result === 'clipboard') toast?.('Приглашение скопировано — открой Telegram');
  }

  return (
    <div className="screen v2">
      <section className="v2-profile-head">
        <span className="v2-avatar" aria-hidden="true">
          {(me?.username || '?').slice(0, 2).toUpperCase()}
        </span>
        <div className="v2-profile__info">
          <span className="v2-profile__name">
            <PlayerTag
              name={me?.username || 'Без имени'}
              emoji={equipped?.emojis || me?.emojied?.emojis}
              size={18}
            />
            {unlimited ? <span className="v2-badge-unlim">безлимит</span> : null}
          </span>
          <span className="v2-profile__id">Telegram ID: {telegramId}</span>
          <span className="v2-profile__id">
            Баланс: {unlimited ? '∞' : rub(balance)}
          </span>
        </div>
      </section>

      <section className="v2-panel">
        <div className="v2-title">
          <span>Игровой счёт</span>
          <span className="v2-chip v2-chip--mint">{unlimited ? '∞' : rub(balance)}</span>
        </div>
        <div className="v2-metrics">
          <div className="v2-metric">
            <span className="v2-metric__num">{games}</span>
            <span className="v2-metric__label">партий</span>
          </div>
          <div className="v2-metric v2-metric--win">
            <span className="v2-metric__num">{wins}</span>
            <span className="v2-metric__label">побед</span>
          </div>
          <div className="v2-metric v2-metric--lose">
            <span className="v2-metric__num">{losses}</span>
            <span className="v2-metric__label">поражений</span>
          </div>
        </div>
        <div className="v2-grid2">
          <button type="button" className="v2-btn" onClick={onWithdraw}>
            Пополнить / вывести
          </button>
          <button type="button" className="v2-btn" onClick={invite}>
            Пригласить друга
          </button>
        </div>
        <div className="v2-grid2">
          <button type="button" className="v2-btn v2-btn--primary" onClick={onInventory}>
            Инвентарь
          </button>
          <button type="button" className="v2-btn" onClick={onInventory}>
            Мои предметы
          </button>
        </div>
      </section>

      <section className="v2-panel">
        <div className="v2-title">
          <span>Настройки</span>
          <span className="v2-chip">профиль</span>
        </div>

        <div className="v2-toggle">
          <span className="v2-toggle__body">
            <span className="v2-toggle__title">Звук</span>
            <span className="v2-toggle__sub">Звуковые эффекты за столом</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            aria-label="Звук"
            className={`v2-switch ${sound ? 'is-on' : ''}`}
            disabled={busy}
            onClick={() => {
              const next = !sound;
              setSound(next);
              saveSettings({ soundEnabled: next, notificationsEnabled: notify });
            }}
          >
            <span />
          </button>
        </div>

        <div className="v2-toggle">
          <span className="v2-toggle__body">
            <span className="v2-toggle__title">Уведомления</span>
            <span className="v2-toggle__sub">Сообщения о ходах и приглашениях</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={notify}
            aria-label="Уведомления"
            className={`v2-switch ${notify ? 'is-on' : ''}`}
            disabled={busy}
            onClick={() => {
              const next = !notify;
              setNotify(next);
              saveSettings({ soundEnabled: sound, notificationsEnabled: next });
            }}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="v2-panel">
        <div className="v2-title">
          <span>Имя игрока</span>
          <span className="v2-chip">смена — 49 ₽</span>
        </div>
        <div className="v2-field">
          <span className="v2-field__label">Ник в игре</span>
          <input
            className="v2-input"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 12))}
            placeholder="4–12 символов"
            maxLength={12}
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <button
          type="button"
          className="v2-btn v2-btn--primary"
          disabled={busy || !hasName}
          onClick={saveName}
        >
          {busy ? 'Сохраняем…' : 'Сохранить имя'}
        </button>
      </section>

      <button type="button" className="v2-btn v2-btn--ghost" onClick={onLogout}>
        Выйти из приложения
      </button>
    </div>
  );
}

export default Profile;
