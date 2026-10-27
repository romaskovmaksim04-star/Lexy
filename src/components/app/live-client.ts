"use client";

// Browser side of a live call with Lexi (ai/live.py, Gemini Live). Two ways to carry the
// audio, tried in this order:
//   WebRTC: Opus over UDP, the browser's own echo cancelling (Lexi does not hear herself),
//           events on the data channel "lexi".
//   WebSocket: raw PCM over the site's own HTTPS port, for networks where UDP to the server
//           does not get through. Without WebRTC's echo cancelling the microphone is gated
//           while Lexi talks: only speech clearly louder than her counts, as interrupting.
// Both give the page the same events and the same handle (LiveLink).

export type LiveEvent = { t: string; [k: string]: unknown };

export type LiveLink = {
  kind: "rtc" | "ws";
  /** A typed answer. */
  sendText: (text: string) => void;
  /** Mute: silence is sent instead of the microphone. */
  setMuted: (on: boolean) => void;
  /** Lexi's voice right now, for the face. */
  voice: () => { level: number; bright: number; playing: boolean; analysed: boolean };
  /** The student's microphone level 0..1. */
  mic: () => number;
  /** Lexi is still talking (audio left to play). */
  playing: () => boolean;
  /** Stops what Lexi is saying at once (the student cut in). */
  hush: () => void;
  /** Hangs up; resolves once the transcript is stored (or after a few seconds). */
  end: () => Promise<void>;
  close: () => void;
};

type Opts = { token: string; onEvent: (e: LiveEvent) => void; onDrop: () => void };

const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
const RTC_TIMEOUT_MS = 6000;
const MIC: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 };

function audioContext(): AudioContext {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new AC();
}

/** Loudness and brightness of what an analyser hears (the same reading as voiceLevel). */
function reader(ctx: AudioContext, analyser: AnalyserNode) {
  const time = new Float32Array(analyser.fftSize);
  const freq = new Uint8Array(analyser.frequencyBinCount);
  return () => {
    analyser.getFloatTimeDomainData(time);
    let sum = 0;
    for (let i = 0; i < time.length; i++) sum += time[i] * time[i];
    const rms = Math.sqrt(sum / time.length);
    analyser.getByteFrequencyData(freq);
    const hz = ctx.sampleRate / analyser.fftSize;
    const band = (from: number, to: number) => {
      let v = 0, n = 0;
      for (let i = Math.floor(from / hz); i <= Math.min(freq.length - 1, Math.ceil(to / hz)); i++, n++) v += freq[i];
      return n ? v / n : 0;
    };
    const low = band(150, 900);
    const high = band(2000, 6000);
    return { rms, bright: high / (low + high + 1) };
  };
}

function micMeter(ctx: AudioContext, stream: MediaStream) {
  const a = ctx.createAnalyser();
  a.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(a);
  const read = reader(ctx, a);
  return () => Math.min(1, read().rms * 8);
}

/** Connects a live call: WebRTC first, the WebSocket if that does not come up. */
export async function connectLive(o: Opts): Promise<LiveLink> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: MIC });
  try {
    if (typeof RTCPeerConnection !== "undefined") return await connectRtc(o, stream);
  } catch (e) {
    console.warn("lexi live: webrtc failed, websocket instead", e);
  }
  return connectWs(o, stream);
}

// ---------- WebRTC ----------

