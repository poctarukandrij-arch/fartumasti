// Голосовое общение через WebRTC: микрофон, приём звука, заглушение игроков.
// Сигнализация идёт через игровой WebSocket, медиа — напрямую между игроками.
export class Voice {
  constructor(send) {
    this.send = send;
    this.localStream = null;
    this.peers = new Map(); // userId -> RTCPeerConnection
    this.audio = new Map(); // userId -> HTMLAudioElement
    this.muted = new Set(); // локально заглушённые игроки
    this.micOn = false;
    this.onChange = () => {};
  }

  setSender(send) {
    this.send = send;
  }

  notify() {
    this.onChange({ micOn: this.micOn, muted: [...this.muted] });
  }

  ensureAudio(userId) {
    let el = this.audio.get(userId);
    if (!el) {
      el = document.createElement('audio');
      el.autoplay = true;
      el.playsInline = true;
      el.dataset.userId = String(userId);
      el.muted = this.muted.has(userId);
      el.style.display = 'none';
      document.body.appendChild(el);
      this.audio.set(userId, el);
    }
    return el;
  }

  async enableMic(peerIds) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Микрофон недоступен в этом устройстве');
    }
    if (!this.localStream) {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    }
    this.micOn = true;
    this.send({ type: 'voice:mic', on: true });
    this.notify();
    for (const id of peerIds) {
      try {
        await this.call(id);
      } catch {
        /* игрок мог отключиться */
      }
    }
  }

  disableMic() {
    this.micOn = false;
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) track.stop();
      this.localStream = null;
    }
    for (const [id, pc] of this.peers) {
      try {
        pc.close();
      } catch {
        /* уже закрыт */
      }
      this.peers.delete(id);
    }
    this.send({ type: 'voice:mic', on: false });
    this.notify();
  }

  async call(userId) {
    if (!this.localStream) return;
    const pc = this.createPeer(userId);
    for (const track of this.localStream.getTracks()) pc.addTrack(track, this.localStream);
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    this.send({ type: 'voice:signal', to: userId, data: { kind: 'offer', sdp: pc.localDescription } });
  }

  createPeer(userId) {
    const existing = this.peers.get(userId);
    if (existing) {
      try {
        existing.close();
      } catch {
        /* уже закрыт */
      }
    }
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    this.peers.set(userId, pc);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'voice:signal',
          to: userId,
          data: { kind: 'candidate', candidate: event.candidate },
        });
      }
    };
    pc.ontrack = (event) => {
      const el = this.ensureAudio(userId);
      el.srcObject = event.streams[0];
      el.play?.().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        if (this.peers.get(userId) === pc) this.peers.delete(userId);
      }
    };
    return pc;
  }

  async handleSignal(from, data) {
    if (!data || typeof data.kind !== 'string') return;
    if (data.kind === 'offer') {
      const pc = this.createPeer(from);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if (this.localStream) {
        for (const track of this.localStream.getTracks()) pc.addTrack(track, this.localStream);
      } else {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.send({ type: 'voice:signal', to: from, data: { kind: 'answer', sdp: pc.localDescription } });
    } else if (data.kind === 'answer') {
      const pc = this.peers.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.kind === 'candidate') {
      const pc = this.peers.get(from);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
          /* устаревший кандидат */
        }
      }
    }
  }

  setPlayerMuted(userId, muted) {
    if (muted) this.muted.add(userId);
    else this.muted.delete(userId);
    const el = this.audio.get(userId);
    if (el) el.muted = muted;
    this.notify();
  }

  togglePlayerMuted(userId) {
    this.setPlayerMuted(userId, !this.muted.has(userId));
  }

  muteAll() {
    for (const [id] of this.audio) {
      this.muted.add(id);
      this.audio.get(id).muted = true;
    }
    this.notify();
  }

  unmuteAll() {
    for (const id of [...this.muted]) this.setPlayerMuted(id, false);
  }

  reset() {
    this.disableMic();
    for (const [, el] of this.audio) el.remove();
    this.audio.clear();
    this.muted.clear();
    this.notify();
  }
}
