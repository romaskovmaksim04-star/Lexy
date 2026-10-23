"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, type MotionValue } from "motion/react";
import type { MicError } from "./voice-client";

// Hands-free call with Lexi: the microphone stays open for the whole call, a voice activity
// detector finds where the student starts and stops talking, and each utterance (with a bit
// of audio from just before the detector fired) is handed over as a 16 kHz WAV file.
//
// An utterance ends after a second of silence. Learners often pause longer mid-thought; the
// page handles that by joining the next utterance to the answer as long as Lexi has not
// started to reply (onSpeechStart tells it the student is talking again). While Lexi speaks,
// only louder and longer speech counts, as interrupting her. The server runs a proper VAD on
// every file again, so a false start here costs nothing.

const TARGET_RATE = 16000;
const FRAME = 2048; // samples per analysis frame (~43 ms at 48 kHz)
const PRE_ROLL_MS = 450; // audio kept from before speech was detected
const START_MS = 150; // speech needed to start an utterance
const BARGE_MS = 320; // speech needed to interrupt Lexi
const END_SILENCE_MS = 750; // silence that ends an utterance (a longer pause is taken back if they go on)
const KEEP_TAIL_MS = 250; // silence kept at the end of the file
const PAUSE_MS = 600; // a silence this long inside an utterance counts as a hesitation
const MAX_UTTERANCE_MS = 60_000;
const MIN_LEVEL = 0.012; // absolute floor for "speech" (RMS)

export type CallState = "off" | "starting" | "waiting" | "hearing";

export type Utterance = { wav: Blob; seconds: number; pauses: number };

type Options = {
  /** Each finished utterance. */
  onUtterance: (u: Utterance) => void;
  /** The student started talking (an utterance began). */
  onSpeechStart?: (bargeIn: boolean) => void;
  /** The student talked over Lexi while `speaking` was on. */
  onBargeIn?: () => void;
};

function encodeWav(chunks: Float32Array[], inputRate: number): Blob {
  const length = chunks.reduce((a, c) => a + c.length, 0);
  const ratio = inputRate / TARGET_RATE;
  const outLen = Math.floor(length / ratio);
  const pcm = new Int16Array(outLen);
  // Linear resampling to 16 kHz over the concatenated chunks
  let ci = 0, offset = 0;
  for (let i = 0; i < outLen; i++) {
    let pos = Math.floor(i * ratio) - offset;
    while (ci < chunks.length && pos >= chunks[ci].length) {
      offset += chunks[ci].length;
      pos -= chunks[ci].length;
      ci++;
    }
    if (ci >= chunks.length) break;
    const v = Math.max(-1, Math.min(1, chunks[ci][pos]));
    pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + pcm.byteLength);
  const dv = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); dv.setUint32(4, 36 + pcm.byteLength, true); str(8, "WAVE");
  str(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, TARGET_RATE, true); dv.setUint32(28, TARGET_RATE * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  str(36, "data"); dv.setUint32(40, pcm.byteLength, true);
  new Int16Array(buf, 44).set(pcm);
  return new Blob([buf], { type: "audio/wav" });
}

