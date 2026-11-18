import { useState } from 'react';
import { api, ApiError } from '../api.js';
import { Logo } from '../components/Logo.jsx';

const NAME_RE = /^[A-Za-z0-9]{4,12}$/;

function validate(name) {
  if (!name) return 'Придумайте имя';
  if (!NAME_RE.test(name)) return '4–12 символов: латинские буквы и цифры, без пробелов';
  const letters = (name.match(/[A-Za-z]/g) || []).length;
  if (letters < 3) return 'В имени должно быть минимум 3 буквы';
  return '';
}

export function Onboarding({ onDone }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const hint = name ? validate(name) : '';

  async function submit(event) {
    event.preventDefault();
    const problem = validate(name.trim());
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api('/auth/name', { method: 'POST', body: { name: name.trim() } });
      onDone(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить имя');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="onboarding screen">
      <div className="onboarding__head">
        <Logo size="lg" tagline />
      </div>

      <div className="panel onboarding__rules">
        <span className="eyebrow">Первый вход</span>
        <h1 className="h1 onboarding__title">Придумайте игровое имя</h1>
        <p className="muted small">
          Оно будет видно соперникам за столом. Позже имя можно изменить за 49 ₽.
        </p>

        <form onSubmit={submit} className="col" style={{ gap: 14, marginTop: 18 }}>
          <label className="field">
            <span className="field__label">Имя игрока</span>
            <input
              className="input input--name"
              value={name}
              onChange={(event) => {
                setName(event.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12));
                setError('');
              }}
              placeholder="Archi"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={12}
            />
          </label>

          <div className="name-status">
            <span className={`rule ${hint ? 'rule--bad' : name ? 'rule--ok' : ''}`}>
              <i className="rule__dot" aria-hidden="true" />4–12 символов
            </span>
            <span className={`rule ${hint ? 'rule--bad' : name ? 'rule--ok' : ''}`}>
              <i className="rule__dot" aria-hidden="true" />латиница и цифры
            </span>
            <span className={`rule ${hint ? 'rule--bad' : name ? 'rule--ok' : ''}`}>
              <i className="rule__dot" aria-hidden="true" />минимум 3 буквы
            </span>
          </div>

          {error ? <div className="hint hint--error">{error}</div> : null}
          {!error && hint && name ? <div className="hint">{hint}</div> : null}

          <button type="submit" className="btn btn--primary btn--lg btn--wide" disabled={busy || Boolean(hint)}>
            {busy ? 'Сохраняем…' : 'Продолжить'}
          </button>
        </form>
      </div>

      <p className="muted small center">
        Вход выполняется автоматически через Telegram. Пароль и телефон не нужны.
      </p>
    </div>
  );
}

export default Onboarding;
