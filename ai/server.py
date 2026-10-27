"""Lexy speech service: speech-to-text with word timings and text-to-speech.

Runs next to the web app and listens on localhost only; the app forwards audio here.

  POST /stt   multipart field "audio" (webm/ogg/wav/mp3), query ?mode=fast|accurate|chat
              and optional form field "context" (what the student is answering)
              -> {"text", "duration", "speech", "language", "words": [{"w", "s", "e", "p"}]}
  POST /tts   json {"text", "voice", "rate", "mood"} -> audio/mpeg (cached on disk)
  GET  /health

Every recording first goes through Silero VAD here (a few milliseconds of CPU): audio with
no speech never reaches a paid recogniser, and silence around the speech is cut off, which
is what made Whisper invent "Thank you." at the end of answers.

With POLZA_API_KEY set, recognition goes through polza.ai (Whisper large-v3-turbo; chat turns
without a fixed language, so Russian stays Russian and mixed speech stays mixed), and voices
through Gemini TTS (emotional, reads Russian). polza gives no word timings, so the scored
Speaking answers take their timings from the local Whisper running alongside. The local
models are also the fallback when polza fails; without the key everything runs locally.

Every request needs the header X-Lexy-Key equal to LEXY_AI_KEY when that variable is set.
"""

import base64
import hashlib
import io
import os
import subprocess
import tempfile
import threading
import time
from pathlib import Path

from concurrent.futures import ThreadPoolExecutor, as_completed, wait

from fastapi import FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

KEY = os.environ.get("LEXY_AI_KEY", "")
CACHE = Path(os.environ.get("LEXY_TTS_CACHE", "/var/cache/lexy-tts"))
FAST_MODEL = os.environ.get("WHISPER_FAST", "base.en")
ACCURATE_MODEL = os.environ.get("WHISPER_ACCURATE", "small.en")
THREADS = int(os.environ.get("WHISPER_THREADS", "2"))
MAX_AUDIO = 25 * 1024 * 1024
POLZA_KEY = os.environ.get("POLZA_API_KEY", "")
POLZA_URL = os.environ.get("POLZA_URL", "https://api.polza.ai/api/v1")
POLZA_STT = os.environ.get("POLZA_STT_MODEL", "openai/whisper-large-v3-turbo")
CHAT_MODEL = os.environ.get("WHISPER_CHAT", "base")  # multilingual local fallback for chat turns
# Judges which reading of a chat turn the audio supports (base is too weak in Russian for it)
SCORE_MODEL = os.environ.get("WHISPER_SCORE", "small")
POLZA_TTS = os.environ.get("POLZA_TTS_MODEL", "google/gemini-3.8-flash-lite-tts")
STT_RUB_PER_MIN = float(os.environ.get("POLZA_STT_RUB_PER_MIN", "0.048"))  # turbo's price, for accounting

# Whisper drops hesitations unless the prompt shows them; we need them for fluency scores.
FILLER_PROMPT = "Umm, let me think, like, hmm... Okay, uh, here's what I, um, think."
# Chat turns may be Russian, English or both; the prompt shows Whisper that mixing is normal
MIXED_PROMPT = "Umm, well, I think... Ну, короче, I went to the park, и там было классно."

# What Whisper writes over silence or noise (from its subtitle training data). A transcript
# made only of these, or ending with one as a separate segment, is cleaned of it.
HALLUCINATIONS = [
    "thank you", "thank you very much", "thanks for watching", "thank you for watching",
    "thanks for listening", "thank you for listening", "bye", "bye bye", "you",
    "subtitles by the amara org community", "please subscribe",
    "спасибо", "спасибо за просмотр", "спасибо за внимание", "продолжение следует",
    "субтитры сделал dimatorzok", "субтитры создавал dimatorzok", "редактор субтитров а синецкая корректор а егорова",
]

