"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

// Browser side of speech: recording with a live level, optional live captions from the
// browser's own recogniser, upload for transcription, and playback of server voices.

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function makeRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const W = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "en-US";
  r.continuous = true;
  r.interimResults = true;
  return r;
}

export type MicError = "denied" | "missing" | "busy" | "unsupported";

export type Recording = { blob: Blob; seconds: number; caption: string };

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<MicError | null>(null);
  const [caption, setCaption] = useState("");
  const level: MotionValue<number> = useMotionValue(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const started = useRef(0);
  const raf = useRef(0);
  const ctx = useRef<AudioContext | null>(null);
  const recog = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const resolveStop = useRef<((r: Recording) => void) | null>(null);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    ctx.current?.close().catch(() => {});
    ctx.current = null;
    try { recog.current?.abort(); } catch { /* already stopped */ }
    recog.current = null;
    level.set(0);
  }, [level]);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    setCaption("");
    finalText.current = "";
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("unsupported");
      return false;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      const name = (e as DOMException).name;
      setError(name === "NotFoundError" ? "missing" : name === "NotReadableError" ? "busy" : "denied");
      return false;
    }
    const type = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    const mr = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
    chunks.current = [];
    mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
      const seconds = (performance.now() - started.current) / 1000;
      const done = resolveStop.current;
      resolveStop.current = null;
      cleanup();
      done?.({ blob, seconds, caption: finalText.current.trim() });
    };
    rec.current = mr;

    // Level meter for the waveform
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx.current = new AC();
    const analyser = ctx.current.createAnalyser();
    analyser.fftSize = 512;
    ctx.current.createMediaStreamSource(stream.current).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      level.set(Math.min(1, Math.sqrt(sum / buf.length) * 4));
      raf.current = requestAnimationFrame(tick);
    };
    tick();

    // Live captions where the browser offers recognition; also a fallback transcript
    const r = makeRecognition();
    if (r) {
      r.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finalText.current += ` ${res[0].transcript}`;
          else interim += res[0].transcript;
        }
        setCaption(`${finalText.current} ${interim}`.trim());
      };
      r.onerror = () => {};
      try { r.start(); recog.current = r; } catch { /* not allowed here */ }
    }

    started.current = performance.now();
    mr.start(250);
    setRecording(true);
    return true;
  }, [cleanup, level]);

  const stop = useCallback(() => {
    return new Promise<Recording | null>((resolve) => {
      const mr = rec.current;
      setRecording(false);
      if (!mr || mr.state === "inactive") return resolve(null);
      resolveStop.current = resolve;
      try { recog.current?.stop(); } catch { /* stopped */ }
      mr.stop();
    });
  }, []);

  return { start, stop, recording, error, caption, level };
}

export type SttResult = { text: string; alt?: string; duration: number; speech?: number; language?: string; words: { w: string; s: number; e: number; p: number }[] };

/** Server transcription with word timings; falls back to the browser caption. */
export async function transcribe(rec: Recording, mode: "fast" | "accurate" | "chat", context = ""): Promise<SttResult & { fallback: boolean }> {
  try {
    const form = new FormData();
    if (context) form.append("context", context.slice(0, 300));
    const ext = rec.blob.type.includes("wav") ? "wav" : rec.blob.type.includes("mp4") ? "m4a" : rec.blob.type.includes("ogg") ? "ogg" : "webm";
    form.append("audio", rec.blob, `answer.${ext}`);
    const res = await fetch(`/api/stt?mode=${mode}`, { method: "POST", body: form });
    if (res.ok) {
      const data = (await res.json()) as SttResult;
      return { ...data, fallback: false };
    }
  } catch {
    /* use the caption */
  }
  return { text: rec.caption, duration: rec.seconds, words: [], fallback: true };
}

let current: HTMLAudioElement | null = null;
let currentDone: (() => void) | null = null;
let routedCurrent = false;
// What is being said right now, for the face's lip-sync: the text of the clip and its length
let speechId = 0;
let speech: { id: number; text: string; durationMs: number; moods: [number, string][] } | null = null;

/** The clip playing now (text and length), or null. */
export function speechNow() {
  return current && !current.paused && !current.ended ? speech : null;
}

// Lexi's voice goes through an analyser, so her mouth can follow it (lip-sync)
let actx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let timeBuf: Float32Array<ArrayBuffer> | null = null;
let freqBuf: Uint8Array<ArrayBuffer> | null = null;

function audioGraph(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!actx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    analyser = actx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.25;
    analyser.connect(actx.destination);
    timeBuf = new Float32Array(analyser.fftSize);
    freqBuf = new Uint8Array(analyser.frequencyBinCount);
  }
  return actx;
}

// iOS Safari lets an <audio> element play only once that same element was started inside a
// tap; a new Audio() for every clip is refused there without a sound. So all of Lexi's clips
// go through one element, started with a moment of silence on the first tap.
let player: HTMLAudioElement | null = null;
let playerSource: MediaElementAudioSourceNode | null = null;
let playToken = 0;
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
// On iOS the analyser is left out: a routed element goes mute whenever iOS suspends the
// audio context (the mic starting, a call, the screen locking). The face follows the text then.
const IOS = typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

