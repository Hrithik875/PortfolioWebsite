"use client";

/**
 * NeonReveal: WebGL GPU-accelerated replica of the React Bits "Neon Reveal" background.
 *
 * Replicates the exact visual appearance, color progression, and choreography
 * from the reference video:
 *  1. Crisp, realistic warm amber hairline outline of each glass tube visible while off.
 *  2. Ignition: spark ignites at vertical tube center and stutters/flickers.
 *  3. Growth & Sweep: active lit segment expands smoothly outward along the tube;
 *     theatrical fan beam sweeps horizontally across the container toward center
 *     and blooms into the rich crimson, fuchsia, and deep velvet plum-wine gradient.
 *  4. Settle & Hum: smooth organic breathing pulse at steady state.
 *  5. Interactive click: collapse to spark dot and re-ignite.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

export type NeonDirection = "down" | "up" | "left" | "right";
export type NeonEasing = "out" | "smooth" | "gentle" | "linear";

export interface NeonRevealHandle {
  replay: () => void;
}

export interface NeonRevealProps {
  colors?: [string, string];
  backgroundColor?: string;
  direction?: NeonDirection;
  expandFrom?: "center" | "left" | "right";
  trigger?: "mount" | "inView" | "manual";
  revealDelay?: number;
  revealDuration?: number;
  easing?: NeonEasing;
  thickness?: number;
  glow?: number;
  spill?: number;
  reach?: number;
  intensity?: number;
  feather?: number;
  inset?: number;
  length?: number;
  mirrored?: boolean;
  hum?: number;
  flicker?: number;
  interactive?: boolean;
  intro?: boolean;
  paused?: boolean;
  dpr?: number;
  scrollThreshold?: number;
  onStart?: () => void;
  onComplete?: () => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/* ───────────────────────── Helpers ───────────────────────── */

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};

const EASE: Record<NeonEasing, (t: number) => number> = {
  out: (t) => 1 - Math.pow(1 - clamp(t), 3),
  smooth: (t) => smooth(t),
  gentle: (t) => Math.sin((clamp(t) * Math.PI) / 2),
  linear: (t) => clamp(t),
};

type RGB = [number, number, number];

function parseColorToUnit(input: string): RGB {
  let h = input.trim();
  if (h.startsWith("#")) {
    h = h.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h.slice(0, 6), 16);
    if (!Number.isNaN(n)) {
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
  }
  const m = h.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((s) => parseFloat(s));
    return [(p[0] || 0) / 255, (p[1] || 0) / 255, (p[2] || 0) / 255];
  }
  return [0, 0, 0];
}

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function stutter(ms: number, span: number, amount: number): number {
  const p = clamp(ms / span);
  if (amount <= 0) return smooth(p);
  const step = Math.floor(ms / 46);
  const on = hash(step * 1.37 + 5.1) < Math.pow(p, 0.7) * 0.9 + 0.05;
  const raw = on ? 0.6 + 0.4 * hash(step + 9.2) : 0.04;
  const forced = smooth((p - 0.8) / 0.2);
  return lerp(lerp(smooth(p), raw, amount), 1, forced);
}

/* ───────────────────────── WebGL Shaders ───────────────────────── */

const VS_SOURCE = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FS_SOURCE = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec3 u_tube_color;
uniform vec3 u_light_color;
uniform vec3 u_bg_color;
uniform float u_inset;
uniform float u_tube_len;
uniform float u_lit_len;
uniform float u_y_center;
uniform float u_tube_level;
uniform float u_light_level;
uniform float u_sweep;
uniform float u_mirrored;
uniform float u_direction; // 0: right (left tube), 1: left (right tube), 2: down, 3: up
uniform float u_glow;
uniform float u_spill;
uniform float u_reach;
uniform float u_time;

