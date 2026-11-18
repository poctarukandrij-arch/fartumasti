import { useState } from 'react';
import { api } from '../api.js';
import { haptic, closeApp } from '../telegram.js';
import { rub } from '../utils.js';

export default function Profile({ me, refreshMe, onLogout, toast }) {
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const user = me.user;
  const price = me.config?.nameChangePrice ?? 4900;

  const toggle = async (field) => {
    haptic('light');
    try {
      const data = await api('/profile/settings', {
        method: 'POST',
        body: {
          soundEnabled: field === 'soundEnabled' ? !user.soundEnabled : Boolean(user.soundEnabled),
          notificationsEnabled:
            field === 'notificationsEnabled' ? !user.notificationsEnabled : Boolean(user.notificationsEnabled),
        },
      });
      await refreshMe();
      toast(
        field === 'soundEnabled'
          ? data.user.soundEnabled
            ? 'Звук включён'
            : 'Звук выключен'
          : data.user.notificationsEnabled
            ? 'Уведомления включены'
            : 'Уведомления выключены',
        'success',
      );
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const changeName = async () => {
    const value = name.trim();
    if (!/^[A-Za-z0-9]{4,12}$/.test(value) || value.replace(/[^A-Za-z]/g, '').length < 3) {
      toast('Имя: 4–12 символов, минимум 3 английские буквы', 'error');
      return;
    }
    setBusy(true);
    try {
      await api('/profile/name', { method: 'POST', body: { name: value } });
      await refreshMe();
      setModal(false);
      setName('');
      haptic('success');
      toast('Имя изменено', 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <section className="panel col">
        <div className="row" style={{ gap: 14 }}>
          <div className="avatar">{user.username.slice(0, 2).toUpperCase()}</div>
          <div className="col" style={{ gap: 2 }}>
            <div className="strong" style={{ fontSize: 18 }}>
              {user.username}
            </div>
            <div className="hint mono">Telegram ID: {user.telegramId}</div>
          </div>
        </div>
        <div className="row row--between" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 14 }}>
          <div>
            <div className="hint">Баланс</div>
            <div className="balance">{rub(user.balance)}</div>
          </div>
          <button className="btn btn--soft btn--sm" type="button" onClick={() => setModal(true)}>
            Сменить имя
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Статистика</h2>
        </div>
        <div className="panel grid-2" style={{ gap: 10 }}>
          <div>
            <div className="hint">Партии</div>
            <div className="strong">{me.stats.gamesPlayed}</div>
          </div>
          <div>
            <div className="hint">Победы</div>
            <div className="strong">{me.stats.wins}</div>
          </div>
          <div>
            <div className="hint">Поражения</div>
            <div className="strong">{me.stats.losses}</div>
          </div>
          <div>
            <div className="hint">Процент побед</div>
            <div className="strong">{me.stats.winRate}%</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Настройки</h2>
        </div>
        <div className="panel col" style={{ gap: 0 }}>
          <div className="row row--between setting">
            <div>
              <div>Звук</div>
              <div className="hint">Сигналы хода и уведомления</div>
            </div>
            <button
              type="button"
              className={`switch ${user.soundEnabled ? 'switch--on' : ''}`}
              onClick={() => toggle('soundEnabled')}
              aria-pressed={Boolean(user.soundEnabled)}
            >
              <span className="switch__knob" />
            </button>
          </div>
          <div className="row row--between setting">
            <div>
              <div>Уведомления</div>
              <div className="hint">Напоминания о ходе в партии</div>
            </div>
            <button
              type="button"
              className={`switch ${user.notificationsEnabled ? 'switch--on' : ''}`}
              onClick={() => toggle('notificationsEnabled')}
              aria-pressed={Boolean(user.notificationsEnabled)}
            >
              <span className="switch__knob" />
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Платежи</h2>
        </div>
        <div className="panel col">
          <p className="hint" style={{ margin: 0 }}>
            {me.config?.payments?.depositsEnabled
              ? 'Пополнение доступно через платёжный провайдер.'
              : 'Приём платежей не подключён: нужны ключи платёжного провайдера. Покупки в магазине идут с баланса.'}
          </p>
          <div className="row" style={{ gap: 8 }}>
            <span className="pill">{me.config?.payments?.providerLabel || 'Провайдер не настроен'}</span>
            <span className="pill">мин. {rub(me.config?.payments?.depositMin ?? 10000)}</span>
          </div>
        </div>
      </section>

      <button className="btn btn--ghost btn--wide" type="button" onClick={onLogout}>
        Выйти из приложения
      </button>
      <button className="btn btn--ghost btn--wide btn--sm" type="button" onClick={() => closeApp()}>
        Закрыть приложение
      </button>

      {modal ? (
        <div className="sheet-backdrop" onClick={() => setModal(false)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet__grab" />
            <h3 className="sheet__title">Новое имя</h3>
            <p className="hint">Стоимость смены — {rub(price)}. Средства списываются с баланса.</p>
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12))}
              placeholder={user.username}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button className="btn btn--primary btn--wide" type="button" onClick={changeName} disabled={busy}>
              {busy ? 'Сохраняем…' : `Сменить за ${rub(price)}`}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
