import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { rub, shortDate, relativeTime } from '../utils.js';

const TABS = [
  { id: 'games', label: 'История игр' },
  { id: 'money', label: 'Операции' },
  { id: 'buys', label: 'Покупки' },
];

export function Stats({ me, toast }) {
  const [tab, setTab] = useState('games');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api('/stats')
      .then((payload) => {
        if (alive) setData(payload);
      })
      .catch((error) => toast(error.message, 'error'))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [toast]);

  const stats = data?.stats || me?.stats || { gamesPlayed: 0, wins: 0, losses: 0, winRate: 0 };
  const history = data?.history || [];
  const transactions = data?.transactions || [];
  const purchases = data?.purchases || [];

  return (
    <div className="screen">
      <div className="section__head">
        <h2 className="h2">Статистика</h2>
        <span className="section__hint">{stats.gamesPlayed} партий</span>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat__label">Партии</span>
          <span className="stat__value">{stats.gamesPlayed}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Победы</span>
          <span className="stat__value stat__value--accent">{stats.wins}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Поражения</span>
          <span className="stat__value">{stats.losses}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Процент побед</span>
          <span className="stat__value">{stats.winRate}%</span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`tabs__btn ${tab === item.id ? 'tabs__btn--active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="list">
          {[0, 1, 2].map((index) => (
            <div key={index} className="skeleton" style={{ height: 58, marginBottom: 8 }} />
          ))}
        </div>
      ) : tab === 'games' ? (
        history.length === 0 ? (
          <div className="empty">Вы ещё не сыграли ни одной партии. Начните с главного экрана.</div>
        ) : (
          <div className="list">
            {history.map((row) => (
              <div key={row.matchId} className="list__row">
                <span className={`list__ico ${row.isWinner ? 'list__ico--win' : ''}`} aria-hidden="true">
                  {row.isWinner ? '★' : '·'}
                </span>
                <span className="list__body">
                  <span className="list__title">
                    {row.isWinner ? 'Победа' : 'Поражение'}
                    {row.durakName ? ` · дурак: ${row.durakName}` : ''}
                  </span>
                  <span className="list__sub">
                    {relativeTime(row.endedAt)} · {row.rounds || 0} раундов · {(row.players || []).join(', ')}
                  </span>
                </span>
                <span className="list__value">{row.place ? `${row.place} место` : shortDate(row.endedAt)}</span>
              </div>
            ))}
          </div>
        )
      ) : tab === 'money' ? (
        transactions.length === 0 ? (
          <div className="empty">Операций пока нет.</div>
        ) : (
          <div className="list">
            {transactions.map((row) => {
              const amount = Number(row.amount ?? row.value ?? 0);
              const title = row.reason || row.title || row.kind || row.type || 'Операция';
              return (
                <div key={row.id} className="list__row">
                  <span className="list__ico" aria-hidden="true">₽</span>
                  <span className="list__body">
                    <span className="list__title">{title}</span>
                    <span className="list__sub">{relativeTime(row.createdAt ?? row.created_at)}</span>
                  </span>
                  <span className={`list__value ${amount >= 0 ? 'list__value--in' : 'list__value--out'}`}>
                    {amount >= 0 ? '+' : '−'}
                    {rub(Math.abs(amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )
      ) : purchases.length === 0 ? (
        <div className="empty">Покупок пока нет.</div>
      ) : (
        <div className="list">
          {purchases.map((row) => (
            <div key={row.id} className="list__row">
              <span className="list__ico" aria-hidden="true">◈</span>
              <span className="list__body">
                <span className="list__title">{row.itemName || row.item_id || row.itemId || 'Предмет'}</span>
                <span className="list__sub">
                  {row.kind === 'case' ? 'Кейс' : 'Предмет'} · {relativeTime(row.createdAt ?? row.created_at)}
                </span>
              </span>
              <span className="list__value list__value--out">{rub(row.price)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Stats;
