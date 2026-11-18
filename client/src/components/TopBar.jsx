import { CoinArt } from './Art.jsx';
import { LogoMark } from './Logo.jsx';

// Верхняя панель: бренд, статус соединения и баланс с кнопкой «+».
export function TopBar({ user, connected = false, onBalance }) {
  const unlimited = Boolean(user?.unlimited);
  const rubles = Math.floor((Number(user?.balance) || 0) / 100);
  const amount = unlimited ? '∞' : rubles.toLocaleString('ru-RU');

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <LogoMark size={34} />
        <span className="topbar__name">
          <b>FARTU</b>
          <i>MASTI</i>
        </span>
        <span
          className={`topbar__status ${connected ? 'topbar__status--on' : ''}`}
          title={connected ? 'Соединение активно' : 'Нет соединения'}
        />
      </div>

      <div className="topbar__right">
        <button
          type="button"
          className={`balance-chip ${unlimited ? 'balance-chip--unlimited' : ''}`}
          onClick={onBalance}
          aria-label="Баланс: пополнить или вывести"
        >
          <span className="balance-chip__coin" aria-hidden="true">
            <CoinArt size={19} />
          </span>
          <span className="balance-chip__value">
            <span className="balance-chip__num">{amount}</span>
            <span className="balance-chip__cur" aria-hidden="true">
              ₽
            </span>
          </span>
          {unlimited ? <span className="balance-chip__tag">безлимит</span> : null}
          <span className="balance-chip__plus" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
      </div>
    </header>
  );
}

export default TopBar;
