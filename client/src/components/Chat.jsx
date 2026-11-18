import { useEffect, useRef, useState } from 'react';

const QUICK_EMOJI = ['🔥', '😂', '😎', '👍', '💀', '⚡', '🎯', '🃏'];

export function Chat({ chat = [], me, send }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chat.length]);

  function submit(event) {
    event.preventDefault();
    const value = text.trim().slice(0, 30);
    if (!value) return;
    send({ type: 'chat', text: value });
    setText('');
  }

  return (
    <div className="chat">
      <div className="chat__list" ref={listRef}>
        {chat.length === 0 ? (
          <div className="chat__empty">Чат стола. Сообщения до 30 символов.</div>
        ) : (
          chat.map((message) => {
            const mine = message.userId === me?.id;
            if (message.kind === 'emoji') {
              return (
                <div key={message.id} className={`chat__msg chat__msg--emoji ${mine ? 'chat__msg--mine' : ''}`}>
                  <span className="chat__author">{mine ? 'Вы' : message.username}</span>
                  <span className="chat__emoji">{message.text}</span>
                </div>
              );
            }
            return (
              <div key={message.id} className={`chat__msg ${mine ? 'chat__msg--mine' : ''}`}>
                <span className="chat__author">{mine ? 'Вы' : message.username}</span>
                <span className="chat__text">{message.text}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="chat__emoji-bar">
        {QUICK_EMOJI.map((symbol) => (
          <button
            key={symbol}
            type="button"
            className="chat__emoji-btn"
            onClick={() => send({ type: 'chat:emoji', symbol })}
            aria-label={`Отправить ${symbol}`}
          >
            {symbol}
          </button>
        ))}
      </div>

      <form className="chat__form" onSubmit={submit}>
        <input
          className="input chat__input"
          value={text}
          maxLength={30}
          onChange={(event) => setText(event.target.value.slice(0, 30))}
          placeholder="Сообщение"
          aria-label="Сообщение в чат"
          autoComplete="off"
        />
        <span className="chat__count">{text.length}/30</span>
        <button type="submit" className="btn btn--primary btn--sm" disabled={!text.trim()}>
          Отправить
        </button>
      </form>
    </div>
  );
}

export default Chat;
