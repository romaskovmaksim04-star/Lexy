"""Lexy live calls: the student and Lexi talk in real time through Gemini Live.

  POST /session          (X-Lexy-Key) json {conv, prompt, voice, opening, seconds, turns, wrapup}
                         -> {"token"}. The web app opens the call here, so the prompt never
                         reaches the browser. A token is good for one connection, two minutes.
  GET  /live/ws?token=   WebSocket: PCM16 16 kHz mono up (binary), PCM16 24 kHz mono down
                         (binary), events as JSON text both ways.
  POST /live/rtc?token=  WebRTC offer -> answer. Audio both ways over UDP (Opus, the browser's
                         echo cancelling), events on the data channel "lexi".
  GET  /health

Events to the browser: ready, heard (what the student said so far), say (Lexi's words so
far), mood, fix, interrupted (stop playing at once), turn, reconnecting, end (Lexi said
goodbye: hang up once her audio has played), saved (the transcript is stored).
Events from the browser: text (a typed answer), end (hang up).

Google refuses our servers' addresses (it places them in Russia), so the connection to
Gemini goes through NL's relay into Cloudflare WARP: TCP to GEMINI_VIA with Google's name
as the TLS server name. When the call ends, the transcript and the seconds go back to the
web app (POST {WEB_URL}/api/live/hook with the same X-Lexy-Key).
"""

import asyncio
import audioop
import base64
import fractions
import json
import os
import re
import secrets
import ssl
import time

import requests
import websockets
from fastapi import FastAPI, Header, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

KEY = os.environ.get("LEXY_AI_KEY", "")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_HOST = "generativelanguage.googleapis.com"
# Gemini goes through the local Cloudflare WARP on this machine: a SOCKS5 proxy
# on 127.0.0.1:40000 (warp-svc) — TLS is end-to-end with Google, the egress is the
# WARP exit (own IPv6, no RU). "" = straight to Google (used for local testing only).
GEMINI_SOCKS = os.environ.get("GEMINI_SOCKS", "socks5://127.0.0.1:40000")
MODEL = os.environ.get("LIVE_MODEL", "models/gemini-3.8-live")
SILENCE_MS = int(os.environ.get("LIVE_SILENCE_MS", "500"))  # pause that ends the student's turn
WEB_URL = os.environ.get("WEB_URL", "http://127.0.0.1:3300")
# What a second of audio costs (25 tokens a second each way), for the costs table
USD_IN_PER_S = float(os.environ.get("LIVE_USD_IN_PER_S", "0.000075"))
USD_OUT_PER_S = float(os.environ.get("LIVE_USD_OUT_PER_S", "0.0003"))
USD_RUB = float(os.environ.get("USD_RUB", "82"))

URI = f"wss://{GEMINI_HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={GEMINI_KEY}"
MOODS = ["neutral", "warm", "excited", "impressed", "laughing", "curious", "sympathetic", "strict", "teasing",
         "encouraging", "angry", "shocked", "disappointed", "proud", "bored", "dramatic", "whisper"]
IN_RATE, OUT_RATE = 16000, 24000
VOICED_RMS = 200  # int16 loudness that counts as talking, when Gemini sends no voice activity
MAX_WALL_S = 40 * 60
# Now and then Gemini hears the student and never answers (seen on the free key, 2026-10-24):
# after NUDGE_S of silence it is asked to answer, after as long again the session is resumed
NUDGE_S = float(os.environ.get("LIVE_NUDGE_S", "3"))
# The corrections on screen come from a fast text model reading the student's line and Lexi's
# answer: as a function of the live model (show_fix) they were almost never called
POLZA_KEY = os.environ.get("POLZA_API_KEY", "")
POLZA_URL = os.environ.get("POLZA_URL", "https://api.polza.ai/api/v1")
DIRECTOR_MODEL = os.environ.get("DIRECTOR_MODEL", "deepseek/deepseek-v4.1-flash")

