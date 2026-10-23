"use client";

import { useEffect, useRef, useState } from "react";
import { useCalm } from "@/lib/motion-pref";

// Lexy's hearth: a full-page WebGL background of warm heat haze and rising embers.
// It follows the cursor, drifts with the page scroll and flares up when the mascot is
// tapped (kickEmbers). Rendered at a fraction of the screen resolution, paused when the
// tab is hidden, and replaced by a still gradient when animations are switched off on the
// site or WebGL is missing.

let kick = 0;
/** Makes the fire flare up for a moment (mascot taps, correct answers). */
export function kickEmbers(amount = 1) {
  kick = Math.min(2.2, kick + amount);
}

const VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

const FS = [
  "precision mediump float;",
  "uniform vec2 R;uniform float T;uniform vec2 M;uniform float S;uniform float K;uniform float D;",
  "uniform vec3 C0;uniform vec3 C1;uniform vec3 C2;uniform vec3 C3;uniform vec3 C4;",
  "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
  "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}",
  "const mat2 RT=mat2(.8,.6,-.6,.8);",
  "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=RT*p*2.02+vec2(3.1,1.7);a*=.5;}return v;}",
  "float fbm3(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*n(p);p=RT*p*2.02+vec2(3.1,1.7);a*=.5;}return v;}",
  "void main(){",
  " vec2 uv=gl_FragCoord.xy/R;float asp=R.x/R.y;",
  " vec2 p=(gl_FragCoord.xy-.5*R)/R.y;",
  " float t=T*.045;",
  // the hearth sits where the hero mascot is and rises away as the page scrolls
  " vec2 hp=vec2(asp>1.1?asp*.24:0.,-.16+S*1.05);",
  " vec2 dh=p-hp;",
  // heat haze flowing upward, warped twice so it curls like air above a fire
  " vec2 q=vec2(fbm(p*1.3+vec2(0.,-t*2.2)),fbm(p*1.3+vec2(4.2,1.3)+vec2(0.,-t*1.7)));",
  " float f=fbm(p*1.7+2.3*q+vec2(t*.4,-t*3.2));",
  " float glow=exp(-dot(dh*vec2(1.5,.95),dh*vec2(1.5,.95))*2.4);",
  " float heat=smoothstep(.38,1.,f)*(.3+glow*1.25);",
  " vec3 col=mix(C0,C4,smoothstep(-.6,.7,p.y));",
  " col=mix(col,C1,clamp(heat*(.75+K*.25),0.,1.));",
  " float flick=.82+.12*sin(T*1.7)+.06*sin(T*4.3+1.);",
  " float gl2=glow*glow*.5*(flick+K*.55);",
  // a soft warm light follows the cursor
  " vec2 m=(M-.5*R)/R.y;float md=dot(p-m,p-m);",
  " float cur=(.11+.07*D)*exp(-md*8.);",
  // rising embers in two depths, each cell lights up for part of its way up
  " float emb=0.;",
  " for(int L=0;L<2;L++){float fl=float(L);",
  "  float sc=14.+fl*12.;",
  "  vec2 sp=p*sc;sp.y-=T*(.55+fl*.35)*sc*.06;sp.y-=S*sc*(.5+fl*.3);",
  "  sp.x+=sin(sp.y*.3+T*.6+fl*2.)*.7+sin(sp.y*.11+T*.23)*1.2;",
  "  vec2 id=floor(sp);float hs=h(id+fl*17.3);",
  "  if(hs>.9-K*.04){vec2 o=vec2(h(id+3.1),h(id+7.7))*.6+.2;float d=length(fract(sp)-o);",
  "   float tw=.5+.5*sin(T*(1.6+hs*4.)+hs*40.);",
  "   float near=.35+exp(-dot(dh,dh)*1.6)*1.1;",
  "   emb+=smoothstep(.13-fl*.03,0.,d)*tw*near*(.55+fl*.25)*(1.+K*.8);}",
  " }",
  // dark: light is added like real glow; light theme: colour is painted over the page
  " vec3 lit=col+C2*(gl2+cur)+C3*emb;",
  " vec3 painted=mix(col,C2,clamp(gl2*.6+cur*.9,0.,.62));",
  " painted=mix(painted,C3,clamp(emb*.95,0.,.9));",
  " col=mix(painted,lit,D);",
  // haze along the bottom edge, vignette, gentle tone map, dither
  " col+=C1*smoothstep(.5,-.6,p.y)*fbm3(vec2(p.x*1.5+t*2.,p.y*2.5-t))*.35;",
  " col*=1.-D*.5*pow(length((uv-.5)*vec2(1.,1.15))*1.25,2.6);",
  " col=mix(col,1.-exp(-col*1.6),D);",
  " col+=(h(gl_FragCoord.xy+fract(T*7.))-.5)*(3./255.);",
  " gl_FragColor=vec4(col,1.);}",
].join("\n");

