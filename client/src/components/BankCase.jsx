import { BankCardArt, BankCaseArt } from './BankCard.jsx';
import { CaseRaritySections } from './CaseRarity.jsx';
import { rub } from '../utils.js';

// Кейс «Банковские карты»: витрина с уровнями редкости.
// Редкости свёрнуты в компактные кнопки (общий компонент CaseRaritySections),
// проценты берутся только из серверной конфигурации (dropRates).

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
  const viewBox = { ...box, prizes: pool };
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

      <CaseRaritySections
        box={viewBox}
        rates={rates}
        renderArt={(prize, size) => <BankCardArt itemId={prize.id} size={size} />}
      />
    </article>
  );
}