app = FastAPI(title="lexy-live", docs_url=None, redoc_url=None)
_sessions: dict[str, tuple[float, dict]] = {}


def log(*a):
    print(*a, flush=True)


def check_key(given: str | None):
    if KEY and given != KEY:
        raise HTTPException(status_code=401, detail="bad key")


def _tool(name: str, desc: str, props: dict, required: list[str]) -> dict:
    # NON_BLOCKING with a SILENT answer: Lexi keeps talking, and the answer does not start
    # another turn (a blocking call made her pause or say "{pause}")
    return {"name": name, "description": desc, "behavior": "NON_BLOCKING",
            "parameters": {"type": "OBJECT", "properties": props, "required": required}}


# No set_mood: called before her first word, 3.1 Flash either never spoke the line (SILENT
# answer) or spoke it twice (WHEN_IDLE). The face follows a text model reading her words.
TOOLS = [{"functionDeclarations": [
    _tool("end_call", "Ends the call. Call it after you have said your goodbye.", {}, []),
    _tool("report_bug", "Passes a problem with the app to the developers: the student says you can't hear them, the sound cuts out, a button or a page fails.",
          {"summary": {"type": "STRING", "description": "what is broken, in Russian, one or two sentences"}}, ["summary"]),
]}]

TOOL_TEXT = re.compile(r"\b(?:set_mood|show_fix|end_call|report_bug)\s*\([^)]{0,300}\)?", re.I)


def tidy(text: str) -> str:
    """Transcription noise that is not words: <no speech>, {pause}, a function call that got
    into the transcript (only there: it is not in the audio)."""
    text = re.sub(r"<[^>]{0,400}>|\{[^}]{0,40}\}", " ", text)
    text = TOOL_TEXT.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()


def director(system: str, user: str, max_tokens: int, json_mode=False) -> str:
    """One short answer from the fast text model (blocking: run it in a thread)."""
    body = {"model": DIRECTOR_MODEL, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "max_tokens": max_tokens, "temperature": 0, "reasoning": {"enabled": False}, "include_reasoning": False}
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    r = requests.post(f"{POLZA_URL}/chat/completions", headers={"Authorization": f"Bearer {POLZA_KEY}"}, json=body, timeout=8)
    r.raise_for_status()
    return (r.json()["choices"][0]["message"].get("content") or "").strip()


MOOD_SYSTEM = ("You pick the facial expression of Lexi, a flame-shaped English tutor, for the line Lexi is saying right now. "
               "Answer with exactly one word from this list and nothing else: " + ", ".join(MOODS) + ".")
MOOD_AFTER_WORDS = 5  # the face changes once this much of her line is known
FIX_SYSTEM = ("A Russian-speaking student learns English with a tutor in a voice call. You get the student's last line and the tutor's answer. "
              "If the tutor corrected a real English mistake in the student's words (grammar, wrong word, unnatural phrase; never punctuation, "
              "spelling or Russian words), return JSON {\"wrong\": the exact words from the student's line, \"right\": the corrected words, "
              "\"why\": why, in Russian, at most 12 words}. If there was no real mistake or the tutor did not correct it, return {}.")


