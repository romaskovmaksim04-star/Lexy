"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useSpring } from "motion/react";
import { useCalm } from "@/lib/motion-pref";
import { kickEmbers } from "@/components/landing/EmberSky";
import { LexiFace, type FaceDriver, type FaceLive } from "./LexiFace";
import type { Mood } from "@/lib/voices";

const TAP_FACES: Mood[] = ["laughing", "excited", "shocked", "teasing", "proud", "impressed", "dramatic"];

// Lexy as living fire: the mascot's silhouette (an egg round the visor, a tall slim tongue,
// a small tongue on each side) rendered as WebGL flame in three layers (veil, body, hot heart). Upward-flowing noise warps its edges so the tongues lick and
// curl, stronger towards the tip; the body stays solid enough to carry the visor. The fire
// leans towards the cursor, flares up when tapped and grows with `level` (a voice meter).
// The visor and eyes are SVG on top, so the face stays crisp. Without WebGL, or with
// animations switched off on the site, the flat SVG mascot is shown instead.

const VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

const FS = [
  "precision mediump float;",
  "uniform vec2 R;uniform float T;uniform float K;uniform float L;uniform float V;uniform float D;uniform float H;uniform float S;",
  "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
  "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}",
  "const mat2 RT=mat2(.8,.6,-.6,.8);",
  "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=RT*p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
  "float smin(float a,float b,float k){float q=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,q)-k*q*(1.-q);}",
  // the mascot silhouette as a distance field, in mascot units (1 = the box width, y up from its bottom).
  // The visor spans x .17..83, y .24..61: the body is an egg that just holds it, the flame above
  // is tall and slim, with a small tongue on each side
  "float shape(vec2 p){",
  " vec2 b=p-vec2(.5,.4);",
  " b.x/=.4-.05*clamp(b.y/.36,-1.,1.);b.y/=.36;",
  " float body=(length(b)-1.)*.36;",
  " float y=clamp((p.y-.56)/.84,0.,1.);",
  " float cx=.5-.05*y+.05*sin(y*4.);",
  " float tg=max(max(abs(p.x-cx)-.3*pow(1.-y,1.15),p.y-1.4),.5-p.y);",
  " float y2=clamp((p.y-.6)/.42,0.,1.);",
  " float t2=max(max(abs(p.x-(.79-.07*y2))-.1*pow(1.-y2,1.1),p.y-1.02),.56-p.y);",
  " float y3=clamp((p.y-.55)/.33,0.,1.);",
  " float t3=max(max(abs(p.x-(.22+.04*y3))-.08*pow(1.-y3,1.1),p.y-.88),.5-p.y);",
  " return smin(smin(smin(body,tg,.1),t2,.06),t3,.06);",
  "}",
  // tongues lick upwards: noise eats into the upper part of a flame, deep inside it stays whole
  "float cut(float d,float hg,float l,float b){return smoothstep(.24,.56,l+(1.-hg)*b+smoothstep(0.,-.12,d)*.55);}",
  // colour by temperature: deep red at the cool edge, orange, amber, a yellow-white heart
  "vec3 fire(float x){x=clamp(x,0.,1.15);",
  " vec3 c=mix(mix(vec3(1.,.44,.1),vec3(.62,.04,.03),D),vec3(.97,.2,.04),smoothstep(.0,.3,x));",
  " c=mix(c,vec3(1.,.46,.06),smoothstep(.25,.55,x));",
  " c=mix(c,vec3(1.,.72,.18),smoothstep(.52,.8,x));",
  " return mix(c,vec3(1.,.96,.8),smoothstep(.8,1.1,x));",
  "}",
  // embers rising from the tips, swaying as they go
  "float embers(vec2 p,float t,float sc,float sp){",
  " vec2 s=vec2(p.x*sc,p.y*sc*.8-t*sp);",
  " s.x+=sin(s.y*.9+t*1.3)*.35;",
  " vec2 id=floor(s);float hs=h(id);",
  " if(hs<.83)return 0.;",
  " vec2 o=vec2(h(id+3.1),h(id+7.7))*.6+.2;",
  " float ds=length((fract(s)-o)*vec2(1.,.55));",
  " return smoothstep(.1,0.,ds)*(.45+.55*sin(t*8.+hs*40.));",
  "}",
  "void main(){",
  " vec2 uv=gl_FragCoord.xy/R;",
  // the canvas is larger than the mascot (room for tall, leaning flames): back to mascot units
  " vec2 p=vec2(uv.x*1.7-.35,(uv.y*1.6-.1)*1.45);",
  " float t=T;",
  " float hg=clamp((p.y-.3)/1.,0.,1.);",
  // lean: the higher the flame, the more it bends towards the cursor
  " p.x-=L*.13*pow(hg,1.5);",
  // grow from the base when tapped or when the voice is loud;
  // anger makes the fire taller and wilder, a whisper makes it smaller and calmer
  " float grow=(1.+K*.1+V*.22+H*.12)*(1.-S*.08);",
  " vec2 g=vec2(p.x,.05+(p.y-.05)/grow);",
  // upward-flowing turbulence warps the outlines, little at the body, a lot at the tips
  " vec2 q=vec2(fbm(g*vec2(3.,2.)+vec2(0.,-t*1.6)),fbm(g*vec2(3.,2.)+vec2(5.2,-t*2.)));",
  " float amp=(.02+.2*hg*hg)*(1.+K*.7+V*.9+H*.9)*(1.-S*.45);",
  " vec2 w=(q-.5)*amp*vec2(1.,.55);",
  " float lick=fbm(g*vec2(5.,2.6)+vec2(q.x*1.5,-t*3.2));",
  " float lick2=fbm(g*vec2(4.,2.2)+vec2(7.3+q.y,-t*2.6));",
  // three nested flames, as in a real fire: a wider, wilder veil behind, the body that carries
  // the visor, and a small hot heart inside it
  " float dO=shape((g-vec2(.5,.04))/1.1+vec2(.5,.04)+w*1.7)*1.1;",
  " float dM=shape(g+w);",
  " float dI=shape((g-vec2(.5,.08))/.62+vec2(.5,.08)+w*1.3)*.62;",
  " float mO=smoothstep(.012,-.02,dO)*cut(dO,hg,lick2,.8);",
  " float mM=smoothstep(.006,-.014,dM)*cut(dM,hg,lick,.95);",
  " float mI=smoothstep(.01,-.06,dI)*cut(dI,hg,lick,1.1);",
  // filaments: stretched noise flowing up gives the inside the texture of real fire
  " float fil=fbm(vec2(g.x*7.,g.y*2.2-t*2.8)+q*.8);",
  " float deep=smoothstep(0.,-.16,dM);",
  " float temp=.16+mM*(.3+deep*.22)+mI*.42+(fil-.5)*.34*mM-hg*.24;",
  " temp=temp*(1.-H*.22)*(1.-S*.3)+(K*.12+V*.15)*mM;",
  // the whole fire breathes a little, like a real flame
  " float fl=.93+.09*n(vec2(t*5.,1.7));",
  " vec3 col=fire(temp)*fl;",
  " float a=max(max(mO*(.42+.4*D),mM),mI);",
  " float fade=smoothstep(0.,.1,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));",
  " float sp=(embers(p,t,9.,2.4)+embers(p+vec2(.37,.11),t,14.,3.3)*.7)*(1.-a)*smoothstep(.55,.85,p.y)*smoothstep(1.9,1.1,p.y)*(.55+K+V)*fade;",
  // a warm halo around the flame, faded out before the canvas edges
  " float halo=exp(-max(dO,0.)*(12.-D*4.))*(1.-a)*(.2+K*.22+V*.3)*(.55+.45*D)*fade;",
  " vec3 c=col*a+vec3(1.,.5,.15)*halo*(.8+D*.4)+vec3(1.,.8,.45)*sp;",
  // everything fades out before the canvas edge, so nothing is ever cut by a straight line
  " gl_FragColor=vec4(c,clamp(a+sp+halo*(.5+D*.3),0.,1.))*fade;",
  "}",
].join("\n");

