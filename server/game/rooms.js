// Менеджер игровых комнат: матчмейкинг, партии, чат, голосовые сигналы,
// переподключение и восстановление сессий после перезапуска сервера.
import crypto from 'node:crypto';
import { createGame, applyAction, publicState, handlePlayerLeft, autoAction, GameError } from './durak.js';
import { db } from '../db.js';
import { checkMessage, sanitizeMessage } from '../filter.js';
import { equippedOf } from '../shop.js';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DISCONNECT_GRACE_MS = 90 * 1000;
const FINISHED_ROOM_TTL_MS = 10 * 60 * 1000;
const CHAT_COOLDOWN_MS = 1000;
const MAX_CHAT_HISTORY = 60;
const ALLOWED_CHAT_EMOJI = ['😀', '😂', '😎', '😱', '😡', '🤔', '👍', '👎', '🔥', '💀', '❄️', '⚡', '💎', '🚀', '🎉', '🤝'];

export class RoomError extends Error {
  constructor(message, code = 'ROOM_ERROR') {
    super(message);
    this.name = 'RoomError';
    this.code = code;
  }
}

function roomCode() {
  let out = '';
  for (let i = 0; i < 5; i += 1) out += ROOM_CODE_ALPHABET[crypto.randomInt(ROOM_CODE_ALPHABET.length)];
  return out;
}

function makePlayer(user) {
  return {
    userId: user.id,
    username: user.username,
    connected: true,
    ready: false,
    equipped: equippedOf(user),
  };
}