class Call:
    """One call: a Gemini Live session and its transcript, whatever carries the browser's audio."""

    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.out: asyncio.Queue = asyncio.Queue()  # ("audio", bytes) | ("event", dict)
        self.gem = None
        self.ready = asyncio.Event()
        self.closed = False
        self.handle: str | None = None  # session resumption
        self.turns: list[dict] = []
        self.user_text = ""
        self.lexi_text = ""
        self.mood = "warm"
        self.fix_asked = False  # this turn went to the correction check
        self.mood_asked = False  # and its first words to the mood check
        self.finished = False
        self.lexi_cut = False
        self.ending = False
        self.wrapped = False
        self.voiced = 0.0  # seconds the student talked
        self.voiced_turn = 0.0
        self.vad_seen = False  # Gemini reports voice activity: the seconds come from it
        self.vad_start: float | None = None
        self.speaking = False  # Gemini is sending audio for the current turn
        self.awaiting: float | None = None  # since when an answer is due
        self.nudged = False
        self._resume_nudge = False
        self.nudge_note = ""
        self.typed = ""  # the last typed answer, until Lexi has answered it
        self.sent_s = 0.0
        self.heard_s = 0.0
        self.started = time.time()
        self.task: asyncio.Task | None = None

    # ---------- to the browser ----------
    def event(self, e: dict):
        self.out.put_nowait(("event", e))

    # ---------- Gemini ----------
    async def _connect(self):
        kw = {"max_size": None, "ssl": ssl.create_default_context(), "open_timeout": 10, "ping_interval": 20}
        if GEMINI_SOCKS:
            kw["proxy"] = GEMINI_SOCKS  # -> SOCKS5 WARP on this host, egress = CF IPv6
        ws = await websockets.connect(URI, **kw)
        setup = {
            "model": MODEL,
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": self.cfg["voice"]}}}},
            "systemInstruction": {"parts": [{"text": self.cfg["prompt"]}]},
            "tools": TOOLS,
            "inputAudioTranscription": {},
            "outputAudioTranscription": {},
            "realtimeInputConfig": {"automaticActivityDetection": {"silenceDurationMs": SILENCE_MS}},
            "sessionResumption": {"handle": self.handle} if self.handle else {},
            "contextWindowCompression": {"slidingWindow": {}},
        }
        await ws.send(json.dumps({"setup": setup}))
        msg = json.loads(await asyncio.wait_for(ws.recv(), 10))
        if "setupComplete" not in msg:
            await ws.close()
            raise RuntimeError(f"setup refused: {str(msg)[:300]}")
        return ws

    async def run(self):
        """Keeps the session up: Google ends a connection after some minutes (goAway) and the
        call goes on in a new one with the same conversation."""
        first = True
        failures = 0
        watch = asyncio.ensure_future(self._watch())
        while not self.closed:
            try:
                t = time.time()
                self.gem = await self._connect()
                log(f"live {self.cfg['conv']}: {'connected' if first else 'resumed'} in {time.time() - t:.2f}s")
                failures = 0
                self.ready.set()
                self.event({"t": "ready"})
                if first:
                    first = False
                    await self.text(self.cfg["opening"], record=False)
                elif self._resume_nudge:
                    self._resume_nudge = False
                    await self.text("(System: the line dropped for a moment. Answer the student's last words now.)", record=False)
                await self._read()
            except Exception as e:
                if self.closed:
                    break
                failures += 1
                log(f"live {self.cfg['conv']}: gemini dropped ({failures}): {e!r}")
                if failures >= 3 or not self.handle:
                    self.event({"t": "error"})
                    break
            if not self.closed:
                self.ready.clear()
                self.event({"t": "reconnecting"})
                await asyncio.sleep(0.3)
        watch.cancel()
        self.closed = True
        self.out.put_nowait(None)

    async def _read(self):
        async for raw in self.gem:
            msg = json.loads(raw)
            if "toolCall" in msg:
                await self._tools(msg["toolCall"].get("functionCalls", []))
            if "sessionResumptionUpdate" in msg:
                u = msg["sessionResumptionUpdate"]
                if u.get("resumable") and u.get("newHandle"):
                    self.handle = u["newHandle"]
            if "goAway" in msg:
                log(f"live {self.cfg['conv']}: goAway {msg['goAway']}")
                await self.gem.close()
                return
            if "voiceActivity" in msg:
                self._activity(msg["voiceActivity"])
            sc = msg.get("serverContent")
            if sc:
                self._content(sc)
            if time.time() - self.started > MAX_WALL_S and not self.ending:
                self.ending = True
                await self._wrap_up("The call has gone on for a long time.")

    def _activity(self, va: dict):
        """Gemini's own voice detector: where the student started and stopped talking. The
        minutes are charged from it (a loudness threshold missed most of a quiet microphone)."""
        try:
            at = float(str(va.get("audioOffset", "0")).rstrip("s"))
        except ValueError:
            return
        if va.get("type") == "ACTIVITY_START":
            self.vad_seen = True
            self.vad_start = at
            self.awaiting = None
        elif va.get("type") == "ACTIVITY_END" and self.vad_start is not None:
            secs = max(0.0, at - self.vad_start)
            self.vad_start = None
            self._count(secs)
            self._await_answer()

    def _await_answer(self):
        self.awaiting = time.time()
        self.nudged = False

    async def _watch(self):
        """Makes sure Lexi answers: a nudge, then a fresh connection to the same session."""
        while not self.closed:
            await asyncio.sleep(0.5)
            if self.awaiting is None or not self.ready.is_set() or time.time() - self.awaiting < NUDGE_S:
                continue
            if not self.nudged:
                log(f"live {self.cfg['conv']}: no answer for {NUDGE_S:.0f}s, nudging")
                self.nudged = True
                self.awaiting = time.time()
                try:
                    note = self.nudge_note or "(System: the student has finished. Answer them now.)"
                    self.nudge_note = ""
                    await self.gem.send(json.dumps({"realtimeInput": {"text": note}}))
                except Exception:
                    pass
            elif self.handle:
                log(f"live {self.cfg['conv']}: still no answer, resuming the session")
                self.awaiting = None
                self._resume_nudge = True
                try:
                    await self.gem.close()
                except Exception:
                    pass
            else:
                self.awaiting = None

    def _count(self, secs: float):
        self.voiced += secs
        self.voiced_turn += secs
        if not self.ending and self.voiced >= self.cfg.get("seconds", 600):
            self.ending = True
            asyncio.ensure_future(self._wrap_up("The student's minutes for today are over."))

    def _content(self, sc: dict):
        for p in (sc.get("modelTurn") or {}).get("parts", []):
            data = (p.get("inlineData") or {}).get("data")
            if data:
                self.awaiting = None
                self.speaking = True
                pcm = base64.b64decode(data)
                self.heard_s += len(pcm) / (OUT_RATE * 2)
                self.out.put_nowait(("audio", pcm))
        if sc.get("inputTranscription"):
            self.user_text += sc["inputTranscription"].get("text", "")
            self.event({"t": "heard", "text": tidy(self.user_text)})
        if sc.get("generationComplete") or sc.get("turnComplete"):
            # the student's line and Lexi's answer are known: was there a mistake to show?
            # a typed answer belongs to the line that answers it, not to the one it cut off
            typed = "" if self.lexi_cut else self.typed
            heard, said = tidy(self.user_text) or typed, tidy(self.lexi_text)
            if heard and said and not self.fix_asked and POLZA_KEY:
                self.fix_asked = True
                if typed and heard == typed:
                    self.typed = ""
                asyncio.ensure_future(self._find_fix(heard, said))
        if sc.get("outputTranscription"):
            self.lexi_text += sc["outputTranscription"].get("text", "")
            said = tidy(self.lexi_text)
            if said:
                self.event({"t": "say", "text": said})
            if not self.mood_asked and POLZA_KEY and len(said.split()) >= MOOD_AFTER_WORDS:
                self.mood_asked = True
                asyncio.ensure_future(self._find_mood(said))
        if sc.get("interrupted"):
            self.lexi_cut = True
            self.speaking = False
            self.event({"t": "interrupted"})
        if sc.get("turnComplete"):
            voiced = self.speaking
            self.speaking = False
            if tidy(self.lexi_text) and not voiced and not self.lexi_cut:
                # words came without a voice (seen with heavy мат in the line): she is asked to
                # say it again at once, and the silent line is not kept
                log(f"live {self.cfg['conv']}: a line came without audio: {tidy(self.lexi_text)[:80]!r}")
                self.lexi_text = ""
                self.awaiting = time.time() - NUDGE_S
                self.nudged = False
                self.nudge_note = "(System: your last line did not reach the student, the sound dropped. Say it again in other words.)"
            self._close_turn()

    def _close_turn(self):
        heard, said = tidy(self.user_text), tidy(self.lexi_text)
        if heard:
            turn = {"role": "user", "text": heard, "words": len(re.findall(r"[A-Za-zА-Яа-яЁё']+", heard)),
                    "seconds": round(self.voiced_turn, 1)}
            self.turns.append(turn)
            self.voiced_turn = 0.0
        if said:
            line = {"role": "preppy", "text": said, "mood": self.mood}
            if self.lexi_cut:
                line["interrupted"] = True
            self.turns.append(line)
        if heard or said:
            self.event({"t": "turn", "heard": heard, "said": said, "fix": None})
        self.user_text = self.lexi_text = ""
        self.fix_asked = False
        self.mood_asked = False
        self.lexi_cut = False
        if said and self.ending:
            self.event({"t": "end"})
            return
        answers = sum(1 for t in self.turns if t["role"] == "user")
        if heard and not self.wrapped and answers >= self.cfg.get("turns", 12):
            self.wrapped = True
            asyncio.ensure_future(self._wrap_up(None))

    async def _wrap_up(self, why: str | None):
        """Asks Lexi to say goodbye now (the last answer, the minutes, the clock)."""
        self.wrapped = True
        self.ending = True
        note = self.cfg.get("wrapup") or "Say goodbye now in character, mention that the review is on the screen, then call end_call."
        await self.text(f"(System: {why + ' ' if why else ''}{note})", record=False)

    async def _find_mood(self, said: str):
        """Her face, from the first words of her line."""
        try:
            word = (await asyncio.to_thread(director, MOOD_SYSTEM, said, 4)).strip(" .\"'").lower()
        except Exception as e:
            log(f"live {self.cfg['conv']}: mood check failed: {e!r}")
            return
        if word in MOODS and word != self.mood:
            self.mood = word
            self.event({"t": "mood", "mood": word})
            # the line already stored (a short one ends before the answer comes) gets it too
            if not tidy(self.lexi_text) and self.turns and self.turns[-1]["role"] == "preppy":
                self.turns[-1]["mood"] = word

    async def _find_fix(self, heard: str, said: str):
        """Asks the fast text model whether Lexi corrected a real mistake; shows it and keeps it
        with the student's line (which is stored by then or soon after)."""
        try:
            raw = await asyncio.to_thread(director, FIX_SYSTEM, f"Student: {heard}\nTutor: {said}", 120, True)
            d = json.loads(raw[raw.find("{"):raw.rfind("}") + 1] or "{}")
        except Exception as e:
            log(f"live {self.cfg['conv']}: fix check failed: {e!r}")
            return
        wrong, right = str(d.get("wrong", "")).strip(" «»\""), str(d.get("right", "")).strip(" «»\"")
        # only a correction of words the student really said, that changes something
        if not wrong or not right or wrong.lower() not in heard.lower() or wrong.lower() == right.lower():
            return
        fix = {"wrong": wrong, "right": right, "why": str(d.get("why", ""))[:160]}
        for _ in range(20):
            line = next((t for t in reversed(self.turns) if t["role"] == "user" and t["text"] == heard), None)
            if line:
                line["fix"] = fix
                break
            await asyncio.sleep(0.25)
        self.event({"t": "fix", "fix": fix})

    async def _tools(self, calls: list[dict]):
        answers = []
        for c in calls:
            name, args = c.get("name"), c.get("args") or {}
            if name == "set_mood" and args.get("mood") in MOODS:
                self.mood = args["mood"]
                self.event({"t": "mood", "mood": self.mood})
            elif name == "end_call":
                self.ending = True
                if not tidy(self.lexi_text):
                    self.event({"t": "end"})
            elif name == "report_bug":
                recent = "\n".join(f"{'👤' if t['role'] == 'user' else '🔥'} {t['text']}" for t in self.turns[-6:])
                asyncio.ensure_future(hook({"kind": "bug", "conv": self.cfg["conv"], "summary": str(args.get("summary", ""))[:600], "context": recent}))
            # Called while she talks: SILENT, so the answer starts no second turn. Called before
            # her first word (3.1 Flash often does): SILENT left the turn without a voice for
            # good, WHEN_IDLE lets her go on and say it
            answers.append({"id": c.get("id"), "name": name, "response": {"result": "ok"}, "scheduling": "SILENT" if self.speaking else "WHEN_IDLE"})
        if answers and self.gem:
            try:
                await self.gem.send(json.dumps({"toolResponse": {"functionResponses": answers}}))
            except Exception:
                pass

    # ---------- from the browser ----------
    async def mic(self, pcm: bytes):
        """PCM16 16 kHz mono from the student's microphone."""
        if self.closed or not self.ready.is_set():
            return
        secs = len(pcm) / (IN_RATE * 2)
        self.sent_s += secs
        if not self.vad_seen and pcm and audioop.rms(pcm, 2) > VOICED_RMS:
            self._count(secs)
        try:
            await self.gem.send(json.dumps({"realtimeInput": {"audio": {"data": base64.b64encode(pcm).decode(), "mimeType": f"audio/pcm;rate={IN_RATE}"}}}))
        except Exception:
            pass

    async def text(self, text: str, record=True):
        """A typed answer (or a note from us): Lexi answers it like speech."""
        text = text.strip()[:800]
        if not text:
            return
        await asyncio.wait_for(self.ready.wait(), 15)
        self._await_answer()
        if record:
            self.typed = text  # a typed answer gets its correction checked too
            self.turns.append({"role": "user", "text": text, "words": len(re.findall(r"[A-Za-zА-Яа-яЁё']+", text)), "seconds": 0, "typed": True})
            text = f"[typed] {text}"
        await self.gem.send(json.dumps({"realtimeInput": {"text": text}}))

    async def finish(self):
        """Hangs up and hands the transcript to the web app (once, whoever hangs up first)."""
        if self.finished:
            return
        self.finished = True
        self.closed = True
        if self.gem:
            try:
                await self.gem.close()
            except Exception:
                pass
        if self.task:
            self.task.cancel()
            self.task = None
        if tidy(self.lexi_text) or tidy(self.user_text):
            self._close_turn()
        cost = (self.sent_s * USD_IN_PER_S + self.heard_s * USD_OUT_PER_S) * USD_RUB
        log(f"live {self.cfg['conv']}: done, {len(self.turns)} lines, student {self.voiced:.0f}s, sent {self.sent_s:.0f}s, heard {self.heard_s:.0f}s, ~{cost:.2f} ₽")
        ok = await hook({"kind": "done", "conv": self.cfg["conv"], "turns": self.turns, "seconds": round(self.voiced), "cost": round(cost, 4)})
        self.event({"t": "saved", "ok": ok})
        self.out.put_nowait(None)

    def start(self):
        self.task = asyncio.ensure_future(self.run())