# Silero v3_en speakers, picked by measured median pitch (voice_probe.py, 2026-10-21):
# male voices around 120 Hz, female around 210 Hz, away from the extremes of each range.
VOICES = {
    "examiner": "en_13",  # male, 123 Hz
    "female": "en_0",     # 210 Hz
    "male": "en_27",      # 120 Hz
    "female2": "en_43",   # 212 Hz
    "male2": "en_89",     # 128 Hz
    "preppy": "en_61",    # female, 218 Hz
}

# TorchScript compiles Silero once per input-length bucket: the first few phrases after a
# start take 7-15 s each, later ones 0.3 s. Warm-up runs these lengths before real traffic.
WARMUP_TTS = [
    "Okay.",
    "Hello there! Ready for a little chat?",
    "Well, I usually spend my weekends with my family. We often go to the park.",
    "That's interesting. Why do you think people enjoy reading books about history so much these days?",
    "Now I'm going to give you a topic and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say.",
    "Good answer, I liked your example. By the way, we say people, not peoples. Let's move on. Do you think a four-day working week would be a good idea for most companies in your country, and why?",
]
SAMPLE_RATE = 24000

# Gemini voices for each of our voice names, with how that voice should sound. A style
# written into the text itself gets read aloud by the lite model, so it goes in "instructions".
RU_EN = " Russian words are read with a native Russian accent, English words with a clear British accent."
GEMINI_VOICES = {
    "examiner": ("Charon", "You are a calm, neutral IELTS examiner with a clear British accent. Speak clearly at an even pace."),
    "female": ("Aoede", "A friendly young British woman speaking naturally."),
    "male": ("Orus", "A friendly British man speaking naturally."),
    "female2": ("Leda", "A cheerful young woman speaking naturally."),
    "male2": ("Puck", "A relaxed young man speaking naturally."),
    "preppy": ("Zephyr", "Lexi, a lively, warm English tutor." + RU_EN),
    "lexi": ("Zephyr", "Lexi, a lively, warm English tutor for Russian speakers." + RU_EN),
    "lexi-strict": ("Kore", "Lexi in strict coach mode: firm, demanding, short sentences, no smiles." + RU_EN),
    "lexi-kind": ("Leda", "Lexi in gentle mode: soft, encouraging and very warm." + RU_EN),
    "lexi-sarcastic": ("Puck", "Lexi in sarcastic mode: dry humour, playful teasing, ironic intonation." + RU_EN),
}
# Voices a user may pick for Lexi ("g:<name>" in requests), same list as src/lib/voices.ts
GEMINI_NAMES = {
    "Zephyr", "Kore", "Leda", "Aoede", "Callirrhoe", "Autonoe", "Despina", "Erinome", "Laomedeia", "Achernar",
    "Gacrux", "Pulcherrima", "Vindemiatrix", "Sulafat", "Puck", "Charon", "Fenrir", "Orus", "Enceladus",
    "Iapetus", "Umbriel", "Algieba", "Algenib", "Rasalgethi", "Alnilam", "Schedar", "Achird",
    "Zubenelgenubi", "Sadachbia", "Sadaltager",
}
FEMALE_NAMES = {
    "Zephyr", "Kore", "Leda", "Aoede", "Callirrhoe", "Autonoe", "Despina", "Erinome", "Laomedeia", "Achernar",
    "Gacrux", "Pulcherrima", "Vindemiatrix", "Sulafat",
}
MOODS = {
    "neutral": "",
    "warm": "Sound warm and friendly.",
    "excited": "Sound genuinely excited and happy.",
    "impressed": "Sound impressed, with a short delighted laugh at the start.",
    "laughing": "Laugh lightly while saying it, amused.",
    "curious": "Sound curious and interested.",
    "sympathetic": "Sound sympathetic and gentle.",
    "strict": "Sound strict and demanding.",
    "teasing": "Sound teasing and ironic.",
    "encouraging": "Sound encouraging and supportive.",
    "angry": "Sound genuinely furious: loud, fast and sharp, biting every word, real anger in the voice.",
    "shocked": "Sound completely shocked and stunned.",
    "disappointed": "Sound deeply disappointed, with a heavy sigh.",
    "proud": "Sound proud and moved.",
    "bored": "Sound bored and unimpressed, flat and slow.",
    "dramatic": "Sound theatrical and over-the-top dramatic.",
    "whisper": "Whisper it, as if sharing a secret.",
}

