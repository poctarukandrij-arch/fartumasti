import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { haptic } from '../telegram.js';
import { rub } from '../utils.js';
import { ItemPreview } from '../components/ItemPreview.jsx';

const TABS = [
  { id: 'deck', title: 'Колоды' },
  { id: 'table', title: 'Столы' },
  { id: 'emoji', title: 'Эмодзи' },
  { id: 'effect', title: 'Эффекты' },
  { id: 'case', title: 'Кейсы' },
];

const RARITY = {
  common: { label: 'обычная', color: '#8d95a4' },
  rare: { label: 'редкая', color: '#5b8cff' },
  epic: { label: 'эпическая', color: '#8b6cff' },
  legendary: { label: 'легендарная', color: '#ff4d6d' },
};

export default function Shop({ me, refreshMe, toast }) {
  const [tab, setTab] = useState('deck');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [reveal, setReveal] = useState(null);

  const load = useCallback(async () => {
    try {
      const next = await api('/shop');
      setData(next);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const buy = async (item) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await api('/shop/buy', { method: 'POST', body: { itemId: item.id } });
      haptic('success');
      toast(`Куплено: ${item.name}`, 'success');
      await Promise.all([load(), refreshMe()]);
    } catch (error) {
      toast(error.message, 'error');
      haptic('error');
    } finally {
      setBusyId('');
    }
  };

  const equip = async (item) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await api('/shop/equip', { method: 'POST', body: { itemId: item.id } });
      haptic('light');
      toast(`Выбрано: ${item.name}`, 'success');
      await Promise.all([load(), refreshMe()]);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  const openCase = async (box) => {
    if (busyId) return;
    setBusyId(box.id);
    try {
      const result = await api('/shop/case', { method: 'POST', body: { caseId: box.id } });
      haptic('success');
      setReveal({ box, ...result });
      await Promise.all([load(), refreshMe()]);
    } catch (error) {
      toast(error.message, 'error');
      haptic('error');
    } finally {
      setBusyId('');
    }
  };

  const balance = data?.balance ?? me.user.balance;
  const items = (data?.items || []).filter((item) => item.type === tab);
  const cases = data?.cases || [];
  const owned = new Set(data?.owned || []);
  const equipped = data?.equipped || {};

  return (
    <div className="screen">
      <div className="section__head">
        <h1 className="title" style={{ margin: 0 }}>
          Магазин
        </h1>
        <span className="balance">
          <span className="balance__icon" />
          {rub(balance)}
        </span>
      </div>

      <div className="chips-scroll">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${tab === item.id ? 'chip--active' : ''}`}
            onClick={() => {
              haptic('light');
              setTab(item.id);
            }}
          >
            {item.title}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty">
          <span className="spinner" />
        </div>
      ) : tab === 'case' ? (
        <div className="col">
          {cases.map((box) => (
            <div className="case-card" key={box.id}>
              <div className="case-card__glow" />
              <div className="col" style={{ gap: 6 }}>
                <div className="strong">{box.name}</div>
                <p className="hint" style={{ margin: 0 }}>
                  {box.desc}
                </p>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(box.odds || {}).map(([rarity, chance]) => (
                    <span
                      key={rarity}
                      className="pill"
                      style={{ color: RARITY[rarity]?.color || '#8d95a4' }}
                    >
                      {RARITY[rarity]?.label || rarity} {chance}%
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="btn btn--primary btn--wide"
                type="button"
                onClick={() => openCase(box)}
                disabled={busyId === box.id || balance < box.price}
              >
                {busyId === box.id ? 'Открываем…' : `Открыть за ${rub(box.price)}`}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="shop-grid">
          {items.map((item) => {
            const isOwned = owned.has(item.id);
            const isEquipped = equipped[item.type] === item.id;
            return (
              <div className={`shop-item ${isEquipped ? 'shop-item--active' : ''}`} key={item.id}>
                <ItemPreview item={item} />
                <div className="col" style={{ gap: 4 }}>
                  <div className="row row--between">
                    <span className="strong">{item.name}</span>
                    <span
                      className="rarity"
                      style={{ color: RARITY[item.rarity]?.color || '#8d95a4' }}
                    >
                      {RARITY[item.rarity]?.label || item.rarity}
                    </span>
                  </div>
                  <p className="hint" style={{ margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
                {isEquipped ? (
                  <button className="btn btn--soft btn--sm" type="button" disabled>
                    Выбрано
                  </button>
                ) : isOwned ? (
                  <button
                    className="btn btn--soft btn--sm"
                    type="button"
                    onClick={() => equip(item)}
                    disabled={busyId === item.id}
                  >
                    Выбрать
                  </button>
                ) : (
                  <button
                    className="btn btn--primary btn--sm"
                    type="button"
                    onClick={() => buy(item)}
                    disabled={busyId === item.id || balance < item.price}
                  >
                    {busyId === item.id ? 'Покупаем…' : rub(item.price)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reveal ? (
        <div className="sheet-backdrop" onClick={() => setReveal(null)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet__grab" />
            <h3 className="sheet__title">{reveal.item ? 'Ваш предмет' : 'Кейс открыт'}</h3>
            {reveal.item ? (
              <>
                <ItemPreview item={reveal.item} />
                <div className="strong" style={{ textAlign: 'center' }}>
                  {reveal.item.name}
                </div>
                <p className="hint" style={{ textAlign: 'center' }}>
                  {reveal.duplicate
                    ? `Предмет уже был — начислена компенсация ${rub(reveal.refund || 0)}.`
                    : 'Предмет добавлен в инвентарь.'}
                </p>
              </>
            ) : null}
            <button className="btn btn--primary btn--wide" type="button" onClick={() => setReveal(null)}>
              Понятно
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
