import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { rub } from '../utils.js';
import { Sheet } from '../components/Sheet.jsx';
import { CaseScene } from '../components/CaseScene.jsx';
import { BankCardArt, BankCaseArt, bankOf } from '../components/BankCard.jsx';
import { BankCasePanel } from '../components/BankCase.jsx';
import { CaseRaritySections } from '../components/CaseRarity.jsx';
import { playCaseSpin, playCaseWin } from '../sfx.js';
import { Reward3D } from '../components/Items3D.jsx';
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
// Конфетти при получении награды: векторы считаем заранее, анимация — только transform/opacity.
const BURST = Array.from({ length: 26 }, (_, index) => {
  const angle = (index / 26) * Math.PI * 2 + (index % 2) * 0.12;
  const dist = 90 + (index % 4) * 38;
  return {
    id: index,
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist * 0.8) - 20,
    rot: (index * 67) % 360,
    delay: (index % 5) * 30,
    kind: index % 3,
  };
});

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
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  // Каждое открытие получает свой номер: устаревшие таймеры и звук не мешают новому.
  const runRef = useRef(0);
  const busyRef = useRef(false);
  const stopSoundRef = useRef(() => {});

  // Полный сброс: звук, незавершённые таймеры (по номеру запуска) и состояние сцены.
  function closeScene() {
    runRef.current += 1;
    busyRef.current = false;
    stopSoundRef.current();
    stopSoundRef.current = () => {};
    setBusyId(null);
    setOpening(null);
  }

  useEffect(() => {
    if (!opening || opening.phase === 'charge') return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closeScene();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opening?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      runRef.current += 1;
      stopSoundRef.current();
    },
    [],
  );

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

  // Запуск движения рулетки. Анимация создаётся заново для каждого открытия
  // (Web Animations), поэтому прошлое положение ленты не может повлиять на новое.
  useEffect(() => {
    if (opening?.phase !== 'spin') return undefined;
    const track = trackRef.current;
    if (!track) return undefined;
    const width = viewportRef.current?.clientWidth || 360;
    const target = WIN_INDEX * STEP + CELL / 2 - width / 2;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = 'translate3d(0, 0, 0)';
    const to = `translate3d(${-target}px, 0, 0)`;
    if (typeof track.animate !== 'function') {
      track.style.transform = to;
      return undefined;
    }
    track.style.transform = from;
    const animation = track.animate([{ transform: from }, { transform: to }], {
      duration: reduce ? 600 : SPIN_MS,
      easing: 'cubic-bezier(0.08, 0.72, 0.05, 1)',
      fill: 'forwards',
    });
    return () => animation.cancel();
  }, [opening?.phase, opening?.runId]);

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
    if (busyRef.current || opening || busyId) return;
    busyRef.current = true;
    runRef.current += 1;
    const run = runRef.current;
    const stale = () => runRef.current !== run;
    stopSoundRef.current();
    stopSoundRef.current = () => {};
    setBusyId(box.id);
    setOpening({ box, phase: 'charge', strip: [], data: null, item: null, runId: run });

    try {
      const started = Date.now();
      const requestId = `${box.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const data = await api('/shop/case', { method: 'POST', body: { caseId: box.id, requestId } });

      // Сервер уже списал/выдал предмет: каталог обновляем в любом случае.
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
      if (stale()) return;

      // Даём сундуку «зарядиться», даже если сервер ответил мгновенно.
      await sleep(Math.max(0, 1100 - (Date.now() - started)));
      if (stale()) return;

      const strip = buildStrip(box, data.item?.id);
      setOpening({ box, phase: 'spin', strip, data, item: data.item || null, runId: run });

      // Звук живёт ровно столько, сколько анимация; закрытие сцены глушит его.
      stopSoundRef.current = playCaseSpin(SPIN_MS);
      await sleep(SPIN_MS + 300);
      if (stale()) return;
      stopSoundRef.current();
      stopSoundRef.current = () => {};
      playCaseWin();
      setOpening((prev) => (prev && prev.runId === run ? { ...prev, phase: 'result' } : prev));
    } catch (error) {
      if (!stale()) {
        stopSoundRef.current();
        stopSoundRef.current = () => {};
        setOpening(null);
      }
      toast(error.message, 'error');
    } finally {
      if (!stale()) {
        busyRef.current = false;
        setBusyId(null);
      }
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
        <div className="v3-scene" data-phase={opening.phase} data-rarity={winRarity}>
          <span className="v3-scene__rays" aria-hidden="true" />
          <span className="v3-scene__glow" aria-hidden="true" />

          {opening.phase !== 'charge' ? (
            <button type="button" className="v3-scene__close" aria-label="Закрыть" onClick={closeScene}>
              ×
            </button>
          ) : null}
          <div className="v3-scene__head">
            <span className="v3-scene__title">{opening.box.name}</span>
            <span className="v3-scene__state">
              {isResult ? 'Награда получена' : isSpin ? 'Рулетка крутится…' : 'Сундук открывается…'}
            </span>
          </div>

          <div className="v3-scene__stage">
            <span className="v3-scene__floor" aria-hidden="true" />
            <span className="v3-scene__beam" aria-hidden="true" />
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
                key={opening.runId}
                ref={trackRef}
                className="v3-roulette__track"
              >
                {opening.strip.map((prize, index) => (
                  <div
                    key={`${prize?.id || 'cell'}-${index}`}
                    className={`v3-roulette__cell ${index === WIN_INDEX ? 'is-win' : ''}`}
                    data-rarity={prize?.rarity || 'common'}
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
              <span className="v3-burst" aria-hidden="true">
                {BURST.map((piece) => (
                  <i
                    key={piece.id}
                    className={`v3-burst__p v3-burst__p--${piece.kind}`}
                    style={{ '--dx': `${piece.dx}px`, '--dy': `${piece.dy}px`, '--r': `${piece.rot}deg`, '--d': `${piece.delay}ms` }}
                  />
                ))}
              </span>
              <span className="v3-reward__ring" aria-hidden="true" />
              {opening.data?.refund ? (
                <span className={`v3-reward__art v3-reward--${winRarity}`}>
                  <CoinArt size={96} />
                </span>
              ) : (
                <Reward3D
                  type={opening.item?.type || 'deck'}
                  rarity={opening.item?.rarity || winRarity}
                  name={opening.item?.name || ''}
                >
                  {itemArt(opening.item, opening.item?.type === 'table' ? 150 : 128)}
                </Reward3D>
              )}
              {opening.data?.refund ? (
                <>
                  <span className="v3-reward__name">Дубликат</span>
                  <p className="v3-reward__hint">
                    Все предметы кейса уже собраны. Возврат {rub(opening.data.refund)}.
                  </p>
                </>
              ) : (
                <>
                  <span className={`v3-reward__rarity v2-rarity v2-rarity--${winRarity}`}>
                    {RARITY_LABEL[winRarity] || 'обычный'}
                  </span>
                  {opening.item?.desc ? <p className="v3-reward__hint">{opening.item.desc}</p> : null}
                </>
              )}
              <button type="button" className="v2-btn v2-btn--primary" onClick={closeScene}>
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
        <CaseRaritySections
          box={ratesBox}
          rates={ratesBox?.dropRates}
          renderArt={(prize, size) => itemArt(prize, size)}
        />
        <p className="fm-fineprint">
          Вероятности заданы на сервере и не зависят от анимации. Награду всегда определяет сервер.
        </p>
      </Sheet>
    </div>
  );
}

export default Shop;