app = FastAPI(title="lexy-ai", docs_url=None, redoc_url=None)
_models: dict = {}
_load_lock = threading.Lock()
_tts_lock = threading.Lock()


def check_key(given: str | None):
    if KEY and given != KEY:
        raise HTTPException(status_code=401, detail="bad key")


def whisper_model(name: str):
    with _load_lock:
        if name not in _models:
            from faster_whisper import WhisperModel

            _models[name] = WhisperModel(name, device="cpu", compute_type="int8", cpu_threads=THREADS)
        return _models[name]


def silero():
    with _load_lock:
        if "tts" not in _models:
            import torch

            torch.set_num_threads(THREADS)
            model, _ = torch.hub.load("snakers4/silero-models", "silero_tts", language="en", speaker="v3_en", trust_repo=True)
            _models["tts"] = model
        return _models["tts"]


_warm = {"tts": False, "stt": False}


def warm_up():
    try:
        model = silero()
        for text in WARMUP_TTS:
            with _tts_lock:
                model.apply_tts(ssml_text=ssml(text, "medium"), speaker=VOICES["examiner"], sample_rate=SAMPLE_RATE)
        _warm["tts"] = True
        import numpy as np

        silence = np.zeros(16000, dtype=np.float32)
        list(whisper_model(FAST_MODEL).transcribe(silence, language="en")[0])
        _warm["stt"] = True
    except Exception as e:  # the service still answers, only slower
        print("warm-up failed:", e, flush=True)


def warm_vad():
    try:
        import numpy as np

        speech_segments(np.zeros(16000, dtype=np.float32))
    except Exception as e:
        print("vad warm-up failed:", e, flush=True)


@app.on_event("startup")
def start_warm_up():
    threading.Thread(target=warm_vad, daemon=True).start()
    if not POLZA_KEY:
        threading.Thread(target=warm_up, daemon=True).start()


@app.get("/health")
def health():
    return {"ok": True, "loaded": sorted(_models.keys()), "warm": _warm}


def decode(data: bytes):
    """Any browser recording -> 16 kHz mono float32."""
    import numpy as np

    r = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1"],
        input=data, capture_output=True, check=True,
    )
    return np.frombuffer(r.stdout, dtype=np.float32)


def vad():
    with _load_lock:
        if "vad" not in _models:
            import torch

            torch.set_num_threads(1)
            model, utils = torch.hub.load("snakers4/silero-vad", "silero_vad", trust_repo=True)
            _models["vad"] = (model, utils[0])
        return _models["vad"]


_vad_lock = threading.Lock()
# a chat turn alone sends up to ten readings and five encodings at once
_pool = ThreadPoolExecutor(max_workers=16)
_tts_pool = ThreadPoolExecutor(max_workers=8)
TTS_HEDGE_S = float(os.environ.get("TTS_HEDGE_S", "3.2"))


def speech_segments(pcm, min_silence_ms=300) -> list[tuple[float, float]]:
    """Seconds where someone speaks, from Silero VAD."""
    import torch

    model, get_ts = vad()
    with _vad_lock:
        ts = get_ts(torch.from_numpy(pcm.copy()), model, sampling_rate=16000, threshold=0.5,
                    min_speech_duration_ms=180, min_silence_duration_ms=min_silence_ms, speech_pad_ms=120)
    return [(t["start"] / 16000, t["end"] / 16000) for t in ts]


