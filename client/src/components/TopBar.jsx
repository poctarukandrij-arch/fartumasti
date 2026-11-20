import { Avatar } from './Avatar.jsx';
import { GoldCoin } from './Crown.jsx';

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
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3h.1a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.100a1.700 1.700 0 0 0-.3 1.800v.1a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default TopBar;