type Palette = { c0: number[]; c1: number[]; c2: number[]; c3: number[]; c4: number[]; dark: number };

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

const LIGHT: Palette = { c0: hex("#f7f5fc"), c4: hex("#fbf3f4"), c1: hex("#ffd9c4"), c2: hex("#ff8a4c"), c3: hex("#ff6a2b"), dark: 0 };
const DARK: Palette = { c0: hex("#0d0a1a"), c4: hex("#16102a"), c1: hex("#5a2414"), c2: hex("#ff6a2b"), c3: hex("#ffb35c"), dark: 1 };

function isDark() {
  return document.documentElement.dataset.theme === "dark";
}

export function EmberSky({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [noGl, setNoGl] = useState(false);
  const calm = useCalm();
  const fallback = noGl || calm;
  const setFallback = setNoGl;

  useEffect(() => {
    const el = canvas.current;
    if (!el || calm) return;
    const gl = el.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
    if (!gl) {
      setFallback(true);
      return;
    }
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) {
      setFallback(true);
      return;
    }
    const pr = gl.createProgram()!;
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      setFallback(true);
      return;
    }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(pr, name);
    const uR = u("R"), uT = u("T"), uM = u("M"), uS = u("S"), uK = u("K"), uD = u("D");
    const uC = ["C0", "C1", "C2", "C3", "C4"].map(u);

    let palette = isDark() ? DARK : LIGHT;
    const applyPalette = () => {
      palette = isDark() ? DARK : LIGHT;
      [palette.c0, palette.c1, palette.c2, palette.c3, palette.c4].forEach((c, i) => gl.uniform3fv(uC[i], c));
      gl.uniform1f(uD, palette.dark);
    };
    applyPalette();
    const themeWatch = new MutationObserver(applyPalette);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // Low resolution keeps it cheap; the haze is soft, so upscaling is invisible
    const mobile = matchMedia("(max-width: 768px)").matches;
    const scale = mobile ? 0.35 : 0.5;
    let w = 0, hgt = 0;
    const resize = () => {
      w = Math.max(1, Math.round(el.clientWidth * scale));
      hgt = Math.max(1, Math.round(el.clientHeight * scale));
      el.width = w;
      el.height = hgt;
      gl.viewport(0, 0, w, hgt);
      gl.uniform2f(uR, w, hgt);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const mouse = { x: w * 0.7, y: hgt * 0.6, tx: w * 0.7, ty: hgt * 0.6 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) * scale;
      mouse.ty = (r.height - (e.clientY - r.top)) * scale;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let last = performance.now();
    let time = Math.random() * 100;
    let running = true;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      // Far down the page the fire is barely visible: drop to ~30 fps there
      const scroll = window.scrollY / Math.max(1, window.innerHeight);
      if (scroll > 1.6 && now - last < 32) return;
      last = now;
      time += dt;
      kick = Math.max(0, kick - dt * 0.9);
      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 5);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 5);
      gl.uniform1f(uT, time);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.uniform1f(uS, Math.min(3, scroll));
      gl.uniform1f(uK, kick);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const onVisibility = () => {
      if (document.hidden && running) {
        cancelAnimationFrame(raf);
        running = false;
      } else if (!document.hidden && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      themeWatch.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [calm]);

  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 -z-10 ${className}`}>
      {fallback ? (
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(60% 55% at 72% 62%, color-mix(in oklab, var(--fire-2) 28%, transparent), transparent 70%), var(--bg)" }}
        />
      ) : (
        <canvas ref={canvas} className="absolute inset-0 size-full" />
      )}
    </div>
  );
}