def trim(pcm, segs, pad=0.15, max_gap=1.2):
    """Speech only: silence cut at both ends and long inner pauses shortened to max_gap."""
    import numpy as np

    parts = []
    for i, (a, b) in enumerate(segs):
        a = max(0.0, a - pad) if i == 0 else a
        b = min(len(pcm) / 16000, b + pad) if i == len(segs) - 1 else b
        if parts:
            gap = a - segs[i - 1][1]
            if gap > max_gap:
                parts.append(np.zeros(int(max_gap * 16000), dtype=np.float32))
            else:
                parts.append(pcm[int(segs[i - 1][1] * 16000):int(a * 16000)])
        parts.append(pcm[int(a * 16000):int(b * 16000)])
    return np.concatenate(parts) if parts else pcm[:0]


def to_wav(pcm) -> bytes:
    import soundfile as sf

    buf = io.BytesIO()
    sf.write(buf, pcm, 16000, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def norm_phrase(t: str) -> str:
    import re

    return re.sub(r"[^a-zа-яё ]+", "", t.lower().replace("ё", "е")).strip()


SHORT_REAL = {"you", "bye", "bye bye"}


def clean_hallucinations(text: str) -> str:
    """Drops Whisper's subtitle phrases when they stand alone or close the transcript."""
    import re

    # turbo puts a double space between its segments; a made-up closing line is its own segment
    parts = [p for p in re.split(r"\s{2,}|(?<=[.!?])\s+", text.strip()) if p.strip()]
    # a closing "you" or "bye" is often really said ("My best friend is... you?"): those two
    # only go when they are all there is
    while parts and norm_phrase(parts[-1]) in HALLUCINATIONS and (len(parts) == 1 or norm_phrase(parts[-1]) not in SHORT_REAL):
        parts.pop()
    return " ".join(parts).strip()


def polza_text(wav: bytes, language: str | None, prompt: str) -> str:
    import requests

    form = {"model": POLZA_STT, "prompt": prompt}
    if language:
        form["language"] = language
    r = requests.post(
        f"{POLZA_URL}/audio/transcriptions",
        headers={"Authorization": f"Bearer {POLZA_KEY}"},
        data=form,
        files={"file": ("answer.wav", wav)},
        timeout=40,
    )
    r.raise_for_status()
    d = r.json()
    if "text" not in d:
        raise RuntimeError(str(d)[:200])
    return d["text"].strip()


def local_words(pcm, model_name: str, language: str | None):
    """Local faster-whisper with word timings: text, words, detected language."""
    model = whisper_model(model_name)
    segments, info = model.transcribe(
        pcm,
        language=language,
        beam_size=1,
        word_timestamps=True,
        initial_prompt=FILLER_PROMPT if language == "en" else MIXED_PROMPT,
        condition_on_previous_text=False,
        vad_filter=False,
    )
    words, text_parts = [], []
    for seg in segments:
        text_parts.append(seg.text.strip())
        for w in seg.words or []:
            words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2), "p": round(w.probability, 3)})
    return " ".join(t for t in text_parts if t), words, info.language


def cyrillic_share(text: str) -> float:
    letters = [c for c in text if c.isalpha()]
    return sum("\u0400" <= c <= "\u04ff" for c in letters) / len(letters) if letters else 0.0


def third_language(text: str) -> bool:
    """Letters that are neither Latin nor Cyrillic: Whisper heard Icelandic or Polish in an accent."""
    return any(c.isalpha() and not c.isascii() and not ("Ѐ" <= c <= "ӿ") for c in text)


def tidy(text: str) -> str:
    """turbo's quotes, leading dashes and double spaces are not the student's."""
    import re

    text = re.sub(r"[«»“”„\"]", "", text)
    text = re.sub(r"^\s*[-–—]\s*", "", text)
    return re.sub(r"\s+", " ", text).strip()