async def hook(body: dict) -> bool:
    def post():
        try:
            r = requests.post(f"{WEB_URL}/api/live/hook", json=body, headers={"X-Lexy-Key": KEY}, timeout=20)
            return r.ok
        except Exception as e:
            log("hook failed:", repr(e))
            return False
    return await asyncio.to_thread(post)


def take(token: str, keep=False) -> dict:
    """The session a token opens. `keep` leaves it usable: a WebRTC attempt that never connects
    must not burn the token the WebSocket fallback needs."""
    now = time.time()
    for k in [k for k, (t, _) in _sessions.items() if now - t > 120]:
        _sessions.pop(k, None)
    found = _sessions.get(token) if keep else _sessions.pop(token, None)
    if not found:
        raise HTTPException(status_code=403, detail="bad token")
    return found[1]


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL, "key": bool(GEMINI_KEY), "via": GEMINI_SOCKS}


@app.post("/session")
async def session(req: Request, x_lexy_key: str | None = Header(None)):
    check_key(x_lexy_key)
    cfg = await req.json()
    for k in ("conv", "prompt", "voice", "opening"):
        if not isinstance(cfg.get(k), str) or not cfg[k]:
            raise HTTPException(status_code=400, detail=f"no {k}")
    token = secrets.token_urlsafe(24)
    _sessions[token] = (time.time(), cfg)
    return {"token": token}


