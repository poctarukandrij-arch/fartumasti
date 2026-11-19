import { useEffect, useMemo, useState } from 'react';
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

const RARITY_CLASS = {
  common: 'v2-rarity--common',
  rare: 'v2-rarity--rare',
  epic: 'v2-rarity--epic',
  legendary: 'v2-rarity--legendary',
  mythic: 'v2-rarity--mythic',
};

const SPARKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

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

  // Кейс: сундук крупно в центре, медленное раскрытие, затем показ
  // именно того предмета, который выдал сервер. Вероятности клиент не считает.
  async function openCase(box) {
    if (opening || busyId) return;
    setBusyId(box.id);
    setOpening({ box, phase: 'chest', data: null, item: null });

    // Медленная фаза «зарядки» сундука — 1.5 с, затем раскрытие.
    // Переводим в «spin» только пока сундук ещё заряжается: иначе таймер
    // может сработать уже после ответа сервера и откатить показ награды.
    const toOpen = setTimeout(
      () => setOpening((prev) => (prev && prev.phase === 'chest' ? { ...prev, phase: 'spin' } : prev)),
      1500,
    );

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
      // Даём раскрытию доиграть, чтобы награда появилась после эффекта.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      clearTimeout(toOpen);
      setOpening((prev) =>
        prev ? { ...prev, data, item: data.item || found || null, phase: 'result' } : prev,
      );
    } catch (error) {
      clearTimeout(toOpen);
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
      <article key={item.id} className={`v2-item ${isOwned ? 'v2-item__owned' : ''}`}>
        <div className="v2-item__stage">
          {itemArt(item, 64)}
          <span className={`v2-rarity ${RARITY_CLASS[item.rarity] || 'v2-rarity--common'}`}>
            {RARITY_LABEL[item.rarity] || item.rarity}
          </span>
          {isEquipped ? <span className="v2-chip v2-chip--mint">надето</span> : null}
        </div>
        <div className="v2-item__body">
          <span className="v2-item__name">{item.name}</span>
          <p className="v2-item__desc">{item.desc}</p>
        </div>
        <div className="v2-item__foot">
          <span className="v2-item__price">
            {item.price === 0 ? 'бесплатно' : rub(item.price)}
          </span>
          {locked ? (
            <span className="v2-chip">скоро</span>
          ) : isEquipped ? (
            <span className="v2-chip v2-chip--mint">выбрано</span>
          ) : isOwned ? (
            <button
              type="button"
              className="v2-btn"
              disabled={busyId === item.id}
              onClick={() => equip(item)}
            >
              Применить
            </button>
          ) : (
            <button
              type="button"
              className="v2-btn v2-btn--primary"
              disabled={busyId === item.id || !affordable}
              onClick={() => buy(item)}
            >
              {busyId === item.id ? '…' : affordable ? 'Купить' : 'Мало ₽'}
            </button>
          )}
        </div>
      </article>
    );
  }

  const winRarity = opening?.data?.rarity || opening?.item?.rarity || 'common';
  const chestOpen = opening?.phase === 'spin' || opening?.phase === 'result';

  return (
    <div className="screen v2">
      <div className="v2-title">
        <span>Магазин</span>
        <span className="v2-chip v2-chip--mint">{unlimited ? '∞' : rub(balance)}</span>
      </div>

      <div className="v2-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`v2-tab ${tab === item.id ? 'is-on' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="v2-shop-grid">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton" style={{ height: 208, borderRadius: 22 }} />
          ))}
        </div>
      ) : tab === 'cases' ? (
        <>
          <p className="v2-hint">
            Кейсы открываются за виртуальные рубли. Шансы рассчитывает сервер — анимация на них не влияет.
          </p>

          <div className="v2-shop-grid">
            {cases.map((box) => (
              <article key={box.id} className="v2-case-card">
                <div className="v2-case-card__chest">
                  <ChestArt theme={box.id} size={150} />
                </div>
                <div className="v2-case-card__body">
                  <span className="v2-case-card__title">{box.name}</span>
                  <p className="v2-case-card__sub">{box.desc}</p>
                  <div className="v2-case-card__odds">
                    {Object.entries(box.odds || {}).map(([rarity, chance]) => (
                      <span
                        key={rarity}
                        className={`v2-rarity ${RARITY_CLASS[rarity] || 'v2-rarity--common'}`}
                      >
                        {RARITY_LABEL[rarity] || rarity} {chance}%
                      </span>
                    ))}
                  </div>
                </div>
                <div className="v2-case-card__foot">
                  <span className="v2-case-card__price">{rub(box.price)}</span>
                  <button
                    type="button"
                    className="v2-btn v2-btn--primary"
                    disabled={Boolean(opening) || (!unlimited && balance < box.price)}
                    onClick={() => openCase(box)}
                  >
                    Открыть
                  </button>
                </div>
              </article>
            ))}
          </div>

          <section className="v2-panel">
            <div className="v2-title">
              <span>История открытий</span>
              <span className="v2-chip">{(catalog?.caseHistory || []).length}</span>
            </div>
            {(catalog?.caseHistory || []).length === 0 ? (
              <div className="v2-empty">Пока нет открытых кейсов.</div>
            ) : (
              <div className="v2-stack">
                {(catalog?.caseHistory || []).slice(0, 20).map((row) => (
                  <div key={row.id || row.openingId} className="v2-row">
                    <span className="v2-row__art" aria-hidden="true">
                      <ChestArt theme={row.caseId} size={26} />
                    </span>
                    <span className="v2-row__body">
                      <span className="v2-row__name">
                        {row.itemName || row.name || 'Возврат за дубликат'}
                      </span>
                      <span className="v2-row__meta">{row.caseName || row.caseId || 'Кейс'}</span>
                    </span>
                    <span className="v2-row__side">
                      {row.refund ? `+${rub(row.refund)}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <p className="v2-hint">
            {lockedTypes.includes(tab)
              ? 'Покупка этого раздела появится позже — предпросмотр уже доступен.'
              : 'Косметика применяется сразу и сохраняется в профиле.'}
          </p>
          <div className="v2-shop-grid">{visible.map(renderItem)}</div>
        </>
      )}

      {opening ? (
        <div
          className="v2-opener"
          role="dialog"
          aria-modal="true"
          onClick={() => (opening.phase === 'result' ? setOpening(null) : null)}
        >
          <span className="v2-opener__rays" aria-hidden="true" />

          {opening.phase !== 'result' ? (
            <div className="v2-opener__stage">
              <span className="v2-opener__halo" aria-hidden="true" />
              <span
                className={`v2-opener__chest ${opening.phase === 'chest' ? 'is-charging' : ''} ${
                  opening.phase === 'spin' ? 'is-open' : ''
                }`}
              >
                <ChestArt theme={opening.box.id} size={300} open={chestOpen} />
              </span>
              {opening.phase === 'spin' ? (
                <span className="v2-opener__sparks" aria-hidden="true">
                  {SPARKS.map((index) => (
                    <span key={index} />
                  ))}
                </span>
              ) : null}
            </div>
          ) : null}

          {opening.phase === 'result' ? (
            <div className="v2-opener__reward">
              <span className="v2-opener__reward-art">
                {opening.data?.refund ? <CoinArt size={104} /> : itemArt(opening.item, 104)}
              </span>
              {opening.data?.refund ? (
                <>
                  <span className="v2-opener__reward-name">Дубликат</span>
                  <p className="v2-opener__hint">
                    Все предметы кейса уже собраны. Возврат {rub(opening.data.refund)}.
                  </p>
                </>
              ) : (
                <>
                  <span className="v2-opener__reward-name">
                    {opening.item?.name || 'Предмет получен'}
                  </span>
                  <span className={`v2-opener__reward-rarity v2-rarity ${RARITY_CLASS[winRarity] || ''}`}>
                    {RARITY_LABEL[winRarity] || 'обычный'}
                  </span>
                  {opening.item?.desc ? (
                    <p className="v2-opener__hint">{opening.item.desc}</p>
                  ) : null}
                </>
              )}
              <button
                type="button"
                className="v2-btn v2-btn--primary"
                onClick={() => setOpening(null)}
              >
                Забрать
              </button>
            </div>
          ) : (
            <>
              <h3 className="v2-opener__title">{opening.box.name}</h3>
              <p className="v2-opener__hint">
                {opening.phase === 'chest' ? 'Кейс заряжается…' : 'Открываем…'}
              </p>
              <div className="v2-opener__progress" aria-hidden="true">
                <span />
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default Shop;
