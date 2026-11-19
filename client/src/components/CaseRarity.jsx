import { useState } from 'react';

// Единый сворачиваемый список редкостей для ЛЮБОГО кейса.
// Группы строятся из фактического пула наград (box.prizes), проценты — только
// из серверного dropRates. Порядок и названия редкостей фиксированы, поэтому
// компонент одинаково работает и для трёх групп, и для одной, и для пяти.
export const RARITY_ORDER = ['mythic', 'legendary', 'epic', 'rare', 'common'];

export const RARITY_TITLE = {
  mythic: 'Мифические',
  legendary: 'Самые редкие',
  epic: 'Редкие',
  rare: 'Средняя редкость',
  common: 'Обычная редкость',
};

const OTHER_TITLE = 'Остальные предметы';

export function prizeGroups(box) {
  const pool = Array.isArray(box?.prizes) ? box.prizes : [];
  const map = new Map();
  pool.forEach((prize) => {
    const key = prize?.rarity || 'common';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(prize);
  });
  const rank = (rarity) => {
    const index = RARITY_ORDER.indexOf(rarity);
    return index === -1 ? RARITY_ORDER.length : index;
  };
  return [...map.keys()]
    .sort((a, b) => rank(a) - rank(b))
    .map((rarity) => ({
      rarity,
      title: RARITY_TITLE[rarity] || OTHER_TITLE,
      list: map.get(rarity),
    }));
}

export function CaseRaritySections({ box, rates, renderArt }) {
  const groups = prizeGroups(box);
  const [open, setOpen] = useState({});

  if (groups.length === 0) return null;

  const rateOf = (id) => {
    const row = (rates || []).find((entry) => entry.id === id);
    return row && Number.isFinite(Number(row.rate)) ? Number(row.rate) : null;
  };

  const totalOf = (list) =>
    Math.round(list.reduce((sum, prize) => sum + (rateOf(prize.id) || 0), 0) * 10) / 10;

  return (
    <div className="fm-rar">
      {groups.map((group) => {
        const isOpen = Boolean(open[group.rarity]);
        const total = totalOf(group.list);
        return (
          <section
            key={group.rarity}
            className={`fm-rar__sec ${isOpen ? 'is-open' : ''}`}
          >
            <button
              type="button"
              className="fm-rar__btn"
              aria-expanded={isOpen}
              onClick={() =>
                setOpen((prev) => ({ ...prev, [group.rarity]: !prev[group.rarity] }))
              }
            >
              <span
                className={`fm-rar__dot v2-rarity--${group.rarity}`}
                aria-hidden="true"
              />
              <span className="fm-rar__title">{group.title}</span>
              <span className="fm-rar__meta num">
                {group.list.length} · {total > 0 ? `${total}%` : '—'}
              </span>
              <span className="fm-rar__chev" aria-hidden="true">
                {isOpen ? '−' : '+'}
              </span>
            </button>

            {isOpen ? (
              <div className="fm-rar__body">
                {group.list.map((prize) => (
                  <div key={prize.id} className="fm-rar__item">
                    <span className="fm-rar__art" aria-hidden="true">
                      {renderArt ? renderArt(prize, 54) : null}
                    </span>
                    <span className="fm-rar__name">{prize.name}</span>
                    <span className="fm-rar__rate num">
                      {rateOf(prize.id) !== null ? `${rateOf(prize.id)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

export default CaseRaritySections;