# ---------- WebSocket ----------

@app.websocket("/live/ws")
async def live_ws(ws: WebSocket, token: str = Query("")):
    try:
        cfg = take(token)
    except HTTPException:
        await ws.close(code=4403)
        return
    await ws.accept()
    call = Call(cfg)
    call.start()

    async def pump():
        while True:
            item = await call.out.get()
            if item is None:
                if call.closed and call.task is None:
                    return
                continue
            kind, data = item
            if kind == "audio":
                await ws.send_bytes(data)
            else:
                await ws.send_text(json.dumps(data, ensure_ascii=False))
            if kind == "event" and data.get("t") == "saved":
                return

    sender = asyncio.ensure_future(pump())
    try:
        while True:
            m = await ws.receive()
            if m["type"] == "websocket.disconnect":
                break
            if m.get("bytes"):
                await call.mic(m["bytes"])
            elif m.get("text"):
                e = json.loads(m["text"])
                if e.get("t") == "text":
                    await call.text(str(e.get("text", "")))
                elif e.get("t") == "end":
                    break
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        await call.finish()
        try:
            await asyncio.wait_for(sender, 25)
        except Exception:
            sender.cancel()
        try:
            await ws.close()
        except Exception:
            pass


# ---------- WebRTC ----------

_peers: set = set()


