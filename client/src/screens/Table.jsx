import { useEffect, useMemo, useState } from 'react';
import PlayingCard, { CardBack } from '../components/PlayingCard.jsx';
import Seat from '../components/Seat.jsx';
import { PlayerTag } from '../components/PlayerTag.jsx';
import Chat from '../components/Chat.jsx';
import { deckClassOf, tableClassOf } from '../catalog.js';
import { suitSymbol, rub } from '../utils.js';
import { shareInvite } from '../share.js';
import { Crown, GoldCoin } from '../components/Crown.jsx';

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

  const inviteCode = room?.inviteCode || '';
  const isPrivate = room?.visibility === 'private';

  function copyCode() {
    const code = isPrivate && inviteCode ? inviteCode : room?.code || room?.id;
    if (!code) return;
    try {
      navigator.clipboard?.writeText(code);
      toast(isPrivate ? 'Код приглашения скопирован' : 'Код стола скопирован', 'success');
    } catch {
      toast(`Код стола: ${code}`);
    }
  }

  function copyInviteLink() {
    const code = isPrivate && inviteCode ? inviteCode : room?.code || room?.id;
    if (!code) return;
    const link = `${window.location.origin}/?start=${code}`;
    try {
      navigator.clipboard?.writeText(link);
      toast('Ссылка-приглашение скопирована', 'success');
    } catch {
      toast(`Код приглашения: ${code}`);
    }
  }

  function invitePlayer() {
    const code = isPrivate && inviteCode ? inviteCode : room?.code || room?.id;
    if (!code) return;
    shareInvite({ code, username: user.username || '' });
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

  // Игроки по кругу: «вы» всегда внизу, остальные садятся по часовой стрелке.
  const rawSeats = waiting
    ? room.players.map((player) => ({
        userId: player.userId,
        name: player.username,
        cards: 0,
        equipped: player.equipped,
        connected: player.connected,
        ready: player.ready,
        mic: player.mic,
      }))
    : players.map((player) => {
        const info = room.players.find((entry) => entry.userId === player.userId) || {};
        return { ...player, equipped: player.equipped || info.equipped, connected: player.connected ?? info.connected, mic: player.mic ?? info.mic };
      });
  const myIndex = Math.max(0, rawSeats.findIndex((player) => player.userId === myId));
  const ordered = rawSeats.map((_, index) => rawSeats[(myIndex + index) % rawSeats.length]);
  const SLOTS = { 1: ['bottom'], 2: ['bottom', 'top'], 3: ['bottom', 'left', 'right'], 4: ['bottom', 'left', 'top', 'right'] };
  const slots = SLOTS[Math.min(4, Math.max(1, ordered.length))];
  const stake = Number(room.pot) > 0 ? { label: 'Банк', value: room.pot } : Number(room.buyIn) > 0 ? { label: 'Взнос', value: room.buyIn } : null;

  return (
    <div className="table-screen rd-table">
      <header className="rd-tablebar">
        <button type="button" className="rd-back" onClick={onLeave} aria-label="Выйти из стола">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" className="rd-tablebar__title" onClick={copyCode} aria-label="Скопировать код стола">
          <span className="rd-tablebar__name">Стол №{isPrivate && inviteCode ? inviteCode : room.code || room.id}</span>
          <span className="rd-tablebar__meta">
            {room.mode === 'perevodnoy' ? 'переводной' : 'подкидной'} · {room.players.length}/{room.maxPlayers}
          </span>
        </button>
        {secondsLeft !== null && !waiting ? <span className="rd-timer">{secondsLeft} с</span> : null}
        <span className="rd-tablebar__spacer" />
        <button type="button" className="rd-round" onClick={onRules} aria-label="Правила игры">
          ?
        </button>
        <button
          type="button"
          className={`rd-round ${showChat ? 'rd-round--on' : ''}`}
          onClick={() => setShowChat((prev) => !prev)}
          aria-label="Чат"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H11l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          </svg>
        </button>
        <button
          type="button"
          className={`rd-round ${showVoice ? 'rd-round--on' : ''}`}
          onClick={() => setShowVoice((prev) => !prev)}
          aria-label="Голос"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>
      </header>

      {stake ? (
        <div className="rd-bank">
          <GoldCoin size={22} />
          <span>
            {stake.label}: <b>{rub(stake.value)}</b>
          </span>
        </div>
      ) : null}

      <div className="rd-stage" data-felt={feltClass.replace('felt--', '')}>
        <div className="rd-oval" aria-hidden="true">
          <span className="rd-oval__crown">
            <Crown size={86} tone="purple" />
          </span>
        </div>

        {ordered.map((player, index) => (
          <Seat
            key={player.userId}
            player={player}
            slot={slots[index] || 'top'}
            isMe={player.userId === myId}
            isTurn={!waiting && player.userId === game?.turnUserId}
            deckClass={deckClass}
            waiting={waiting}
          />
        ))}

        {waiting ? (
          <div className="rd-center rd-center--wait">
            <span className="waiting__count">
              {room.players.length} / {room.maxPlayers} игроков
            </span>
            <p className="rd-note">
              {isPrivate ? (
                <>
                  Приватный стол. Код приглашения <b>{inviteCode}</b>.
                </>
              ) : (
                <>
                  Открытый стол. Код <b>{room.code || room.id}</b>. Ботов за столом нет.
                </>
              )}
            </p>
            <div className="rd-waitbtns">
              <button type="button" className="rd-btn rd-btn--violet rd-btn--sm" onClick={invitePlayer}>
                Пригласить
              </button>
              <button type="button" className="rd-btn rd-btn--violet rd-btn--sm" onClick={copyInviteLink}>
                Ссылка
              </button>
              <button type="button" className="rd-btn rd-btn--violet rd-btn--sm" onClick={copyCode}>
                Код
              </button>
              <button
                type="button"
                className={`rd-btn rd-btn--sm ${room.you?.ready ? 'rd-btn--violet' : 'rd-btn--gold'}`}
                onClick={() => send({ type: 'room:ready' })}
              >
                {room.you?.ready ? 'Не готов' : 'Готов'}
              </button>
              {room.you?.isOwner ? (
                <button
                  type="button"
                  className="rd-btn rd-btn--gold rd-btn--sm"
                  disabled={room.players.length < 2}
                  onClick={() => send({ type: 'room:start' })}
                >
                  Начать игру
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rd-center">
            <div className="rd-deck">
              <div className="deck-stack">
                <CardBack deckClass={deckClass} />
                <span className="deck-stack__count">{game.deckCount}</span>
              </div>
              {game.trumpCard ? (
                <div className="trump">
                  <PlayingCard card={game.trumpCard} size="xs" />
                  <span className="rd-trump__label">козырь {suitSymbol(game.trumpSuit)}</span>
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
          </div>
        )}
      </div>

      {!waiting ? (
        <>
          <div className="rd-status" role="status">
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

          <div className="hand rd-hand" style={{ '--n': hand.length }}>
            {hand.map((card, index) => {
              const playable = cardPlayable(card.id);
              return (
                <span
                  key={card.id}
                  className={`hand__card ${playable ? 'hand__card--playable' : 'hand__card--dim'} ${
                    selected === card.id ? 'hand__card--picked' : ''
                  }`}
                  style={{ '--i': index }}
                >
                  <PlayingCard
                    card={card}
                    size="md"
                    deckClass={deckClass}
                    selected={selected === card.id}
                    onClick={() => setSelected((prev) => (prev === card.id ? null : card.id))}
                  />
                </span>
              );
            })}
            {hand.length === 0 ? <span className="muted small">Карт нет</span> : null}
          </div>

          <div className="rd-actions">
            {canAct && !isDefender ? (
              <>
                <button
                  type="button"
                  className="rd-btn rd-btn--violet rd-actions__left"
                  onClick={() => send({ type: 'end' })}
                  disabled={!legal.canEnd}
                >
                  Бито
                </button>
                {transferIds.size > 0 ? (
                  <button
                    type="button"
                    className="rd-btn rd-btn--violet rd-actions__mid"
                    onClick={playTransfer}
                    disabled={!selected || !transferIds.has(selected)}
                  >
                    Перевести
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rd-btn rd-btn--orange rd-actions__right"
                  onClick={playAttack}
                  disabled={!selected}
                >
                  <span className="rd-btn__play" aria-hidden="true">▶</span>
                  {table.length === 0 ? 'Атаковать' : 'Подкинуть'}
                </button>
              </>
            ) : null}

            {canAct && isDefender ? (
              <>
                <button
                  type="button"
                  className="rd-btn rd-btn--violet rd-actions__left"
                  onClick={() => {
                    send({ type: 'take' });
                    setSelected(null);
                  }}
                  disabled={!legal.canTake}
                >
                  Брать карты
                </button>
                {transferIds.size > 0 ? (
                  <button
                    type="button"
                    className="rd-btn rd-btn--violet rd-actions__mid"
                    onClick={playTransfer}
                    disabled={!selected || !transferIds.has(selected)}
                  >
                    Перевести
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rd-btn rd-btn--orange rd-actions__right"
                  onClick={() => playDefend()}
                  disabled={!selected || defendOptions.length === 0}
                >
                  <span className="rd-btn__play" aria-hidden="true">▶</span>
                  Отбить
                </button>
              </>
            ) : null}

            {!canAct ? <span className="table-note rd-wait">Ждём ход соперника…</span> : null}
          </div>
        </>
      ) : null}

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
                <button type="button" className="rd-btn rd-btn--gold rd-btn--sm" onClick={() => send({ type: 'room:start' })}>
                  Играть снова
                </button>
              ) : null}
              <button type="button" className="rd-btn rd-btn--violet rd-btn--sm" onClick={onLeave}>
                Выйти
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
