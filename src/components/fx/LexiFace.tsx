"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Face as LuraFace } from "@/vendor/openlura/face.js";
import type { Mood } from "@/lib/voices";

// Lexi's face. The features inside the dark glass are drawn by the openlura face engine
// (src/vendor/openlura, MIT): eyes that morph between rings, arcs, hearts, stars and "> <",
// anticipation and overshoot on every change, syllable lip-sync. Around it this component
// keeps the glass, the glow colour of the mood and the body language the flame carries
// (tilt, bounce, shake, heat, travelling while she talks). One animation loop eases every number towards
// the current expression, so moods blend instead of jumping. The loop writes attributes
// straight to the SVG: no React render per frame.
//
// Coordinates are the mascot's (viewBox 0 -25 100 145): the white visor spans x 18..82,
// y 62..96, with big eyes at (36.5, 76) and (63.5, 76) and the mouth under them at x 50.
// At rest the face is calm, not smiling: a smile is a mood, not the default.
//
// The whole flame also moves through space: it drifts, darts, hops and leans on springs.
// How much depends on the mood and on the character the student picked (the roast fidgets
// and shakes, the strict examiner barely moves, the drama queen sways).

export type FaceMode = "idle" | "hearing" | "thinking" | "speaking";

// The face is an 8-bit LED matrix (owners, 2026-10-24: "simpler, more 8-bit"): the same
// expression numbers as before, drawn as pixels on a 32 x 16 grid behind the glass instead of
// the openlura engine. Set to false to bring the smooth face back.
const PIXEL_FACE = true;
const PW = 32;
const PH = 16;

type PixelFace = {
  openL: number; openR: number; // eye opening with blinks, 0..1+
  happy: boolean; // ^ ^ eyes
  lid: number; lidAngle: number; wide: number;
  gx: number; gy: number; // gaze
  mouthOpen: number; talking: boolean;
  mw: number; mcl: number; mcr: number; mb: number; round: boolean;
  color: string;
};

/** Is this cell of the grid behind the glass (the visor is a capsule)? */
function inVisor(x: number, y: number): boolean {
  const r = PH / 2;
  const cx = x < r ? r : x >= PW - r ? PW - r : x + 0.5;
  return (x + 0.5 - cx) ** 2 + (y + 0.5 - r) ** 2 <= r * r;
}

function drawPixels(ctx: CanvasRenderingContext2D, f: PixelFace) {
  ctx.clearRect(0, 0, PW, PH);
  // the unlit LEDs, faintly
  ctx.fillStyle = f.color;
  ctx.globalAlpha = 0.1;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (inVisor(x, y)) ctx.fillRect(x, y, 1, 1);
  ctx.globalAlpha = 1;
  const px = (x: number, y: number) => { if (x >= 0 && x < PW && y >= 0 && y < PH && inVisor(x, y)) ctx.fillRect(x, y, 1, 1); };
  const dx = Math.round(f.gx * 1.5);
  const dy = Math.round(f.gy * 1.2);

  // eyes: 4 x 6 blocks (5 x 7 when wide), ^ when happy, cut by the lid, slanted by its angle
  const eye = (x0: number, open: number, inner: 1 | -1) => {
    if (f.happy) {
      const x = x0 + dx;
      const y = 5 + dy;
      px(x + 1, y); px(x + 2, y);
      px(x, y + 1); px(x + 3, y + 1);
      px(x - 1, y + 2); px(x + 4, y + 2);
      return;
    }
    const w = f.wide > 1.08 ? 5 : 4;
    const h = Math.max(1, Math.min(8, Math.round(6 * open * f.wide)));
    const left = x0 + dx - (w === 5 && inner === 1 ? 1 : 0); // a wide eye grows outwards
    const top = Math.round(6.5 - h / 2) + dy;
    const lidRows = Math.round(Math.max(0, f.lid) * h * 0.85);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (h >= 4 && (r === 0 || r === h - 1) && (c === 0 || c === w - 1)) continue; // round corners
        if (r < lidRows) continue;
        // a slanted lid: one row deeper on the inner side (angry) or the outer one (sad)
        if (lidRows > 0 && r === lidRows && Math.abs(f.lidAngle) > 3) {
          const innerSide = inner === 1 ? c >= w - 2 : c <= 1;
          if (f.lidAngle > 0 ? innerSide : !innerSide) continue;
        }
        px(left + c, top + r);
      }
    }
  };
  eye(8, f.openL, 1);
  eye(20, f.openR, -1);

  // mouth: a line with corners up or down, a "D" when it beams, an "O" when shocked,
  // a block that opens with her voice while she talks
  const w = Math.max(3, Math.min(10, Math.round(f.mw * 1.3)));
  const x0 = 16 - Math.floor(w / 2);
  const row = 12;
  if (f.talking && f.mouthOpen > 0.12) {
    const h = Math.min(4, 1 + Math.round(f.mouthOpen * 3.5));
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      if (h >= 3 && (r === 0 || r === h - 1) && (c === 0 || c === w - 1)) continue;
      px(x0 + c, row - 1 + r);
    }
  } else if (f.round) {
    for (const [c, r] of [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [1, 3], [2, 3]] as const) px(14 + c, row - 1 + r);
  } else {
    for (let c = 0; c < w; c++) {
      const lift = c === 0 ? f.mcl : c === w - 1 ? f.mcr : 0;
      px(x0 + c, row + (lift > 1 ? -1 : lift < -1 ? 1 : 0));
    }
    if (f.mb > 6 && f.mcl > 1) for (let c = 1; c < w - 1; c++) px(x0 + c, row + 1); // a beaming "D"
  }
}

export type FaceDriver = {
  mood: () => Mood;
  mode: () => FaceMode;
  /** Lexi's voice: loudness and brightness for lip-sync */
  voice: () => { level: number; bright: number; playing: boolean; analysed: boolean };
  /** The student's microphone level, 0..1 */
  hear: () => number;
  /** The character (persona id): it sets how much Lexi moves */
  persona?: () => string;
  /** A woman's voice: her face glows mostly pink */
  female?: () => boolean;
  /** The clip being said now (text and length), for syllable lip-sync */
  speech?: () => { id: number; text: string; durationMs: number; moods?: [number, string][] } | null;
};

