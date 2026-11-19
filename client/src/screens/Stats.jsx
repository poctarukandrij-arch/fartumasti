import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { rub, shortDate } from '../utils.js';
import { PlayerTag } from '../components/PlayerTag.jsx';

const num = (value) => Number(value) || 0;

function rateOf(wins, games) {
  if (!games) return 0;
  return Math.round((wins / games) * 100);
}

export function Stats({ me, toast }) {
  const [tab, setTab] = useState('mine');
  const [data, setData] = useState(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([api('/stats'), api('/leaderboard')])
      .then(([statsData, boardData]) => {
        if (!alive) return;
        setData(statsData);
        setBoard(boardData);
      })
      .catch((error) => toast?.(error.message, 'error'))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [toast]);

  const stats = data?.stats || me?.stats || {};
  const games = num(stats.gamesPlayed ?? stats.games ?? stats.total);
  const wins = num(stats.wins);
  const losses = num(stats.losses ?? Math.max(0, games - wins));
  const rate = rateOf(wins, games);

  const history = data?.history || [];
  const transactions = data?.transactions || [];
  const top = board?.top || [];
  const myRank = board?.me || null;
  const myId = me?.id || me?.userId;

  const inTop = useMemo(
    () => top.some((row) => row.isMe || (myId && row.userId === myId)),
    [top, myId],
  );

  function historyRow(row) {
    const won =
      typeof row.won === 'boolean'
        ? row.won
        : row.result === 'win' || (row.winnerId && row.winnerId === myId);
    const when = row.endedAt || row.finishedAt || row.createdAt || row.startedAt;
    return (
      <div key={row.id || row.matchId || when} className="v2-rank">
        <span className={`v2-rank__pos`} aria-hidden="true">
          {won ? '✓' : '✕'}
        </span>
        <span className="v2-rank__body">
          <span className="v2-rank__name">{won ? 'Победа' : 'Поражение'}</span>
          <span className="v2-rank__meta">
            {row.rounds ? `${row.rounds} раундов · ` : ''}
            {shortDate(when)}
          </span>
        </span>
        <span className="v2-rank__val" style={{ color: won ? '#7ff0cd' : '#ff9dbb' }}>
          {won ? '+1' : '—'}
        </span>
      </div>
    );
  }

  return (
    <div className="screen v2">
      <div className="v2-title">
        <span>Статистика</span>
        <span className="v2-chip">{board?.total ? `${board.total} игроков` : 'онлайн'}</span>
      </div>

      <div className="v2-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'mine'}
          className={`v2-tab ${tab === 'mine' ? 'is-on' : ''}`}
          onClick={() => setTab('mine')}
        >
          Моя статистика
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'all'}
          className={`v2-tab ${tab === 'all' ? 'is-on' : ''}`}
          onClick={() => setTab('all')}
        >
          Все игроки
        </button>
      </div>

      {tab === 'mine' ? (
        <>
          <section className="v2-stats-hero">
            <div className="v2-ring" style={{ '--p': rate }}>
              <span className="v2-ring__value">
                <span className="v2-ring__num">{rate}%</span>
                <span className="v2-ring__cap">побед</span>
              </span>
            </div>
            <div className="v2-stack" style={{ flex: '1 1 auto' }}>
              <PlayerTag
                name={me?.username || 'Игрок'}
                emoji={me?.emoji || me?.equipped?.emojis}
                size={16}
                className="v2-profile__name"
              />
              <span className="v2-eyebrow">личный зачёт</span>
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
            </div>
          </section>

          <section className="v2-panel">
            <div className="v2-title">
              <span>История игр</span>
              <span className="v2-chip">{history.length}</span>
            </div>
            {loading ? (
              <div className="v2-empty">Загружаем историю…</div>
            ) : history.length === 0 ? (
              <div className="v2-empty">Партий пока нет. Сыграй первую — статистика появится здесь.</div>
            ) : (
              <div className="v2-stack">{history.slice(0, 20).map(historyRow)}</div>
            )}
          </section>

          <section className="v2-panel">
            <div className="v2-title">
              <span>Финансовая история</span>
              <span className="v2-chip">{transactions.length}</span>
            </div>
            {transactions.length === 0 ? (
              <div className="v2-empty">Операций пока нет.</div>
            ) : (
              <div className="v2-stack">
                {transactions.slice(0, 20).map((row) => {
                  const amount = num(row.amount);
                  const positive = amount >= 0;
                  return (
                    <div key={row.id || row.txId} className="v2-rank">
                      <span className="v2-rank__pos" aria-hidden="true">
                        {positive ? '+' : '−'}
                      </span>
                      <span className="v2-rank__body">
                        <span className="v2-rank__name">{row.title || row.kind || 'Операция'}</span>
                        <span className="v2-rank__meta">{shortDate(row.createdAt)}</span>
                      </span>
                      <span
                        className="v2-rank__val"
                        style={{ color: positive ? '#7ff0cd' : '#ff9dbb' }}
                      >
                        {positive ? '+' : '−'}
                        {rub(Math.abs(amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="v2-panel">
            <div className="v2-title">
              <span>Рейтинг игроков</span>
              <span className="v2-chip">по победам</span>
            </div>

            {loading ? (
              <div className="v2-empty">Загружаем рейтинг…</div>
            ) : top.length === 0 ? (
              <div className="v2-empty">Рейтинг появится после первых партий.</div>
            ) : (
              <div className="v2-stack">
                {top.map((row) => (
                  <div
                    key={row.userId || row.rank}
                    className={`v2-rank v2-rank--${row.rank <= 3 ? row.rank : 'n'} ${
                      row.isMe || row.userId === myId ? 'v2-rank--me' : ''
                    }`}
                  >
                    <span className="v2-rank__pos">{row.rank}</span>
                    <span className="v2-rank__body">
                      <span className="v2-rank__name">
                        <PlayerTag name={row.name} emoji={row.emojis} size={14} />
                        {row.unlimited ? <span className="v2-badge-unlim">∞</span> : null}
                        {row.isMe || row.userId === myId ? (
                          <span className="v2-chip">вы</span>
                        ) : null}
                      </span>
                      <span className="v2-rank__meta">
                        {num(row.gamesPlayed)} партий · {num(row.losses)} поражений
                      </span>
                    </span>
                    <span className="v2-rank__val">
                      {num(row.wins)}
                      <small>побед</small>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {!inTop && myRank ? (
            <section className="v2-panel">
              <div className="v2-title">
                <span>Моя позиция</span>
                <span className="v2-chip v2-chip--mint">#{myRank.rank}</span>
              </div>
              <div className="v2-rank v2-rank--me">
                <span className="v2-rank__pos">{myRank.rank}</span>
                <span className="v2-rank__body">
                  <span className="v2-rank__name">
                    <PlayerTag name={myRank.name || me?.username} emoji={myRank.emojis} size={14} />
                    <span className="v2-chip">вы</span>
                  </span>
                  <span className="v2-rank__meta">
                    {num(myRank.gamesPlayed)} партий · {num(myRank.losses)} поражений
                  </span>
                </span>
                <span className="v2-rank__val">
                  {num(myRank.wins)}
                  <small>побед</small>
                </span>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

export default Stats;
