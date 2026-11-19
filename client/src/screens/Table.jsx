import { useEffect, useMemo, useState } from 'react';
import PlayingCard, { CardBack } from '../components/PlayingCard.jsx';
import Seat from '../components/Seat.jsx';
import { PlayerTag } from '../components/PlayerTag.jsx';
import Chat from '../components/Chat.jsx';
import { deckClassOf, tableClassOf } from '../catalog.js';
import { suitSymbol } from '../utils.js';

const SUIT_NAME = { s: 'пики', h: 'черви', d: 'бубны', c: 'трефы' };

export function TableScreen({ room, me, send, voice, toast, onLeave, onRefreshMe, onRules }) {
  const user = me?.user || me || {};
  const myId = user.id;
  const game = room?.game;
  const [selected, setSelected] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [muted, setMuted] = useState(() => new Set());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelected(null);
  }, [game?.version, game?.round]);

  const mePlayer = room?.players?.find((player) => player.userId === myId);
  const deckClass = deckClassOf(mePlayer?.equipped?.deck);
  const feltClass = tableClassOf(mePlayer?.equipped?.table);

  const legal = game?.legal || {};
  const canAct = Boolean(game?.canAct);
  const attackIds = useMemo(() => new Set(legal.attack || []), [legal.attack]);
  const transferIds = useMemo(() => new Set(legal.transfer || []), [legal.transfer]);
  const defendOptions = useMemo(
    () => (legal.defend || []).filter((option) => option.cardId === selected),
    [legal.defend, selected],
  );

  const hand = game?.hand || [];
  const table = game?.table || [];
  const players = game?.players || [];
  const isDefender = Boolean(legal.isDefender);
  const isAttacker = Boolean(legal.isAttacker);

  const deadline = room?.turnStartedAt ? room.turnStartedAt + (room.turnTimeoutMs || 0) : 0;
  const secondsLeft = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
  const turnPlayer = players.find((player) => player.userId === game?.turnUserId);

  const peers = (room?.players || []).filter((player) => player.userId !== myId).map((player) => player.userId);

  function copyCode() {
    const code = room?.code || room?.id;
    if (!code) return;
    try {
      navigator.clipboard?.writeText(code);
      toast('Код комнаты скопирован', 'success');
    } catch {
      toast(`Код комнаты: ${code}`);
    }
  }

  function playAttack() {
    if (!selected) {
      toast('Выберите карту', 'error');
      return;
    }
    send({ type: 'attack', cardId: selected });
    setSelected(null);
  }

  function playTransfer() {
    if (!selected) return;
    send({ type: 'transfer', cardId: selected });
    setSelected(null);
  }

  function playDefend(targetCardId) {
    if (!selected) return;
    const target = targetCardId || (defendOptions.length === 1 ? defendOptions[0].targetCardId : null);
    if (!target) {
      toast('Выберите карту на столе', 'error');
      return;
    }
    send({ type: 'defend', cardId: selected, targetCardId: target });
    setSelected(null);
  }

  function onSlotClick(slot) {
    if (!isDefender || !selected) return;
    const allowed = (legal.defend || []).some(
      (option) => option.cardId === selected && option.targetCardId === slot.attack.id,
    );
    if (!allowed) {
      toast('Этой картой нельзя отбить', 'error');
      return;
    }
    playDefend(slot.attack.id);
  }

  async function toggleMic() {
    if (!voice) {
      toast('Голосовой чат недоступен', 'error');
      return;
    }
    try {
      if (micOn) {
        voice.disableMic();
        setMicOn(false);
        send({ type: 'voice:mic', mic: false });
      } else {
        await voice.enableMic(peers);
        setMicOn(true);
        send({ type: 'voice:mic', mic: true });
      }
    } catch {
      toast('Не удалось включить микрофон', 'error');
    }
  }

  function toggleMute(playerId) {
    if (!voice) return;
    voice.togglePlayerMuted(playerId);
    setMuted(new Set(voice.muted || []));
  }

  function muteAll() {
    if (!voice) return;
    if (muted.size >= peers.length && peers.length > 0) voice.unmuteAll();
    else voice.muteAll();
    setMuted(new Set(voice.muted || []));
  }

  const allMuted = peers.length > 0 && muted.size >= peers.length;

  function cardPlayable(cardId) {
    if (!canAct) return false;
    return attackIds.has(cardId) || transferIds.has(cardId) || (legal.defend || []).some((o) => o.cardId === cardId);
  }

  if (!room) return null;

  const waiting = room.status === 'waiting' || !game;

  return (
    <div className="table-screen">
      <header className="table-screen__head">
        <button type="button" className="icon-btn" onClick={onLeave} aria-label="Выйти из стола">
          ←
        </button>
        <button type="button" className="icon-btn" onClick={onRules} aria-label="Правила игры">
          ?
        </button>
        <div className="table-screen__title">
          {room.name}
          <span className="small muted">
            {room.mode === 'perevodnoy' ? 'переводной' : 'подкидной'} · {room.players.length}/{room.maxPlayers}
          </span>
        </div>
        {secondsLeft !== null && !waiting ? (
          <span className="chip chip--pulse">{secondsLeft} с</span>
        ) : (
          <button type="button" className="chip" onClick={copyCode}>
            {room.code || room.id}
          </button>
        )}
        <button
          type="button"
          className={`icon-btn ${showChat ? 'icon-btn--active' : ''}`}
          onClick={() => setShowChat((prev) => !prev)}
          aria-label="Чат"
        >
          ✎
        </button>
        <button
          type="button"
          className={`icon-btn ${showVoice ? 'icon-btn--active' : ''}`}
          onClick={() => setShowVoice((prev) => !prev)}
          aria-label="Голос"
        >
          ♪
        </button>
      </header>

      <div className={`felt ${feltClass}`}>
        <div className="seat-row">
          {players.map((player) => (
            <Seat
              key={player.userId}
              player={player}
              isMe={player.userId === myId}
              isTurn={player.userId === game?.turnUserId}
              deckClass={deckClass}
            />
          ))}
        </div>

        {waiting ? (
          <div className="waiting">
            <div className="waiting__orbit" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <span className="waiting__count">
              {room.players.length} / {room.maxPlayers} игроков
            </span>
            <p className="muted small center" style={{ margin: 0 }}>
              Код комнаты <b>{room.code || room.id}</b> — отправьте другу. Ботов за столом нет.
            </p>
            <div className="table-actions">
              <button type="button" className="btn btn--soft btn--sm" onClick={copyCode}>
                Скопировать код
              </button>
              <button
                type="button"
                className="btn btn--soft btn--sm"
                onClick={() => send({ type: 'room:ready' })}
              >
                {room.you?.ready ? 'Не готов' : 'Готов'}
              </button>
              {room.you?.isOwner ? (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  disabled={room.players.length < 2}
                  onClick={() => send({ type: 'room:start' })}
                >
                  Начать игру
                </button>
              ) : null}
            </div>
            <div className="seats-dots">
              {room.players.map((player) => (
                <span key={player.userId} className={`seat-dot ${player.connected ? 'seat-dot--on' : ''}`}>
                  <PlayerTag
                    name={player.username}
                    emoji={player.emoji || player.equipped?.emojis || player.emojis}
                    size={12}
                  />
                  {player.ready ? ' ✓' : ''}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="table-center">
              <div className="deck-stack">
                <CardBack deckClass={deckClass} />
                <span className="deck-stack__count">{game.deckCount}</span>
              </div>
              {game.trumpCard ? (
                <div className="trump">
                  <PlayingCard card={game.trumpCard} size="xs" />
                  <span className="small muted">козырь {suitSymbol(game.trumpSuit)}</span>
                </div>
              ) : null}
            </div>

            <div className="attack-row">
              {table.length === 0 ? (
                <div className="table-empty">Стол пуст · {isDefender ? 'защита' : 'атака'}</div>
              ) : (
                table.map((slot) => (
                  <button
                    key={slot.attack.id}
                    type="button"
                    className="attack-slot"
                    onClick={() => onSlotClick(slot)}
                    disabled={!isDefender}
                  >
                    <PlayingCard card={slot.attack} size="sm" />
                    {slot.defend ? (
                      <span className="attack-slot__defend">
                        <PlayingCard card={slot.defend} size="sm" />
                      </span>
                    ) : (
                      <span className="attack-slot__defend attack-slot__defend--empty" aria-hidden="true" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="turn-banner">
              {game.finished
                ? 'Партия завершена'
                : canAct
                ? isDefender
                  ? 'Ваш ход: отбивайтесь или возьмите карты'
                  : 'Ваш ход: подкиньте карту или скажите «бито»'
                : turnPlayer
                ? `Ход: ${turnPlayer.name}`
                : 'Ожидание соперника'}
            </div>

            <div className="hand">
              {hand.map((card) => {
                const playable = cardPlayable(card.id);
                return (
                  <span key={card.id} className={`hand__card ${playable ? 'hand__card--playable' : 'hand__card--dim'}`}>
                    <PlayingCard
                      card={card}
                      size="sm"
                      deckClass={deckClass}
                      selected={selected === card.id}
                      onClick={() => setSelected((prev) => (prev === card.id ? null : card.id))}
                    />
                  </span>
                );
              })}
              {hand.length === 0 ? <span className="muted small">Карт нет</span> : null}
            </div>

            <div className="table-actions">
              {canAct && !isDefender ? (
                <>
                  <button type="button" className="btn btn--primary btn--sm" onClick={playAttack} disabled={!selected}>
                    {table.length === 0 ? 'Атаковать' : 'Подкинуть'}
                  </button>
                  {transferIds.size > 0 ? (
                    <button
                      type="button"
                      className="btn btn--soft btn--sm"
                      onClick={playTransfer}
                      disabled={!selected || !transferIds.has(selected)}
                    >
                      Перевести
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => send({ type: 'end' })}
                    disabled={!legal.canEnd}
                  >
                    Бито
                  </button>
                </>
              ) : null}

              {canAct && isDefender ? (
                <>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => playDefend()}
                    disabled={!selected || defendOptions.length === 0}
                  >
                    Отбить
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => {
                      send({ type: 'take' });
                      setSelected(null);
                    }}
                    disabled={!legal.canTake}
                  >
                    Взять
                  </button>
                  {transferIds.size > 0 ? (
                    <button
                      type="button"
                      className="btn btn--soft btn--sm"
                      onClick={playTransfer}
                      disabled={!selected || !transferIds.has(selected)}
                    >
                      Перевести
                    </button>
                  ) : null}
                </>
              ) : null}

              {!canAct ? <span className="table-note">Ждём ход соперника…</span> : null}
            </div>
          </>
        )}

        {room.finished && room.result ? (
          <div className="result">
            <div className="result__card">
              <span className="result__title">
                {room.result.loserId === myId ? 'Вы проиграли' : 'Вы победили'}
              </span>
              <span className="result__sub">
                {room.result.loserName ? `Дурак: ${room.result.loserName}` : 'Партия завершена'}
              </span>
              <div className="result__actions">
                {room.you?.isOwner ? (
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => send({ type: 'room:start' })}
                  >
                    Играть снова
                  </button>
                ) : null}
                <button type="button" className="btn btn--soft btn--sm" onClick={onLeave}>
                  Выйти
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showVoice ? (
        <div className="voice-panel fm-voice">
          <div className="fm-voice__head">
            <span className="fm-voice__title">Голос стола</span>
            <button
              type="button"
              className="chat__close"
              onClick={() => setShowVoice(false)}
              aria-label="Закрыть голосовую панель"
            >
              ✕
            </button>
          </div>

          <div className="fm-voice__stage">
            <button
              type="button"
              className={`fm-mic ${micOn ? 'is-on' : ''}`}
              onClick={toggleMic}
              aria-pressed={micOn}
              aria-label={micOn ? 'Выключить микрофон' : 'Включить микрофон'}
            >
              <span className="fm-mic__pulse" aria-hidden="true" />
              <span className="fm-mic__glyph" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </span>
              <span className="fm-mic__label">{micOn ? 'Микрофон включён' : 'Включить микрофон'}</span>
            </button>

            <button
              type="button"
              className={`fm-voice__mute ${allMuted ? 'is-on' : ''}`}
              onClick={muteAll}
              disabled={peers.length === 0}
            >
              {allMuted ? 'Включить всех' : 'Заглушить всех'}
            </button>
          </div>

          <p className="fm-voice__note">
            {micOn ? 'Вас слышат игроки за столом.' : 'Микрофон выключен — вас не слышно.'}
          </p>

          {peers.length === 0 ? (
            <p className="fm-voice__empty">В комнате пока нет других игроков.</p>
          ) : (
            (room.players || [])
              .filter((player) => player.userId !== myId)
              .map((player) => (
                <div key={player.userId} className="voice-row fm-voice__row">
                  <span className="voice-row__name">
                    <PlayerTag
                      name={player.username}
                      emoji={player.emoji || player.equipped?.emojis || player.emojis}
                      size={13}
                    />
                    {player.mic ? <span className="voice-chip voice-chip--live">говорит</span> : null}
                  </span>
                  <button
                    type="button"
                    className={`voice-chip ${muted.has(player.userId) ? 'voice-chip--on' : ''}`}
                    onClick={() => toggleMute(player.userId)}
                  >
                    {muted.has(player.userId) ? 'Включить' : 'Заглушить'}
                  </button>
                </div>
              ))
          )}
        </div>
      ) : null}

      {showChat ? (
        <div className="chat">
          <div className="chat__head">
            <span className="chat__title">Чат стола</span>
            <button type="button" className="chat__close" onClick={() => setShowChat(false)} aria-label="Закрыть чат">
              ✕
            </button>
          </div>
          <Chat chat={room.chat || []} me={user} send={send} />
        </div>
      ) : null}
    </div>
  );
}

export default TableScreen;
