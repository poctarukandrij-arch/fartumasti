import { BankCardArt, BankCaseArt } from './BankCard.jsx';
import { rub } from '../utils.js';

// Кейс «Банковские карты»: витрина с тремя отдельными уровнями редкости.
// Названия групп фиксированы, а проценты берутся из серверной конфигурации
// (dropRates), поэтому в интерфейсе нет выдуманных шансов.
const GROUPS = [
  { rarity: 'legendary', title: 'САМЫЕ РЕДКИЕ' },
  { rarity: 'rare', title: 'СРЕДНЯЯ РЕДКОСТЬ' },
  { rarity: 'common', title: 'ОБЫЧНАЯ РЕДКОСТЬ' },
];

export function BankCasePanel({
  box,
  items = [],
  onOpen,
  onRates,
  disabled = false,
  unlimited = false,
  balance = 0,
}) {
  if (!box) return null;

  const pool =
    Array.isArray(box.prizes) && box.prizes.length
      ? box.prizes
      : (box.pool || []).map((id) => items.find((item) => item.id === id)).filter(Boolean);
  const rates = Array.isArray(box.dropRates) ? box.dropRates : [];
  const price = Number(box.price) || 0;
  const affordable = unlimited || balance >= price;

  return (
    <article className="fm-bankcase">
      <header className="fm-bankcase__head">
        <span className="fm-bankcase__art" aria-hidden="true">
          <BankCaseArt size={116} />
        </span>
        <div className="fm-bankcase__intro">
          <h3 className="fm-bankcase__title">Банковские карты</h3>
          <p className="fm-bankcase__desc">
            {box.desc || 'Десять коллекционных карт в трёх уровнях редкости.'}
          </p>
          <div className="fm-bankcase__actions">
            <span className="fm-bankcase__price num">{rub(price)}</span>
            <button type="button" className="v3-case__rates" onClick={() => onRates?.(box)}>
              Шансы
            </button>
            <button
              type="button"
              className="v2-btn v2-btn--primary v3-case__buy"
              disabled={disabled || !affordable}
              onClick={() => onOpen?.(box)}
            >
              Открыть
            </button>
          </div>
        </div>
      </header>

      {GROUPS.map((group) => {
        const list = pool.filter((prize) => prize.rarity === group.rarity);
        if (list.length === 0) return null;
        return (
          <section key={group.rarity} className="fm-bankcase__group">
            <div className="fm-bankcase__group-head">
              <span className={`fm-bankcase__group-dot v2-rarity--${group.rarity}`} aria-hidden="true" />
              <h4 className="fm-bankcase__group-title">{group.title}</h4>
              <span className="fm-bankcase__group-count num">{list.length}</span>
            </div>
            <div className="fm-bankcase__grid">
              {list.map((prize) => {
                const rate = rates.find((entry) => entry.id === prize.id);
                return (
                  <div key={prize.id} className="fm-bankcase__item">
                    <span className="fm-bankcase__card" aria-hidden="true">
                      <BankCardArt itemId={prize.id} size={100} />
                    </span>
                    <span className="fm-bankcase__name">{prize.name}</span>
                    <span className="fm-bankcase__rate num">{rate ? `${rate.rate}%` : '—'}</span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </article>
  );
}
