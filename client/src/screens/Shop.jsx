import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { rub } from '../utils.js';
import { Sheet } from '../components/Sheet.jsx';
import { CaseScene } from '../components/CaseScene.jsx';
import { BankCardArt, BankCaseArt, bankOf } from '../components/BankCard.jsx';
import { BankCasePanel } from '../components/BankCase.jsx';
import { playCaseSpin, playCaseWin } from '../sfx.js';
import {
  ChestArt,
  DeckArt,
  TableArt,
  EmojiArt,
  EffectArt,
  CoinArt,
  CrystalArt,
} from '../components/Art.jsx';

// Категории магазина: у каждой своя 3D-иллюстрация и понятное назначение.
const CATS = [
  { id: 'cases', label: 'Кейсы', sub: 'Награды и рулетка' },
  { id: 'deck', label: 'Колоды', sub: 'Стиль карт' },
  { id: 'table', label: 'Столы', sub: 'Оформление стола' },
  { id: 'emoji', label: 'Эмодзи', sub: 'Знак у ника' },
  { id: 'effect', label: 'Эффекты', sub: 'Появление за столом' },
];

const RARITY_LABEL = {
  common: 'обычный',
  rare: 'редкий',
  epic: 'эпический',
  legendary: 'легендарный',
  mythic: 'мифический',
};

const SPARKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Рулетка кейса: фиксированный шаг ячейки, победитель всегда встаёт по центру.
const CELL = 92;
const GAP = 10;
const STEP = CELL + GAP;
const STRIP = 44;
const WIN_INDEX = 36;
const SPIN_MS = 6400;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function itemArt(item, size = 56) {
  if (!item) return <CrystalArt size={size} />;
  if (bankOf(item.id)) return <BankCardArt itemId={item.id} size={Math.round(size * 1.6)} />;
  if (item.type === 'deck') return <DeckArt itemId={item.id} size={size} />;
  if (item.type === 'table') return <TableArt itemId={item.id} size={size} />;
  if (item.type === 'emoji') return <EmojiArt id={item.id} size={size} />;
  if (item.type === 'effect') return <EffectArt id={item.id} size={size} />;
  return <CrystalArt size={size} />;
}

function catArt(id, size = 40) {
  if (id === 'cases') return <ChestArt theme="case_bank" size={size + 12} />;
  if (id === 'deck') return <DeckArt itemId="deck_neon" size={size} />;
  if (id === 'table') return <TableArt itemId="table_aurora" size={size} />;
  if (id === 'emoji') return <EmojiArt id="emoji_fire" size={size} />;
  return <EffectArt id="effect_phoenix" size={size} />;
}

// Лента рулетки собирается только из реальных предметов кейса (box.prizes).
// Выигрыш подставляет сервер, поэтому лента всегда останавливается на нём.
function buildStrip(box, winnerId) {
  const pool = Array.isArray(box?.prizes) && box.prizes.length ? box.prizes : [];
  if (pool.length === 0) return [];
  const cells = Array.from({ length: STRIP }, () => pool[Math.floor(Math.random() * pool.length)]);
  const winner = pool.find((entry) => entry.id === winnerId) || pool[0];
  cells[WIN_INDEX] = winner;
  return cells;
}