def _rtc():
    """aiortc is loaded on the first WebRTC call (it pulls in PyAV)."""
    import av
    from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription

    class LexiTrack(MediaStreamTrack):
        """Lexi's voice as a 20 ms frame clock; silence while she says nothing.

        Gemini sends her voice in bursts. Played the moment it arrives, a burst that comes a
        little late left a gap in the middle of a word (the call sounded torn), so each stretch
        of speech starts only once PREBUFFER of it is here, and a gap waits for that much again."""
        kind = "audio"
        FRAME = OUT_RATE // 50
        PREBUFFER = int(OUT_RATE * 2 * float(os.environ.get("LIVE_PREBUFFER_S", "0.16")))

        def __init__(self):
            super().__init__()
            self.buf = bytearray()
            self.pts = 0
            self.t0 = None
            self.flowing = False
            self.first_at = 0.0

        def feed(self, pcm: bytes):
            if not self.buf and not self.flowing:
                self.first_at = time.time()
            self.buf.extend(pcm)

        def flush(self):
            self.buf.clear()
            self.flowing = False

        async def recv(self):
            if self.t0 is None:
                self.t0 = time.time()
            wait = self.t0 + self.pts / OUT_RATE - time.time()
            if wait > 0:
                await asyncio.sleep(wait)
            need = self.FRAME * 2
            # start (or go on after a gap) with enough in hand, or once the line is clearly
            # all there (a short "Ha!" never reaches PREBUFFER)
            if not self.flowing and self.buf and (len(self.buf) >= self.PREBUFFER or time.time() - self.first_at > 0.3):
                self.flowing = True
            if self.flowing:
                chunk = bytes(self.buf[:need])
                del self.buf[:need]
                if not self.buf:
                    self.flowing = False
            else:
                chunk = b""
            if len(chunk) < need:
                chunk += b"\0" * (need - len(chunk))
            frame = av.AudioFrame(format="s16", layout="mono", samples=self.FRAME)
            frame.planes[0].update(chunk)
            frame.sample_rate = OUT_RATE
            frame.pts = self.pts
            frame.time_base = fractions.Fraction(1, OUT_RATE)
            self.pts += self.FRAME
            return frame

    return av, RTCPeerConnection, RTCSessionDescription, LexiTrack