export function createRoomManager({
  sendToUser,
  onlineUserIds,
  turnTimeoutMs = 45000,
  logger = console,
  onMatchFinished = null,
  matchmakingDelayMs = 0,
}) {
  const rooms = new Map();
  const userRoom = new Map();
  const queue = [];
  const graceTimers = new Map();
  const chatCooldown = new Map();
  const voiceState = new Map(); // roomId -> { userId: {mic:boolean} }

  function onlineCount() {
    return onlineUserIds().length;
  }

  function roomView(room, userId) {
    const game = room.game && !room.game.finished ? publicState(room.game, userId) : null;
    const finishedState = room.game && room.game.finished ? publicState(room.game, userId) : null;
    return {
      id: room.id,
      code: room.code || null,
      name: room.name,
      status: room.status,
      maxPlayers: room.maxPlayers,
      ownerId: room.ownerId,
      createdAt: room.createdAt,
      players: room.players.map((p) => ({
        userId: p.userId,
        username: p.username,
        connected: p.connected,
        ready: p.ready,
        isOwner: p.userId === room.ownerId,
        equipped: p.equipped,
        mic: Boolean(voiceState.get(room.id)?.[p.userId]?.mic),
      })),
      chat: room.chat.slice(-MAX_CHAT_HISTORY),
      game: game || finishedState,
      finished: Boolean(room.game && room.game.finished),
      result: room.result || null,
      matchId: room.matchId || null,
      turnStartedAt: room.game?.turnStartedAt || null,
      turnTimeoutMs,
      you: {
        userId,
        isOwner: userId === room.ownerId,
        ready: room.players.find((p) => p.userId === userId)?.ready || false,
      },
    };
  }

  function lobbyPayload() {
    const openRooms = [...rooms.values()]
      .filter((room) => room.status === 'waiting' && room.players.length < room.maxPlayers)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30)
      .map((room) => ({
        id: room.id,
        code: room.code || null,
        name: room.name,
        players: room.players.length,
        maxPlayers: room.maxPlayers,
        status: room.status,
        ownerName: room.players.find((p) => p.userId === room.ownerId)?.username || '—',
      }));
    const playing = [...rooms.values()].filter((room) => room.status === 'playing').length;
    return {
      online: onlineCount(),
      rooms: openRooms,
      activeTables: playing,
      queueSize: queue.length,
      turnTimeoutMs,
    };
  }

  function broadcastLobby() {
    const payload = { type: 'lobby', lobby: lobbyPayload() };
    for (const userId of onlineUserIds()) sendToUser(userId, payload);
  }

  function broadcastRoom(room) {
    for (const player of room.players) {
      sendToUser(player.userId, { type: 'room', room: roomView(room, player.userId) });
    }
  }

  function persistRoom(room) {
    try {
      const snapshot = {
        id: room.id,
        name: room.name,
        ownerId: room.ownerId,
        maxPlayers: room.maxPlayers,
        players: room.players,
        chat: room.chat.slice(-20),
        status: room.status,
        game: room.game,
        result: room.result,
        matchId: room.matchId,
        createdAt: room.createdAt,
      };
      db.run(
        `INSERT INTO rooms (id, code, owner_id, max_players, status, state, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET status = excluded.status, state = excluded.state, updated_at = excluded.updated_at`,
        [
          room.id,
          room.code,
          room.ownerId,
          room.maxPlayers,
          room.status,
          JSON.stringify(snapshot),
          room.createdAt,
          Date.now(),
        ],
      );
    } catch (error) {
      logger.error?.('[rooms] persist failed', error);
    }
  }

  function deletePersistedRoom(roomId) {
    try {
      db.run('DELETE FROM rooms WHERE id = ?', [roomId]);
    } catch (error) {
      logger.error?.('[rooms] delete persisted failed', error);
    }
  }

  function userRow(userId) {
    return db.get('SELECT * FROM users WHERE id = ?', [userId]);
  }

  function insertMatch(room) {
    const matchId = crypto.randomUUID();
    db.run(
      `INSERT INTO matches (id, room_id, status, players, started_at) VALUES (?, ?, 'playing', ?, ?)`,
      [matchId, room.id, room.players.length, Date.now()],
    );
    return matchId;
  }

  function finalizeGame(room) {
    if (!room.game || !room.game.finished || room.finishedRecorded) return;
    room.finishedRecorded = true;
    room.status = 'finished';
    const state = room.game;
    const loser = state.players.find((p) => p.userId === state.loserId) || null;
    const winners = state.players.filter((p) => p.userId !== state.loserId);
    room.result = {
      loserId: loser?.userId || null,
      loserName: loser?.name || '—',
      winners: winners.map((p) => ({ userId: p.userId, name: p.name })),
      finishedAt: state.finishedAt || Date.now(),
      rounds: state.round || 0,
    };

    if (room.matchId) {
      const finishedAt = room.result.finishedAt;
      db.run(
        'UPDATE matches SET status = ?, ended_at = ?, rounds = ?, loser_id = ?, players_json = ? WHERE id = ?',
        [
          'finished',
          finishedAt,
          room.result.rounds,
          room.result.loserId,
          JSON.stringify(state.players.map((p) => ({ userId: p.userId, name: p.name }))),
          room.matchId,
        ],
      );
      for (const player of state.players) {
        const isWinner = player.userId !== state.loserId;
        const cardsLeft = player.hand.length;
        db.run(
          `INSERT INTO match_results (match_id, user_id, is_winner, place, cards_left, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [room.matchId, player.id, isWinner ? 1 : 0, isWinner ? 1 : 2, cardsLeft, finishedAt],
        );
        db.run(
          `UPDATE users SET
             games_played = games_played + 1,
             wins = wins + ?,
             losses = losses + ?,
             updated_at = ?
           WHERE id = ?`,
          [isWinner ? 1 : 0, isWinner ? 0 : 1, Date.now(), player.id],
        );
      }
    }

    for (const player of room.players) player.ready = false;
    if (typeof onMatchFinished === 'function') {
      try {
        onMatchFinished({ room, result: room.result, matchId: room.matchId });
      } catch (error) {
        logger.error?.('[rooms] onMatchFinished failed', error);
      }
    }
    persistRoom(room);
    broadcastRoom(room);
    broadcastLobby();
  }

  function startGame(room) {
    if (room.players.length < 2) throw new RoomError('За столом нужно минимум два игрока', 'NOT_ENOUGH_PLAYERS');
    const infos = room.players.map((p, index) => ({ userId: p.userId, name: p.username, seat: index }));
    const game = createGame(infos, Math.random);
    room.game = game;
    room.status = 'playing';
    room.finishedRecorded = false;
    room.result = null;
    room.matchId = insertMatch(room);
    for (const player of room.players) player.ready = false;
    persistRoom(room);
    broadcastRoom(room);
    broadcastLobby();
    return room;
  }

  function createRoom(user, { maxPlayers = 2, name = null } = {}) {
    if (userRoom.has(user.id)) leaveRoom(user.id, { silent: true });
    const size = [2, 3, 4].includes(Number(maxPlayers)) ? Number(maxPlayers) : 2;
    const code = roomCode();
    const room = {
      id: `room_${crypto.randomUUID()}`,
      code,
      name: name ? String(name).slice(0, 24) : `Стол ${code}`,
      ownerId: user.id,
      maxPlayers: size,
      players: [makePlayer(user)],
      chat: [],
      status: 'waiting',
      game: null,
      result: null,
      matchId: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      finishedRecorded: false,
    };
    rooms.set(room.id, room);
    userRoom.set(user.id, room.id);
    persistRoom(room);
    broadcastLobby();
    broadcastRoom(room);
    return room;
  }

  function joinRoom(user, roomId) {
    let room = rooms.get(roomId);
    if (!room && roomId) {
      const code = String(roomId).trim().toUpperCase();
      room = [...rooms.values()].find(
        (item) =>
          String(item.code || '').toUpperCase() === code ||
          String(item.id).toUpperCase() === code,
      );
    }
    if (!room) throw new RoomError('Стол не найден', 'ROOM_NOT_FOUND');
    if (room.players.some((p) => p.userId === user.id)) {
      broadcastRoom(room);
      return room;
    }
    if (room.status !== 'waiting') throw new RoomError('За этим столом уже идёт партия', 'ROOM_PLAYING');
    if (room.players.length >= room.maxPlayers) throw new RoomError('За столом нет свободных мест', 'ROOM_FULL');
    if (userRoom.has(user.id)) leaveRoom(user.id, { silent: true });
    room.players.push(makePlayer(user));
    room.lastActivity = Date.now();
    userRoom.set(user.id, room.id);
    persistRoom(room);
    broadcastLobby();
    broadcastRoom(room);
    return room;
  }

  function leaveRoom(userId, { silent = false } = {}) {
    const roomId = userRoom.get(userId);
    if (!roomId) return;
    const room = rooms.get(roomId);
    userRoom.delete(userId);
    graceTimers.delete(userId);
    if (!room) return;

    const wasPlaying = room.status === 'playing' && room.game && !room.game.finished;
    if (wasPlaying) {
      handlePlayerLeft(room.game, userId);
      if (room.game.finished) finalizeGame(room);
      else persistRoom(room);
    }

    room.players = room.players.filter((p) => p.userId !== userId);
    const voice = voiceState.get(room.id);
    if (voice) delete voice[userId];

    if (room.players.length === 0) {
      rooms.delete(room.id);
      voiceState.delete(room.id);
      deletePersistedRoom(room.id);
    } else {
      if (room.ownerId === userId) room.ownerId = room.players[0].userId;
      if (room.status === 'playing' && !room.game?.finished) {
        if (room.players.filter((p) => p.connected).length < 2) {
          // Остался один игрок — партия не может продолжаться.
          if (room.game) room.game.finished = true;
          finalizeGame(room);
        }
      }
      persistRoom(room);
      if (!silent) broadcastRoom(room);
    }
    broadcastLobby();
  }

  function handleAction(userId, action) {
    const roomId = userRoom.get(userId);
    if (!roomId) throw new RoomError('Вы не за игровым столом', 'NOT_IN_ROOM');
    const room = rooms.get(roomId);
    if (!room || !room.game) throw new RoomError('Партия не найдена', 'NO_GAME');
    if (room.game.finished) throw new RoomError('Партия завершена', 'GAME_FINISHED');
    applyAction(room.game, userId, action);
    room.lastActivity = Date.now();
    persistRoom(room);
    broadcastRoom(room);
    if (room.game.finished) finalizeGame(room);
    return room;
  }

  function playTurnTimeout(room) {
    if (!room.game || room.game.finished) return;
    if (Date.now() - (room.game.turnStartedAt || 0) < turnTimeoutMs) return;
    const outcome = autoAction(room.game);
    if (outcome) {
      applyAction(room.game, outcome.userId, outcome.action);
      persistRoom(room);
      broadcastRoom(room);
      if (room.game.finished) finalizeGame(room);
    }
  }

  function chat(userId, text, kind = 'text') {
    const roomId = userRoom.get(userId);
    if (!roomId) throw new RoomError('Вы не за игровым столом', 'NOT_IN_ROOM');
    const room = rooms.get(roomId);
    if (!room) throw new RoomError('Стол не найден', 'ROOM_NOT_FOUND');
    const player = room.players.find((p) => p.userId === userId);
    if (!player) throw new RoomError('Вы не за игровым столом', 'NOT_IN_ROOM');

    const now = Date.now();
    const last = chatCooldown.get(userId) || 0;
    if (now - last < CHAT_COOLDOWN_MS) throw new RoomError('Слишком часто. Подождите немного', 'CHAT_RATE');
    chatCooldown.set(userId, now);

    if (kind === 'emoji') {
      const symbol = String(text || '');
      if (!ALLOWED_CHAT_EMOJI.includes(symbol)) throw new RoomError('Этот эмодзи недоступен', 'BAD_EMOJI');
      const message = {
        id: crypto.randomUUID(),
        userId,
        username: player.username,
        text: symbol,
        kind: 'emoji',
        ts: now,
      };
      room.chat.push(message);
      room.chat = room.chat.slice(-MAX_CHAT_HISTORY);
      broadcastRoom(room);
      return message;
    }

    const clean = sanitizeMessage(text, 30);
    if (!clean) throw new RoomError('Пустое сообщение', 'EMPTY_MESSAGE');
    const verdict = checkMessage(clean);
    if (!verdict.ok) {
      db.run(
        'INSERT INTO chat_logs (room_id, user_id, text, blocked, reason, created_at) VALUES (?, ?, ?, 1, ?, ?)',
        [room.id, userId, clean, verdict.reason, now],
      );
      throw new RoomError(verdict.message, 'CHAT_BLOCKED');
    }
    db.run(
      'INSERT INTO chat_logs (room_id, user_id, text, blocked, reason, created_at) VALUES (?, ?, ?, 0, NULL, ?)',
      [room.id, userId, clean, now],
    );
    const message = {
      id: crypto.randomUUID(),
      userId,
      username: player.username,
      text: clean,
      kind: 'text',
      ts: now,
    };
    room.chat.push(message);
    room.chat = room.chat.slice(-MAX_CHAT_HISTORY);
    broadcastRoom(room);
    return message;
  }

  function setMic(userId, mic) {
    const roomId = userRoom.get(userId);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    if (!voiceState.has(roomId)) voiceState.set(roomId, {});
    voiceState.get(roomId)[userId] = { mic: Boolean(mic) };
    broadcastRoom(room);
  }

  function voiceSignal(userId, toUserId, data) {
    const roomId = userRoom.get(userId);
    if (!roomId || userRoom.get(toUserId) !== roomId) {
      throw new RoomError('Голосовая связь доступна только игрокам одного стола', 'VOICE_SCOPE');
    }
    if (!data || typeof data !== 'object') throw new RoomError('Некорректный голосовой пакет', 'BAD_VOICE');
    sendToUser(toUserId, {
      type: 'voice:signal',
      from: userId,
      data: {
        kind: data.kind === 'answer' ? 'answer' : data.kind === 'offer' ? 'offer' : 'candidate',
        sdp: typeof data.sdp === 'string' ? data.sdp.slice(0, 12000) : undefined,
        candidate: typeof data.candidate === 'string' ? data.candidate.slice(0, 4000) : undefined,
      },
    });
  }

  function setReady(userId) {
    const roomId = userRoom.get(userId);
    if (!roomId) throw new RoomError('Вы не за игровым столом', 'NOT_IN_ROOM');
    const room = rooms.get(roomId);
    if (!room) throw new RoomError('Стол не найден', 'ROOM_NOT_FOUND');
    if (room.status === 'playing') return room;
    const player = room.players.find((p) => p.userId === userId);
    if (!player) throw new RoomError('Вы не за игровым столом', 'NOT_IN_ROOM');
    player.ready = true;
    room.lastActivity = Date.now();
    const allReady = room.players.length >= 2 && room.players.every((p) => p.ready);
    if (allReady) {
      startGame(room);
    } else {
      persistRoom(room);
      broadcastRoom(room);
    }
    return room;
  }

  function joinQueue(user) {
    if (userRoom.has(user.id)) leaveRoom(user.id, { silent: true });
    if (!queue.some((entry) => entry.userId === user.id)) {
      queue.push({ userId: user.id, since: Date.now() });
    }
    tryMatch();
    broadcastLobby();
    return { queueSize: queue.length };
  }

  function leaveQueue(userId) {
    const index = queue.findIndex((entry) => entry.userId === userId);
    if (index >= 0) queue.splice(index, 1);
    broadcastLobby();
    return { queueSize: queue.length };
  }

  function tryMatch() {
    while (queue.length >= 2) {
      const first = queue.shift();
      const second = queue.shift();
      const userA = userRow(first.userId);
      const userB = userRow(second.userId);
      if (!userA || !userB) continue;
      if (userRoom.has(userA.id) || userRoom.has(userB.id)) continue;
      const room = createRoom(userA, { maxPlayers: 2 });
      try {
        joinRoom(userB, room.id);
        setTimeout(() => {
          const liveRoom = rooms.get(room.id);
          if (liveRoom && liveRoom.status === 'waiting' && liveRoom.players.length === 2) {
            startGame(liveRoom);
          }
        }, Math.max(matchmakingDelayMs, 0));
      } catch (error) {
        logger.error?.('[rooms] matchmaking failed', error);
      }
    }
  }

  function onConnect(user) {
    const roomId = userRoom.get(user.id);
    graceTimers.delete(user.id);
    if (!roomId) {
      broadcastLobby();
      return null;
    }
    const room = rooms.get(roomId);
    if (!room) {
      userRoom.delete(user.id);
      return null;
    }
    const player = room.players.find((p) => p.userId === user.id);
    if (player) player.connected = true;
    broadcastRoom(room);
    return roomView(room, user.id);
  }

  function onDisconnect(userId) {
    const roomId = userRoom.get(userId);
    if (roomId) {
      const room = rooms.get(roomId);
      const player = room?.players.find((p) => p.userId === userId);
      if (player) player.connected = false;
      graceTimers.set(userId, Date.now());
      if (room) {
        if (room.status === 'waiting') {
          leaveRoom(userId);
        } else {
          persistRoom(room);
          broadcastRoom(room);
        }
      }
    }
    const index = queue.findIndex((entry) => entry.userId === userId);
    if (index >= 0) queue.splice(index, 1);
    broadcastLobby();
  }

  function tick() {
    const now = Date.now();
    for (const room of [...rooms.values()]) {
      if (room.status === 'playing' && room.game && !room.game.finished) playTurnTimeout(room);
      if (room.status === 'finished' && now - (room.result?.finishedAt || room.lastActivity) > FINISHED_ROOM_TTL_MS) {
        const stillThere = room.players.some((p) => p.connected);
        if (!stillThere) {
          for (const player of room.players) userRoom.delete(player.userId);
          rooms.delete(room.id);
          voiceState.delete(room.id);
          deletePersistedRoom(room.id);
          broadcastLobby();
        }
      }
    }
    for (const [userId, since] of [...graceTimers.entries()]) {
      if (now - since > DISCONNECT_GRACE_MS) {
        graceTimers.delete(userId);
        leaveRoom(userId, { silent: true });
      }
    }
    for (const [userId, at] of [...chatCooldown.entries()]) {
      if (now - at > 60_000) chatCooldown.delete(userId);
    }
  }

  function roomForUser(userId) {
    const roomId = userRoom.get(userId);
    if (!roomId) return null;
    const room = rooms.get(roomId);
    if (!room) return null;
    return roomView(room, userId);
  }

  function adminRooms() {
    return [...rooms.values()].map((room) => ({
      id: room.id,
      name: room.name,
      code: room.code,
      status: room.status,
      players: room.players.map((p) => ({ userId: p.userId, username: p.username, connected: p.connected })),
      createdAt: room.createdAt,
      matchId: room.matchId,
    }));
  }

  function adminCloseRoom(roomId, reason = 'Стол закрыт администратором') {
    const room = rooms.get(roomId);
    if (!room) return false;
    for (const player of room.players) {
      sendToUser(player.userId, { type: 'error', message: reason });
      sendToUser(player.userId, { type: 'room:closed', message: reason });
      userRoom.delete(player.userId);
    }
    rooms.delete(roomId);
    voiceState.delete(roomId);
    deletePersistedRoom(roomId);
    broadcastLobby();
    return true;
  }

  function restore() {
    const rows = db.all("SELECT * FROM rooms WHERE status IN ('waiting','playing')");
    let restored = 0;
    for (const row of rows) {
      try {
        const snapshot = JSON.parse(row.state);
        if (!snapshot?.players?.length) continue;
        const room = {
          ...snapshot,
          code: row.code,
          lastActivity: Date.now(),
          finishedRecorded: false,
        };
        room.players = room.players.map((p) => ({ ...p, connected: false }));
        if (room.game) {
          room.game.turnStartedAt = Date.now();
          if (room.status === 'playing' && room.players.length < 2) {
            rooms.set(room.id, room);
            continue;
          }
        }
        rooms.set(room.id, room);
        for (const player of room.players) userRoom.set(player.userId, room.id);
        restored += 1;
      } catch (error) {
        logger.error?.('[rooms] restore failed', error);
      }
    }
    if (restored > 0) logger.log?.(`[rooms] restored ${restored} room(s)`);
    return restored;
  }

  function reset() {
    rooms.clear();
    userRoom.clear();
    queue.length = 0;
    graceTimers.clear();
    chatCooldown.clear();
    voiceState.clear();
  }

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    handleAction,
    chat,
    setMic,
    voiceSignal,
    setReady,
    joinQueue,
    leaveQueue,
    onConnect,
    onDisconnect,
    tick,
    restore,
    roomForUser,
    lobbyPayload,
    broadcastLobby,
    broadcastRoom,
    adminRooms,
    adminCloseRoom,
    reset,
    get rooms() {
      return rooms;
    },
    get queue() {
      return queue;
    },
    get userRoom() {
      return userRoom;
    },
  };
}
