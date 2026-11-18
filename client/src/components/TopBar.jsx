import { Logo } from './Logo.jsx';
import { rub } from '../utils.js';

export function TopBar({ user, connected }) {
  const unlimited = Boolean(user?.unlimited);
  return (
    <header className="topbar">
      <Logo size="sm" />
      <div className="row" style={{ gap: 8 }}>
        <span className="conn" title={connected ? 'Соединение активно' : 'Переподключение'}>
          <i className={`conn__dot ${connected ? '' : 'conn__dot--off'}`} aria-hidden="true" />
          {connected ? 'в сети' : 'связь'}
        </span>
        <span className={`balance-chip ${unlimited ? 'balance-chip--unlimited' : ''}`}>
          <span className="balance-chip__coin" aria-hidden="true">₽</span>
          <span className="num">{unlimited ? '∞' : rub(user?.balance)}</span>
        </span>
      </div>
    </header>
  );
}

export default TopBar;