def encode_audio(model, pcm):
    """Whisper's encoder over just this audio, not padded to 30 s: 7x faster, the same verdicts."""
    feats = model.feature_extractor(pcm)
    frames = min(feats.shape[-1], 3000)
    return model.encode(feats[:, :frames]), frames


def reading_score(model, encoded, text: str) -> float:
    """How well the audio supports a reading: the mean token log-probability when the model is
    made to say exactly this text. A translation scores far below what was really said. Each
    token is clipped, so one odd token cannot sink a good reading."""
    import math

    from faster_whisper.tokenizer import Tokenizer

    text = tidy(text).replace("ё", "е").replace("Ё", "Е")
    if not text or third_language(text):
        return -99.0
    enc, frames = encoded
    tok = Tokenizer(model.hf_tokenizer, True, task="transcribe", language="ru" if cyrillic_share(text) > 0.3 else "en")
    ids = tok.encode(" " + text)
    probs = model.model.align(enc, tok.sot_sequence, [ids], frames)[0].text_token_probs
    return sum(max(math.log(max(p, 1e-9)), -4.6) for p in probs) / max(1, len(probs))


def phrase_chunks(pcm, segs, min_len=0.8, most=4):
    """The turn cut at its pauses, for students who switch language between phrases. Pieces
    shorter than min_len join a neighbour (too little for Whisper to tell the language)."""
    spans = [list(s) for s in segs]
    while len(spans) > 1:
        short = [i for i, (a, b) in enumerate(spans) if b - a < min_len]
        if len(spans) <= most and not short:
            break
        # join across the smallest pause, or the short piece with its nearer neighbour
        if short and len(spans) <= most:
            i = short[0]
            j = i - 1 if i == len(spans) - 1 or (i > 0 and spans[i][0] - spans[i - 1][1] < spans[i + 1][0] - spans[i][1]) else i + 1
        else:
            gaps = [spans[k + 1][0] - spans[k][1] for k in range(len(spans) - 1)]
            j = gaps.index(min(gaps))
            i = j + 1
        a, b = min(i, j), max(i, j)
        spans[a:b + 1] = [[spans[a][0], spans[b][1]]]
    if len(spans) < 2:
        return []
    end = len(pcm) / 16000
    return [pcm[int(max(0.0, a - 0.1) * 16000):int(min(end, b + 0.1) * 16000)] for a, b in spans]


