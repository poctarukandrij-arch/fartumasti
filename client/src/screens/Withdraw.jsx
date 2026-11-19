import { useState } from 'react';
import { rub } from '../utils.js';

// Вывод: только СБП — единственный способ в интерфейсе.
const METHODS = ['СБП'];
// Минимальная сумма вывода — 500 ₽.
const MIN_WITHDRAW = 500;

// Раздел вывода: полноценный интерфейс будущего функционала, операции отключены.
export function Withdraw({ me, onBack }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(METHODS[0]);
  const [info, setInfo] = useState(false);

  return (
    <div className="screen">
      <div className="row row--between" style={{ marginBottom: 12 }}>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onBack}>
          ← Назад
        </button>
        <span className="chip chip--soon">Скоро</span>
      </div>

      <h2 className="h1">Вывод средств</h2>
      <p className="muted small" style={{ marginTop: 6 }}>
        Раздел подготовлен, но операции отключены. Виртуальные рубли не выводятся и не имеют денежной стоимости.
      </p>

      <div className="panel" style={{ marginTop: 16 }}>
        <span className="field__label">Доступно</span>
        <div className="display num" style={{ marginBottom: 8 }}>
          {me?.unlimited ? '∞' : rub(me?.balance)}
        </div>
        <p className="fm-min-note" style={{ marginTop: 0 }}>
          <span>Минимальная сумма вывода</span>
          <span className="num">{MIN_WITHDRAW.toLocaleString('ru-RU')} ₽</span>
        </p>

        <label className="field">
          <span className="field__label">Сумма вывода</span>
          <input
            className="input"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.,]/g, '').slice(0, 12))}
            placeholder={String(MIN_WITHDRAW)}
            disabled
            aria-disabled="true"
          />
        </label>

        <span className="field__label" style={{ display: 'block', marginTop: 16 }}>Способ</span>
        <div className="segmented" style={{ marginTop: 8 }}>
          {METHODS.map((item) => (
            <button
              key={item}
              type="button"
              className={`segmented__btn ${method === item ? 'segmented__btn--active' : ''}`}
              onClick={() => setMethod(item)}
              disabled
            >
              {item}
            </button>
          ))}
        </div>

        <button type="button" className="btn btn--primary btn--lg btn--wide" style={{ marginTop: 18 }} disabled>
          Вывести
        </button>

        <button type="button" className="btn btn--ghost btn--wide" style={{ marginTop: 8 }} onClick={() => setInfo((prev) => !prev)}>
          Как это будет работать
        </button>

        {info ? (
          <div className="soon" style={{ marginTop: 14 }}>
            <span className="soon__badge">Скоро</span>
            <span className="soon__title">Вывод появится позже</span>
            <p className="soon__text">
              Выплаты подключаются только через официального платёжного провайдера после проверки правовой
              допустимости игровой модели. До этого момента раздел неактивен, фиктивные транзакции не создаются.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Withdraw;