const LINES = ["Ещё разок!", "Горячо! Давай к Speaking?", "I'm on fire today.", "Пробник ждёт тебя", "Band 7? Легко.", "Тренируемся каждый день?", "Ай, щекотно!"];

export function FireSpirit({ className = "", level, talk = true, face }: {
  className?: string;
  level?: { get(): number };
  talk?: boolean;
  /** Drives the face during a call (mood, voice, listening); without it Lexi idles and blinks */
  face?: FaceDriver;
}) {
  const id = useId();
  const calm = useCalm();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const kick = useRef(0);
  const [gl, setGl] = useState(true);
  const [line, setLine] = useState<string | null>(null);
  const taps = useRef(0);
  const controls = useAnimationControls();
  const ex = useMotionValue(0);
  const ey = useMotionValue(0);
  const px = useSpring(ex, { stiffness: 220, damping: 18 });
  const py = useSpring(ey, { stiffness: 220, damping: 18 });
  const lean = useRef({ v: 0, t: 0 });
  const faceLive = useRef<FaceLive>({ heat: 0, dim: 0, flare: 0, voice: 0 });
  const gaze = useMemo(() => ({ x: px, y: py }), [px, py]);
  // Outside a call a tap makes a face for a moment
  const tapFace = useRef<{ mood: Mood; until: number }>({ mood: "neutral", until: 0 });
  const idle = useMemo<FaceDriver>(() => ({
    mood: () => (performance.now() < tapFace.current.until ? tapFace.current.mood : "neutral"),
    mode: () => (performance.now() < tapFace.current.until ? "speaking" : "idle"),
    voice: () => ({ level: 0, bright: 0.5, playing: false, analysed: false }),
    hear: () => 0,
  }), []);
  const body = useRef<HTMLDivElement>(null);
  const live = gl && !calm;

  // Eyes follow the cursor; the fire leans towards it
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.62;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 260);
      ex.set((dx / d) * 5 * k);
      ey.set((dy / d) * 3.2 * k);
      lean.current.t = Math.max(-1, Math.min(1, dx / 420)) * Math.max(0, 1 - Math.abs(dy) / 900);
    };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, [ex, ey]);

  useEffect(() => {
    if (!line) return;
    const t = setTimeout(() => setLine(null), 2200);
    return () => clearTimeout(t);
  }, [line]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || !live) return;
    const ctx = el.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!ctx) { setGl(false); return; }
    const g = ctx;
    const compile = (type: number, src: string) => {
      const s = g.createShader(type)!;
      g.shaderSource(s, src);
      g.compileShader(s);
      return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(g.VERTEX_SHADER, VS);
    const fs = compile(g.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { setGl(false); return; }
    const pr = g.createProgram()!;
    g.attachShader(pr, vs);
    g.attachShader(pr, fs);
    g.linkProgram(pr);
    if (!g.getProgramParameter(pr, g.LINK_STATUS)) { setGl(false); return; }
    g.useProgram(pr);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(pr, "a");
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    g.clearColor(0, 0, 0, 0);
    const u = (n: string) => g.getUniformLocation(pr, n);
    const uR = u("R"), uT = u("T"), uK = u("K"), uL = u("L"), uV = u("V"), uD = u("D"), uH = u("H"), uS = u("S");
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    const resize = () => {
      el.width = Math.max(1, Math.round(el.clientWidth * dpr));
      el.height = Math.max(1, Math.round(el.clientHeight * dpr));
      g.viewport(0, 0, el.width, el.height);
      g.uniform2f(uR, el.width, el.height);
    };
    resize();
    // If the browser takes the GPU context away (too many canvases, a driver reset), the
    // flat drawing replaces the fire instead of an empty white box
    const lost = (e: Event) => { e.preventDefault(); setGl(false); };
    el.addEventListener("webglcontextlost", lost);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "120px" });
    io.observe(el);
    let raf = 0;
    let last = performance.now();
    let time = Math.random() * 50;
    let voice = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = now; return; }
      // a frame stamp can be a little older than the start: a negative step would make every
      // spring push instead of damp (the flame once flew 300 px off), so the step is never below 0
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      time += dt;
      kick.current = Math.max(0, kick.current - dt * 1.1);
      const l = lean.current;
      l.v += (l.t - l.v) * Math.min(1, dt * 3);
      // The fire grows with a voice meter, or with Lexi's own voice in a call
      const target = Math.min(1, Math.max(level ? level.get() : 0, faceLive.current.voice * 0.9 + faceLive.current.flare * 0.25));
      voice += (target - voice) * Math.min(1, dt * (target > voice ? 14 : 4));
      g.uniform1f(uT, time);
      g.uniform1f(uK, kick.current);
      g.uniform1f(uL, l.v);
      g.uniform1f(uV, voice);
      g.uniform1f(uD, document.documentElement.dataset.theme === "dark" ? 1 : 0);
      g.uniform1f(uH, faceLive.current.heat);
      g.uniform1f(uS, faceLive.current.dim);
      g.clear(g.COLOR_BUFFER_BIT);
      g.drawArrays(g.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("webglcontextlost", lost);
      ro.disconnect();
      io.disconnect();
      g.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [live, level]);

  const tap = () => {
    kick.current = Math.min(2, kick.current + 1.2);
    kickEmbers(1.3);
    taps.current += 1;
    tapFace.current = { mood: TAP_FACES[(taps.current - 1) % TAP_FACES.length], until: performance.now() + 1800 };
    if (talk) setLine(LINES[(taps.current - 1) % LINES.length]);
    if (!calm) {
      controls.start({ y: [0, 6, -18, 0], scaleY: [1, 0.9, 1.06, 1], transition: { duration: 0.7, times: [0, 0.2, 0.5, 1], ease: "easeOut" } });
    }
  };

  return (
    <div ref={wrap} className={`relative select-none ${className}`}>
      <AnimatePresence>
        {line && (
          <motion.p
            key={line + taps.current}
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="absolute left-1/2 top-[6%] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold shadow-lg"
            role="status"
          >
            {line}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={tap}
        animate={controls}
        style={{ originY: 1 }}
        className="relative block aspect-[1/1.45] w-full cursor-pointer rounded-[40%] focus-visible:outline-offset-8"
        aria-label="Огонёк Лекси. Нажми на него"
      >
        <div ref={body} className="absolute inset-0" style={{ transformOrigin: "50% 92%" }}>
          {live ? (
            <canvas ref={canvas} className="pointer-events-none absolute" style={{ left: "-35%", width: "170%", top: "-50%", height: "160%" }} aria-hidden />
          ) : (
            <svg viewBox="0 -25 100 145" className="absolute inset-0 size-full drop-shadow-[0_30px_40px_rgba(255,90,31,0.35)]" aria-hidden>
              <defs>
                <linearGradient id={`${id}f`} x1="0.2" y1="1" x2="0.8" y2="0">
                  <stop offset="0" stopColor="#FF4E1A" />
                  <stop offset="1" stopColor="#FF9A0A" />
                </linearGradient>
              </defs>
              <path fill={`url(#${id}f)`} d="M48-20C58-4 68 12 70 30C73 24 77 20 80 16C82 28 84 38 86 52C89 60 90 70 90 80C90 101 72 116 50 116C28 116 10 101 10 80C10 64 17 54 24 46C22 40 21 36 22 30C26 36 29 40 32 42C38 28 46 10 48-20z" />
            </svg>
          )}
          {/* The face sits on the body, where the flame is solid */}
          <LexiFace driver={face ?? idle} live={faceLive} body={body} gaze={gaze} calm={calm} />
        </div>
      </motion.button>
    </div>
  );
}