@app.post("/stt")
def stt(
    audio: UploadFile = File(...),
    mode: str = Query("fast"),
    context: str = Form(""),
    x_lexy_key: str | None = Header(None),
):
    check_key(x_lexy_key)
    data = audio.file.read(MAX_AUDIO + 1)
    if not data:
        raise HTTPException(status_code=400, detail="empty audio")
    if len(data) > MAX_AUDIO:
        raise HTTPException(status_code=413, detail="audio too large")
    started = time.time()
    try:
        pcm = decode(data)
    except Exception:
        raise HTTPException(status_code=400, detail="unreadable audio")
    duration = round(len(pcm) / 16000, 2)
    segs = speech_segments(pcm)
    speech = round(sum(b - a for a, b in segs), 2)
    base = {"duration": duration, "speech": speech, "segments": [[round(a, 2), round(b, 2)] for a, b in segs]}
    if speech < 0.25:
        return JSONResponse({**base, "text": "", "language": "", "words": [], "engine": "vad", "took": round(time.time() - started, 2)})

    chat = mode == "chat"
    language = None if chat else "en"
    # The context (Lexi's last line) helps with topic words, but in a call it is often Russian,
    # and a Russian prompt pushes Whisper to hear Russian: there only its English words go in
    hint = context.strip()[:240]
    if chat:
        hint = " ".join(w for w in hint.split() if cyrillic_share(w) == 0)
    prompt = (MIXED_PROMPT if chat else FILLER_PROMPT) + (" " + hint if hint else "")
    speech_pcm = trim(pcm, segs)
    wav = to_wav(speech_pcm)
    text, words, engine, lang = "", [], "local", language or ""
    alt = ""  # chat turns: the other reading of the same audio, when it differs
    pieces = []  # chat turns: the phrases read one by one

    if mode == "accurate":
        # Text from polza, timings and per-word confidence from the local model, at the same time.
        # Timings are taken on the original audio, so pauses keep their real length.
        remote = _pool.submit(polza_text, wav, "en", prompt) if POLZA_KEY else None
        local_text, words, _ = local_words(pcm, ACCURATE_MODEL, "en")
        try:
            text, engine = (remote.result(), "polza+local") if remote else (local_text, "local")
        except Exception as e:
            print("polza stt failed, local text:", e, flush=True)
            text = local_text
    else:
        if POLZA_KEY:
            try:
                # Chat turns: on its own Whisper picks one language for the whole turn, and with an
                # accent it picks wrong: English comes out translated into Russian (or the other
                # way), even as Icelandic; in a mixed turn one half gets translated. So the turn is
                # read as is and as English, and when it has pauses each phrase is read as Russian
                # and as English too, all at once. The local model then checks which words the
                # audio really supports: a translation scores far below what was said.
                if chat:
                    auto_f = _pool.submit(polza_text, wav, None, prompt)
                    en_f = _pool.submit(polza_text, wav, "en", prompt)
                    # a switch of language often comes with only a short breath, so phrases are cut finer
                    pieces = phrase_chunks(pcm, speech_segments(pcm, 150)) if speech < 28 else []
                    piece_f = [(_pool.submit(polza_text, to_wav(c), "ru", prompt), _pool.submit(polza_text, to_wav(c), "en", prompt)) for c in pieces]
                    scorer = whisper_model(SCORE_MODEL)
                    whole_enc = _pool.submit(encode_audio, scorer, speech_pcm) if speech < 28 else None
                    piece_enc = [_pool.submit(encode_audio, scorer, c) for c in pieces]
                    auto, en_text = auto_f.result(), en_f.result()
                    read_at = time.time()
                    readings = {"polza:auto": auto, "polza:en": en_text}
                    scores: dict[str, float] = {}
                    notes: list[str] = []
                    # the phrases get a second at most once the whole is read, the check itself
                    # a second more: when the phrases are late, the choice is between the two wholes
                    deadline = read_at + 1.0
                    left = lambda: max(0.05, deadline - time.time())
                    try:
                        parts = []
                        for (ru_f, en_pf), enc_f, c_pcm in zip(piece_f, piece_enc, pieces):
                            ru_p, en_p = ru_f.result(timeout=left()), en_pf.result(timeout=left())
                            enc = enc_f.result(timeout=left())
                            sr, se = reading_score(scorer, enc, ru_p), reading_score(scorer, enc, en_p)
                            parts.append(en_p if se > sr else ru_p)
                            notes.append(f"[{len(c_pcm) / 16000:.1f}s ru {sr:.2f} {ru_p[:40]!r} en {se:.2f} {en_p[:40]!r}]")
                        if parts:
                            readings["polza:mixed"] = " ".join(p.strip() for p in parts if p.strip())
                    except Exception as e:
                        notes.append(f"[phrases late: {e!r}]")
                    try:
                        if whole_enc is None:
                            raise TimeoutError("turn too long to check")
                        enc = whole_enc.result(timeout=max(0.05, read_at + 2.0 - time.time()))
                        scores = {k: reading_score(scorer, enc, v) for k, v in readings.items()}
                    except Exception as e:
                        print("stt chat: no reading check:", repr(e), flush=True)
                    if scores:
                        ranked = sorted(scores, key=scores.get, reverse=True)
                    else:
                        # without the check: as is, unless it came out in a third language
                        ranked = ["polza:en", "polza:auto"] if third_language(auto) else ["polza:auto", "polza:en"]
                    ranked = [k for k in ranked if readings[k].strip()] or ["polza:auto"]
                    engine = ranked[0]
                    text = readings[engine]
                    # a runner-up only goes to Lexi when the audio supports it nearly as well
                    norm = lambda x: "".join(c for c in x.lower() if c.isalnum())
                    for k in ranked[1:]:
                        if scores and scores[k] > scores[engine] - 0.35 and norm(readings[k]) != norm(text):
                            alt = tidy(clean_hallucinations(readings[k]))
                            break
                    if len({norm(v) for v in readings.values()}) > 1:
                        print(f"stt chat: read {read_at - started:.1f}s check +{time.time() - read_at:.1f}s -> " + engine + " | " + " | ".join(f"{k[6:]} {scores.get(k, 0):.2f} {v[:60]!r}" for k, v in readings.items()) + (" " + " ".join(notes) if notes else ""), flush=True)
                else:
                    text = polza_text(wav, language, prompt)
                    engine = "polza"
            except Exception as e:
                print("polza stt failed, local whisper:", e, flush=True)
        if engine == "local":
            text, words, lang = local_words(speech_pcm, CHAT_MODEL if chat else FAST_MODEL, language)

    text = clean_hallucinations(text)
    if chat:
        text = tidy(text)
    # a chat turn is read twice whole, and twice more phrase by phrase when it has pauses
    reads = (4 if pieces else 2) if chat else 1
    cost = round(len(speech_pcm) / 16000 / 60 * STT_RUB_PER_MIN * reads, 5) if engine.startswith("polza") else 0
    if chat and not lang:
        lang = "ru" if any("\u0400" <= c <= "\u04ff" for c in text) else "en"
    return JSONResponse({**base, "text": text, "alt": alt, "language": lang, "words": words, "engine": engine, "cost": cost, "took": round(time.time() - started, 2)})