export function Shop({ me, toast, refreshMe }) {
  const [cat, setCat] = useState('cases');
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [opening, setOpening] = useState(null);
  const [ratesBox, setRatesBox] = useState(null);
  const [offset, setOffset] = useState(0);
  const viewportRef = useRef(null);

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

  // Запуск движения рулетки: считаем смещение так, чтобы победная ячейка
  // оказалась точно по центру экрана.
  useEffect(() => {
    if (opening?.phase !== 'spin') return undefined;
    const width = viewportRef.current?.clientWidth || 360;
    const target = WIN_INDEX * STEP + CELL / 2 - width / 2;
    setOffset(0);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setOffset(target));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [opening?.phase]);

  const items = catalog?.items || [];
  const cases = catalog?.cases || [];
  const owned = useMemo(() => new Set(catalog?.owned || []), [catalog]);
  const equipped = catalog?.equipped || me?.equipped || {};
  const lockedTypes = catalog?.lockedTypes || [];
  const unlimited = Boolean(catalog?.unlimited ?? me?.unlimited);
  const balance = catalog?.balance ?? me?.balance ?? 0;

  const visible = items.filter((item) => item.type === cat);

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
      toast(`Надето: ${item.name}`, 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  // Кейс: сундук заряжается, затем медленная рулетка и показ именно той
  // награды, которую вернул сервер. Клиент не выбирает предмет.
  async function openCase(box) {
    if (opening || busyId) return;
    setBusyId(box.id);
    setOpening({ box, phase: 'charge', strip: [], data: null, item: null });
    // Звук прокрутки живёт ровно столько, сколько анимация рулетки.
    let stopSpin = () => {};

    try {
      const started = Date.now();
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

      // Даём сундуку «зарядиться», даже если сервер ответил мгновенно.
      await sleep(Math.max(0, 1100 - (Date.now() - started)));

      const strip = buildStrip(box, data.item?.id);
      setOpening({ box, phase: 'spin', strip, data, item: data.item || null });

      stopSpin = playCaseSpin(SPIN_MS);
      await sleep(SPIN_MS + 300);
      stopSpin();
      playCaseWin();
      setOpening((prev) => (prev ? { ...prev, phase: 'result' } : prev));
    } catch (error) {
      stopSpin();
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
              Надеть
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
  const isResult = opening?.phase === 'result';
  const isSpin = opening?.phase === 'spin';

  return (
    <div className="screen v2 v3-shop">
      <div className="v2-title">
        <span>Магазин</span>
        <span className="v2-chip v2-chip--mint">{unlimited ? '∞' : rub(balance)}</span>
      </div>

      <div className="v3-catbar" role="tablist" aria-label="Категории магазина">
        {CATS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={cat === entry.id}
            className={`v3-cat ${cat === entry.id ? 'is-on' : ''}`}
            onClick={() => setCat(entry.id)}
          >
            <span className="v3-cat__art" aria-hidden="true">{catArt(entry.id, 38)}</span>
            <span className="v3-cat__label">{entry.label}</span>
            <span className="v3-cat__sub">{entry.sub}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="v2-shop-grid">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton" style={{ height: 208, borderRadius: 22 }} />
          ))}
        </div>
      ) : cat === 'cases' ? (
        <>
          <p className="v2-hint">
            Кейсы открываются за виртуальные рубли. Шансы считает сервер — анимация на них не влияет.
          </p>

          <div className="v3-case-grid">
            {/* Единственная точка входа в кейс банковских карт — отдельная витрина. */}
            {(() => {
              const bankBox = cases.find((box) => box.id === 'case_bankcards');
              if (!bankBox) return null;
              return (
                <BankCasePanel
                  box={bankBox}
                  items={catalog?.items || []}
                  onOpen={openCase}
                  onRates={setRatesBox}
                  disabled={Boolean(opening) || Boolean(busyId)}
                  unlimited={Boolean(catalog?.unlimited)}
                  balance={Number(catalog?.balance) || 0}
                />
              );
            })()}
            {cases.filter((box) => box.id !== 'case_bankcards').map((box) => (
              <article key={box.id} className="v3-case">
                <div className="v3-case__stage">
                  <span className="v3-case__halo" aria-hidden="true" />
                  {box.id === 'case_bankcards' ? (
                    <BankCaseArt size={132} />
                  ) : (
                    <ChestArt theme={box.id} size={132} />
                  )}
                </div>
                <div className="v3-case__body">
                  <span className="v3-case__title">{box.name}</span>
                  <p className="v3-case__sub">{box.desc}</p>
                  <div className="v3-case__odds">
                    {Object.entries(box.odds || {}).map(([rarity, chance]) => (
                      <span key={rarity} className={`v2-rarity v2-rarity--${rarity}`}>
                        {RARITY_LABEL[rarity] || rarity} {chance}%
                      </span>
                    ))}
                  </div>
                  <div className="v3-case__pool">
                    {(box.prizes || []).slice(0, 4).map((prize) => (
                      <span key={prize.id} className="v3-case__pool-art" aria-hidden="true">
                        {itemArt(prize, 30)}
                      </span>
                    ))}
                    {(box.prizes || []).length > 4 ? (
                      <span className="v3-case__pool-more">+{(box.prizes || []).length - 4}</span>
                    ) : null}
                  </div>
                </div>
                <div className="v3-case__foot">
                  <span className="v3-case__price">{rub(box.price)}</span>
                  <button
                    type="button"
                    className="v3-case__rates"
                    onClick={() => setRatesBox(box)}
                  >
                    Шансы
                  </button>
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
                  <div key={row.openingId || row.id} className="v2-row">
                    <span className="v2-row__art" aria-hidden="true">
                      <ChestArt theme={row.caseId} size={26} />
                    </span>
                    <span className="v2-row__body">
                      <span className="v2-row__name">
                        {row.item?.name || row.itemName || 'Возврат за дубликат'}
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
            {lockedTypes.includes(cat)
              ? 'Покупка этого раздела появится позже — предпросмотр уже доступен, а предметы этого типа выпадают из кейсов.'
              : 'Косметика применяется сразу и сохраняется в профиле.'}
          </p>
          <div className="v2-shop-grid">{visible.map(renderItem)}</div>
        </>
      )}

      <CaseScene open={Boolean(opening)} label={opening?.box?.name || 'Открытие кейса'}>
        {opening ? (
        <div className="v3-scene">
          <span className="v3-scene__rays" aria-hidden="true" />
          <span className="v3-scene__glow" aria-hidden="true" />

          <div className="v3-scene__head">
            <span className="v3-scene__title">{opening.box.name}</span>
            <span className="v3-scene__state">
              {isResult ? 'Награда получена' : isSpin ? 'Рулетка крутится…' : 'Сундук открывается…'}
            </span>
          </div>

          <div className="v3-scene__stage">
            <span
              className={`v3-scene__chest ${opening.phase === 'charge' ? 'is-charging' : ''} ${
                isSpin || isResult ? 'is-open' : ''
              }`}
            >
              {opening.box.id === 'case_bankcards' ? (
                <BankCaseArt size={isResult ? 168 : 210} />
              ) : (
                <ChestArt theme={opening.box.id} size={isResult ? 168 : 224} open={isSpin || isResult} />
              )}
            </span>
            {isSpin ? (
              <span className="v3-scene__sparks" aria-hidden="true">
                {SPARKS.map((index) => <span key={index} />)}
              </span>
            ) : null}
          </div>

          {isSpin ? (
            <div className="v3-roulette" ref={viewportRef}>
              <span className="v3-roulette__marker" aria-hidden="true" />
              <div
                className="v3-roulette__track"
                style={{ transform: `translate3d(${-offset}px, 0, 0)` }}
              >
                {opening.strip.map((prize, index) => (
                  <div
                    key={`${prize?.id || 'cell'}-${index}`}
                    className={`v3-roulette__cell ${index === WIN_INDEX ? 'is-win' : ''}`}
                    style={{ width: CELL, marginRight: GAP }}
                  >
                    <span className="v3-roulette__art" aria-hidden="true">{itemArt(prize, 52)}</span>
                    <span className="v3-roulette__name">{prize?.name || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {isResult ? (
            <div className="v3-reward">
              <span className={`v3-reward__art v3-reward--${winRarity}`}>
                {opening.data?.refund ? <CoinArt size={96} /> : itemArt(opening.item, 96)}
              </span>
              {opening.data?.refund ? (
                <>
                  <span className="v3-reward__name">Дубликат</span>
                  <p className="v3-reward__hint">
                    Все предметы кейса уже собраны. Возврат {rub(opening.data.refund)}.
                  </p>
                </>
              ) : (
                <>
                  <span className="v3-reward__name">{opening.item?.name || 'Предмет получен'}</span>
                  <span className={`v3-reward__rarity v2-rarity v2-rarity--${winRarity}`}>
                    {RARITY_LABEL[winRarity] || 'обычный'}
                  </span>
                  {opening.item?.desc ? <p className="v3-reward__hint">{opening.item.desc}</p> : null}
                </>
              )}
              <button type="button" className="v2-btn v2-btn--primary" onClick={() => setOpening(null)}>
                Забрать
              </button>
            </div>
          ) : (
            <p className="v3-scene__hint">
              {opening.phase === 'charge' ? 'Кейс заряжается…' : 'Награду определяет сервер'}
            </p>
          )}
        </div>
        ) : null}
      </CaseScene>

      <Sheet
        open={Boolean(ratesBox)}
        onClose={() => setRatesBox(null)}
        title={ratesBox ? `${ratesBox.name} — шансы` : 'Шансы'}
        subtitle="Все награды и вероятности выпадения"
      >
        <div className="fm-rates">
          {(ratesBox?.prizes || []).map((prize) => {
            const row = (ratesBox?.dropRates || []).find((entry) => entry.id === prize.id);
            return (
              <div key={prize.id} className="fm-rates__row">
                <span className="fm-rates__art" aria-hidden="true">{itemArt(prize, 30)}</span>
                <span className="fm-rates__body">
                  <span className="fm-rates__name">{prize.name}</span>
                  <span className={`fm-rates__tag v2-rarity v2-rarity--${prize.rarity}`}>
                    {RARITY_LABEL[prize.rarity] || 'обычный'}
                  </span>
                </span>
                <span className="fm-rates__value num">{row ? `${row.rate}%` : '—'}</span>
              </div>
            );
          })}
        </div>
        <p className="fm-fineprint">
          Вероятности заданы на сервере и не зависят от анимации. Награду всегда определяет сервер.
        </p>
      </Sheet>
    </div>
  );
}

export default Shop;
