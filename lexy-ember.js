/* ==========================================================
   lexy-ember.js — «огонёк» на главной (порт EmberSky из GoLexi)
   WebGL-фон: дымка жара + летящие искры. Реагирует на курсор,
   скролл и вспышки (LexyEmber.kick()). Палитра под тёмную тему.
   Без React. Фолбэк — градиент, если нет WebGL / «меньше движения».
   ========================================================== */
(function (w, d) {
  "use strict";
  if (w.LexyEmber) return;

  var VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  var FS = [
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
    " vec2 hp=vec2(asp>1.1?asp*.24:0.,-.16+S*1.05);",
    " vec2 dh=p-hp;",
    " vec2 q=vec2(fbm(p*1.3+vec2(0.,-t*2.2)),fbm(p*1.3+vec2(4.2,1.3)+vec2(0.,-t*1.7)));",
    " float f=fbm(p*1.7+2.3*q+vec2(t*.4,-t*3.2));",
    " float glow=exp(-dot(dh*vec2(1.5,.95),dh*vec2(1.5,.95))*2.4);",
    " float heat=smoothstep(.38,1.,f)*(.3+glow*1.25);",
    " vec3 col=mix(C0,C4,smoothstep(-.6,.7,p.y));",
    " col=mix(col,C1,clamp(heat*(.75+K*.25),0.,1.));",
    " float flick=.82+.12*sin(T*1.7)+.06*sin(T*4.3+1.);",
    " float gl2=glow*glow*.5*(flick+K*.55);",
    " vec2 m=(M-.5*R)/R.y;float md=dot(p-m,p-m);",
    " float cur=(.11+.07*D)*exp(-md*8.);",
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
    " vec3 lit=col+C2*(gl2+cur)+C3*emb;",
    " vec3 painted=mix(col,C2,clamp(gl2*.6+cur*.9,0.,.62));",
    " painted=mix(painted,C3,clamp(emb*.95,0.,.9));",
    " col=mix(painted,lit,D);",
    " col+=C1*smoothstep(.5,-.6,p.y)*fbm3(vec2(p.x*1.5+t*2.,p.y*2.5-t))*.35;",
    " col*=1.-D*.5*pow(length((uv-.5)*vec2(1.,1.15))*1.25,2.6);",
    " col=mix(col,1.-exp(-col*1.6),D);",
    " col+=(h(gl_FragCoord.xy+fract(T*7.))-.5)*(3./255.);",
    " gl_FragColor=vec4(col,1.);}"
  ].join("\n");

  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; }); }
  var LIGHT = { c0: hex("#f7f5fc"), c4: hex("#fbf3f4"), c1: hex("#ffd9c4"), c2: hex("#ff8a4c"), c3: hex("#ff6a2b"), dark: 0 };
  var DARK = { c0: hex("#0d0a1a"), c4: hex("#16102a"), c1: hex("#5a2414"), c2: hex("#ff6a2b"), c3: hex("#ffb35c"), dark: 1 };
  function isDark() { return d.documentElement.getAttribute("data-theme") === "dark"; }
  function reduced() { try { return w.matchMedia("(prefers-reduced-motion:reduce)").matches; } catch (e) { return false; } }

  var kick = 0;
  function kickEmbers(amount) { kick = Math.min(2.2, kick + (amount || 1)); }
  function fallback(el) {
    el.style.background = "radial-gradient(60% 55% at 72% 62%,rgba(255,138,76,.28),transparent 70%),var(--mist,#f7f5fc)";
  }

  function mount(el) {
    if (!el || el._ember) return;
    el._ember = 1;
    if (d.documentElement.getAttribute("data-ember-off") === "1" || reduced()) { fallback(el); return; }
    var gl = el.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
    if (!gl) { fallback(el); return; }
    function compile(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { fallback(el); return; }
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { fallback(el); return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var u = function (n) { return gl.getUniformLocation(pr, n); };
    var uR = u("R"), uT = u("T"), uM = u("M"), uS = u("S"), uK = u("K"), uD = u("D");
    var uC = ["C0", "C1", "C2", "C3", "C4"].map(u);
    var palette;
    function applyPalette() {
      palette = isDark() ? DARK : LIGHT;
      [palette.c0, palette.c1, palette.c2, palette.c3, palette.c4].forEach(function (c, i) { gl.uniform3fv(uC[i], c); });
      gl.uniform1f(uD, palette.dark);
    }
    applyPalette();
    var tw = new MutationObserver(applyPalette);
    tw.observe(d.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    var mobile = false; try { mobile = w.matchMedia("(max-width:768px)").matches; } catch (e) {}
    var scale = mobile ? 0.35 : 0.5, cw = 0, ch = 0;
    function resize() {
      cw = Math.max(1, Math.round(el.clientWidth * scale));
      ch = Math.max(1, Math.round(el.clientHeight * scale));
      el.width = cw; el.height = ch;
      gl.viewport(0, 0, cw, ch);
      gl.uniform2f(uR, cw, ch);
    }
    resize();
    var ro = new ResizeObserver(resize); ro.observe(el);

    var mouse = { x: cw * 0.7, y: ch * 0.6, tx: cw * 0.7, ty: ch * 0.6 };
    function onMove(e) {
      var r = el.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) * scale;
      mouse.ty = (r.height - (e.clientY - r.top)) * scale;
    }
    w.addEventListener("pointermove", onMove, { passive: true });

    var raf = 0, last = performance.now(), time = Math.random() * 100, running = true;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000);
      var scroll = (w.scrollY || 0) / Math.max(1, w.innerHeight);
      if (scroll > 1.6 && now - last < 32) return;
      last = now; time += dt;
      kick = Math.max(0, kick - dt * 0.9);
      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 5);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 5);
      gl.uniform1f(uT, time);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.uniform1f(uS, Math.min(3, scroll));
      gl.uniform1f(uK, kick);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function onVis() {
      if (d.hidden && running) { cancelAnimationFrame(raf); running = false; }
      else if (!d.hidden && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    d.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);
    el._emberStop = function () { cancelAnimationFrame(raf); tw.disconnect(); ro.disconnect(); w.removeEventListener("pointermove", onMove); d.removeEventListener("visibilitychange", onVis); };
  }

  function css() {
    if (d.getElementById("lexy-ember-css")) return;
    var s = d.createElement("style"); s.id = "lexy-ember-css";
    s.textContent = ".hero{position:relative}.hero>.lexy-ember{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;pointer-events:none;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,#000 56%,rgba(0,0,0,.45) 80%,transparent 98%);mask-image:linear-gradient(to bottom,#000 56%,rgba(0,0,0,.45) 80%,transparent 98%)}.hero .wrap{position:relative;z-index:1}";
    d.head.appendChild(s);
  }
  function inject() {
    var hosts = d.querySelectorAll(".hero");
    if (!hosts.length) return;
    css();
    [].forEach.call(hosts, function (hero) {
      if (hero.querySelector(":scope > .lexy-ember")) return;
      var c = d.createElement("canvas"); c.className = "lexy-ember"; c.setAttribute("aria-hidden", "true");
      hero.insertBefore(c, hero.firstChild);
      mount(c);
    });
    var m = d.querySelector(".mascot");
    if (m && !m._emberKick) { m._emberKick = 1; m.addEventListener("click", function () { kickEmbers(1.3); }); }
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", inject); else inject();
  w.LexyEmber = { mount: mount, kick: kickEmbers, inject: inject };
})(window, document);