export function useVoiceCall({ onUtterance, onSpeechStart, onBargeIn }: Options) {
  const [state, setState] = useState<CallState>("off");
  const [error, setError] = useState<MicError | null>(null);
  const [silentFor, setSilentFor] = useState(0); // seconds without any voice on the student's turn
  const [peak, setPeak] = useState(0); // loudest level in the last seconds, for the mic check
  const level: MotionValue<number> = useMotionValue(0);

  const ctx = useRef<AudioContext | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const node = useRef<ScriptProcessorNode | null>(null);
  const speaking = useRef(false); // Lexi is talking
  const paused = useRef(false); // muted: nothing is collected
  const endNow = useRef(false); // the student said they are done
  const cb = useRef({ onUtterance, onSpeechStart, onBargeIn });
  cb.current = { onUtterance, onSpeechStart, onBargeIn };

  const stop = useCallback(() => {
    node.current?.disconnect();
    node.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    ctx.current?.close().catch(() => {});
    ctx.current = null;
    level.set(0);
    setState("off");
  }, [level]);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("unsupported");
      return false;
    }
    setState("starting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      const name = (e as DOMException).name;
      setError(name === "NotFoundError" ? "missing" : name === "NotReadableError" ? "busy" : "denied");
      setState("off");
      return false;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new AC();
    ctx.current = ac;
    await ac.resume().catch(() => {});
    const src = ac.createMediaStreamSource(stream.current);
    const proc = ac.createScriptProcessor(FRAME, 1, 1);
    node.current = proc;
    const frameMs = (FRAME / ac.sampleRate) * 1000;
    const preFrames = Math.ceil(PRE_ROLL_MS / frameMs);

    let floor = 0.01; // background noise estimate
    let voiced = 0; // consecutive ms of speech
    let quiet = 0; // consecutive ms of silence inside an utterance
    let recording: Float32Array[] | null = null;
    let recMs = 0;
    let pauses = 0;
    let lastVoice = performance.now();
    let peakLevel = 0;
    let peakAt = performance.now();
    const ring: Float32Array[] = [];

    const finish = () => {
      const chunks = recording!;
      recording = null;
      voiced = 0;
      endNow.current = false;
      // Most of the closing silence is cut: it only makes the recogniser invent words
      const drop = Math.max(0, Math.floor((quiet - KEEP_TAIL_MS) / frameMs));
      const kept = drop ? chunks.slice(0, Math.max(1, chunks.length - drop)) : chunks;
      const speechMs = recMs - quiet;
      setState("waiting");
      if (speechMs >= 400) cb.current.onUtterance({ wav: encodeWav(kept, ac.sampleRate), seconds: speechMs / 1000, pauses });
    };

    proc.onaudioprocess = (e) => {
      const data = new Float32Array(e.inputBuffer.getChannelData(0));
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      level.set(Math.min(1, rms * 8));
      const now = performance.now();
      if (rms > peakLevel || now - peakAt > 3000) {
        peakLevel = rms;
        peakAt = now;
        setPeak(Math.round(Math.min(1, rms * 8) * 20) / 20);
      }

      const barging = speaking.current;
      // Starting needs a clearer signal than keeping an utterance going (hysteresis)
      const base = Math.max(MIN_LEVEL, floor * 3);
      const threshold = recording ? base * 0.8 : barging ? Math.max(MIN_LEVEL * 1.8, floor * 8) : base;
      const isVoice = rms > threshold;
      if (!isVoice && !recording) floor = floor * 0.95 + rms * 0.05; // follow the room noise

      ring.push(data);
      if (ring.length > preFrames) ring.shift();

      if (paused.current) {
        voiced = 0;
        lastVoice = now;
        if (recording) finish();
        return;
      }

      if (!recording) {
        voiced = isVoice ? voiced + frameMs : 0;
        // Silence only counts while it is the student's turn
        if (isVoice || barging) { lastVoice = now; setSilentFor(0); }
        else setSilentFor(Math.floor((now - lastVoice) / 1000));
        if (voiced >= (barging ? BARGE_MS : START_MS)) {
          if (barging) {
            speaking.current = false;
            cb.current.onBargeIn?.();
          }
          recording = [...ring];
          recMs = ring.length * frameMs;
          quiet = 0;
          pauses = 0;
          setState("hearing");
          cb.current.onSpeechStart?.(barging);
        }
        return;
      }

      recording.push(data);
      recMs += frameMs;
      if (isVoice) {
        if (quiet >= PAUSE_MS) pauses++;
        quiet = 0;
        lastVoice = now;
      } else quiet += frameMs;
      if (endNow.current || quiet >= END_SILENCE_MS || recMs >= MAX_UTTERANCE_MS) finish();
    };
    src.connect(proc);
    // A ScriptProcessor only runs when connected to an output; it writes silence there
    proc.connect(ac.destination);
    setState("waiting");
    return true;
  }, [level]);

  /** Lexi starts or stops talking: speech in between counts as interrupting. */
  const setSpeaking = useCallback((on: boolean) => { speaking.current = on; }, []);
  /** Mute: nothing is recorded, silence is not counted. */
  const setPaused = useCallback((on: boolean) => { paused.current = on; if (!on) setSilentFor(0); }, []);
  /** The student says they are done: the current utterance is sent right away. */
  const finishNow = useCallback(() => { endNow.current = true; }, []);

  return { start, stop, state, error, level, silentFor, peak, setSpeaking, setPaused, finishNow };
}
