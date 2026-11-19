import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { rub } from '../utils.js';
import { DeckArt, TableArt, EmojiArt, EffectArt, CrystalArt } from '../components/Art.jsx';

const GROUPS = [
  { id: 'deck', title: 'Колоды карт', sub: 'Так выглядят карты в руке и на столе' },
  { id: 'table', title: 'Игровые столы', sub: 'Оформление игрового стола' },
  { id: 'emoji', title: 'Эмодзи', sub: 'Значок рядом с ником' },
  { id: 'effect', title: 'Эффекты', sub: 'Появление за столом' },
];

const RARITY_LABEL = {
  common: 'обычный',
  rare: 'редкий',
  epic: 'эпический',
  legendary: 'легендарный',
  mythic: 'мифический',
};

function itemArt(item, size = 64) {
  if (!item) return <CrystalArt size={size} />;
  if (item.type === 'deck') return <DeckArt itemId={item.id} size={size} />;
  if (item.type === 'table') return <TableArt itemId={item.id} size={size} />;
  if (item.type === 'emoji') return <EmojiArt id={item.id} size={size} />;
  if (item.type === 'effect') return <EffectArt id={item.id} size={size} />;
  return <CrystalArt size={size} />;
}

// Инвентарь показывает только реальные владения с сервера: предметы из кейсов,
// покупок и бесплатные наборы. Ничего демонстрационного здесь не создаётся.
export function Inventory({ onBack, toast, refreshMe }) {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('deck');

  useEffect(() => {
    let alive = true;
    api('/shop')
      .then((data) => {
        if (alive) setCatalog(data);
      })
      .catch((error) => toast?.(error.message, 'error'))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [toast]);

  const items = catalog?.items || [];
  const owned = useMemo(() => new Set(catalog?.owned || []), [catalog]);
  const equipped = catalog?.equipped || {};
  const group = GROUPS.find((entry) => entry.id === tab) || GROUPS[0];

  const mine = items.filter((item) => item.type === tab && owned.has(item.id));
  const locked = items.filter((item) => item.type === tab && !owned.has(item.id));

  async function equip(item) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const data = await api('/shop/equip', { method: 'POST', body: { itemId: item.id } });
      setCatalog((prev) => (prev ? { ...prev, equipped: data.equipped || prev.equipped } : prev));
      refreshMe?.();
      toast?.(`Надето: ${item.name}`, 'success');
    } catch (error) {
      toast?.(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="screen v2 v3-inventory">
      <div className="v3-topline">
        <button type="button" className="v2-link" onClick={onBack}>‹ Назад</button>
        <span className="v2-chip">{mine.length} предметов</span>
      </div>

      <div className="v2-title">
        <span>Инвентарь</span>
        <span className="v2-chip v2-chip--mint">{catalog?.unlimited ? '∞' : rub(catalog?.balance || 0)}</span>
      </div>

      <section className="v2-panel v3-equipped">
        <div className="v2-title">
          <span>Сейчас надето</span>
        </div>
        <div className="v3-equipped__row">
          {GROUPS.map((entry) => {
            const current = items.find((item) => item.id === equipped[entry.id]);
            return (
              <div key={entry.id} className="v3-equipped__cell">
                <span className="v3-equipped__art" aria-hidden="true">
                  {itemArt(current || { type: entry.id, id: `x_${entry.id}` }, 44)}
                </span>
                <span className="v3-equipped__label">{entry.title}</span>
                <span className="v3-equipped__value">{current?.name || '—'}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="v2-tabs v3-tabs" role="tablist">
        {GROUPS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={`v2-tab ${tab === entry.id ? 'is-on' : ''}`}
            onClick={() => setTab(entry.id)}
          >
            {entry.title}
          </button>
        ))}
      </div>

      <p className="v2-hint">{group.sub}</p>

      {loading ? (
        <div className="v2-shop-grid">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton" style={{ height: 208, borderRadius: 22 }} />
          ))}
        </div>
      ) : (
        <>
          {mine.length === 0 ? (
            <div className="v2-empty">
              Здесь пока пусто. Открой кейс в магазине — предмет сразу появится в инвентаре.
            </div>
          ) : (
            <div className="v2-shop-grid">
              {mine.map((item) => {
                const isEquipped = equipped[item.type] === item.id;
                return (
                  <article key={item.id} className={`v2-item ${isEquipped ? 'v3-item--on' : ''}`}>
                    <div className="v2-item__stage">
                      {itemArt(item, 64)}
                      <span className={`v2-rarity v2-rarity--${item.rarity || 'common'}`}>
                        {RARITY_LABEL[item.rarity] || item.rarity}
                      </span>
                      {isEquipped ? <span className="v2-chip v2-chip--mint">надето</span> : null}
                    </div>
                    <div className="v2-item__body">
                      <span className="v2-item__name">{item.name}</span>
                      <p className="v2-item__desc">{item.desc}</p>
                    </div>
                    <div className="v2-item__foot">
                      <span className="v2-item__price">{item.isDefault ? 'базовый' : 'получено'}</span>
                      {isEquipped ? (
                        <span className="v2-chip v2-chip--mint">выбрано</span>
                      ) : (
                        <button
                          type="button"
                          className="v2-btn v2-btn--primary"
                          disabled={busyId === item.id}
                          onClick={() => equip(item)}
                        >
                          {busyId === item.id ? '…' : 'Надеть'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {locked.length > 0 ? (
            <section className="v2-panel v3-locked">
              <div className="v2-title">
                <span>Ещё не открыто</span>
                <span className="v2-chip">{locked.length}</span>
              </div>
              <div className="v3-locked__grid">
                {locked.map((item) => (
                  <div key={item.id} className="v3-locked__cell">
                    <span className="v3-locked__art" aria-hidden="true">
                      {itemArt(item, 44)}
                    </span>
                    <span className="v3-locked__name">{item.name}</span>
                    <span className="v2-rarity v2-rarity--muted">не открыто</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

export default Inventory;
