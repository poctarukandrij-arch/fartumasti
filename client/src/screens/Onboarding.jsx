import { useState } from 'react';
import { api } from '../api.js';
import { haptic } from '../telegram.js';
import { rub } from '../utils.js';

const RULES = [
  '4–12 символов, только английские буквы и цифры.',
  'Минимум 3 буквы, без пробелов и спецсимволов.',
  'Имя проверяется на уникальность на сервере.',
  'Сменить имя позже можно за 49 ₽.',
];

export default function Onboarding({ config, onDone, toast }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = (value) => {
    if (!/^[A-Za-z0-9]{4,12}$/.test(value)) {
      return 'Имя: 4–12 символов, только английские буквы и цифры.';
    }
    const letters = value.replace(/[^A-Za-z]/g, '').length;
    if (letters < 3) return 'В имени должно быть минимум 3 буквы.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    const value = name.trim();
    const problem = validate(value);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api('/auth/name', { method: 'POST', body: { name: value } });
      haptic('success');
      toast('Имя сохранено', 'success');
      onDone(data);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить имя');
      haptic('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboarding">
      <div>
        <div className="brand" style={{ fontSize: 15 }}>
          FARTU MASTI
        </div>
        <h1 className="title" style={{ fontSize: 26, marginTop: 8 }}>
          Ваше имя за столом
        </h1>
        <p className="subtitle">
          Один раз придумайте уникальное имя — оно будет видно соперникам. Приветственный бонус:{' '}
          {rub(config?.welcomeBonus ?? 25000)}.
        </p>
      </div>

      <form className="panel col" onSubmit={submit}>
        <div className="field">
          <label htmlFor="username">Имя пользователя</label>
          <input
            id="username"
            className="input"
            value={name}
            onChange={(event) => {
              setName(event.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12));
              setError('');
            }}
            placeholder="например, durakpro"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            maxLength={12}
          />
          <div className="row row--between">
            <span className="hint">Латиница и цифры, 4–12 символов</span>
            <span className="hint mono">{name.length}/12</span>
          </div>
        </div>
        {error ? <p className="hint hint--error">{error}</p> : null}
        <button className="btn btn--primary btn--wide" type="submit" disabled={busy || !name}>
          {busy ? 'Проверяем…' : 'Занять имя'}
        </button>
      </form>

      <ul className="rules">
        {RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}
