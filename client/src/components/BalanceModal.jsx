import { useEffect, useMemo, useState } from 'react';
import { SbpMark, Sparkle } from './Art.jsx';
import { RefIcon } from './RefIcon.jsx';
import { haptic } from '../telegram.js';

const PRESETS = [500, 1000, 2500, 5000];

// Минимальные суммы операций: пополнение — 100 ₽, вывод — 500 ₽.
const MIN_TOPUP = 100;
const MIN_WITHDRAW = 500;

function rubles(value) {
  return Math.floor((Number(value) || 0) / 100).toLocaleString('ru-RU');
}

/**
 * Модальное окно баланса: пополнение и вывод только через СБП.
 * Реальные платежи не проводятся — провайдер ещё не подключён, кнопки остаются защищёнными.
 */
export function BalanceModal({ open, user, onClose, toast }) {
  const [mode, setMode] = useState('topup');
  const [amount, setAmount] = useState('1000');

  const unlimited = Boolean(user?.unlimited);
  const balance = Number(user?.balance) || 0;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [open, onClose]);

  const numeric = useMemo(() => Number(String(amount).replace(/[^\d]/g, '')) || 0, [amount]);
  const minAmount = mode === 'topup' ? MIN_TOPUP : MIN_WITHDRAW;
  const belowMin = numeric > 0 && numeric < minAmount;

  if (!open) return null;

  const hint =
    mode === 'topup'
      ? 'Пополнение через СБП станет доступно после подключения платёжного провайдера. Минимум — 100 ₽.'
      : 'Вывод откроется после согласования юридических требований и подключения СБП. Минимум — 500 ₽.';

  return (
    <div className="fm-modal" role="dialog" aria-modal="true" aria-label="Баланс" onClick={onClose}>
      <div className="fm-modal__sheet" onClick={(event) => event.stopPropagation()}>
        <span className="fm-modal__grip" aria-hidden="true" />

        <header className="fm-modal__head">
          <div>
            <span className="fm-eyebrow">Ваш счёт</span>
            <h2 className="fm-modal__title">Баланс</h2>
          </div>
          <button type="button" className="fm-iconbtn" onClick={onClose} aria-label="Закрыть">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className={`fm-wallet-hero ${unlimited ? 'fm-wallet-hero--unlimited' : ''}`}>
          <span className="fm-wallet-hero__coin" aria-hidden="true">
            <RefIcon name="coin" height={56} />
          </span>
          <div className="fm-wallet-hero__body">
            <span className="fm-wallet-hero__amount">
              {unlimited ? '∞' : rubles(balance)}
              <i>₽</i>
            </span>
            <span className="fm-wallet-hero__note">
              {unlimited ? 'Безлимитный виртуальный баланс' : 'Виртуальные игровые рубли'}
            </span>
          </div>
          <Sparkle size={16} tone="#7FE9FF" />
        </div>

        <div className="fm-segment" role="tablist">
          {[
            { id: 'topup', label: 'Пополнить' },
            { id: 'withdraw', label: 'Вывести' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={`fm-segment__btn ${mode === item.id ? 'fm-segment__btn--on' : ''}`}
              onClick={() => {
                haptic('light');
                setMode(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="fm-field">
          <span className="fm-field__label">Сумма</span>
          <span className="fm-field__box">
            <input
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, '').slice(0, 7))}
              placeholder="1000"
              aria-label="Сумма в рублях"
            />
            <i>₽</i>
          </span>
        </label>

        <div className="fm-chips">
          {PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              className={`fm-chip ${numeric === value ? 'fm-chip--on' : ''}`}
              onClick={() => {
                haptic('light');
                setAmount(String(value));
              }}
            >
              {value.toLocaleString('ru-RU')} ₽
            </button>
          ))}
        </div>

        <div className={`fm-min-note ${belowMin ? 'fm-min-note--warn' : ''}`}>
          <span>
            {belowMin
              ? `Минимум для этой операции — ${minAmount.toLocaleString('ru-RU')} ₽`
              : `Минимум ${minAmount.toLocaleString('ru-RU')} ₽ · только СБП`}
          </span>
          <span className="num">{numeric > 0 ? `${numeric.toLocaleString('ru-RU')} ₽` : '—'}</span>
        </div>

        <div className="fm-method" aria-label="Способ оплаты">
          <span className="fm-method__logo" aria-hidden="true">
            <SbpMark size={34} />
          </span>
          <span className="fm-method__body">
            <b>СБП</b>
            <small>Система быстрых платежей · по номеру телефона</small>
          </span>
          <span className="fm-method__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </span>
        </div>

        <p className="fm-note">{hint}</p>

        <button
          type="button"
          className="fm-cta fm-cta--muted"
          onClick={() => {
            if (belowMin) {
              toast?.(`Минимальная сумма — ${minAmount.toLocaleString('ru-RU')} ₽`, 'error');
              return;
            }
            toast?.('СБП подключается. Операции станут доступны после запуска провайдера.', 'info');
          }}
        >
          {mode === 'topup' ? 'Пополнить через СБП' : 'Вывести через СБП'}
          <span className="fm-cta__tag">Скоро</span>
        </button>

        <p className="fm-fineprint">
          Виртуальные рубли не являются денежными средствами. Реальные платежи не проводятся, пока платёжный
          провайдер не подключён и модель не проверена юридически.
        </p>
      </div>
    </div>
  );
}

export default BalanceModal;
