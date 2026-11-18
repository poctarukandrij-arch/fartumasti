import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import { initTelegram, waitForInitData, tg, openLink, haptic } from './telegram.js';
import { GameSocket } from './ws.js';
import { Voice } from './voice.js';
import { Toasts } from './components/Toasts.jsx';
import { TopBar } from './components/TopBar.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Shop from './screens/Shop.jsx';
import Stats from './screens/Stats.jsx';
import Profile from './screens/Profile.jsx';
import TableScreen from './screens/Table.jsx';

const TABS = [
  { id: 'home', label: 'Главная', icon: '⌂' },
  { id: 'shop', label: 'Магазин', icon: '◈' },
  { id: 'stats', label: 'Статистика', icon: '▤' },
  { id: 'profile', label: 'Профиль', icon: '◉' },
];

export default function App() {
  const [phase, setPhase] = useState('boot');
  const [authError, setAuthError] = useState('');
  const [authAttempt, setAuthAttempt] = useState(0);
  const [devLogin, setDevLogin] = useState(false);
  const [devId, setDevId] = useState('1001');
  const [devName, setDevName] = useState('Тест');
  const [me, setMe] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [room, setRoom] = useState(null);
  const [tab, setTab] = useState('home');
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const autoRetryRef = useRef(0);
  const voiceRef = useRef(null);

  const toast = useCallback((message, kind = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 3400);
  }, []);

  useEffect(() => {
    initTelegram();
    let alive = true;
    (async () => {
      let config = null;
      try {
        config = await api('/config', { token: '' });
      } catch {
        config = null;
      }
      if (!alive) return;
      setDevLogin(Boolean(config?.devLogin));

      if (getToken()) {
        try {
          const data = await api('/me');
          if (!alive) return;
          setMe(data);
          setPhase('ready');
          return;
        } catch {
          setToken('');
        }
      }

      const initData = await waitForInitData({ timeoutMs: 6000 });
      if (!alive) return;
      if (initData) {
        try {
          const data = await api('/auth/telegram', {
            method: 'POST',
            body: { initData },
            token: '',
          });
          if (!alive) return;
          setToken(data.token);
          setMe({
            user: data.user,
            stats: data.stats,
            inventory: data.inventory,
            equipped: data.equipped,
            config: data.config,
          });
          setPhase('ready');
          return;
        } catch (error) {
          if (!alive) return;
          setAuthError(error.message || 'Не удалось войти через Telegram');
        }
      } else if (autoRetryRef.current < 2) {
        // На iOS SDK инициализируется с задержкой — повторяем попытку входа.
        autoRetryRef.current += 1;
        setTimeout(() => {
          if (alive) setAuthAttempt((count) => count + 1);
        }, 1500);
      }
      if (alive) setPhase('auth');
    })();
    return () => {
      alive = false;
    };
  }, [authAttempt]);

  useEffect(() => {
    if (phase !== 'ready') return;
    if (!voiceRef.current) {
      voiceRef.current = new Voice((payload) => socketRef.current?.send(payload));
    }
    const socket = new GameSocket(getToken());
    socketRef.current = socket;
    const offs = [
      socket.on('open', () => setConnected(true)),
      socket.on('close', () => setConnected(false)),
      socket.on('hello', (msg) => {
        setMe((prev) =>
          prev ? { ...prev, user: msg.user, stats: msg.stats, config: msg.config || prev.config } : prev,
        );
        setLobby(msg.lobby);
        setRoom(msg.room);
      }),
      socket.on('lobby', (msg) => setLobby(msg.lobby)),
      socket.on('room', (msg) => setRoom(msg.room)),
      socket.on('room:closed', (msg) => {
        setRoom(null);
        setTab('home');
        voiceRef.current?.reset();
        toast(msg.message || 'Стол закрыт', 'error');
      }),
      socket.on('error', (msg) => toast(msg.message || 'Ошибка', 'error')),
      socket.on('voice:signal', (msg) => {
        voiceRef.current?.handleSignal(msg.from, msg.data).catch(() => {});
      }),
    ];
    socket.connect();
    return () => {
      for (const off of offs) off();
      socket.disconnect();
      setConnected(false);
    };
  }, [phase, toast]);

  const send = useCallback((payload) => {
    socketRef.current?.send(payload);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const data = await api('/me');
      setMe(data);
      return data;
    } catch (error) {
      toast(error.message, 'error');
      return null;
    }
  }, [toast]);

  const loginDev = useCallback(async () => {
    try {
      const data = await api('/auth/telegram', {
        method: 'POST',
        body: { devUserId: devId.trim() || '1001', devName: devName.trim() || 'Тест' },
        token: '',
      });
      setToken(data.token);
      setMe({
        user: data.user,
        stats: data.stats,
        inventory: data.inventory,
        equipped: data.equipped,
        config: data.config,
      });
      setPhase('ready');
    } catch (error) {
      setAuthError(error.message || 'Ошибка входа');
    }
  }, [devId, devName]);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* сессия могла истечь */
    }
    setToken('');
    socketRef.current?.disconnect();
    voiceRef.current?.reset();
    setMe(null);
    setRoom(null);
    setPhase('auth');
    setTab('home');
  }, []);

  const leaveRoom = useCallback(() => {
    send({ type: 'room:leave' });
    voiceRef.current?.reset();
    setRoom(null);
    setTab('home');
  }, [send]);

  if (phase === 'boot') {
    return (
      <div className="splash">
        <div className="splash__logo">FARTU MASTI</div>
        <div className="spinner" />
        <p className="muted small">Загрузка стола…</p>
      </div>
    );
  }

  if (phase === 'auth' || !me) {
    return (
      <div className="onboarding">
        <div className="splash__logo">FARTU MASTI</div>
        <p className="muted small" style={{ textAlign: 'center' }}>
          Вход выполняется автоматически через Telegram. Откройте приложение из бота FARTU MASTI.
        </p>
        {authError ? <p className="hint hint--error">{authError}</p> : null}
        <button
          className="btn btn--primary btn--wide"
          type="button"
          onClick={() => {
            autoRetryRef.current = 2;
            setAuthError('');
            setPhase('boot');
            setAuthAttempt((count) => count + 1);
          }}
        >
          Повторить вход
        </button>
        {tg() ? null : (
          <button className="btn btn--wide" type="button" onClick={() => openLink('https://t.me/Fartumastiibot')}>
            Открыть в Telegram
          </button>
        )}
        {devLogin ? (
          <div className="panel col">
            <div className="field">
              <label htmlFor="dev-id">Тестовый Telegram ID</label>
              <input
                id="dev-id"
                className="input"
                value={devId}
                onChange={(event) => setDevId(event.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="field">
              <label htmlFor="dev-name">Имя в Telegram</label>
              <input
                id="dev-name"
                className="input"
                value={devName}
                onChange={(event) => setDevName(event.target.value)}
              />
            </div>
            <button className="btn btn--primary btn--wide" type="button" onClick={loginDev}>
              Войти в тестовом режиме
            </button>
            <p className="hint">Тестовый вход доступен только при включённом DEV_LOGIN на сервере.</p>
          </div>
        ) : (
          <div className="panel">
            <p className="small muted" style={{ margin: 0 }}>
              Авторизация недоступна вне Telegram. Откройте Mini App по кнопке в боте.
            </p>
          </div>
        )}
        <Toasts items={toasts} />
      </div>
    );
  }

  if (me.user.needsUsername) {
    return (
      <>
        <Onboarding
          config={me.config}
          onDone={(data) => {
            setMe(data);
            haptic('success');
          }}
          toast={toast}
        />
        <Toasts items={toasts} />
      </>
    );
  }

  const inRoom = Boolean(room);

  return (
    <div className="app">
      {!inRoom ? <TopBar user={me.user} connected={connected} /> : null}
      {inRoom ? (
        <TableScreen
          room={room}
          me={me}
          send={send}
          voice={voiceRef.current}
          toast={toast}
          onLeave={leaveRoom}
          onRefreshMe={refreshMe}
        />
      ) : tab === 'home' ? (
        <Home
          me={me}
          lobby={lobby}
          connected={connected}
          send={send}
          toast={toast}
        />
      ) : tab === 'shop' ? (
        <Shop me={me} refreshMe={refreshMe} toast={toast} />
      ) : tab === 'stats' ? (
        <Stats me={me} toast={toast} />
      ) : (
        <Profile me={me} refreshMe={refreshMe} onLogout={logout} toast={toast} />
      )}

      {!inRoom ? (
        <nav className="nav">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav__item ${tab === item.id ? 'nav__item--active' : ''}`}
              onClick={() => {
                haptic('light');
                setTab(item.id);
              }}
            >
              <span className="ico" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      ) : null}
      <Toasts items={toasts} />
    </div>
  );
}