@app.post("/live/rtc")
async def live_rtc(req: Request, token: str = Query("")):
    cfg = take(token, keep=True)
    offer = await req.json()
    av, RTCPeerConnection, RTCSessionDescription, LexiTrack = _rtc()
    pc = RTCPeerConnection()
    _peers.add(pc)
    call = Call(cfg)
    voice = LexiTrack()
    pc.addTrack(voice)
    channel = {"dc": None}
    done = asyncio.Event()

    def send_event(e: dict):
        dc = channel["dc"]
        if dc and dc.readyState == "open":
            dc.send(json.dumps(e, ensure_ascii=False))

    async def pump():
        while True:
            item = await call.out.get()
            if item is None:
                if call.closed and call.task is None:
                    break
                continue
            kind, data = item
            if kind == "audio":
                voice.feed(data)
            else:
                if data.get("t") == "interrupted":
                    voice.flush()
                send_event(data)
                if data.get("t") == "saved":
                    break
        done.set()

    async def hang_up():
        if not call.task:
            # never connected, or already hung up: nothing to store
            if not call.closed:
                call.closed = True
                await pc.close()
                _peers.discard(pc)
            return
        await call.finish()
        try:
            await asyncio.wait_for(done.wait(), 25)
        except Exception:
            pass
        await asyncio.sleep(0.5)  # let "saved" leave
        await pc.close()
        _peers.discard(pc)

    @pc.on("datachannel")
    def on_channel(dc):
        channel["dc"] = dc

        @dc.on("message")
        def on_message(m):
            try:
                e = json.loads(m)
            except Exception:
                return
            if e.get("t") == "text":
                asyncio.ensure_future(call.text(str(e.get("text", ""))))
            elif e.get("t") == "end":
                asyncio.ensure_future(hang_up())

        if call.ready.is_set():
            send_event({"t": "ready"})

    @pc.on("track")
    def on_track(track):
        if track.kind != "audio":
            return
        resampler = av.AudioResampler(format="s16", layout="mono", rate=IN_RATE)

        async def read():
            pending = bytearray()
            while True:
                try:
                    frame = await track.recv()
                except Exception:
                    break
                for f in resampler.resample(frame):
                    pending.extend(bytes(f.planes[0])[: f.samples * 2])
                # 40 ms pieces to Gemini
                while len(pending) >= IN_RATE // 25 * 2:
                    piece = bytes(pending[: IN_RATE // 25 * 2])
                    del pending[: IN_RATE // 25 * 2]
                    await call.mic(piece)
            await hang_up()
        asyncio.ensure_future(read())

    @pc.on("connectionstatechange")
    async def on_state():
        if pc.connectionState == "connected" and not call.task and not call.closed:
            # the audio flows: the call begins and the token is used up
            _sessions.pop(token, None)
            call.start()
            asyncio.ensure_future(pump())
        elif pc.connectionState in ("failed", "closed"):
            await hang_up()

    # a browser that never connects is let go
    async def give_up():
        await asyncio.sleep(15)
        if not call.task and not call.closed:
            await hang_up()
    asyncio.ensure_future(give_up())

    await pc.setRemoteDescription(RTCSessionDescription(sdp=offer["sdp"], type=offer["type"]))
    await pc.setLocalDescription(await pc.createAnswer())
    return JSONResponse({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("LIVE_PORT", "8766")), ws="wsproto")