async function connectRtc(o: Opts, stream: MediaStream): Promise<LiveLink> {
  const pc = new RTCPeerConnection({ iceServers: ICE });
  for (const track of stream.getAudioTracks()) pc.addTrack(track, stream);
  const dc = pc.createDataChannel("lexi");
  const ctx = audioContext();
  ctx.resume().catch(() => {});
  const player = new Audio();
  player.autoplay = true;
  player.setAttribute("playsinline", "");
  let voiceRead: (() => { rms: number; bright: number }) | null = null;

  pc.ontrack = (e) => {
    const remote = e.streams[0] ?? new MediaStream([e.track]);
    // played by an element, so the browser's echo cancelling knows it; analysed on the side
    player.srcObject = remote;
    player.play().catch(() => {});
    const a = ctx.createAnalyser();
    a.fftSize = 1024;
    a.smoothingTimeConstant = 0.25;
    ctx.createMediaStreamSource(remote).connect(a);
    voiceRead = reader(ctx, a);
  };

  let saved: (() => void) | null = null;
  let ended = false;
  dc.onmessage = (m) => {
    let e: LiveEvent;
    try { e = JSON.parse(m.data as string); } catch { return; }
    if (e.t === "saved") saved?.();
    o.onEvent(e);
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  // the whole offer at once (no trickling): wait for the candidates, a second at most
  await new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const t = setTimeout(resolve, 1200);
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") { clearTimeout(t); resolve(); }
    });
  });
  const res = await fetch(`/live/rtc?token=${encodeURIComponent(o.token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pc.localDescription),
  });
  if (!res.ok) throw new Error(`rtc ${res.status}`);
  await pc.setRemoteDescription(await res.json());
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("rtc timeout")), RTC_TIMEOUT_MS);
    const check = () => {
      if (pc.connectionState === "connected") { clearTimeout(t); resolve(); }
      if (pc.connectionState === "failed") { clearTimeout(t); reject(new Error("rtc failed")); }
    };
    pc.addEventListener("connectionstatechange", check);
    check();
  }).catch((e) => {
    pc.close();
    ctx.close().catch(() => {});
    throw e;
  });
  pc.addEventListener("connectionstatechange", () => {
    if (!ended && (pc.connectionState === "failed" || pc.connectionState === "disconnected")) o.onDrop();
  });

  const send = (e: LiveEvent) => { if (dc.readyState === "open") dc.send(JSON.stringify(e)); };
  const mic = micMeter(ctx, stream);
  // "Lexi is talking" holds through the gaps between syllables: read frame by frame it
  // flickered, and every flicker sent the face darting to a new spot
  let voicedAt = 0;
  const voice = () => {
    if (!voiceRead || ctx.state !== "running") return { level: 0, bright: 0.5, playing: false, analysed: false };
    const v = voiceRead();
    const now = performance.now();
    if (v.rms > 0.01) voicedAt = now;
    return { level: Math.min(1, v.rms * 6), bright: v.bright, playing: now - voicedAt < 700, analysed: true };
  };
  const close = () => {
    ended = true;
    stream.getTracks().forEach((t) => t.stop());
    player.srcObject = null;
    pc.close();
    ctx.close().catch(() => {});
  };
  return {
    kind: "rtc",
    sendText: (text) => send({ t: "text", text }),
    setMuted: (on) => stream.getAudioTracks().forEach((t) => { t.enabled = !on; }),
    voice,
    mic,
    playing: () => voice().playing,
    hush: () => { /* the server drops the rest of her line; the jitter buffer is short */ },
    end: () => new Promise<void>((resolve) => {
      ended = true;
      saved = resolve;
      send({ t: "end" });
      stream.getTracks().forEach((t) => t.stop());
      setTimeout(resolve, 8000);
    }).finally(close),
    close,
  };
}

// ---------- WebSocket ----------

// Runs in the audio thread: averages the microphone down to 16 kHz and hands out 40 ms of
// 16-bit PCM at a time.
const WORKLET = `
class LexyMic extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.acc = 0; this.sum = 0; this.n = 0; this.buf = new Int16Array(640); this.i = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let k = 0; k < ch.length; k++) {
      this.sum += ch[k]; this.n++; this.acc++;
      if (this.acc >= this.ratio) {
        this.acc -= this.ratio;
        const v = Math.max(-1, Math.min(1, this.sum / this.n));
        this.sum = 0; this.n = 0;
        this.buf[this.i++] = v < 0 ? v * 0x8000 : v * 0x7fff;
        if (this.i === 640) { this.port.postMessage(this.buf.buffer, [this.buf.buffer]); this.buf = new Int16Array(640); this.i = 0; }
      }
    }
    return true;
  }
}
registerProcessor("lexy-mic", LexyMic);
`;

const FRAME_MS = 40;
const BARGE_MS = 240; // speech over Lexi needed to cut her off
const PRE_ROLL = 8; // frames (320 ms) sent from before the cut, so the first word is not lost

async function connectWs(o: Opts, stream: MediaStream): Promise<LiveLink> {
  const ctx = audioContext();
  await ctx.resume().catch(() => {});
  const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
  await ctx.audioWorklet.addModule(url);
  URL.revokeObjectURL(url);
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "lexy-mic");
  src.connect(node);
  // a worklet runs only when it leads somewhere; it writes nothing
  const sink = ctx.createGain();
  sink.gain.value = 0;
  node.connect(sink).connect(ctx.destination);

  const out = ctx.createAnalyser();
  out.fftSize = 1024;
  out.smoothingTimeConstant = 0.25;
  out.connect(ctx.destination);
  const voiceRead = reader(ctx, out);
  const mic = micMeter(ctx, stream);

  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/live/ws?token=${encodeURIComponent(o.token)}`);
  ws.binaryType = "arraybuffer";
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("ws failed"));
  });

  // ---- Lexi's voice: 24 kHz pieces scheduled back to back ----
  let next = 0;
  const sources = new Set<AudioBufferSourceNode>();
  const hush = () => {
    for (const s of sources) { try { s.stop(); } catch { /* not started yet */ } }
    sources.clear();
    next = 0;
  };
  const playing = () => next > ctx.currentTime + 0.02;
  const play = (data: ArrayBuffer) => {
    const pcm = new Int16Array(data);
    if (!pcm.length) return;
    const buf = ctx.createBuffer(1, pcm.length, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x8000;
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.connect(out);
    // a fresh stretch of speech (or one after a gap) starts with a little in hand: her voice
    // comes in bursts, and a burst that is a bit late would otherwise cut a word in two
    const at = next > ctx.currentTime ? next : ctx.currentTime + 0.15;
    s.start(at);
    next = at + buf.duration;
    sources.add(s);
    s.onended = () => sources.delete(s);
  };

  let saved: (() => void) | null = null;
  let ended = false;
  ws.onmessage = (m) => {
    if (m.data instanceof ArrayBuffer) return play(m.data);
    let e: LiveEvent;
    try { e = JSON.parse(m.data as string); } catch { return; }
    if (e.t === "interrupted") hush();
    if (e.t === "saved") saved?.();
    o.onEvent(e);
  };
  ws.onclose = () => { if (!ended) o.onDrop(); };

  // ---- the microphone, gated while Lexi talks ----
  let muted = false;
  let floor = 0.01;
  let voiced = 0;
  const ring: ArrayBuffer[] = [];
  const zeros = new Int16Array(640).buffer;
  node.port.onmessage = (m) => {
    const frame = m.data as ArrayBuffer;
    if (ws.readyState !== WebSocket.OPEN) return;
    const pcm = new Int16Array(frame);
    let sum = 0;
    for (let i = 0; i < pcm.length; i++) sum += (pcm[i] / 0x8000) ** 2;
    const rms = Math.sqrt(sum / pcm.length);
    ring.push(frame);
    if (ring.length > PRE_ROLL) ring.shift();
    if (muted) return void ws.send(zeros);
    if (!playing()) {
      floor = rms < 0.02 ? floor * 0.95 + rms * 0.05 : floor;
      voiced = 0;
      return void ws.send(frame);
    }
    // Lexi is talking and her voice comes back through the speakers: only clearly louder
    // speech that lasts counts, and then she stops at once
    voiced = rms > Math.max(0.03, floor * 8) ? voiced + FRAME_MS : 0;
    if (voiced >= BARGE_MS) {
      hush();
      voiced = 0;
      for (const f of ring) ws.send(f);
      ring.length = 0;
      return;
    }
    ws.send(zeros);
  };

  const close = () => {
    ended = true;
    hush();
    stream.getTracks().forEach((t) => t.stop());
    try { ws.close(); } catch { /* already closed */ }
    ctx.close().catch(() => {});
  };
  return {
    kind: "ws",
    sendText: (text) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ t: "text", text })),
    setMuted: (on) => { muted = on; },
    voice: () => {
      if (ctx.state !== "running") return { level: 0, bright: 0.5, playing: false, analysed: false };
      const v = voiceRead();
      return { level: Math.min(1, v.rms * 6), bright: v.bright, playing: playing(), analysed: true };
    },
    mic,
    playing,
    hush,
    end: () => new Promise<void>((resolve) => {
      ended = true;
      saved = resolve;
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: "end" }));
      else resolve();
      stream.getTracks().forEach((t) => t.stop());
      setTimeout(resolve, 8000);
    }).finally(close),
    close,
  };
}