function voicePlayer(): HTMLAudioElement {
  if (!player) {
    player = new Audio();
    player.preload = "auto";
    player.setAttribute("playsinline", "");
    // any later tap unlocks it too, should the first one have been missed (a reload mid-call)
    document.addEventListener("pointerdown", unlockAudio, { passive: true });
  }
  return player;
}

/** Call from a click: browsers allow sound (and its analysis) only after a user gesture. */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  audioGraph()?.resume().catch(() => {});
  const p = voicePlayer();
  if (!current && (p.paused || p.ended)) {
    p.src = SILENCE;
    p.play().catch(() => {});
  }
}

/**
 * Lexi's voice right now: loudness 0..1 and brightness 0..1 (open "a/o" sounds are dark,
 * "e/i/s" bright), for the mouth. `analysed` is false where the browser gave no analyser.
 */
export function voiceLevel(): { level: number; bright: number; playing: boolean; analysed: boolean } {
  const playing = !!current && !current.paused && !current.ended;
  if (!playing || !routedCurrent || !analyser || !timeBuf || !freqBuf || actx?.state !== "running") {
    return { level: 0, bright: 0.5, playing, analysed: false };
  }
  analyser.getFloatTimeDomainData(timeBuf);
  let sum = 0;
  for (let i = 0; i < timeBuf.length; i++) sum += timeBuf[i] * timeBuf[i];
  const rms = Math.sqrt(sum / timeBuf.length);
  analyser.getByteFrequencyData(freqBuf);
  const hz = actx.sampleRate / analyser.fftSize;
  const band = (from: number, to: number) => {
    let v = 0, n = 0;
    for (let i = Math.floor(from / hz); i <= Math.min(freqBuf!.length - 1, Math.ceil(to / hz)); i++, n++) v += freqBuf![i];
    return n ? v / n : 0;
  };
  const low = band(150, 900);
  const high = band(2000, 6000);
  return { level: Math.min(1, rms * 6), bright: high / (low + high + 1), playing, analysed: true };
}

/**
 * Plays a signed voice URL from the speech service. There is deliberately no browser-voice
 * fallback: if the service fails, the text stays on screen and the flow just goes on.
 */
export function playVoice(url: string, _text?: string, opts: { rate?: number; moods?: [number, string][] } = {}): Promise<void> {
  stopCurrent();
  return new Promise((resolve) => {
    if (!url || typeof window === "undefined") return resolve();
    const a = voicePlayer();
    const token = ++playToken;
    current = a;
    const ctx = audioGraph();
    // an element can be routed into the analyser only once, and then stays routed
    if (!IOS && !playerSource && ctx && ctx.state === "running" && analyser) {
      try {
        playerSource = ctx.createMediaElementSource(a);
        playerSource.connect(analyser);
      } catch {
        playerSource = null;
      }
    }
    routedCurrent = !!playerSource && ctx?.state === "running";
    // the clip's text travels in its URL (t=…); its length is known once it starts
    const spoken = (() => { try { return new URL(url, location.href).searchParams.get("t") ?? ""; } catch { return ""; } })();
    a.onplaying = () => {
      if (token !== playToken) return;
      speech = { id: ++speechId, text: spoken, durationMs: Number.isFinite(a.duration) ? (a.duration * 1000) / (a.playbackRate || 1) : spoken.length * 70, moods: opts.moods ?? [] };
    };
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      if (token === playToken) { current = null; currentDone = null; routedCurrent = false; speech = null; }
      resolve();
    };
    currentDone = done;
    a.onended = () => token === playToken && done();
    a.onerror = () => token === playToken && done();
    a.src = url;
    // a new src resets the rate to the default one, so both are set
    a.defaultPlaybackRate = a.playbackRate = opts.rate ?? 1;
    a.play().catch(done);
  });
}

let queueId = 0;

/** Plays the parts of one reply back to back; all parts are requested at once. */
export async function playVoices(urls: string[]): Promise<void> {
  const id = ++queueId;
  urls.slice(1).forEach(preloadVoice);
  for (const url of urls) {
    if (id !== queueId) return; // stopped or replaced by a newer reply
    await playVoice(url);
  }
}

/** Starts fetching a voice so it is ready when playVoice asks for it. */
export function preloadVoice(url: string) {
  if (!url || typeof window === "undefined") return;
  fetch(url).catch(() => {});
}

function stopCurrent() {
  const a = current;
  const done = currentDone;
  current = null;
  currentDone = null;
  if (a) a.pause();
  done?.();
}

export function stopVoice() {
  queueId++;
  stopCurrent();
}

export const MIC_ERRORS: Record<MicError, string> = {
  denied: "Разреши доступ к микрофону в настройках браузера и попробуй снова.",
  missing: "Микрофон не найден. Подключи микрофон и попробуй снова.",
  busy: "Микрофон занят другим приложением. Закрой его и попробуй снова.",
  unsupported: "Этот браузер не умеет записывать звук. Открой сайт в Chrome, Safari или Edge.",
};
