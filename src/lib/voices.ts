// Gemini voices the user can pick for Lexi (all speak Russian and English). The speech
// service validates the same names; "hint" is how Google describes the timbre.

export type GeminiVoice = { id: string; hint: string; female: boolean };

export const GEMINI_VOICES: GeminiVoice[] = [
  { id: "Zephyr", hint: "Яркий", female: true },
  { id: "Kore", hint: "Твёрдый", female: true },
  { id: "Leda", hint: "Юный", female: true },
  { id: "Aoede", hint: "Лёгкий", female: true },
  { id: "Callirrhoe", hint: "Расслабленный", female: true },
  { id: "Autonoe", hint: "Звонкий", female: true },
  { id: "Despina", hint: "Мягкий", female: true },
  { id: "Erinome", hint: "Чистый", female: true },
  { id: "Laomedeia", hint: "Бодрый", female: true },
  { id: "Achernar", hint: "Нежный", female: true },
  { id: "Gacrux", hint: "Взрослый", female: true },
  { id: "Pulcherrima", hint: "Напористый", female: true },
  { id: "Vindemiatrix", hint: "Ласковый", female: true },
  { id: "Sulafat", hint: "Тёплый", female: true },
  { id: "Puck", hint: "Задорный", female: false },
  { id: "Charon", hint: "Деловой", female: false },
  { id: "Fenrir", hint: "Возбуждённый", female: false },
  { id: "Orus", hint: "Твёрдый", female: false },
  { id: "Enceladus", hint: "С придыханием", female: false },
  { id: "Iapetus", hint: "Чёткий", female: false },
  { id: "Umbriel", hint: "Расслабленный", female: false },
  { id: "Algieba", hint: "Бархатный", female: false },
  { id: "Algenib", hint: "С хрипотцой", female: false },
  { id: "Rasalgethi", hint: "Лекторский", female: false },
  { id: "Alnilam", hint: "Уверенный", female: false },
  { id: "Schedar", hint: "Ровный", female: false },
  { id: "Achird", hint: "Дружелюбный", female: false },
  { id: "Zubenelgenubi", hint: "Небрежный", female: false },
  { id: "Sadachbia", hint: "Живой", female: false },
  { id: "Sadaltager", hint: "Умный", female: false },
];

export const GEMINI_VOICE_IDS = new Set(GEMINI_VOICES.map((v) => v.id));

/** Lexi's one voice, whatever the character: the face of the site should sound the same every
 * time (owners' choice 2026-10-24, the voice Maks picked: Iapetus, «Чёткий», a man's voice). */
export const LEXI_VOICE = "Iapetus";

/** How each reply can sound; the model picks one per line and the speech service plays it. */
export const MOODS = [
  "neutral", "warm", "excited", "impressed", "laughing", "curious", "sympathetic", "strict",
  "teasing", "encouraging", "angry", "shocked", "disappointed", "proud", "bored", "dramatic", "whisper",
] as const;
export type Mood = (typeof MOODS)[number];

export function isMood(x: unknown): x is Mood {
  return typeof x === "string" && (MOODS as readonly string[]).includes(x);
}