// Color ramp matching the reference video
vec3 get_ramp(float I) {
  vec3 c_bg = u_bg_color;
  vec3 c_wine = vec3(u_light_color.r * 0.27, 0.0, u_light_color.b * 0.35); // #440026 deep wine
  vec3 c_fuchsia = vec3(u_light_color.r * 0.67, 0.0, u_light_color.b * 0.58); // #AA0041 vivid fuchsia
  vec3 c_crimson = u_light_color; // #FF4D6D radiant crimson
  vec3 c_coral = mix(u_light_color, u_tube_color, 0.42); // warm coral
  vec3 c_peach = u_tube_color; // #FFD3A8 golden peach
  vec3 c_core = vec3(1.0, 0.996, 0.90); // #FFFDE4 incandescent cream

  if (I < 0.12) {
    float f = clamp(I / 0.12, 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    return mix(c_bg, c_wine, f);
  } else if (I < 0.32) {
    float f = clamp((I - 0.12) / (0.32 - 0.12), 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    return mix(c_wine, c_fuchsia, f);
  } else if (I < 0.58) {
    float f = clamp((I - 0.32) / (0.58 - 0.32), 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    return mix(c_fuchsia, c_crimson, f);
  } else if (I < 0.78) {
    float f = clamp((I - 0.58) / (0.78 - 0.58), 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    return mix(c_crimson, c_coral, f);
  } else if (I < 0.92) {
    float f = clamp((I - 0.78) / (0.92 - 0.78), 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    return mix(c_coral, c_peach, f);
  } else {
    float f = clamp((I - 0.92) / (1.0 - 0.92), 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    return mix(c_peach, c_core, f);
  }
}

float calc_light_beam(vec2 pos, float posX, float sgn) {
  float dx = (pos.x - posX) * sgn;
  float dx_eff = dx < 0.0 ? -dx * 3.2 : dx;
  
  // Spotlight fan expansion: beam expands vertically as it sweeps horizontally
  float fan = dx_eff * 0.22;
  float dy = max(0.0, abs(pos.y - u_y_center) - (u_lit_len * 0.5 + fan));
  
  float rx = max(u_resolution.x * 0.55 * u_reach * u_sweep, 1.0);
  float ry = max(u_tube_len * 0.55 * max(0.20, u_sweep), 1.0);
  
  float q = sqrt(max(0.0, pow(dx_eff / rx, 1.8) + pow(dy / ry, 1.8)));
  float I = pow(clamp(1.0 - q, 0.0, 1.0), 1.35);
  return I * u_light_level * u_spill;
}

void main() {
  vec2 pos = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  
  float y_full_lo = u_y_center - u_tube_len * 0.5;
  float y_full_hi = u_y_center + u_tube_len * 0.5;
  
  float y_lo = u_y_center - u_lit_len * 0.5;
  float y_hi = u_y_center + u_lit_len * 0.5;
  
  float I_tot = 0.0;
  if (u_light_level > 0.001 && u_sweep > 0.001) {
    if (u_direction == 0.0 || u_mirrored > 0.5) {
      I_tot += calc_light_beam(pos, u_inset, 1.0);
    }
    if (u_direction == 1.0 || u_mirrored > 0.5) {
      I_tot += calc_light_beam(pos, u_resolution.x - u_inset, -1.0);
    }
    I_tot = clamp(I_tot, 0.0, 1.0);
  }
  
  vec3 color = get_ramp(I_tot);
  
  // Warm hairline glass tube color
  vec3 c_glass = vec3(0.53, 0.39, 0.29);
  
  // Left tube
  if (u_direction == 0.0 || u_mirrored > 0.5) {
    float dx_t = abs(pos.x - u_inset);
    float dy_full = max(0.0, max(y_full_lo - pos.y, pos.y - y_full_hi));
    float d_glass = sqrt(dx_t * dx_t + dy_full * dy_full);
    float glass_val = exp(-d_glass / 1.5) * 0.28;
    color = max(color, c_glass * glass_val);
    
    if (u_tube_level > 0.005) {
      float dy_lit = max(0.0, max(y_lo - pos.y, pos.y - y_hi));
      float d_lit = sqrt(dx_t * dx_t + dy_lit * dy_lit);
      
      float aura = exp(-d_lit / (18.0 * u_glow)) * 0.40 * u_tube_level;
      float plasma = exp(-d_lit / (4.8 * u_glow)) * 0.95 * u_tube_level;
      float filament = exp(-d_lit / 1.5) * 1.0 * u_tube_level;
      
      vec3 c_tube_glow = u_light_color * aura + u_tube_color * plasma + vec3(1.0, 0.996, 0.90) * filament;
      color = max(color, c_tube_glow);
    }
  }
  
  // Right tube
  if (u_direction == 1.0 || u_mirrored > 0.5) {
    float dx_t = abs(pos.x - (u_resolution.x - u_inset));
    float dy_full = max(0.0, max(y_full_lo - pos.y, pos.y - y_full_hi));
    float d_glass = sqrt(dx_t * dx_t + dy_full * dy_full);
    float glass_val = exp(-d_glass / 1.5) * 0.28;
    color = max(color, c_glass * glass_val);
    
    if (u_tube_level > 0.005) {
      float dy_lit = max(0.0, max(y_lo - pos.y, pos.y - y_hi));
      float d_lit = sqrt(dx_t * dx_t + dy_lit * dy_lit);
      
      float aura = exp(-d_lit / (18.0 * u_glow)) * 0.40 * u_tube_level;
      float plasma = exp(-d_lit / (4.8 * u_glow)) * 0.95 * u_tube_level;
      float filament = exp(-d_lit / 1.5) * 1.0 * u_tube_level;
      
      vec3 c_tube_glow = u_light_color * aura + u_tube_color * plasma + vec3(1.0, 0.996, 0.90) * filament;
      color = max(color, c_tube_glow);
    }
  }
  
  // High-frequency triangular dither noise to eliminate gradient banding
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  color = clamp(color + vec3(dither), 0.0, 1.0);
  
  fragColor = vec4(color, 1.0);
}
`;

/* ───────────────────────── Component ───────────────────────── */

const IGNITE_MS = 460;
const CUT_MS = 240;

type Phase = "off" | "run" | "cut";

export const NeonReveal = forwardRef<NeonRevealHandle, NeonRevealProps>(function NeonReveal(props, ref) {
  const {
    colors = ["#FFD3A8", "#FF4D6D"],
    backgroundColor = "#000000",
    direction = "right",
    trigger = "mount",
    glow = 0.8,
    spill = 1,
    reach = 1,
    inset = 35,
    length = 0.89,
    mirrored = true,
    hum = 0.8,
    interactive = true,
    paused = false,
    scrollThreshold = 0.3,
    children,
    className,
    style,
  } = props;

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const S = useRef({
    phase: "off" as Phase,
    t0: 0,
    clock: 0,
    kick: -1e9,
    started: false,
    done: false,
    visible: true,
    last: 0,
    w: 0,
    h: 0,
    dpr: 1,
    raf: 0,
    gl: null as WebGL2RenderingContext | null,
    program: null as WebGLProgram | null,
    uniforms: {} as Record<string, WebGLUniformLocation | null>,
  });

  const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const play = useCallback(() => {
    const s = S.current;
    s.phase = "run";
    s.t0 = s.clock;
    s.started = false;
    s.done = false;
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cutThenPlay = () => {
    const s = S.current;
    if (s.phase === "off") return play();
    s.phase = "cut";
    s.t0 = s.clock;
    wake();
  };

  useImperativeHandle(ref, () => ({ replay: () => cutThenPlay() }), []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── WebGL Context Setup ── */
  const initGL = (canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) return false;

    const createShader = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("NeonReveal Shader Error:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = createShader(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("NeonReveal Program Error:", gl.getProgramInfoLog(prog));
      return false;
    }

    const posAttr = gl.getAttribLocation(prog, "position");
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // Single full-screen triangle covering [-1, -1] to [3, 3]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uniformNames = [
      "u_resolution",
      "u_tube_color",
      "u_light_color",
      "u_bg_color",
      "u_inset",
      "u_tube_len",
      "u_lit_len",
      "u_y_center",
      "u_tube_level",
      "u_light_level",
      "u_sweep",
      "u_mirrored",
      "u_direction",
      "u_glow",
      "u_spill",
      "u_reach",
      "u_time",
    ];

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of uniformNames) {
      uniforms[name] = gl.getUniformLocation(prog, name);
    }

    S.current.gl = gl;
    S.current.program = prog;
    S.current.uniforms = uniforms;
    return true;
  };

  /* ── Draw Frame ── */
  const draw = (dtMs: number) => {
    const s = S.current;
    const P = propsRef.current;
    const gl = s.gl;
    if (!gl || !s.program || !s.w || !s.h) return;

    if (!P.paused) s.clock += dtMs;
    const W = s.w;
    const H = s.h;
    const dprNow = s.dpr;

    const tubeRGB = parseColorToUnit((P.colors ?? colors)[0]);
    const lightRGB = parseColorToUnit((P.colors ?? colors)[1]);
    const bgRGB = parseColorToUnit(P.backgroundColor ?? backgroundColor);

    const D = P.revealDelay ?? 0;
    const T = Math.max(50, P.revealDuration ?? 2600);
    const ease = EASE[P.easing ?? "out"] ?? EASE.out;
    const flickerAmt = clamp(P.flicker ?? 0.75);
    const ign = flickerAmt > 0 ? IGNITE_MS : 160;

    let tubeLevel = 0;
    let grow = 0;
    let sweep = 0;
    let lightLevel = 0;
    const staticFrame = reduced() || P.intro === false;

    if (staticFrame && s.phase !== "cut") {
      tubeLevel = grow = sweep = lightLevel = 1;
      if (!s.started) {
        s.started = true;
        P.onStart?.();
      }
      if (!s.done) {
        s.done = true;
        P.onComplete?.();
      }
    } else if (s.phase === "run") {
      const el = s.clock - s.t0;
      if (el >= D) {
        if (!s.started) {
          s.started = true;
          P.onStart?.();
        }
        const e = el - D;
        if (e < ign) {
          tubeLevel = stutter(e, ign, flickerAmt);
        } else {
          tubeLevel = 1;
          const tt = (e - ign) / T;
          grow = ease(clamp(tt));
          // Fan sweeps horizontally over the initial ~35% of the duration
          sweep = ease(clamp(tt / 0.35));
          // Light beam catches with a subtle organic stutter
          lightLevel = stutter(e - ign, 380, flickerAmt * 0.75);
          if (tt >= 1 && !s.done) {
            s.done = true;
            P.onComplete?.();
          }
          if (tt >= 1) {
            grow = 1;
            sweep = 1;
            lightLevel = 1;
          }
        }
      }
    } else if (s.phase === "cut") {
      const e = (s.clock - s.t0) / CUT_MS;
      const f = 1 - smooth(e);
      tubeLevel = f;
      grow = f;
      sweep = f;
      lightLevel = f * f;
      if (e >= 1) {
        s.phase = "off";
        play();
        return;
      }
    }

    // Click during reveal stutters
    const sinceKick = s.clock - s.kick;
    if (sinceKick < 420 && s.phase === "run") {
      const k = stutter(sinceKick, 420, 1);
      tubeLevel *= lerp(0.15, 1, k);
      lightLevel *= lerp(0.1, 1, k);
    }

    // Subtle breathing pulse hum at steady state
    const humAmt = clamp(P.hum ?? 0.8, 0, 2);
    const breathe = 0.5 + 0.5 * Math.sin((s.clock / 1000) * 2.1) * 0.8 + 0.1 * Math.sin((s.clock / 1000) * 5.3);
    tubeLevel *= 1 - 0.05 * humAmt * breathe;
    lightLevel *= 1 - 0.04 * humAmt * breathe;

    // Tube geometry calculations
    const fullTubeLen = H * clamp(P.length ?? 0.89, 0.1, 1.0) * dprNow;
    const sparkLen = Math.max(28 * dprNow, fullTubeLen * 0.05);
    const activeLitLen = sparkLen + (fullTubeLen - sparkLen) * grow;
    const yCenter = (H * 0.5) * dprNow;
    const insetPx = (P.inset ?? 35) * dprNow;

    const dirVal = P.direction === "left" ? 1.0 : 0.0;
    const isMirrored = P.mirrored !== false ? 1.0 : 0.0;

    gl.viewport(0, 0, Math.round(W * dprNow), Math.round(H * dprNow));
    gl.useProgram(s.program);

    const u = s.uniforms;
    gl.uniform2f(u.u_resolution, W * dprNow, H * dprNow);
    gl.uniform3f(u.u_tube_color, tubeRGB[0], tubeRGB[1], tubeRGB[2]);
    gl.uniform3f(u.u_light_color, lightRGB[0], lightRGB[1], lightRGB[2]);
    gl.uniform3f(u.u_bg_color, bgRGB[0], bgRGB[1], bgRGB[2]);
    gl.uniform1f(u.u_inset, insetPx);
    gl.uniform1f(u.u_tube_len, fullTubeLen);
    gl.uniform1f(u.u_lit_len, activeLitLen);
    gl.uniform1f(u.u_y_center, yCenter);
    gl.uniform1f(u.u_tube_level, tubeLevel);
    gl.uniform1f(u.u_light_level, lightLevel);
    gl.uniform1f(u.u_sweep, sweep);
    gl.uniform1f(u.u_mirrored, isMirrored);
    gl.uniform1f(u.u_direction, dirVal);
    gl.uniform1f(u.u_glow, clamp(P.glow ?? 0.8, 0.1, 3.0));
    gl.uniform1f(u.u_spill, clamp(P.spill ?? 1.0, 0.1, 3.0));
    gl.uniform1f(u.u_reach, clamp(P.reach ?? 1.0, 0.1, 3.0));
    gl.uniform1f(u.u_time, s.clock / 1000);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* ── Animation Loop ── */
  const loop = (now: number) => {
    const s = S.current;
    s.raf = 0;
    const dt = s.last ? Math.min(64, now - s.last) : 16;
    s.last = now;
    draw(dt);
    if (s.visible && !propsRef.current.paused) s.raf = requestAnimationFrame(loop);
    else s.last = 0;
  };

  function wake() {
    const s = S.current;
    if (!s.raf) s.raf = requestAnimationFrame(loop);
  }

  /* ── Resize & Initialization ── */
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    if (!initGL(canvas)) {
      console.warn("NeonReveal: WebGL2 context initialization failed");
      return;
    }

    const resize = () => {
      const r = root.getBoundingClientRect();
      const d = Math.min(window.devicePixelRatio || 1, propsRef.current.dpr ?? 2);
      const s = S.current;
      s.w = Math.max(1, r.width);
      s.h = Math.max(1, r.height);
      s.dpr = d;
      canvas.width = Math.round(s.w * d);
      canvas.height = Math.round(s.h * d);
      canvas.style.width = `${s.w}px`;
      canvas.style.height = `${s.h}px`;
      draw(0);
      wake();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const state = S.current;
    return () => {
      ro.disconnect();
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Triggers ── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const s = S.current;
    if (trigger === "mount") {
      play();
      return;
    }
    if (trigger === "inView") {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            s.visible = e.isIntersecting;
            if (e.isIntersecting) {
              if (s.phase === "off") play();
              wake();
            }
          }
        },
        { threshold: scrollThreshold }
      );
      io.observe(root);
      return () => io.disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, scrollThreshold]);

  /* Pause loop when scrolled offscreen */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || trigger === "inView") return;
    const io = new IntersectionObserver(([e]) => {
      S.current.visible = e.isIntersecting;
      if (e.isIntersecting) wake();
    });
    io.observe(root);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  /* Re-render when props change */
  useEffect(() => {
    draw(0);
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, colors[0], colors[1], backgroundColor, direction, mirrored, glow, spill, reach, inset, length, hum]);

  /* ── Click interaction ── */
  const onClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    const target = e.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select,summary,[role='button'],[role='link']")) return;
    const s = S.current;
    if (s.phase === "run" && !s.done) {
      s.kick = s.clock;
      wake();
    } else if (s.phase === "off") {
      play();
    } else {
      cutThenPlay();
    }
  };

  return (
    <div
      ref={rootRef}
      className={className}
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor,
        cursor: interactive ? "pointer" : undefined,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          pointerEvents: "none",
        }}
      />
      {children !== undefined && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
});

NeonReveal.displayName = "NeonReveal";
export default NeonReveal;