class TtsIn(BaseModel):
    text: str = Field(min_length=1, max_length=1200)
    voice: str = "examiner"
    rate: str = "medium"  # medium | slow
    mood: str = "neutral"
    style: str = Field(default="", max_length=400)  # how the character speaks (Lexi)


def ssml(text: str, rate: str) -> str:
    safe = text.replace("&", " and ").replace("<", " ").replace(">", " ")
    return f'<speak><prosody rate="{"slow" if rate == "slow" else "medium"}">{safe}</prosody></speak>'


def to_mp3(src: str, out: Path, raw_pcm: bool = False):
    part = out.with_suffix(".part.mp3")
    pre = ["-f", "s16le", "-ar", "24000", "-ac", "1"] if raw_pcm else []
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *pre, "-i", src, "-ac", "1", "-b:a", "64k", str(part)], check=True)
    part.replace(out)


def resolve_voice(voice: str, style: str) -> tuple[str, str]:
    """Gemini voice name and base instructions for a request."""
    if voice.startswith("g:") and voice[2:] in GEMINI_NAMES:
        return voice[2:], ((style or "Lexi, a lively English tutor.") + RU_EN)
    return GEMINI_VOICES.get(voice, GEMINI_VOICES["examiner"])


def gemini_tts(text: str, voice: str, rate: str, mood: str, style: str, out: Path) -> float:
    import requests

    name, base = resolve_voice(voice, style)
    parts = [base, MOODS.get(mood, "")]
    if rate == "slow":
        parts.append("Speak slowly and very clearly, like for a learner.")
    body = {"model": POLZA_TTS, "input": text, "voice": name, "instructions": " ".join(p for p in parts if p)}

    def call():
        r = requests.post(f"{POLZA_URL}/audio/speech", headers={"Authorization": f"Bearer {POLZA_KEY}"}, json=body, timeout=40)
        r.raise_for_status()
        return r.json()

    # A voice usually comes in 3-4 s, but now and then one hangs for 9+: if it is not back by
    # TTS_HEDGE_S, the same request goes out again and whichever answers first is used
    first = _tts_pool.submit(call)
    done, _ = wait([first], timeout=TTS_HEDGE_S)
    if done:
        d = first.result()
    else:
        second = _tts_pool.submit(call)
        d = None
        for f in as_completed([first, second]):
            try:
                d = f.result()
                break
            except Exception as e:
                print("tts attempt failed:", e, flush=True)
        if d is None:
            raise RuntimeError("both tts attempts failed")
        print(f"tts hedged: {'first' if f is first else 'second'} won", flush=True)
    cost = float((d.get("usage") or {}).get("cost_rub") or 0)
    pcm = base64.b64decode(d["audio"])
    if len(pcm) < 2000:
        raise RuntimeError("empty audio")
    with tempfile.NamedTemporaryFile(suffix=".pcm", delete=False) as tmp:
        tmp.write(pcm)
        raw = tmp.name
    try:
        # WAV comes with its own header; anything else from Gemini is raw 24 kHz 16-bit PCM
        to_mp3(raw, out, raw_pcm=d.get("contentType") != "audio/wav")
    finally:
        os.unlink(raw)
    return cost


