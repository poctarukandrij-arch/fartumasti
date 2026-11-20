import { Avatar } from './Avatar.jsx';
import { GoldCoin } from './Crown.jsx';
import { RefIcon } from './RefIcon.jsx';

// Верхняя панель: игрок, баланс с кнопкой «+», настройки (профиль).
export function TopBar({ user, connected = false, onBalance, onSettings }) {
  const unlimited = Boolean(user?.unlimited);
  const rubles = Math.floor((Number(user?.balance) || 0) / 100);
  const amount = unlimited ? '∞' : rubles.toLocaleString('ru-RU');
  const name = user?.username || 'Игрок';

  return (
    <header className="topbar rd-top">
      <button type="button" className="rd-player" onClick={onSettings} aria-label="Открыть профиль">
        <span className="rd-player__ava">
          <Avatar name={name} size={46} ring="blue" />
          <span
            className={`rd-online ${connected ? 'rd-online--on' : ''}`}
            title={connected ? 'Соединение активно' : 'Нет соединения'}
          />
        </span>
        <span className="rd-player__text">
          <span className="rd-player__name">{name}</span>
          <span className="rd-player__id">ID: {user?.telegramId || '—'}</span>
        </span>
      </button>

      <div className="rd-top__right">
        <button
          type="button"
          className={`rd-coins ${unlimited ? 'rd-coins--unlimited' : ''}`}
          onClick={onBalance}
          aria-label="Баланс: пополнить или вывести"
        >
          <GoldCoin size={26} />
          <span className="rd-coins__num">{amount}</span>
          {unlimited ? <span className="rd-coins__tag">безлимит</span> : <span className="rd-coins__cur">₽</span>}
          <span className="rd-coins__plus" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
        <button type="button" className="rd-gear" onClick={onSettings} aria-label="Настройки профиля">
          <RefIcon name="gear" height={30} />
        </button>
      </div>
    </header>
  );
}

export default TopBar;