/** Numbers the flame reads: the WebGL fire grows with voice, reddens with heat. */
export type FaceLive = { heat: number; dim: number; flare: number; voice: number };

type Expr = {
  open: number; // eye opening, 1 = normal
  openL?: number; // per-eye override (wink, squint)
  openR?: number;
  wide: number; // eye width
  happy: number; // 0..1 eyes become ^ ^
  lid: number; // 0..1 upper lid coming down
  lidAngle: number; // + angry (inner side down), - sad
  gx: number; // gaze -1..1
  gy: number;
  brow: number; // 0..1 brows visible
  browY: number; // + lower
  browTilt: number; // + angry V, - worried
  browRaiseR: number; // right brow up (one-brow raise)
  mw: number; // mouth half-width
  mt: number; // upper lip bend (+ down)
  mb: number; // lower lip depth
  mcl: number; // left corner lift
  mcr: number; // right corner lift
  my: number; // mouth y
  teeth: number;
  tongue: number;
  cheeks: number;
  tilt: number; // body rotation, degrees
  lean: number; // body y offset (+ down)
  scale: number;
  bounce: number; // bounce amplitude
  bounceHz: number;
  shake: number;
  heat: number;
  dim: number;
  flare: number;
};

const BASE: Expr = {
  open: 1, wide: 1, happy: 0, lid: 0, lidAngle: 0, gx: 0, gy: 0, brow: 0, browY: 0, browTilt: 0, browRaiseR: 0,
  mw: 3.8, mt: 0.4, mb: 2.8, mcl: 0, mcr: 0, my: 86, teeth: 0, tongue: 0, cheeks: 0,
  tilt: 0, lean: 0, scale: 1, bounce: 0.6, bounceHz: 0.5, shake: 0, heat: 0, dim: 0, flare: 0,
};

const e = (x: Partial<Expr>): Expr => ({ ...BASE, ...x });

// Every mood as a full expression. Mouth: mw half-width, mt upper lip bend (+ down),
// mb lower lip depth (how open), mcl/mcr corner lift (+ up = smile, - = frown).
const MOODS: Record<Mood, Expr> = {
  neutral: e({}),
  warm: e({ open: 0.94, mw: 5, mt: 1.4, mb: 4.6, mcl: 1.5, mcr: 1.5, cheeks: 0.5, tilt: 4 }),
  excited: e({ open: 1.16, wide: 1.06, brow: 0.7, browY: -2.2, mw: 6.4, mt: -0.4, mb: 10.5, mcl: 2.2, mcr: 2.2, cheeks: 0.6, bounce: 2.6, bounceHz: 2.3, flare: 0.7 }),
  impressed: e({ open: 1.26, wide: 1.1, brow: 1, browY: -3, mw: 3.8, mt: -2.6, mb: 7, flare: 0.45, bounce: 1.2, bounceHz: 1.4 }),
  laughing: e({ happy: 1, brow: 0.6, browY: -1.5, mw: 7, mt: -0.4, mb: 11.5, mcl: 2.6, mcr: 2.6, tongue: 0.8, cheeks: 0.9, bounce: 1.8, bounceHz: 4.6, tilt: -3, flare: 0.5 }),
  curious: e({ open: 1.1, gx: 0.25, gy: -0.15, brow: 1, browY: -1, browRaiseR: 3.2, mw: 2.6, mt: -1, mb: 4.2, mcr: 0.6, my: 87, tilt: -8 }),
  sympathetic: e({ open: 0.88, lid: 0.15, lidAngle: -14, brow: 1, browTilt: -16, browY: -1, mw: 3.8, mt: 0.6, mb: 2.6, mcl: -0.4, mcr: -0.4, my: 87, tilt: 6, dim: 0.25, cheeks: 0.25 }),
  strict: e({ open: 0.8, lid: 0.34, brow: 1, browY: 1.4, mw: 4.6, mt: 0.1, mb: 1.2, mcl: -0.4, mcr: -0.4, my: 87, bounce: 0.2 }),
  teasing: e({ openL: 0.5, open: 1, gx: 0.55, brow: 1, browRaiseR: 3, browTilt: 4, mw: 4.8, mt: 0.6, mb: 3.8, mcl: -0.8, mcr: 2.2, my: 87, tilt: -6 }),
  encouraging: e({ open: 1.02, brow: 0.5, browY: -1.4, mw: 5.4, mt: 1.2, mb: 6.5, mcl: 1.8, mcr: 1.8, cheeks: 0.35, bounce: 1.4, bounceHz: 1.2, flare: 0.25 }),
  angry: e({ open: 0.86, lid: 0.4, lidAngle: 24, brow: 1, browTilt: 24, browY: 1.4, mw: 6.2, mt: -1, mb: 9, mcl: -1.8, mcr: -1.8, my: 87, teeth: 1, heat: 1, shake: 1.6, scale: 1.06, bounce: 0.4 }),
  shocked: e({ open: 1.34, wide: 1.12, brow: 1, browY: -3.6, mw: 3.6, mt: -3.2, mb: 9, flare: 0.3, bounce: 0.3, lean: -2 }),
  disappointed: e({ open: 0.66, lid: 0.42, lidAngle: -8, brow: 1, browTilt: -12, browY: 0.5, gy: 0.4, mw: 4.4, mt: -0.6, mb: 1.2, mcl: -2.2, mcr: -2.2, my: 88, lean: 2.4, scale: 0.97, dim: 0.3, bounce: 0.2 }),
  proud: e({ happy: 1, brow: 0.5, browY: -1, mw: 6, mt: 1.8, mb: 6.6, mcl: 2.6, mcr: 2.6, cheeks: 0.7, scale: 1.05, flare: 0.55, tilt: 3, bounce: 1, bounceHz: 0.9 }),
  bored: e({ open: 0.58, lid: 0.52, gx: -0.4, gy: -0.5, mw: 3.8, mt: 0, mb: 1, mcr: -0.6, my: 88, lean: 2, scale: 0.97, dim: 0.35, bounce: 0.15, tilt: -4 }),
  dramatic: e({ open: 1.18, brow: 1, browTilt: -22, browY: -2, mw: 5, mt: -1.4, mb: 9.5, mcl: -2.2, mcr: -2.2, my: 87, tilt: 9, bounce: 1, bounceHz: 0.7, flare: 0.35 }),
  whisper: e({ open: 0.84, gx: 0.6, mw: 2.2, mt: -0.6, mb: 2.6, my: 87, lean: 1.5, scale: 1.04, dim: 0.5, bounce: 0.2 }),
};

