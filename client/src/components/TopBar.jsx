import { rub } from '../utils.js';

export function TopBar({ user, connected }) {
  return (
    <div className="topbar" style={{ padding: '10px 16px 0', maxWidth: 620, width: '100%', margin: '0 auto' }}>
      <div className="brand">
        FARTU MASTI
      </div>
      <div className="row" style={{ gap: 8 }}>
        <span className={`pill ${connected ? 'pill--live' : ''}`} title={connected ? 'Соединение активно' : 'Нет связи'}>
          <span className="dot" style={{ background: connected ? '#37d39b' : '#ff4d6d' }} />
          {connected ? 'онлайн' : 'связь'}
        </span>
        <span className="balance">
          <span className="balance__icon" />
          {rub(user.balance)}
        </span>
      </div>
    </div>
  );
}
