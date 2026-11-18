// Клиент игрового WebSocket с автопереподключением и буфером исходящих сообщений.
export class GameSocket {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.handlers = new Map();
    this.queue = [];
    this.attempt = 0;
    this.closedByUser = false;
    this.timer = null;
  }

  on(type, handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  emitLocal(type, payload) {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch (err) {
        console.error('ws handler error', err);
      }
    }
  }

  connect() {
    if (!this.token) return;
    this.closedByUser = false;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/ws?token=${encodeURIComponent(this.token)}`;
    let socket;
    try {
      socket = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.emitLocal('open');
      const pending = this.queue.splice(0);
      for (const msg of pending) this.send(msg);
    };

    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!msg || typeof msg.type !== 'string') return;
      this.emitLocal(msg.type, msg);
    };

    socket.onclose = () => {
      this.emitLocal('close');
      if (!this.closedByUser) this.scheduleReconnect();
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch {
        /* уже закрыт */
      }
    };
  }

  scheduleReconnect() {
    clearTimeout(this.timer);
    this.attempt += 1;
    const delay = Math.min(8000, 500 * 2 ** Math.min(this.attempt, 4));
    this.timer = setTimeout(() => this.connect(), delay);
  }

  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    if (this.queue.length < 20) this.queue.push(payload);
    return false;
  }

  disconnect() {
    this.closedByUser = true;
    clearTimeout(this.timer);
    try {
      this.ws?.close();
    } catch {
      /* уже закрыт */
    }
  }
}
