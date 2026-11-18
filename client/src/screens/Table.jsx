import { useEffect, useState } from 'react';
import { PlayingCard, CardBack } from '../components/PlayingCard.jsx';
import { Seat } from '../components/Seat.jsx';
import { Chat } from '../components/Chat.jsx';
import { deckClassOf, tableClassOf } from '../catalog.js';
import { suitSymbol, rub } from '../utils.js';
import { haptic } from '../telegram.js';

export default function Table({ room, me, send, voice, toast, onLeave }) {
  const myId = me.user.id;
  const game = room?.game;
  const finished = room?.finished;
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceState, setVoiceState] = useState({ micOn: false, muted: [] });
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!voice) return undefined;
    voice.onChange = (next) => setVoiceState(next);
    return () => {
      voice.onChange = () => {};
    };
  }, [voice]);

  if (!room) {
    return (
      <div className="screen">
        <div className="empty">
          <span className="spinner" />
        </div>
      </div>
    );
  }

  const myPlayer = room.players.find((player) => player.userId === myId);
  const others = room.players.filter((player) => player.userId !== myId);
  const isOwner = room.ownerId === myId;
  const equipped = myPlayer?.equipped || {};
  const deckClass = deckClassOf(equipped.deck);
  const feltClass = tableClassOf(equipped.table);

  const toggleMic = async () => {
    if (!voice) {
      toast('Голосовой чат недоступен', 'error');
      return;
    }
    try {
      if (voiceState.micOn) {
        voice.disableMic();
      } else {
        await voice.enableMic(others.map((player) => player.userId));
        toast('Микрофон включён', 'success');
      }
    } catch (error) {
      toast(error.message || 'Не удалось включить микрофон', 'error');
    }
  };

  const toggleMutePlayer = (userId) => {
    if (!voice) return;
    voice.togglePlayerMuted(userId);
  };

  const secondsLeft =
    game && room.turnStartedAt && room.turnTimeoutMs
      ? Math.max(0, Math.ceil((room.turnStartedAt + room.turnTimeoutMs - tick) / 1000))
      : null;

  const playCard = (card) => {
    if (!game) return;
    if (!game.canAct) {
      toast('Сейчас не ваш ход', 'error');
      return;
    }
    haptic('light');
    if (game.defenderId === myId) {
      const slot = (game.table || []).find((pair) => !pair.defend);
      if (!slot) {
        toast('Сейчас нечего отбивать', 'error');
        return;
      }
      send({
        type: 'game:action',
        action: { type: 'defend', cardId: card.id, targetCardId: slot.attack.id },
      });
    } else {
      send({ type: 'game:action', action: { type: 'attack', cardId: card.id } });
    }
  };

  const act = (action) => {
    haptic('light');
    send({ type: 'game:action', action });
  };

  const waiting = !game && !finished;
  const iAmDefender = Boolean(game && game.defenderId === myId);
  const myHand = game?.hand || [];
  const table = game?.table || [];
  const myCardsLeft = game?.players?.find((player) => player.userId === myId)?.cards ?? 0;
  const readyCount = room.players.filter((player) => player.ready).length;
  const allReady = room.players.length >= 2 && readyCount === room.players.length;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code || room.id);
      toast('Код комнаты скопирован', 'success');
    } catch {
      toast(`Код комнаты: ${room.code || room.id}`);
    }
  };

  return (
    <div className="table-screen">
      <div className="table-top">
        <button type="button" className="icon-btn" onClick={onLeave} aria-label="Выйти из стола">
          ←
        </button>
        <div className="col" style={{ gap: 0 }}>
          <span className="strong">{room.name}</span>
          <span className="hint">
            {room.players.length}/{room.maxPlayers} игроков · код {room.code || '—'}
          </span>
        </div>
        <button type="button" className="icon-btn" onClick={copyCode} aria-label="Скопировать код">
          ⧉
        </button>
      </div>

      {waiting ? (
        <>
          <div className={`felt ${feltClass} felt--waiting`}>
            <div className="felt__inner">
              <div className="felt__title">Ожидание игроков</div>
              <div className="felt__sub">
                Готовы {readyCount} из {room.players.length}
              </div>
              <div className="seat-list">
                {room.players.map((player) => (
                  <div className="seat-row" key={player.userId}>
                    <span className={player.connected ? 'dot' : 'dot dot--off'} />
                    <span className="strong">{player.username}</span>
                    {player.isOwner ? <span className="pill">хост</span> : null}
                    <span className="hint" style={{ marginLeft: 'auto' }}>
                      {player.ready ? 'готов' : 'не готов'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="actions">
            {isOwner ? (
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={() => {
                  haptic('light');
                  send({ type: 'room:start' });
                }}
                disabled={room.players.length < 2}
              >
                {room.players.length < 2 ? 'Нужен второй игрок' : 'Начать игру'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={() => {
                  haptic('light');
                  send({ type: 'room:ready', ready: !myPlayer?.ready });
                }}
              >
                {myPlayer?.ready ? 'Не готов' : 'Готов'}
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={() => setChatOpen(true)}>
              Чат
            </button>
            {isOwner && allReady ? <span className="hint">Все готовы — можно начинать</span> : null}
          </div>
        </>
      ) : null}

      {game ? (
        <>
          <div className="table-meta">
            <span className="pill">
              Козырь {game.trumpCard ? `${game.trumpCard.rank}${suitSymbol(game.trumpSuit)}` : '—'}
            </span>
            <span className="pill">Колода: {game.deckCount}</span>
            <span className="pill">Раунд {game.round}</span>
            {secondsLeft !== null ? (
              <span className={`pill ${secondsLeft <= 10 ? 'pill--danger' : ''}`}>{secondsLeft} с</span>
            ) : null}
          </div>

          <div className="seats-strip">
            {others.map((player) => (
              <Seat
                key={player.userId}
                player={player}
                gamePlayer={game.players.find((item) => item.userId === player.userId)}
                deckClass={deckClass}
                muted={voiceState.muted.includes(player.userId)}
                onToggleMute={toggleMutePlayer}
                isSelf={false}
              />
            ))}
            {others.length === 0 ? <div className="hint">Ожидание соперника…</div> : null}
          </div>

          <div className={`felt ${feltClass}`}>
            <div className="felt__inner">
              <div className="felt__deck">
                <CardBack deckClass={deckClass} size="sm" />
                <span className="felt__deck-count">{game.deckCount}</span>
                {game.trumpCard ? (
                  <div className="felt__trump">
                    <PlayingCard card={game.trumpCard} size="xs" />
                    <span className="felt__trump-suit">{suitSymbol(game.trumpSuit)}</span>
                  </div>
                ) : null}
              </div>

              <div className="trick">
                {table.length === 0 ? (
                  <div className="trick__empty">Стол пуст</div>
                ) : (
                  table.map((pair) => (
                    <div className="trick__pair" key={pair.attack.id}>
                      <PlayingCard card={pair.attack} size="sm" />
                      {pair.defend ? (
                        <PlayingCard card={pair.defend} size="sm" />
                      ) : (
                        <div className="trick__slot" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {game.phase === 'defend' ? (
                <div className="felt__hint">
                  {iAmDefender ? 'Отбивайтесь или возьмите карты' : 'Соперник отбивается'}
                </div>
              ) : (
                <div className="felt__hint">
                  {game.canAct && !iAmDefender ? 'Ваш ход — подкиньте карту' : 'Ход соперника'}
                </div>
              )}
            </div>
          </div>

          <div className="my-hand">
            <div className="my-hand__head">
              <span className="hint">Ваши карты: {myCardsLeft}</span>
              {myPlayer ? (
                <span className="hint">
                  {game.players.find((player) => player.userId === myId)?.isAttacker
                    ? 'вы атакуете'
                    : game.players.find((player) => player.userId === myId)?.isDefender
                      ? 'вы отбиваетесь'
                      : ''}
                </span>
              ) : null}
            </div>
            <div className="hand-scroll">
              {myHand.map((card) => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  size="md"
                  onClick={() => playCard(card)}
                  disabled={!game.canAct}
                />
              ))}
              {myHand.length === 0 ? <span className="hint">Карт нет</span> : null}
            </div>
          </div>

          <div className="actions actions--game">
            {game.canAct && iAmDefender ? (
              <button type="button" className="btn btn--soft" onClick={() => act({ type: 'take' })}>
                Взять
              </button>
            ) : null}
            {game.canAct && !iAmDefender && table.length > 0 ? (
              <button type="button" className="btn btn--primary" onClick={() => act({ type: 'end' })}>
                Бито
              </button>
            ) : null}
            <button
              type="button"
              className={`btn ${voiceState.micOn ? 'btn--danger' : 'btn--soft'}`}
              onClick={toggleMic}
            >
              {voiceState.micOn ? 'Выкл. микрофон' : 'Микрофон'}
            </button>
            <button
              type="button"
              className="btn btn--soft"
              onClick={() => (voiceState.muted.length ? voice?.unmuteAll() : voice?.muteAll())}
            >
              {voiceState.muted.length ? 'Включить всех' : 'Заглушить всех'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setChatOpen(true)}>
              Чат
            </button>
          </div>
        </>
      ) : null}

      {finished ? (
        <div className="result-panel">
          <div className="result-panel__title">
            {finished.loserId && finished.loserId !== myId ? 'Вы победили' : 'Партия завершена'}
          </div>
          <p className="hint">
            {(finished.players || [])
              .map((player) => player.name)
              .filter(Boolean)
              .join(', ') || 'Итоги сохранены в статистике'}
          </p>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {isOwner ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  haptic('light');
                  send({ type: 'room:start' });
                }}
              >
                Новая партия
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  haptic('light');
                  send({ type: 'room:ready', ready: true });
                }}
              >
                Готов к новой
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={onLeave}>
              В лобби
            </button>
          </div>
        </div>
      ) : null}

      {chatOpen ? (
        <div className="sheet-backdrop" onClick={() => setChatOpen(false)}>
          <div className="sheet sheet--chat" onClick={(event) => event.stopPropagation()}>
            <div className="sheet__grab" />
            <div className="row row--between">
              <h3 className="sheet__title" style={{ margin: 0 }}>
                Чат стола
              </h3>
              <button type="button" className="icon-btn" onClick={() => setChatOpen(false)}>
                ✕
              </button>
            </div>
            <Chat
              messages={room.chat || []}
              onSend={(text) => send({ type: 'chat', text })}
              onEmoji={(emoji) => send({ type: 'chat:emoji', emoji })}
              limit={30}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
