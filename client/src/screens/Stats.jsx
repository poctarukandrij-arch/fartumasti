import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { rub, shortDate, relativeTime } from '../utils.js';
import { TrophyArt, ChartArt, StarArt, CardsArt, CoinArt, GiftArt } from '../components/Art.jsx';

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

  const total = Math.max(1, Number(stats.gamesPlayed) || 0);
  const winShare = Math.min(100, Math.max(0, Number(stats.winRate) || 0));

  return (
    <div className="screen">
      <div className="fm-section">
        <div>
          <span className="fm-eyebrow">Ваш прогресс</span>
          <h2 className="fm-title">Статистика</h2>
        </div>
        <span className="fm-section__hint">{total} партий</span>
      </div>

      <div className="fm-grid">
        <div className="fm-stat">
          <span className="fm-stat__ico" aria-hidden="true">
            <CardsArt size={26} />
          </span>
          <span className="fm-stat__label">Партии</span>
          <span className="fm-stat__value">{stats.gamesPlayed ?? 0}</span>
        </div>
        <div className="fm-stat">
          <span className="fm-stat__ico" aria-hidden="true">
            <TrophyArt size={26} />
          </span>
          <span className="fm-stat__label">Победы</span>
          <span className="fm-stat__value fm-stat__value--mint">{stats.wins ?? 0}</span>
        </div>
        <div className="fm-stat">
          <span className="fm-stat__ico" aria-hidden="true">
            <StarArt size={26} />
          </span>
          <span className="fm-stat__label">Поражения</span>
          <span className="fm-stat__value fm-stat__value--pink">{stats.losses ?? 0}</span>
        </div>
        <div className="fm-stat">
          <span className="fm-stat__ico" aria-hidden="true">
            <ChartArt size={26} />
          </span>
          <span className="fm-stat__label">Процент побед</span>
          <span className="fm-stat__value fm-stat__value--violet">{stats.winRate ?? 0}%</span>
        </div>
      </div>

      <div className="fm-panel fm-panel--tight" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <span className="fm-stat__label">Соотношение побед</span>
          <span className="fm-stat__label" style={{ color: '#3de3b0' }}>
            {winShare}%
          </span>
        </div>
        <div className="fm-progress" aria-hidden="true">
          <span style={{ width: `${winShare}%` }} />
        </div>
      </div>

      <div className="fm-section">
        <span className="fm-section__title">История</span>
      </div>

      <div className="fm-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`fm-chip ${tab === item.id ? 'fm-chip--on' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="fm-list">
          {[0, 1, 2].map((index) => (
            <div key={index} className="skeleton" style={{ height: 56, borderRadius: 15 }} />
          ))}
        </div>
      ) : tab === 'games' ? (
        history.length === 0 ? (
          <div className="empty">Вы ещё не сыграли ни одной партии. Начните с главного экрана.</div>
        ) : (
          <div className="fm-list">
            {history.map((row) => (
              <div key={row.matchId} className="fm-row">
                <span className="fm-row__ico" aria-hidden="true">
                  {row.isWinner ? <TrophyArt size={20} /> : <CardsArt size={20} />}
                </span>
                <span className="fm-row__body">
                  <span className="fm-row__title">
                    {row.isWinner ? 'Победа' : 'Поражение'}
                    {row.durakName ? ` · дурак: ${row.durakName}` : ''}
                  </span>
                  <span className="fm-row__sub">
                    {relativeTime(row.endedAt)} · {row.rounds || 0} раундов
                    {(row.players || []).length ? ` · ${(row.players || []).join(', ')}` : ''}
                  </span>
                </span>
                <span
                  className="fm-row__value"
                  style={{ color: row.isWinner ? '#3de3b0' : '#ff8fb8' }}
                >
                  {row.place ? `${row.place} место` : shortDate(row.endedAt)}
                </span>
              </div>
            ))}
          </div>
        )
      ) : tab === 'money' ? (
        transactions.length === 0 ? (
          <div className="empty">Операций пока нет.</div>
        ) : (
          <div className="fm-list">
            {transactions.map((row) => {
              const amount = Number(row.amount ?? row.value ?? 0);
              const title = row.reason || row.title || row.kind || row.type || 'Операция';
              return (
                <div key={row.id} className="fm-row">
                  <span className="fm-row__ico" aria-hidden="true">
                    <CoinArt size={20} />
                  </span>
                  <span className="fm-row__body">
                    <span className="fm-row__title">{title}</span>
                    <span className="fm-row__sub">{relativeTime(row.createdAt ?? row.created_at)}</span>
                  </span>
                  <span
                    className="fm-row__value"
                    style={{ color: amount >= 0 ? '#3de3b0' : '#ff8fb8' }}
                  >
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
        <div className="fm-list">
          {purchases.map((row) => (
            <div key={row.id} className="fm-row">
              <span className="fm-row__ico" aria-hidden="true">
                <GiftArt size={20} />
              </span>
              <span className="fm-row__body">
                <span className="fm-row__title">{row.itemName || row.item_id || row.itemId || 'Предмет'}</span>
                <span className="fm-row__sub">
                  {row.kind === 'case' ? 'Кейс' : 'Предмет'} · {relativeTime(row.createdAt ?? row.created_at)}
                </span>
              </span>
              <span className="fm-row__value" style={{ color: '#cfd5f6' }}>
                {rub(row.price)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Stats;
