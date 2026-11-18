import { useEffect, useRef, useState } from 'react';

const EMOJIS = ['😂', '😎', '🔥', '👏', '🤝', '😭', '😡', '🤔', '💀', '🍀', '⚡', '🃏'];

export function Chat({ messages, onSend, onEmoji, limit = 30, disabled }) {
  const [text, setText] = useState('');
  const logRef = useRef(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value.slice(0, limit));
    setText('');
  };

  return (
    <div className="chat">
      <div className="chat__log" ref={logRef}>
        {messages.length === 0 ? (
          <div className="chat__sys">Чат пуст. Сообщение до 30 символов.</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={msg.system ? 'chat__sys' : 'chat__msg'}>
              {msg.system ? (
                msg.text
              ) : (
                <>
                  <span className="chat__author">{msg.username}: </span>
                  <span>{msg.text}</span>
                </>
              )}
            </div>
          ))
        )}
      </div>
      <div className="emoji-bar">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="emoji-btn"
            onClick={() => onEmoji?.(emoji)}
            aria-label={`Отправить ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <form className="chat__form" onSubmit={submit}>
        <input
          className="chat__input"
          value={text}
          maxLength={limit}
          onChange={(event) => setText(event.target.value)}
          placeholder="Сообщение"
          aria-label="Сообщение в чат"
          disabled={disabled}
        />
        <span className="chat__counter">
          {text.length}/{limit}
        </span>
        <button className="btn btn--sm btn--primary" type="submit" disabled={!text.trim() || disabled}>
          Отправить
        </button>
      </form>
    </div>
  );
}
