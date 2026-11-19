import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { rub } from '../utils.js';
import {
  ChestArt,
  DeckArt,
  TableArt,
  EmojiArt,
  EffectArt,
  CoinArt,
  CrystalArt,
  Sparkle,
} from '../components/Art.jsx';

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

const CELL_W = 82;
const WIN_INDEX = 6;

function itemArt(item, size = 56) {
  if (!item) return <CrystalArt size={size} />;
  if (item.type === 'deck') return <DeckArt itemId={item.id} size={size} />;
  if (item.type === 'table') return <TableArt itemId={item.id} size={size} />;
  if (item.type === 'emoji') return <EmojiArt id={item.id} size={size} />;
  if (item.type === 'effect') return <EffectArt id={item.id} size={size} />;
  return <CrystalArt size={size} />;
}

export function Shop({ me, toast, refreshMe }) {
  const [tab, setTab] = useState('deck');
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [opening, setOpening] = useState(null);
  const reelRef = useRef(null);

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
  const balance = catalog?.balance ?? me?.balance ?? 0;

  const visible = items.filter((item) => item.type === tab);

  async function buy(item) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const data = await api('/shop/buy', { method: 'POST', body: { itemId: item.id } });
      setCatalog((prev) =>
        prev ? { ...prev, owned: data.owned || prev.owned, balance: data.balance ?? prev.balance } : prev,
      );
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
    const width = reelRef.current?.clientWidth || 320;
    const shift = WIN_INDEX * CELL_W + CELL_W / 2 - width / 2;
    const pool = items.filter((item) => item.type === box.type || true);
    const reel = Array.from({ length: 12 }).map(
      (_, index) => pool[Math.floor(Math.random() * Math.max(1, pool.length))] || null,
    );

    setBusyId(box.id);
    setOpening({ box, phase: 'chest', reel, shift, data: null, item: null });

    // Сундук реагирует на нажатие, затем «раскрывается».
    const toSpin = setTimeout(() => setOpening((prev) => (prev ? { ...prev, phase: 'spin' } : prev)), 620);

    try {
      const requestId = `${box.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const data = await api('/shop/case', { method: 'POST', body: { caseId: box.id, requestId } });
      const found = items.find((item) => item.id === (data.itemId || data.item?.id));
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
      setOpening((prev) =>
        prev
          ? {
              ...prev,
              data,
              item: data.item || found || null,
              reel: prev.reel.map((cell, index) =>
                index === WIN_INDEX ? data.item || found || cell : cell,
              ),
            }
          : prev,
      );
      setTimeout(() => setOpening((prev) => (prev ? { ...prev, phase: 'result' } : prev)), 1250);
    } catch (error) {
      clearTimeout(toSpin);
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
    const affordable = unlimited || balance >= item.price;

    return (
      <article key={item.id} className={`fm-item ${isOwned ? 'fm-item--owned' : ''}`}>
        <div className="fm-item__art">
          {itemArt(item, 58)}
          {isEquipped ? (
            <span className="fm-rarity fm-rarity--rare" style={{ position: 'absolute', top: 7, right: 7 }}>
              надето
            </span>
          ) : null}
        </div>
        <div className="fm-item__body">
          <span className="fm-item__name">{item.name}</span>
          <span className={`fm-rarity fm-rarity--${item.rarity}`}>
            {RARITY_LABEL[item.rarity] || item.rarity}
          </span>
          <p className="fm-item__desc">{item.desc}</p>
          <div className="fm-item__foot">
            <span className="fm-item__price">{item.price === 0 ? 'бесплатно' : rub(item.price)}</span>
            {locked ? (
              <span className="fm-rarity fm-rarity--common">скоро</span>
            ) : isEquipped ? (
              <span className="fm-rarity fm-rarity--rare">выбрано</span>
            ) : isOwned ? (
              <button
                type="button"
                className="fm-item__btn fm-item__btn--soft"
                disabled={busyId === item.id}
                onClick={() => equip(item)}
              >
                Применить
              </button>
            ) : (
              <button
                type="button"
                className="fm-item__btn"
                disabled={busyId === item.id || !affordable}
                onClick={() => buy(item)}
              >
                {busyId === item.id ? '…' : affordable ? 'Купить' : 'Мало ₽'}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  const winRarity = opening?.data?.rarity || opening?.item?.rarity || 'common';

  return (
    <div className="screen">
      <div className="fm-section">
        <div>
          <span className="fm-eyebrow">Витрина</span>
          <h2 className="fm-title">Магазин</h2>
        </div>
        <span className="fm-section__hint" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <CoinArt size={16} />
          {unlimited ? '∞' : rub(balance)}
        </span>
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
        <div className="fm-shop-grid">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton" style={{ height: 200, borderRadius: 20 }} />
          ))}
        </div>
      ) : tab === 'cases' ? (
        <>
          <p className="fm-sub" style={{ margin: '0 2px 10px' }}>
            Кейсы открываются за виртуальные рубли. Шансы рассчитывает сервер — анимация на них не влияет.
          </p>
          <div className="fm-case-grid">
            {cases.map((box) => (
              <article key={box.id} className="fm-case">
                <div className="fm-case__art">
                  <ChestArt theme={box.id} size={118} />
                  <Sparkle size={12} tone="#8be6ff" />
                </div>
                <div className="fm-case__body">
                  <span className="fm-case__name">{box.name}</span>
                  <p className="fm-case__desc">{box.desc}</p>
                  <div className="fm-case__odds">
                    {Object.entries(box.odds || {}).map(([rarity, chance]) => (
                      <span key={rarity} className={`fm-rarity fm-rarity--${rarity}`}>
                        {RARITY_LABEL[rarity] || rarity} {chance}%
                      </span>
                    ))}
                  </div>
                  <div className="fm-case__foot">
                    <span className="fm-case__price">{rub(box.price)}</span>
                    <button
                      type="button"
                      className="fm-item__btn"
                      disabled={Boolean(opening) || (!unlimited && balance < box.price)}
                      onClick={() => openCase(box)}
                    >
                      Открыть
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="fm-section">
            <span className="fm-section__title">История открытий</span>
            <span className="fm-section__hint">{(catalog?.caseHistory || []).length}</span>
          </div>
          {(catalog?.caseHistory || []).length === 0 ? (
            <div className="empty">Пока нет открытых кейсов.</div>
          ) : (
            <div className="fm-list">
              {(catalog?.caseHistory || []).slice(0, 20).map((row) => (
                <div key={row.id || row.openingId} className="fm-row">
                  <span className="fm-row__ico" aria-hidden="true">
                    <ChestArt theme={row.caseId} size={22} />
                  </span>
                  <span className="fm-row__body">
                    <span className="fm-row__title">{row.itemName || row.name || 'Возврат за дубликат'}</span>
                    <span className="fm-row__sub">{row.caseName || row.caseId || 'Кейс'}</span>
                  </span>
                  <span className="fm-row__value">{row.refund ? `+${rub(row.refund)}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="fm-sub" style={{ margin: '0 2px 10px' }}>
            {lockedTypes.includes(tab)
              ? 'Покупка этого раздела появится позже — предпросмотр уже доступен.'
              : 'Косметика применяется сразу и сохраняется в профиле.'}
          </p>
          <div className="fm-shop-grid">{visible.map(renderItem)}</div>
        </>
      )}

      {opening ? (
        <div
          className="fm-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => (opening.phase === 'result' ? setOpening(null) : null)}
        >
          <div className="fm-modal__sheet" onClick={(event) => event.stopPropagation()}>
            <span className="fm-modal__grip" aria-hidden="true" />
            <div className="fm-modal__head">
              <div>
                <span className="fm-eyebrow">Кейс</span>
                <h3 className="fm-modal__title">{opening.box.name}</h3>
              </div>
              <button
                type="button"
                className="fm-iconbtn"
                aria-label="Закрыть"
                onClick={() => setOpening(null)}
                disabled={opening.phase !== 'result'}
              >
                ✕
              </button>
            </div>

            <div className="fm-opener">
              {opening.phase === 'chest' || opening.phase === 'spin' ? (
                <div className="fm-opener__stage">
                  <span
                    className={`fm-opener__burst ${opening.phase === 'spin' ? 'fm-opener__burst--on' : ''}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`fm-opener__chest ${opening.phase === 'chest' ? 'fm-opener__chest--shake' : ''} ${
                      opening.phase === 'spin' ? 'fm-opener__chest--opened' : ''
                    }`}
                  >
                    <ChestArt theme={opening.box.id} size={128} open={opening.phase === 'spin'} />
                  </span>
                </div>
              ) : null}

              {opening.phase === 'spin' ? (
                <div className="fm-reel" ref={reelRef}>
                  <div
                    className="fm-reel__track fm-reel__track--run"
                    style={{ '--fm-reel-shift': `-${opening.shift}px` }}
                  >
                    {opening.reel.map((cell, index) => (
                      <span
                        key={index}
                        className={`fm-reel__cell ${index === WIN_INDEX ? 'fm-reel__cell--win' : ''}`}
                      >
                        {itemArt(cell, 46)}
                      </span>
                    ))}
                  </div>
                  <span className="fm-reel__pointer" aria-hidden="true" />
                </div>
              ) : null}

              {opening.phase === 'result' ? (
                <div className="fm-reward">
                  <span className="fm-reward__art">
                    {opening.data?.refund ? <CoinArt size={58} /> : itemArt(opening.item, 62)}
                  </span>
                  {opening.data?.refund ? (
                    <>
                      <span className="fm-reward__name">Дубликат</span>
                      <p className="fm-reward__sub">
                        Все предметы кейса уже собраны. Возврат {rub(opening.data.refund)}.
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="fm-reward__name">{opening.item?.name || 'Предмет получен'}</span>
                      <span className={`fm-rarity fm-rarity--${winRarity}`}>
                        {RARITY_LABEL[winRarity] || 'обычный'}
                      </span>
                      {opening.item?.desc ? <p className="fm-reward__sub">{opening.item.desc}</p> : null}
                    </>
                  )}
                  <button type="button" className="fm-cta" onClick={() => setOpening(null)}>
                    Забрать
                  </button>
                </div>
              ) : null}

              {opening.phase !== 'result' ? (
                <p className="fm-note" style={{ textAlign: 'center' }}>
                  Открываем кейс…
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Shop;