// What Lexi looks like when not speaking, per call mode
const MODES: Record<Exclude<FaceMode, "speaking">, Partial<Expr>> = {
  idle: { mw: 3.6, mt: 0.5, mb: 2.6, mcl: 0.3, mcr: 0.3, my: 86, teeth: 0, tongue: 0 },
  hearing: { open: 1.06, gy: 0.25, brow: 0.45, browY: -1, mw: 3.2, mt: 0.7, mb: 2.6, mcl: 0.4, mcr: 0.4, my: 86, lean: 1.4, scale: 1.02, teeth: 0, tongue: 0, bounce: 0.3 },
  thinking: { open: 0.9, gx: -0.6, gy: -0.85, brow: 1, browRaiseR: 2, browY: -0.5, mw: 3, mt: 0, mb: 1.2, mcl: 0.4, mcr: -0.6, my: 87, teeth: 0, tongue: 0, tilt: -5, bounce: 0.3, bounceHz: 0.4 },
};

// How the body moves in space for each mood: energy of the drift, how often Lexi darts to
// a new spot, how far, and how hard she shakes
const MOTION: Record<Mood, { energy: number; dart: number; range: number; jitter: number }> = {
  neutral: { energy: 0.35, dart: 0, range: 8, jitter: 0 },
  warm: { energy: 0.4, dart: 0, range: 9, jitter: 0 },
  excited: { energy: 1, dart: 1.1, range: 24, jitter: 0 },
  impressed: { energy: 0.6, dart: 0.4, range: 14, jitter: 0 },
  laughing: { energy: 0.9, dart: 0.6, range: 16, jitter: 0.3 },
  curious: { energy: 0.45, dart: 0.3, range: 12, jitter: 0 },
  sympathetic: { energy: 0.25, dart: 0, range: 6, jitter: 0 },
  strict: { energy: 0.12, dart: 0, range: 3, jitter: 0 },
  teasing: { energy: 0.55, dart: 0.5, range: 14, jitter: 0 },
  encouraging: { energy: 0.6, dart: 0.3, range: 12, jitter: 0 },
  angry: { energy: 0.8, dart: 0.8, range: 14, jitter: 1 },
  shocked: { energy: 0.7, dart: 0.2, range: 10, jitter: 0.4 },
  disappointed: { energy: 0.15, dart: 0, range: 4, jitter: 0 },
  proud: { energy: 0.45, dart: 0.2, range: 10, jitter: 0 },
  bored: { energy: 0.18, dart: 0, range: 10, jitter: 0 },
  dramatic: { energy: 0.95, dart: 0.5, range: 22, jitter: 0.2 },
  whisper: { energy: 0.25, dart: 0, range: 5, jitter: 0 },
};

// The character's temperament scales all of it
const TEMPER: Record<string, number> = { roast: 1.35, drama: 1.25, bro: 1.05, classic: 1, sarcastic: 0.85, kind: 0.7, strict: 0.45 };

// Our moods as openlura emotions
const LURA: Record<Mood, string> = {
  neutral: "calm", warm: "warm", excited: "excited", impressed: "surprised", laughing: "laugh", curious: "curious",
  sympathetic: "tender", strict: "focused", teasing: "sly", encouraging: "happy", angry: "angry", shocked: "shocked",
  disappointed: "sad", proud: "proud", bored: "bored", dramatic: "worried", whisper: "shy",
};

// The LED face glows in the colour of the mood: shades of blue, other colours only for the
// strong feelings (owners' choice 2026-10-25, the pink happy states are gone)
const CYAN = "#5fe3ff", SKY = "#8fd3ff", AZURE = "#4fa3ff", ICE = "#b6ecff", RED = "#ff3b3b", YELLOW = "#ffd166", VIOLET = "#a98bff";
const COLOR: Record<Mood, string> = {
  neutral: CYAN, warm: SKY, curious: CYAN, strict: CYAN, bored: CYAN, whisper: CYAN, encouraging: SKY, sympathetic: SKY,
  excited: AZURE, laughing: AZURE, proud: AZURE, impressed: AZURE, teasing: ICE,
  angry: RED, shocked: YELLOW, dramatic: YELLOW, disappointed: VIOLET,
};

// Moods whose mouth stays round while talking ("o" shapes)
const ROUND = new Set<Mood>(["shocked", "impressed", "curious", "whisper"]);

type Effect = "anger" | "sweat" | "tears" | "sob" | "sparks" | "question" | "dots" | "heart" | "zzz" | "bang" | "puff";

function effectsFor(mood: Mood, mode: FaceMode): Effect[] {
  if (mode === "thinking") return ["dots"];
  if (mode === "hearing") return [];
  const map: Partial<Record<Mood, Effect[]>> = {
    angry: ["anger", "puff"], shocked: ["bang"],
    excited: ["sparks"], proud: ["sparks"], impressed: ["sparks"], curious: ["question"],
    sympathetic: ["heart"], disappointed: ["puff"], bored: mode === "idle" ? ["zzz"] : [],
  };
  return map[mood] ?? [];
}

function mouthPath(cx: number, cy: number, hw: number, t: number, b: number, cl: number, cr: number) {
  const f = (n: number) => n.toFixed(2);
  const lx = cx - hw, ly = cy - cl, rx = cx + hw, ry = cy - cr;
  return `M${f(lx)} ${f(ly)}C${f(cx - hw * 0.45)} ${f(cy + t)} ${f(cx + hw * 0.45)} ${f(cy + t)} ${f(rx)} ${f(ry)}C${f(cx + hw * 0.62)} ${f(cy + b)} ${f(cx - hw * 0.62)} ${f(cy + b)} ${f(lx)} ${f(ly)}Z`;
}

const KEYS = Object.keys(BASE) as (keyof Expr)[];
const MOUTH_KEYS = new Set<string>(["mw", "mt", "mb", "mcl", "mcr", "my"]);

