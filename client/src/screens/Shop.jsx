import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import ItemPreview from '../components/ItemPreview.jsx';
import { rub } from '../utils.js';

const TABS = [
  { id: 'deck', label: 'Колоды' },
  { id: 'table', label: 'Столы' },
  { id: 'emoji', label: 'Эмодзи' },
  { id: 'effect', label: 'Эффекты' },
  { id: 'cases', label: 'Кейсы' },
];

const RARITY_LABEL = {
  common: 'обычный',
  rare: 'редкий',
  epic: 'эпический',
  legendary: 'легендарный',
  mythic: 'мифический',
};

export function Shop({ me, toast, refreshMe }) {
  const [tab, setTab] = useState('deck');
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    let alive = true;
    api('/shop')
      .then((data) => {
        if (alive) setCatalog(data);
      })
      .catch((error) => toast(error.message, 'error'))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [toast]);

  const items = catalog?.items || [];
  const cases = catalog?.cases || [];
  const owned = useMemo(() => new Set(catalog?.owned || []), [catalog]);
  const equipped = catalog?.equipped || me?.equipped || {};
  const lockedTypes = catalog?.lockedTypes || [];
  const unlimited = Boolean(catalog?.unlimited ?? me?.unlimited);

  const visible = items.filter((item) => item.type === tab);

  async function buy(item) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const data = await api('/shop/buy', { method: 'POST', body: { itemId: item.id } });
      setCatalog((prev) => (prev ? { ...prev, owned: data.owned || prev.owned, balance: data.balance ?? prev.balance } : prev));
      refreshMe?.();
      toast(`Куплено: ${item.name}`, 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function equip(item) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const data = await api('/shop/equip', { method: 'POST', body: { itemId: item.id } });
      setCatalog((prev) => (prev ? { ...prev, equipped: data.equipped || prev.equipped } : prev));
      refreshMe?.();
      toast(`Применено: ${item.name}`, 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function openCase(box) {
    if (opening || busyId) return;
    setBusyId(box.id);
    setOpening({ box, phase: 'spin' });
    try {
      const requestId = `${box.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const data = await api('/shop/case', { method: 'POST', body: { caseId: box.id, requestId } });
      setCatalog((prev) =>
        prev
          ? {
              ...prev,
              owned: data.owned || prev.owned,
              balance: data.balance ?? prev.balance,
              caseHistory: data.caseHistory || prev.caseHistory,
              unlimited: data.unlimited ?? prev.unlimited,
            }
          : prev,
      );
      refreshMe?.();
      const found = items.find((item) => item.id === (data.itemId || data.item?.id));
      setTimeout(() => setOpening({ box, phase: 'result', data, item: data.item || found }), 1250);
    } catch (error) {
      setOpening(null);
      toast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  function renderItem(item) {
    const isOwned = owned.has(item.id) || item.isDefault;
    const isEquipped = equipped[item.type] === item.id;
    const locked = lockedTypes.includes(item.type);
    const affordable = unlimited || (catalog?.balance ?? me?.balance ?? 0) >= item.price;

    return (
      <article
        key={item.id}
        className={`item-card ${isOwned ? 'item-card--owned' : ''} ${locked ? 'item-card--locked' : ''}`}
      >
        <ItemPreview item={item} />
        <div className="item-card__name">
          {item.name}
          <span className={`rarity rarity--${item.rarity}`}>{RARITY_LABEL[item.rarity] || item.rarity}</span>
        </div>
        <p className="item-card__desc">{item.desc}</p>
        <div className="item-card__foot">
          <span className="item-card__price">{item.price === 0 ? 'бесплатно' : rub(item.price)}</span>
          {locked ? (
            <span className="chip chip--soon">Скоро</span>
          ) : isEquipped ? (
            <span className="chip">выбрано</span>
          ) : isOwned ? (
            <button
              type="button"
              className="btn btn--soft btn--xs"
              disabled={busyId === item.id}
              onClick={() => equip(item)}
            >
              Применить
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--xs"
              disabled={busyId === item.id || !affordable}
              onClick={() => buy(item)}
            >
              {busyId === item.id ? '…' : affordable ? 'Купить' : 'Мало ₽'}
            </button>
          )}
        </div>
        {locked ? <span className="lock-overlay">Покупка откроется позже</span> : null}
      </article>
    );
  }

  return (
    <div className="screen">
      <div className="section__head">
        <h2 className="h2">Магазин</h2>
        <span className="chip">
          <span className="balance-chip__coin" aria-hidden="true">₽</span>
          {unlimited ? '∞' : rub(catalog?.balance ?? me?.balance)}
        </span>
      </div>

      <div className="tabs scroll-x" role="tablist">
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
        <div className="item-grid">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton" style={{ height: 190 }} />
          ))}
        </div>
      ) : tab === 'cases' ? (
        <>
          <p className="section__hint">
            Кейсы открываются за виртуальные рубли. Шансы заданы на сервере и не зависят от анимации.
          </p>
          <div className="case-grid">
            {cases.map((box) => (
              <article key={box.id} className="case-card">
                <div className="case-card__art" aria-hidden="true">
                  <span className="case-card__chest" />
                </div>
                <div className="case-card__name">{box.name}</div>
                <p className="item-card__desc">{box.desc}</p>
                <div className="pill-row">
                  {Object.entries(box.odds || {}).map(([rarity, chance]) => (
                    <span key={rarity} className={`rarity rarity--${rarity}`}>
                      {RARITY_LABEL[rarity] || rarity} {chance}%
                    </span>
                  ))}
                </div>
                <div className="case-card__foot">
                  <span className="case-card__price">{rub(box.price)}</span>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={Boolean(opening) || (!unlimited && (catalog?.balance ?? 0) < box.price)}
                    onClick={() => openCase(box)}
                  >
                    Открыть
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="section">
            <div className="section__head">
              <h3 className="section__title">История открытий</h3>
            </div>
            {(catalog?.caseHistory || []).length === 0 ? (
              <div className="empty">Пока нет открытых кейсов.</div>
            ) : (
              <div className="list">
                {(catalog?.caseHistory || []).map((row) => (
                  <div key={row.id || row.openingId} className="list__row">
                    <span className="list__ico" aria-hidden="true">◈</span>
                    <span className="list__body">
                      <span className="list__title">{row.itemName || row.name || 'Возврат за дубликат'}</span>
                      <span className="list__sub">{row.caseName || row.caseId || 'Кейс'}</span>
                    </span>
                    <span className="list__value list__value--out">{row.refund ? `+${rub(row.refund)}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="section__hint">
            {lockedTypes.includes(tab)
              ? 'Покупка этого раздела появится позже. Предпросмотр доступен уже сейчас.'
              : 'Косметика применяется сразу и сохраняется в профиле.'}
          </p>
          <div className="item-grid">{visible.map(renderItem)}</div>
        </>
      )}

      {opening ? (
        <div className="sheet" role="dialog" aria-modal="true" onClick={() => (opening.phase === 'result' ? setOpening(null) : null)}>
          <div className="sheet__panel" onClick={(event) => event.stopPropagation()}>
            <span className="sheet__grip" aria-hidden="true" />
            <h3 className="sheet__title">{opening.box.name}</h3>
            <div className="opener">
              <div className="opener__stage">
                <div className={`opener__reel ${opening.phase === 'spin' ? 'opener__reel--spin' : ''}`}>
                  <div className="opener__track">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <span key={index} className={`opener__cell ${index === 13 ? 'opener__cell--win' : ''}`}>
                        <i className={`rarity rarity--${['common', 'rare', 'epic', 'legendary'][index % 4]}`} />
                      </span>
                    ))}
                  </div>
                </div>
                <span className="opener__pointer" aria-hidden="true" />
              </div>

              {opening.phase === 'result' ? (
                <div className="opener__result">
                  {opening.data?.refund ? (
                    <>
                      <span className="opener__result-name">Дубликат</span>
                      <p className="muted small">
                        Все предметы кейса уже собраны. Возврат {rub(opening.data.refund)}.
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="opener__result-name">{opening.item?.name || 'Предмет получен'}</span>
                      <span className={`rarity rarity--${opening.data?.rarity || opening.item?.rarity || 'common'}`}>
                        {RARITY_LABEL[opening.data?.rarity || opening.item?.rarity] || 'обычный'}
                      </span>
                      {opening.item ? <ItemPreview item={opening.item} /> : null}
                    </>
                  )}
                  <button type="button" className="btn btn--primary btn--wide" onClick={() => setOpening(null)}>
                    Забрать
                  </button>
                </div>
              ) : (
                <p className="muted small center">Открываем…</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Shop;
