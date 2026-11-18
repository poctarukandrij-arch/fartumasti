import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { rub, shortDate } from '../utils.js';

export default function Stats({ me, toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('games');

  const load = useCallback(async () => {
    try {
      const next = await api('/stats');
      setData(next);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = data?.stats || me.stats;
  const history = data?.history || [];
  const transactions = data?.transactions || [];
  const purchases = data?.purchases || [];

  return (
    <div className="screen">
      <h1 className="title">Статистика</h1>

      <div className="panel grid-2" style={{ gap: 12 }}>
        <div>
          <div className="hint">Сыграно партий</div>
          <div className="metric">{stats.gamesPlayed}</div>
        </div>
        <div>
          <div className="hint">Побед</div>
          <div className="metric metric--good">{stats.wins}</div>
        </div>
        <div>
          <div className="hint">Поражений</div>
          <div className="metric metric--bad">{stats.losses}</div>
        </div>
        <div>
          <div className="hint">Процент побед</div>
          <div className="metric">{stats.winRate}%</div>
        </div>
      </div>

      <div className="progress" aria-hidden="true">
        <span className="progress__bar" style={{ width: `${Math.min(100, stats.winRate)}%` }} />
      </div>

      <div className="chips-scroll">
        {[
          { id: 'games', title: 'История игр' },
          { id: 'money', title: 'Финансы' },
          { id: 'purchases', title: 'Покупки' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${tab === item.id ? 'chip--active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty">
          <span className="spinner" />
        </div>
      ) : tab === 'games' ? (
        history.length === 0 ? (
          <div className="empty">
            <div className="empty__title">Партий пока нет</div>
            <p className="hint">Сыграйте первую партию — история появится здесь.</p>
          </div>
        ) : (
          <div className="col">
            {history.map((match) => (
              <div className="panel row row--between" key={`${match.matchId}_${match.endedAt}`}>
                <div className="col" style={{ gap: 2 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className={`dot dot--lg`} style={{ background: match.isWinner ? '#37d39b' : '#ff4d6d' }} />
                    <span className="strong">{match.isWinner ? 'Победа' : 'Поражение'}</span>
                    <span className="hint">{match.rounds} раундов</span>
                  </div>
                  <div className="hint">
                    {(match.players || []).join(', ') || '—'}
                    {match.durakName ? ` · дурак: ${match.durakName}` : ''}
                  </div>
                </div>
                <span className="hint mono">{shortDate(match.endedAt)}</span>
              </div>
            ))}
          </div>
        )
      ) : tab === 'money' ? (
        transactions.length === 0 ? (
          <div className="empty">
            <div className="empty__title">Операций пока нет</div>
            <p className="hint">Здесь появятся пополнения, списания и выигрыши.</p>
          </div>
        ) : (
          <div className="col">
            {transactions.map((row) => {
              const amount = Number(row.amount ?? row.delta ?? 0);
              return (
                <div className="panel row row--between" key={row.id || `${row.createdAt}_${amount}`}>
                  <div className="col" style={{ gap: 2 }}>
                    <span className="strong">{row.description || row.kind || 'Операция'}</span>
                    <span className="hint mono">{shortDate(row.createdAt ?? row.created_at)}</span>
                  </div>
                  <span className={`amount ${amount >= 0 ? 'amount--in' : 'amount--out'}`}>
                    {amount >= 0 ? '+' : '−'}
                    {rub(Math.abs(amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )
      ) : purchases.length === 0 ? (
        <div className="empty">
          <div className="empty__title">Покупок пока нет</div>
          <p className="hint">Загляните в магазин за колодами и оформлением.</p>
        </div>
      ) : (
        <div className="col">
          {purchases.map((row) => (
            <div className="panel row row--between" key={row.id || `${row.itemId}_${row.createdAt}`}>
              <div className="col" style={{ gap: 2 }}>
                <span className="strong">{row.name || row.itemId || row.item_id}</span>
                <span className="hint mono">{shortDate(row.createdAt ?? row.created_at)}</span>
              </div>
              <span className="amount amount--out">−{rub(row.price ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