export function LexiFace({ driver, live, body, gaze, calm = false }: {
  driver?: FaceDriver;
  live: { current: FaceLive };
  body: { current: HTMLElement | null };
  gaze?: { x: { get(): number }; y: { get(): number } };
  calm?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const refs = useRef<Record<string, SVGElement | null>>({});
  const set = (k: string) => (el: SVGElement | null) => { refs.current[k] = el; };
  const [fx, setFx] = useState<Effect[]>([]);
  const fxKey = useRef("");
  const host = useRef<HTMLDivElement>(null);
  const lura = useRef<LuraFace | null>(null);
  const [luraReady, setLuraReady] = useState(false);
  const pixels = useRef<HTMLCanvasElement>(null);

  // The engine's motion follows the site's animation switch
  useEffect(() => {
    import("@/vendor/openlura/face.js").then(({ setReduced }) => setReduced(calm));
  }, [calm]);

  // The engine touches the DOM when it loads, so it is only loaded in the browser
  useEffect(() => {
    if (PIXEL_FACE) return;
    let alive = true;
    let face: LuraFace | null = null;
    import("@/vendor/openlura/face.js").then(({ Face }) => {
      if (!alive || !host.current) return;
      // the engine's compact view is "88 118 824 430"; a 1.4x wider view around the same
      // centre makes the features smaller, with air between them and the edge of the glass
      face = new Face(host.current, { small: true, particles: false, viewBox: "-77 32 1154 602" });
      // Closer to Lexi's own LED look: filled glowing eyes and mouth, no lashes, no tongue
      const parts = face as unknown as { tongueEl?: SVGElement; eyeEl?: SVGElement[]; lashEl?: SVGElement[]; mouthEl?: SVGElement };
      parts.tongueEl?.setAttribute("display", "none");
      parts.eyeEl?.forEach((e) => e.classList.add("lexi-eye"));
      parts.lashEl?.forEach((e) => e.setAttribute("display", "none"));
      parts.mouthEl?.classList.add("lexi-mouth");
      lura.current = face;
      setLuraReady(true);
    });
    return () => {
      alive = false;
      face?.destroy();
      lura.current = null;
    };
  }, []);

  useEffect(() => {
    const cur: Expr = { ...BASE };
    let openL = 1;
    let openR = 1;
    const vel: Record<string, number> = {};
    let squash = 0; // a short squash-and-stretch when the mood changes
    let squashV = 0;
    let hv = 0; // 0 = round eyes, 1 = ^ ^
    let raf = 0;
    let last = performance.now();
    let t = Math.random() * 10;
    let blinkAt = last + 1500 + Math.random() * 3000;
    let blinkUntil = 0;
    let doubleBlink = false;
    let sacc = { x: 0, y: 0, at: last + 2000 };
    let mouthOpen = 0;
    let bright = 0.5;
    let nod = 0;
    let hearSmooth = 0;
    let prevMood: Mood = "neutral";
    let jump = 0;
    let fakeTalk = 0;
    // position in space (px), on a spring towards a target that moves
    const pos = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, at: last + 800 };
    let energy = 0.35;
    let lastOpen = 0;
    let pop = 0;
    let lastColor = "";
    let luraEmotion = "";
    let luraMode = "";
    let luraSpeech = 0;
    // beats: moments within a clip where the words call for it (a mood change Lexi marked,
    // a laugh, a "hmm", an exclamation), timed by where they fall in the clip
    let beats: { at: number; run: () => void }[] = [];
    let clipMood: Mood | null = null;
    let nextNod = 0;
    const rgb = [95, 227, 255];

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      // a frame stamp can be a little older than the start: a negative step would make every
      // spring push instead of damp (the flame once flew 300 px off), so the step is never below 0
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      t += dt;
      const mode = driver?.mode() ?? "idle";
      if (mode !== "speaking") clipMood = null;
      // while she talks, the mood she marked inside the line wins over the line's first mood
      const mood = (mode === "speaking" && clipMood) || (driver?.mood() ?? "neutral");
      const voice = driver?.voice() ?? { level: 0, bright: 0.5, playing: false, analysed: false };
      const hear = driver?.hear() ?? 0;

      // Target expression: the mood while speaking (and a while after), the mode otherwise
      const target: Expr = { ...MOODS[mood] };
      if (mode !== "speaking") Object.assign(target, MODES[mode]);
      if (mode === "idle") {
        // Between lines a trace of the last mood stays on the face
        const m = MOODS[mood];
        target.tilt = m.tilt * 0.5;
        target.happy = 0; // ^ ^ eyes only while she says something happy
        target.lid = m.lid * 0.5;
        target.lidAngle = m.lidAngle * 0.5;
        target.cheeks = m.cheeks * 0.5;
        target.brow = m.brow * 0.4;
        target.browTilt = m.browTilt * 0.5;
        target.heat = m.heat * 0.3;
        target.dim = m.dim * 0.5;
      }
      if (mood !== prevMood) {
        if (mood === "shocked" || mood === "excited") jump = 1;
        squashV -= 14 * (MOTION[mood].energy + 0.3);
        // a new feeling often comes with a blink, as in people
        if (!calm && MOODS[mood].happy < 0.5 && Math.random() < 0.6) blinkAt = now;
        prevMood = mood;
      }
      squashV += (-squash * 160 - squashV * 11) * dt;
      squash += squashV * dt;

      // Ease every number towards the target (faster for the mouth)
      const k = 1 - Math.exp(-dt * 7);
      for (const key of KEYS) {
        const tv = target[key] as number | undefined;
        if (typeof tv !== "number") continue;
        // underdamped springs (damping ratio ~0.6): features arrive with a small overshoot;
        // the mouth is stiffer so speech stays crisp
        const fast = MOUTH_KEYS.has(key);
        const stiff = fast ? 240 : 110;
        const damp = fast ? 22 : 13;
        const x = cur[key] as number;
        const v = (vel[key] ?? 0) + ((tv - x) * stiff - (vel[key] ?? 0) * damp) * dt;
        vel[key] = v;
        (cur[key] as number) = x + v * dt;
      }
      hv += ((cur.happy > 0.5 ? 1 : 0) - hv) * (1 - Math.exp(-dt * 9));
      // Each eye on its own, for winks and squints
      openL += ((target.openL ?? target.open) - openL) * k;
      openR += ((target.openR ?? target.open) - openR) * k;

      // Lip-sync: loudness opens the mouth, brightness widens it
      const speakingNow = mode === "speaking" && voice.playing;
      let level = voice.level;
      if (speakingNow && !voice.analysed) {
        // No analyser in this browser: a natural-looking flap instead
        fakeTalk += dt * (7 + Math.sin(t * 1.3) * 2);
        level = Math.max(0, Math.sin(fakeTalk) * 0.5 + 0.35 + Math.sin(fakeTalk * 2.7) * 0.15);
      }
      const aim = speakingNow ? Math.min(1, level * 1.15) : 0;
      mouthOpen += (aim - mouthOpen) * (1 - Math.exp(-dt * (aim > mouthOpen ? 22 : 11)));
      bright += (voice.bright - bright) * (1 - Math.exp(-dt * 10));
      live.current.voice = mouthOpen;

      // Blinking, sometimes twice
      let blink = 1;
      const BLINK_MS = 180;
      if (now > blinkAt && !calm) {
        blinkUntil = now + BLINK_MS;
        blinkAt = doubleBlink ? now + 220 : now + 2200 + Math.random() * 3800;
        doubleBlink = !doubleBlink && Math.random() < 0.22;
      }
      if (now < blinkUntil) blink = 1 - 0.92 * Math.sin((1 - (blinkUntil - now) / BLINK_MS) * Math.PI);

      // Gaze: the mode's direction, small saccades when idle, the cursor when nothing else
      if (now > sacc.at) {
        const talkingNow = (driver?.mode() ?? "idle") === "speaking";
        sacc = { x: (Math.random() - 0.5) * 0.5, y: (Math.random() - 0.5) * 0.35, at: now + (talkingNow ? 500 + Math.random() * 900 : 1400 + Math.random() * 2600) };
      }
      const cursorX = gaze ? gaze.x.get() / 5 : 0;
      const cursorY = gaze ? gaze.y.get() / 3.2 : 0;
      const free = mode === "idle" && Math.abs(cur.gx) < 0.2;
      const talkingEyes = mode === "speaking";
      const gx = cur.gx + (free ? sacc.x + cursorX * 0.6 : talkingEyes ? sacc.x * 0.5 : cursorX * 0.15);
      const gy = cur.gy + (free ? sacc.y + cursorY * 0.6 : talkingEyes ? sacc.y * 0.4 : 0);

      // Listening: small nods on the student's louder moments
      hearSmooth += (hear - hearSmooth) * (1 - Math.exp(-dt * 6));
      if (mode === "hearing" && hear > hearSmooth * 1.6 && hear > 0.12 && nod <= 0.05) nod = 1;
      nod = Math.max(0, nod - dt * 2.4);

      // ---- write the face ----
      const r = refs.current;
      const glow = mode === "speaking" || mode === "idle" ? COLOR[mood] : CYAN;
      const kc = 1 - Math.exp(-dt * 5);
      for (let i = 0; i < 3; i++) rgb[i] += (parseInt(glow.slice(1 + i * 2, 3 + i * 2), 16) - rgb[i]) * kc;
      const lift = mode === "speaking" ? Math.min(0.35, mouthOpen * 0.4 + pop * 0.15) : 0;
      const color = `rgb(${rgb.map((v) => Math.round(v + (255 - v) * lift)).join(",")})`;
      // ---- the openlura face: emotion, listening/thinking, lip-sync, colour ----
      const lf = lura.current;
      if (lf) {
        const name = LURA[mood];
        const key = `${name}|${mode === "speaking" ? 1 : 0}`;
        if (key !== luraEmotion) {
          luraEmotion = key;
          lf.setEmotion(name, { intensity: mode === "speaking" ? 0.95 : 0.5 });
        }
        const m = mode === "hearing" ? "listen" : mode === "thinking" ? "think" : "";
        if (m !== luraMode) {
          luraMode = m;
          lf.listen(m === "listen");
          lf.think(m === "think");
        }
        const sp = driver?.speech?.() ?? null;
        if (sp && sp.id !== luraSpeech) {
          luraSpeech = sp.id;
          lf.speak(sp.text, { durationMs: sp.durationMs });
          // the face turns where the words do: the mood changes Lexi marked, a laugh, a "hmm"
          beats = [];
          const len = Math.max(1, sp.text.length);
          const at = (i: number) => now + (sp.durationMs * i) / len;
          for (const [i, m] of sp.moods ?? []) {
            if (m in MOODS) beats.push({ at: at(i) - 120, run: () => { clipMood = m as Mood; } });
          }
          for (const m of sp.text.matchAll(/!+|(?<!\p{L})(?:ха|хи|haha|lol|lmao)\p{L}*|(?<!\p{L})(?:хм+|hm+)(?!\p{L})/giu)) {
            const word = m[0].toLowerCase();
            const i = m.index ?? 0;
            if (word.startsWith("!")) beats.push({ at: at(i) - 200, run: () => lf.gesture("ack") });
            else if (/^(ха|хи|haha|lol|lmao)/.test(word)) beats.push({ at: at(i), run: () => lf.gesture("giggle") });
            else beats.push({ at: at(i), run: () => lf.gesture("hmm") });
          }
        } else if (!sp && luraSpeech && mode !== "speaking") {
          luraSpeech = 0;
          lf.silence();
        }
        if (mode === "speaking") {
          for (const b of beats) if (b.at <= now) b.run();
          beats = beats.filter((b) => b.at > now);
        } else if (mode === "hearing") {
          // listening: a nod now and then while the student talks
          if (hear > 0.1 && now >= nextNod) {
            nextNod = now + 2500 + Math.random() * 2000;
            lf.poke();
            lf.gesture("ack");
          }
        }
        if (host.current) host.current.style.color = `rgb(${rgb.map((v) => Math.round(v + (255 - v) * lift)).join(",")})`;
      }
      if (color !== lastColor) {
        lastColor = color;
        for (const k of ["eL", "eR", "mouth"]) r[k]?.setAttribute("fill", color);
        for (const k of ["aL", "aR"]) r[k]?.setAttribute("stroke", color);
        if (pixels.current) pixels.current.style.color = color;
      }
      const pctx = pixels.current?.getContext("2d");
      if (pctx) {
        const shut = blink * (1 - hv * 0.85);
        drawPixels(pctx, {
          openL: openL * shut, openR: openR * shut, happy: hv > 0.5, lid: cur.lid, lidAngle: cur.lidAngle, wide: cur.wide,
          gx, gy, mouthOpen, talking: speakingNow, mw: cur.mw, mcl: cur.mcl, mcr: cur.mcr, mb: cur.mb, round: ROUND.has(mood), color,
        });
      }
      const eye = (side: "L" | "R", ex: number, open: number) => {
        const o = Math.max(0.05, open * blink * (1 - hv * 0.85) * (1 + pop * 0.06));
        const happy = cur.happy;
        const cx = ex + gx * 2.6;
        const cy = 76 + gy * 1.8;
        const breathe = 1 + Math.sin(t * 1.4) * 0.015;
        const emph = 1 + pop * 0.08;
        r[`e${side}`]?.setAttribute("rx", (4.2 * cur.wide * emph * breathe).toFixed(2));
        r[`e${side}`]?.setAttribute("ry", (6 * o).toFixed(2));
        r[`e${side}`]?.setAttribute("cx", cx.toFixed(2));
        r[`e${side}`]?.setAttribute("cy", cy.toFixed(2));
        void happy;
        r[`e${side}`]?.setAttribute("opacity", (1 - hv * hv).toFixed(2));
        // two highlights make the eyes look wet and alive; they follow the gaze a little more
        const shine = o > 0.3 ? 1 - happy : 0;
        r[`h${side}`]?.setAttribute("cx", (cx + 1.9 + gx * 0.5).toFixed(2));
        r[`h${side}`]?.setAttribute("cy", (cy - 2.7 * o).toFixed(2));
        r[`h${side}`]?.setAttribute("opacity", shine.toFixed(2));
        r[`s${side}`]?.setAttribute("cx", (cx - 1.9 + gx * 0.3).toFixed(2));
        r[`s${side}`]?.setAttribute("cy", (cy + 2.7 * o).toFixed(2));
        r[`s${side}`]?.setAttribute("opacity", (shine * 0.8).toFixed(2));
        r[`a${side}`]?.setAttribute("opacity", Math.max(0, hv * 1.4 - 0.4).toFixed(2));
        r[`a${side}`]?.setAttribute("transform", `translate(0 ${((1 - hv) * 2).toFixed(2)}) scale(1 ${(0.4 + hv * 0.6).toFixed(3)})`);
        r[`a${side}`]?.setAttribute("transform-origin", `${ex} 76`);
        // the upper lid: glass-coloured, it comes down from the eye's own top edge only as
        // far as the mood asks, so an open eye is never cut
        const ry = 6 * o;
        const top = cy - ry;
        const bottom = top + Math.max(0, cur.lid) * ry * 1.1;
        const angle = (side === "L" ? cur.lidAngle : -cur.lidAngle) * Math.min(1, Math.max(0, cur.lid) * 4);
        r[`l${side}`]?.setAttribute("x", (cx - 9).toFixed(2));
        r[`l${side}`]?.setAttribute("y", "48");
        // no lid at all when the mood has none: even its edge would cut the eye's glow
        r[`l${side}`]?.setAttribute("height", cur.lid > 0.02 ? Math.max(0, bottom - 48).toFixed(2) : "0");
        r[`l${side}`]?.setAttribute("transform", `rotate(${angle.toFixed(2)} ${cx.toFixed(2)} ${top.toFixed(2)})`);
      };
      eye("L", 36.5, openL);
      eye("R", 63.5, openR);

      const brow = (side: "L" | "R", ex: number) => {
        const tilt = side === "L" ? cur.browTilt : -cur.browTilt;
        const raise = side === "R" ? cur.browRaiseR : 0;
        const y = 66.4 + cur.browY * 0.75 - raise * 0.75 + nod * 0.5;
        r[`b${side}`]?.setAttribute("d", `M${ex - 4.6} ${y.toFixed(2)}Q${ex} ${(y - 1.6).toFixed(2)} ${ex + 4.6} ${y.toFixed(2)}`);
        r[`b${side}`]?.setAttribute("transform", `rotate(${tilt.toFixed(2)} ${ex} ${y.toFixed(2)})`);
        r[`b${side}`]?.setAttribute("opacity", cur.brow.toFixed(2));
      };
      brow("L", 36.5);
      brow("R", 63.5);

      // The mouth: the mood's shape, opened by the voice
      const round = ROUND.has(mood);
      const talkOpen = mouthOpen * (round ? 6.5 : 9);
      const mw = cur.mw * (speakingNow && !round ? 0.9 + bright * 0.3 : 1) + (round ? 0 : mouthOpen * 1.6);
      const mb = speakingNow ? Math.max(cur.mt + 1.2, cur.mb * 0.5 + talkOpen) : cur.mb;
      const d = mouthPath(50, cur.my, mw, cur.mt, mb, cur.mcl, cur.mcr);
      r.mouth?.setAttribute("d", d);
      r.mclip?.setAttribute("d", d);
      r.cheekL?.setAttribute("opacity", (cur.cheeks * 0.75).toFixed(2));
      r.cheekR?.setAttribute("opacity", (cur.cheeks * 0.75).toFixed(2));

      // ---- body and flame ----
      const temper = TEMPER[driver?.persona?.() ?? "classic"] ?? 1;
      const motion = MOTION[mood];
      // Speaking shows the mood fully; listening and thinking calm the body down
      const talking = mode === "speaking";
      const want = (talking ? motion.energy : 0.06) * temper;
      energy += (want - energy) * (1 - Math.exp(-dt * 3));

      // Where to be: a new spot now and then; often and far when angry or excited
      if (!talking) {
        // back home and still
        pos.tx = 0;
        pos.ty = mode === "hearing" ? 2 : 0; // leans in a little to listen
        pos.at = now;
      } else if (!calm && now > pos.at) {
        const darting = motion.dart > 0 && Math.random() < 0.5;
        // half the table's distance: at full range she flew from side to side (owners, 2026-10-24)
        const range = motion.range * 0.5 * Math.min(1.4, temper);
        pos.tx = (Math.random() * 2 - 1) * range;
        pos.ty = (Math.random() * 2 - 1) * range * 0.35;
        pos.at = now + (darting ? (600 + Math.random() * 900) / motion.dart : 1800 + Math.random() * 2600);
      }
      // A spring towards it: stiff and fast with energy, soft and floaty without
      const stiff = 18 + energy * 70;
      const damp = 7 + energy * 6;
      pos.vx += ((pos.tx - pos.x) * stiff - pos.vx * damp) * dt;
      pos.vy += ((pos.ty - pos.y) * stiff - pos.vy * damp) * dt;
      pos.x += pos.vx * dt;
      pos.y += pos.vy * dt;

      jump = Math.max(0, jump - dt * 2.2);
      const hop = jump > 0 ? -Math.sin((1 - jump) * Math.PI) * 14 : 0;
      const bob = calm ? 0 : talking ? Math.sin(t * Math.PI * 2 * cur.bounceHz) * cur.bounce * (0.7 + energy) : Math.sin(t * 1.6) * 0.5;
      // anger trembles, it doesn't vibrate: a slow, small shiver, capped whatever the mood mix
      const shiver = Math.min(0.9, (cur.shake * 0.3 + motion.jitter * 0.35) * temper);
      const jitter = calm ? 0 : (Math.sin(t * 13) * 0.6 + Math.sin(t * 8.3) * 0.4) * (talking ? shiver : 0);
      // A strong word: a small pop towards the viewer
      if (speakingNow && mouthOpen - lastOpen > 0.18) pop = Math.min(1, pop + 0.6 * temper);
      lastOpen = mouthOpen;
      pop = Math.max(0, pop - dt * 3.5);
      const talkBounce = speakingNow && !calm ? -mouthOpen * 2.6 * (0.6 + energy) : 0;
      const x = calm ? 0 : pos.x + jitter * 1.6;
      const y = cur.lean + (calm ? 0 : pos.y) + bob + hop + talkBounce + nod * 2.4;
      // Leans into the movement, like something with weight
      const tilt = (talking ? cur.tilt : cur.tilt * 0.3) + (calm ? 0 : Math.max(-8, Math.min(8, pos.vx * 0.1))) + jitter * 1.4;
      const sq = calm ? 0 : Math.max(-0.12, Math.min(0.12, squash * 0.02));
      const sx = cur.scale * (1 + mouthOpen * 0.02 + pop * 0.035 + (mode === "hearing" ? 0.02 : 0) - sq * 0.7);
      const sy = cur.scale * (1 - mouthOpen * 0.012 + pop * 0.045 + (jump > 0.5 ? 0.05 : 0) + sq);
      if (body.current) {
        body.current.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${tilt.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      }
      live.current.heat = cur.heat;
      live.current.dim = cur.dim;
      live.current.flare = cur.flare;

      // Effects change only when the mood or mode does
      const list = effectsFor(mood, mode);
      const keyNow = list.join(",");
      if (keyNow !== fxKey.current) {
        fxKey.current = keyNow;
        setFx(list);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [driver, live, body, gaze, calm]);

  const clipVisor = `v${uid}`;
  const clipMouth = `m${uid}`;
  return (
    <>
    <svg viewBox="0 -25 100 145" className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
      <defs>
        <clipPath id={clipVisor}><rect x="17" y="59" width="66" height="37" rx="18.5" /></clipPath>
        <clipPath id={clipMouth}><path ref={set("mclip")} d={mouthPath(50, 86, 3.8, 0.4, 2.8, 0, 0)} /></clipPath>
        {/* one gradient in user space for the glass and the lids, so the lids are invisible on it */}
        <linearGradient id={`g${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="59" x2="0" y2="96">
          <stop offset="0" stopColor="#2a2140" />
          <stop offset="1" stopColor="#0c0916" />
        </linearGradient>
        <radialGradient id={`s${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`f${uid}`} filterUnits="userSpaceOnUse" x="0" y="45" width="100" height="70">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* the glass: dark, a warm rim and a gloss on top */}
      <rect x="17" y="59" width="66" height="37" rx="18.5" fill={`url(#g${uid})`} />
      <g clipPath={`url(#${clipVisor})`}>
        <g filter={`url(#f${uid})`} style={{ display: luraReady || PIXEL_FACE ? "none" : undefined }}>
          {(["L", "R"] as const).map((side) => {
            const ex = side === "L" ? 36.5 : 63.5;
            return (
              <g key={side}>
                <ellipse ref={set(`e${side}`)} cx={ex} cy="76" rx="4.2" ry="6" fill={CYAN} />
                <path ref={set(`a${side}`)} d={`M${ex - 5} 78Q${ex} 70 ${ex + 5} 78`} stroke={CYAN} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0" />
              </g>
            );
          })}
          <path ref={set("mouth")} d={mouthPath(50, 86, 3.8, 0.4, 2.8, 0, 0)} fill={CYAN} />
        </g>

        {!luraReady && !PIXEL_FACE && (["L", "R"] as const).map((side) => {
          const ex = side === "L" ? 36.5 : 63.5;
          return <rect key={side} ref={set(`l${side}`)} x={ex - 9} y="48" width="18" height="0" fill={`url(#g${uid})`} />;
        })}
        <ellipse cx="38" cy="63.5" rx="17" ry="4.2" fill={`url(#s${uid})`} />
      </g>
      {/* the rim goes over everything, so the lids never cut into the edge of the glass */}
      <rect x="17" y="59" width="66" height="37" rx="18.5" fill="none" stroke="#ff9b5e" strokeOpacity="0.75" strokeWidth="0.9" />
      {!luraReady && <Effects list={fx} calm={calm} />}
    </svg>
    {/* the 8-bit face: a 32 x 16 LED matrix over the glass, scaled up without smoothing */}
    {PIXEL_FACE && (
      <canvas
        ref={pixels}
        width={PW}
        height={PH}
        className="pointer-events-none absolute"
        style={{ left: "17%", width: "66%", top: `${((59 + 25) / 145) * 100}%`, height: `${(37 / 145) * 100}%`, imageRendering: "pixelated", color: CYAN, filter: "drop-shadow(0 0 1px currentColor) drop-shadow(0 0 5px currentColor)" }}
        aria-hidden
      />
    )}
    {/* the openlura face, over the glass (x 17..83, y 59..96 of the mascot), glowing in the mood colour */}
    <div
      ref={host}
      className="lura-host pointer-events-none absolute grid place-items-center overflow-hidden"
      style={{ left: "19%", width: "62%", top: `${((61 + 25) / 145) * 100}%`, height: `${(33 / 145) * 100}%`, borderRadius: "9999px", filter: "drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 6px currentColor)" }}
      aria-hidden
    />
    </>
  );
}

const pop = { initial: { opacity: 0, scale: 0.4 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.6 }, transition: { type: "spring" as const, stiffness: 380, damping: 18 } };

function Effects({ list, calm }: { list: Effect[]; calm: boolean }) {
  const loop = (values: Record<string, number[]>, duration: number, delay = 0) =>
    calm ? {} : { animate: values, transition: { duration, delay, repeat: Infinity, ease: "easeInOut" as const } };
  return (
    <AnimatePresence>
      {list.includes("anger") && (
        <motion.g key="anger" {...pop} style={{ transformOrigin: "84px 48px" }}>
          <motion.g {...loop({ scale: [1, 1.18, 1] }, 0.5)} style={{ transformOrigin: "84px 48px" }}>
            {[0, 90, 180, 270].map((r) => (
              <path key={r} d="M86 46q1.5 -1.5 3 0" transform={`rotate(${r} 84 48)`} stroke="#e8203a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            ))}
          </motion.g>
        </motion.g>
      )}
      {list.includes("puff") && [0, 1].map((i) => (
        <motion.circle key={`puff${i}`} cx={i ? 76 : 24} cy="20" r="3.2" fill="#cfc8d8" initial={{ opacity: 0 }}
          animate={calm ? { opacity: 0.6 } : { opacity: [0, 0.75, 0], cy: [22, 6, -6], r: [2.4, 4, 5] }}
          exit={{ opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8 }} />
      ))}
      {list.includes("sweat") && (
        <motion.path key="sweat" d="M86 58c-1.8 2.6-2.6 4.1-2.6 5.3a2.6 2.6 0 0 0 5.2 0c0-1.2-.8-2.7-2.6-5.3z" fill="#5fb7ff" stroke="#fff" strokeWidth="0.6"
          initial={{ opacity: 0, y: -4 }} animate={calm ? { opacity: 1 } : { opacity: [0, 1, 1, 0], y: [-4, 0, 6, 10] }} exit={{ opacity: 0 }}
          transition={{ duration: 1.8, repeat: Infinity }} />
      )}
      {list.includes("bang") && (
        <motion.text key="bang" x="88" y="44" fontSize="13" fontWeight="900" fill="#ff3b30" {...pop} style={{ fontFamily: "var(--font-display)" }}>!</motion.text>
      )}
      {(list.includes("tears") || list.includes("sob")) && [24, 76].map((x, i) => (
        <motion.ellipse key={`tear${x}`} cx={x} cy="78" rx="1.5" ry="2.1" fill="#5fb7ff"
          initial={{ opacity: 0 }} animate={calm ? { opacity: 0.9 } : { opacity: [0, 1, 0], cy: [77, list.includes("sob") ? 100 : 88, list.includes("sob") ? 106 : 93] }}
          exit={{ opacity: 0 }} transition={{ duration: list.includes("sob") ? 1.1 : 0.9, repeat: Infinity, delay: i * 0.3 }} />
      ))}
      {list.includes("sparks") && [[10, 40, 0], [90, 28, 0.3], [88, 100, 0.6], [12, 98, 0.9]].map(([x, y, d]) => (
        <motion.path key={`spark${x}`} d={`M${x} ${y - 4}L${x + 1.1} ${y - 1.1}L${x + 4} ${y}L${x + 1.1} ${y + 1.1}L${x} ${y + 4}L${x - 1.1} ${y + 1.1}L${x - 4} ${y}L${x - 1.1} ${y - 1.1}Z`} fill="#ffd34d"
          style={{ transformOrigin: `${x}px ${y}px` }} initial={{ opacity: 0, scale: 0 }}
          animate={calm ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 0], scale: [0.3, 1.1, 0.3], rotate: [0, 45, 90] }}
          exit={{ opacity: 0 }} transition={{ duration: 1.3, repeat: Infinity, delay: d }} />
      ))}
      {list.includes("question") && (
        <motion.text key="q" x="86" y="46" fontSize="14" fontWeight="900" fill="#1b1433" {...pop} style={{ fontFamily: "var(--font-display)" }}>?</motion.text>
      )}
      {list.includes("heart") && (
        <motion.path key="heart" d="M86 50c-2-3.2-6.6-1.6-5.4 1.8.8 2.2 3.6 4 5.4 5.2 1.8-1.2 4.6-3 5.4-5.2 1.2-3.4-3.4-5-5.4-1.8z" fill="#ff5f8a"
          initial={{ opacity: 0, y: 4 }} animate={calm ? { opacity: 1 } : { opacity: [0, 1, 0], y: [4, -4, -12] }} exit={{ opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }} />
      )}
      {list.includes("zzz") && ["z", "z", "Z"].map((z, i) => (
        <motion.text key={`z${i}`} x={84 + i * 3} y={50 - i * 6} fontSize={6 + i * 2} fontWeight="800" fill="#7b7396"
          initial={{ opacity: 0 }} animate={calm ? { opacity: 0.8 } : { opacity: [0, 1, 0], y: [0, -6] }} exit={{ opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}>{z}</motion.text>
      ))}
      {list.includes("dots") && (
        <motion.g key="dots" {...pop} style={{ transformOrigin: "84px 46px" }}>
          <rect x="74" y="38" width="22" height="13" rx="6.5" fill="#fff" stroke="#e3ddef" strokeWidth="0.6" />
          {[0, 1, 2].map((i) => (
            <motion.circle key={i} cx={79.5 + i * 5.5} cy="44.5" r="1.6" fill="#1b1433"
              {...loop({ opacity: [0.25, 1, 0.25], cy: [44.5, 43.3, 44.5] }, 0.9, i * 0.15)} />
          ))}
        </motion.g>
      )}
    </AnimatePresence>
  );
}