def silero_tts(text: str, voice: str, rate: str, out: Path):
    import soundfile as sf

    if voice.startswith("g:"):
        speaker = VOICES["preppy"] if voice[2:] in FEMALE_NAMES else VOICES["male"]
    else:
        speaker = VOICES.get(voice, VOICES["examiner"])
    model = silero()
    with _tts_lock:
        audio = model.apply_tts(ssml_text=ssml(text, rate), speaker=speaker, sample_rate=SAMPLE_RATE)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sf.write(tmp.name, audio.numpy(), SAMPLE_RATE)
        wav = tmp.name
    try:
        to_mp3(wav, out)
    finally:
        os.unlink(wav)


def has_cyrillic(text: str) -> bool:
    return any("\u0400" <= c <= "\u04ff" for c in text)


@app.post("/tts")
def tts(body: TtsIn, x_lexy_key: str | None = Header(None)):
    check_key(x_lexy_key)
    mood = body.mood if body.mood in MOODS else "neutral"
    engine = "gemini" if POLZA_KEY else "silero"
    digest = hashlib.sha1(f"v3|{engine}|{body.voice}|{body.rate}|{mood}|{body.style}|{body.text}".encode()).hexdigest()
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / f"{digest}.mp3"
    # The page preloads a voice and then plays it: one generation per text, the other waits
    with _inflight_lock:
        lock = _inflight.setdefault(digest, threading.Lock())
    with lock:
        try:
            return make_tts(body, mood, engine, digest, out)
        finally:
            with _inflight_lock:
                _inflight.pop(digest, None)


_inflight: dict = {}
_inflight_lock = threading.Lock()


def make_tts(body: TtsIn, mood: str, engine: str, digest: str, out: Path):
    if out.exists():
        return FileResponse(out, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=31536000, immutable"})
    if POLZA_KEY:
        try:
            cost = gemini_tts(body.text, body.voice, body.rate, mood, body.style, out)
            return FileResponse(out, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=31536000, immutable", "X-Cost-Rub": str(cost)})
        except Exception as e:
            print("gemini tts failed, silero:", e, flush=True)
    # Silero only speaks English: Russian text gets no voice rather than gibberish
    if has_cyrillic(body.text):
        raise HTTPException(status_code=503, detail="no voice for this text")
    fallback = CACHE / f"{digest}.silero.mp3"
    if not fallback.exists():
        silero_tts(body.text, body.voice, body.rate, fallback)
    # Not cached by browsers, so the Gemini voice replaces it once the service is back
    cache = "public, max-age=31536000, immutable" if engine == "silero" else "no-store"
    return FileResponse(fallback, media_type="audio/mpeg", headers={"Cache-Control": cache})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "8765")))
