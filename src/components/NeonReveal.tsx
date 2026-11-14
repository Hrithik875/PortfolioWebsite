"use client";

/**
 * NeonReveal: WebGL2 neon-tube reveal background.
 *
 * The look is reverse-engineered from the reference recording, frame by frame:
 *  - Spectrum: black → plum → wine → crimson → coral/salmon → peach → cream,
 *    sampled from the reference and stored as a log-intensity colour ramp.
 *  - Light spread: each tube throws a fan beam. Its vertical profile is the tube
 *    blurred by a Gaussian whose width grows with distance, with a ~1/distance
 *    falloff. That produces the lens-shaped lobes that converge on the tube tips.
 *  - Behind the tube: a dimmer reflection of the same light that fades smoothly,
 *    so front and back blend across the tube with no hard edge.
 *  - Tube: white-hot core, yellow rim, long amber aura (a pure radial profile),
 *    and a faint warm-gray glass hairline while the tube is off.
 *  - Choreography (measured): cut (~220ms) → dark hold → 30px spark that flickers
 *    for ~0.5s → cubic ease-out growth over 2.6s → slow breathing hum.
 *  - Geometry scales with tube length, so the picture is the same at any size.
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
  length?: number | { mobile?: number; desktop?: number };
  mirrored?: boolean;
  hum?: number;
  flicker?: number;
  cornerBlur?: number;
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
const smooth = (t: number) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};

// "out" is the reference curve (cubic ease-out, measured fit: exponent 2.97).
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

/* 3x3 palette remap: sends the default (peach, crimson) pair to the requested
   pair and keeps black fixed. Identity for the default colours. */
const DEFAULT_TUBE: RGB = [1, 211 / 255, 168 / 255];
const DEFAULT_LIGHT: RGB = [1, 77 / 255, 109 / 255];

type V3 = [number, number, number];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
// matrices are stored as three column vectors
type Cols = [V3, V3, V3];
const mulMat = (A: Cols, B: Cols): Cols =>
  B.map((c) => [
    A[0][0] * c[0] + A[1][0] * c[1] + A[2][0] * c[2],
    A[0][1] * c[0] + A[1][1] * c[1] + A[2][1] * c[2],
    A[0][2] * c[0] + A[1][2] * c[1] + A[2][2] * c[2],
  ]) as Cols;
function invMat(m: Cols): Cols | null {
  const [a, b, c] = m;
  const r0 = cross(b, c);
  const r1 = cross(c, a);
  const r2 = cross(a, b);
  const det = a[0] * r0[0] + a[1] * r0[1] + a[2] * r0[2];
  if (Math.abs(det) < 1e-6) return null;
  return [
    [r0[0] / det, r1[0] / det, r2[0] / det],
    [r0[1] / det, r1[1] / det, r2[1] / det],
    [r0[2] / det, r1[2] / det, r2[2] / det],
  ];
}
function paletteMatrix(tube: RGB, light: RGB): Float32Array {
  const same = (a: RGB, b: RGB) => a.every((v, i) => Math.abs(v - b[i]) < 1e-4);
  const I = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  if (same(tube, DEFAULT_TUBE) && same(light, DEFAULT_LIGHT)) return I;
  const d: Cols = [DEFAULT_TUBE, DEFAULT_LIGHT, norm(cross(DEFAULT_TUBE, DEFAULT_LIGHT))];
  const t: Cols = [tube, light, norm(cross(tube, light))];
  const inv = invMat(d);
  if (!inv) return I;
  const m = mulMat(t, inv);
  return new Float32Array([...m[0], ...m[1], ...m[2]]);
}

/* ───────────────────────── Shaders ───────────────────────── */

const VS_SOURCE = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FS_SOURCE = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  u_res;      // container size in CSS px
uniform float u_dpr;
uniform float u_inset;    // tube axis distance from container edge (CSS px)
uniform float u_yc;       // vertical centre of tubes (CSS px, top-down)
uniform float u_full;     // full tube length (CSS px)
uniform float u_lit;      // currently lit length (CSS px)
uniform float u_level;    // tube drive level 0..1
uniform float u_sc;       // geometry scale (u_full / reference tube length)
uniform float u_left;     // 1 = left tube present
uniform float u_right;    // 1 = right tube present
uniform float u_glow;     // aura gain
uniform float u_beam;     // beam gain (log10 offset applied)
uniform float u_reach;    // horizontal reach multiplier
uniform float u_hair;     // glass hairline visibility
uniform float u_cornerBlur; // corner blur/feather strength 0..1
uniform vec3  u_bg;
uniform mat3  u_cmat;     // palette remap (identity for default colours)

/* ---- spectrum: log10(intensity) -> colour (measured from the reference) ---- */
const int NR = 28;
const float RL[NR] = float[NR](-4.5,-4.0,-3.7,-3.4,-3.3,-3.2,-3.1,-3.0,-2.9,-2.8,-2.7,-2.6,-2.5,-2.4,-2.3,-2.2,-2.1,-2.0,-1.9,-1.8,-1.7,-1.6,-1.5,-1.4,-1.3,-1.2,-1.0,-0.85);
const vec3 RC[NR] = vec3[NR](
  vec3(0,0,0)/255.0,
  vec3(5,0,2)/255.0,
  vec3(13,0,6)/255.0,
  vec3(26.4,1.3,13.3)/255.0,
  vec3(30.4,0.0,15.1)/255.0,
  vec3(37.0,0.0,19.1)/255.0,
  vec3(42.4,0.0,22.2)/255.0,
  vec3(50.5,0.0,26.7)/255.0,
  vec3(57.4,0.0,30.9)/255.0,
  vec3(66.0,0.0,34.9)/255.0,
  vec3(78.2,0.0,40.5)/255.0,
  vec3(92.2,0.0,45.8)/255.0,
  vec3(106.1,0.0,50.8)/255.0,
  vec3(122.1,0.0,55.2)/255.0,
  vec3(139.9,0.0,58.4)/255.0,
  vec3(158.2,0.0,60.9)/255.0,
  vec3(176.3,0.0,65.1)/255.0,
  vec3(190.2,0.0,70.4)/255.0,
  vec3(201.7,19.4,75.4)/255.0,
  vec3(210.3,47.0,76.7)/255.0,
  vec3(216.8,74.4,77.3)/255.0,
  vec3(219.7,102.9,81.6)/255.0,
  vec3(220.3,130.4,94.1)/255.0,
  vec3(220.9,154.8,112.8)/255.0,
  vec3(225.2,175.5,131.8)/255.0,
  vec3(232.7,192.8,148.0)/255.0,
  vec3(249.1,221.8,162.8)/255.0,
  vec3(252,230,174)/255.0
);

vec3 ramp(float l) {
  if (l <= RL[0]) return RC[0];
  for (int i = 1; i < NR; i++) {
    if (l < RL[i]) {
      float f = (l - RL[i - 1]) / (RL[i] - RL[i - 1]);
      return mix(RC[i - 1], RC[i], f);
    }
  }
  return RC[NR - 1];
}

/* ---- tube radial profile: distance from the lit axis -> colour ---- */
const int NT = 19;
const float TD[NT] = float[NT](0.5,1.5,2.5,3.5,4.5,5.5,6.5,8.5,10.5,14.5,18.5,22.5,26.5,33.5,45.0,60.0,80.0,110.0,150.0);
const vec3 TC[NT] = vec3[NT](
  vec3(255.0,252.0,237.0)/255.0,
  vec3(255.0,246.0,150.0)/255.0,
  vec3(236.0,199.0,77.0)/255.0,
  vec3(194.0,141.0,30.0)/255.0,
  vec3(171.0,118.0,9.0)/255.0,
  vec3(158.0,107.0,8.0)/255.0,
  vec3(150.0,99.0,5.0)/255.0,
  vec3(136.0,88.0,4.0)/255.0,
  vec3(121.0,75.0,5.0)/255.0,
  vec3(97.0,57.0,3.0)/255.0,
  vec3(80.0,46.0,3.0)/255.0,
  vec3(66.0,37.0,2.0)/255.0,
  vec3(58.0,30.0,1.0)/255.0,
  vec3(46.0,24.0,0.0)/255.0,
  vec3(40.0,19.0,0.0)/255.0,
  vec3(30.0,11.0,0.0)/255.0,
  vec3(18.0,5.0,0.0)/255.0,
  vec3(6.0,1.0,0.0)/255.0,
  vec3(0.0,0.0,0.0)
);

vec3 tubeProfile(float d) {
  if (d <= TD[0]) return TC[0];
  for (int i = 1; i < NT; i++) {
    if (d < TD[i]) {
      float f = (d - TD[i - 1]) / (TD[i] - TD[i - 1]);
      return mix(TC[i - 1], TC[i], f);
    }
  }
  return TC[NT - 1];
}

/* ---- error function (Abramowitz & Stegun 7.1.26) ---- */
float erf_(float x) {
  float s = x < 0.0 ? -1.0 : 1.0;
  x = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * x);
  float y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-x * x);
  return s * y;
}

/* ---- fan beam: tube extent blurred by a Gaussian that widens with distance ----
   all lengths in reference pixels (CSS px / u_sc) */
const float B_D0 = 83.4124;
const float B_S  = 1.0954;
const float B_KAP = 0.5902;
const float B_SIG0 = 11.5536;
const float B_SIG1 = 0.0823;
const float B_G = -0.1322;
const float B_EX = 3.2038;
const float B_GAM = 0.8054;
const float B_ABR = 0.9569;
const float B_LA = -2.3103;
const float BACK_GAIN = 0.55;  // brightness right behind the tube (relative to the front)
const float BACK_FALL = 34.0;  // fade distance behind the tube (reference px)

float beamI(float dx, float yp, float hh) {
  dx = max(dx, 0.0);
  float sig = B_KAP * pow(dx + 1.0, B_GAM) * pow(60.0, 1.0 - B_GAM) + B_SIG0 + B_SIG1 * hh;
  float P = 0.5 * (erf_((hh - yp) / (1.41421356 * sig)) + erf_((hh + yp) / (1.41421356 * sig)));
  float A = pow(1.0 + pow(dx / B_D0, B_ABR), -B_S / B_ABR) * pow(hh / 200.0, B_G);
  return A * pow(max(P, 0.0), B_EX);
}

vec3 levelScale(vec3 c, float l) {
  return vec3(c.r * l, c.g * pow(l, 1.45), c.b * pow(l, 1.9));
}

void main() {
  vec2 p = gl_FragCoord.xy / u_dpr;
  p.y = u_res.y - p.y;

  float hhFull = u_full * 0.5;
  float hhLit  = max(u_lit * 0.5, 0.0);
  float yp = p.y - u_yc;
  float ay = abs(yp);

  float xl = p.x - u_inset;               // inward distance from left tube
  float xr = (u_res.x - u_inset) - p.x;   // inward distance from right tube

  // ---- corner feather: smooth fade near the top/bottom AND left/right edges ----
  // The vertical fade rolls off over the outer 18% of the half-height.
  // The horizontal (corner-only) fade rolls off over the outer 20% of inset
  // so only the tight corner region is blended, not the whole tube reach.
  float fadeRange = u_cornerBlur * 0.22;  // fraction of half-height used as fade band
  float halfH = u_res.y * 0.5;
  float topDist  = p.y / halfH;                       // 0 at top, 1 at centre
  float botDist  = (u_res.y - p.y) / halfH;           // 0 at bottom, 1 at centre
  float vFade = smoothstep(0.0, fadeRange, min(topDist, botDist));

  // horizontal corner fade: only squeeze near the wall-side corners
  float leftDist  = clamp(xl / (u_inset * 1.5 + 1.0), 0.0, 1.0);
  float rightDist = clamp(xr / (u_inset * 1.5 + 1.0), 0.0, 1.0);
  // corner mask: 1 at centre/far, 0 at the tube-tip corners
  // We only want to fade where both vertical AND horizontal are close to edge
  float lCorner = smoothstep(0.0, fadeRange * 0.7, min(topDist, botDist)) +
                  smoothstep(0.0, 0.5, leftDist);
  float rCorner = smoothstep(0.0, fadeRange * 0.7, min(topDist, botDist)) +
                  smoothstep(0.0, 0.5, rightDist);
  float hFade = clamp(min(lCorner, rCorner) * 0.5, 0.0, 1.0);

  float cornerFade = mix(1.0, min(vFade, mix(1.0, hFade, 0.5)), u_cornerBlur);

  // beam intensity (sum of both tubes) in reference px
  float Itot = 0.0;
  float hhn = hhLit / u_sc;
  float ypn = yp / u_sc;
  if (u_level > 0.0005 && hhLit > 0.5) {
    if (u_left  > 0.5) Itot += beamI(xl / (u_sc * u_reach), ypn, hhn) * smoothstep(2.5, 6.0, xl);
    if (u_right > 0.5) Itot += beamI(xr / (u_sc * u_reach), ypn, hhn) * smoothstep(2.5, 6.0, xr);
    // light behind the tube: the same light, dimmer, fading smoothly with distance,
    // so front and back blend across the tube instead of meeting at a hard edge
    float bl = 0.0;
    float nearI = beamI(6.0 / u_reach, ypn, hhn);
    if (u_left  > 0.5 && xl < 0.0) bl += nearI * exp(-(-xl) / (BACK_FALL * u_sc)) * smoothstep(-1.0, 3.0, -xl);
    if (u_right > 0.5 && xr < 0.0) bl += nearI * exp(-(-xr) / (BACK_FALL * u_sc)) * smoothstep(-1.0, 3.0, -xr);
    Itot += bl * BACK_GAIN;
  }

  // Apply corner fade to beam intensity before the ramp lookup
  Itot *= cornerFade;

  float lI = log2(max(Itot, 1e-9)) * 0.30102999566 + B_LA * 0.4342944819 + u_beam
           + log2(max(u_level, 1e-6)) * 0.30102999566;
  vec3 col = (Itot > 1e-9) ? ramp(lI) : vec3(0.0);

  // tubes
  for (int k = 0; k < 2; k++) {
    float present = (k == 0) ? u_left : u_right;
    if (present < 0.5) continue;
    float dxa = abs(p.x - ((k == 0) ? u_inset : (u_res.x - u_inset)));

    // distance to lit segment
    float over = max(0.0, ay - hhLit);
    float dseg = sqrt(dxa * dxa + over * over);
    float cap = clamp(over / 2.0, 0.0, 1.0);

    // glass hairline (always there, full length)
    float overF = max(0.0, ay - hhFull);
    float endF = 1.0 - smoothstep(0.0, 2.0, overF);
    float gl = exp(-dxa * dxa / (2.0 * 1.8 * 1.8)) * endF;
    col = max(col, vec3(59.0, 50.0, 46.0) / 255.0 * 1.04 * gl * u_hair * cornerFade);

    if (u_level > 0.0005 && hhLit > 0.5) {
      // lit tube: core inside segment, aura outside/around
      float inside = 1.0 - smoothstep(-0.5, 1.0, ay - hhLit);   // 1 along the lit segment
      float dLookup = mix(max(dseg + 1.2 * cap, 4.5), dxa, inside);
      vec3 tc = tubeProfile(dLookup);
      // aura gain only affects the outer halo, not the white-hot core
      float auraMask = smoothstep(3.0, 6.0, dLookup);
      tc *= mix(1.0, u_glow, auraMask);
      tc = levelScale(tc, u_level);
      // fade the tube tip glow at the corners; use a softer fade for the core (dLookup < 6)
      float tipFade = mix(cornerFade, 1.0, smoothstep(0.0, 6.0, dLookup) * (1.0 - cornerFade));
      col = max(col, tc * tipFade);
    }
  }

  col = u_cmat * col;
  col = max(col, u_bg);

  // dither to avoid banding in the dark gradients
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453)
          + fract(sin(dot(gl_FragCoord.xy + 17.0, vec2(26.651, 57.173))) * 24634.6345);
  col += (n - 1.0) / 255.0 * 0.75;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

/* ───────────────────────── Timeline (measured from the reference) ───────────────────────── */

const CUT_MS = 220; // light + tube fade out
const HOLD_MS = 260; // dark hold with only the glass hairline
const IGNITE_MS = 540; // 30px spark flickering at the tube centre
const SPARK_PX = 30; // lit length during ignition
const FLICKER_STEP_MS = 64;

type Phase = "off" | "run" | "cut";
const UNIFORMS = [
  "u_res", "u_dpr", "u_inset", "u_yc", "u_full", "u_lit", "u_level", "u_sc",
  "u_left", "u_right", "u_glow", "u_beam", "u_reach", "u_hair", "u_cornerBlur", "u_bg", "u_cmat",
] as const;

export const NeonReveal = forwardRef<NeonRevealHandle, NeonRevealProps>(function NeonReveal(props, ref) {
  const {
    colors = ["#FFD3A8", "#FF4D6D"],
    backgroundColor = "#000000ff",
    direction = "right",
    trigger = "mount",
    glow = 1,
    spill = 1,
    reach = 0.85,
    intensity = 1,
    inset = 1, // tube axis from the edge: the tube sits flush in the corner
    length,
    mirrored = true,
    hum = 1,
    interactive = true,
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
    level: 0, // smoothed tube level (gives the flicker its afterglow)
    gl: null as WebGL2RenderingContext | null,
    program: null as WebGLProgram | null,
    buffer: null as WebGLBuffer | null,
    vao: null as WebGLVertexArrayObject | null,
    uniforms: {} as Record<string, WebGLUniformLocation | null>,
  });

  const reduced = () =>
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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

  /* ── WebGL setup ── */
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

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("NeonReveal shader error:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = compile(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("NeonReveal program error:", gl.getProgramInfoLog(prog));
      return false;
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posAttr = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(prog, name);

    const s = S.current;
    s.gl = gl;
    s.program = prog;
    s.buffer = buf;
    s.vao = vao;
    s.uniforms = uniforms;
    return true;
  };

  /* ── Frame ── */
  const draw = (dtMs: number) => {
    const s = S.current;
    const P = propsRef.current;
    const gl = s.gl;
    if (!gl || !s.program || !s.w || !s.h) return;

    if (!P.paused) s.clock += dtMs;

    const cols = P.colors ?? colors;
    const tubeRGB = parseColorToUnit(cols[0]);
    const lightRGB = parseColorToUnit(cols[1]);
    const bgRGB = parseColorToUnit(P.backgroundColor ?? backgroundColor);

    const D = P.revealDelay ?? 0;
    const T = Math.max(50, P.revealDuration ?? 2600);
    const ease = EASE[P.easing ?? "out"] ?? EASE.out;
    const flickerAmt = clamp(P.flicker ?? 1);

    const isSmallDevice = (s.w > 0 ? s.w : (typeof window !== "undefined" ? window.innerWidth : 1200)) < 1024;
    const defaultLen = isSmallDevice ? 0.7 : 0.9;
    let targetLen = defaultLen;
    if (typeof P.length === "number") {
      targetLen = P.length;
    } else if (typeof P.length === "object" && P.length !== null) {
      targetLen = (isSmallDevice ? P.length.mobile : P.length.desktop) ?? defaultLen;
    } else if (typeof length === "number") {
      targetLen = length;
    } else if (typeof length === "object" && length !== null) {
      targetLen = (isSmallDevice ? (length as { mobile?: number; desktop?: number }).mobile : (length as { mobile?: number; desktop?: number }).desktop) ?? defaultLen;
    }

    const fullLen = s.h * clamp(targetLen, 0.1, 1);
    const sparkLen = Math.min(SPARK_PX, fullLen);

    // targets for this frame
    let lit = 0; // lit length in px
    let levelTarget = 0;
    let instant = false; // set level without smoothing
    const staticFrame = reduced() || P.intro === false;

    if (staticFrame && s.phase !== "cut") {
      lit = fullLen;
      levelTarget = 1;
      instant = true;
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
        if (e < IGNITE_MS) {
          // spark: 30px segment, flickering on/off with increasing duty cycle
          lit = sparkLen;
          const p = e / IGNITE_MS;
          const step = Math.floor(e / FLICKER_STEP_MS);
          const on = p > 0.88 || hash(step * 1.91 + 3.7) < 0.3 + 0.7 * p;
          levelTarget = on ? 1 : 1 - 0.9 * flickerAmt;
          if (flickerAmt <= 0) {
            levelTarget = 1;
          }
        } else {
          levelTarget = 1;
          const tt = (e - IGNITE_MS) / T;
          lit = sparkLen + (fullLen - sparkLen) * ease(clamp(tt));
          if (tt >= 1) {
            lit = fullLen;
            if (!s.done) {
              s.done = true;
              P.onComplete?.();
            }
          }
        }
      }
    } else if (s.phase === "cut") {
      const e = (s.clock - s.t0) / (CUT_MS + HOLD_MS);
      const f = clamp((s.clock - s.t0) / CUT_MS);
      lit = fullLen;
      levelTarget = Math.pow(1 - f, 2.5);
      instant = true;
      if (e >= 1) {
        s.phase = "off";
        s.level = 0;
        play();
        return;
      }
      if (f >= 1) lit = 0;
    }

    // click during the reveal makes the tube stutter
    const sinceKick = s.clock - s.kick;
    if (sinceKick < 420 && s.phase === "run") {
      const k = hash(Math.floor(sinceKick / FLICKER_STEP_MS) * 2.13 + 9.1) < 0.55 ? 1 : 0.15;
      levelTarget *= k;
    }

    // flicker afterglow: fast attack, slower decay
    if (instant || P.paused) {
      s.level = levelTarget;
    } else {
      const tau = levelTarget > s.level ? 18 : 80;
      s.level += (levelTarget - s.level) * (1 - Math.exp(-dtMs / tau));
    }
    let level = s.level;

    // slow breathing at steady state
    const humAmt = clamp(P.hum ?? hum, 0, 3);
    const tsec = s.clock / 1000;
    const breathe = 0.6 * Math.sin(tsec * 1.3) + 0.4 * Math.sin(tsec * 2.9 + 1.0);
    level *= 1 + 0.04 * humAmt * breathe;

    const dprNow = s.dpr;
    const isMirrored = P.mirrored !== false;
    const dir = P.direction ?? direction;
    const left = isMirrored || dir !== "left" ? 1 : 0;
    const right = isMirrored || dir === "left" ? 1 : 0;

    const REF_TUBE = 680; // tube length of the reference recording (px)

    gl.viewport(0, 0, Math.round(s.w * dprNow), Math.round(s.h * dprNow));
    gl.useProgram(s.program);
    gl.bindVertexArray(s.vao);

    const u = s.uniforms;
    gl.uniform2f(u.u_res, s.w, s.h);
    gl.uniform1f(u.u_dpr, dprNow);
    gl.uniform1f(u.u_inset, P.inset ?? inset);
    gl.uniform1f(u.u_yc, s.h * 0.5);
    gl.uniform1f(u.u_full, fullLen);
    gl.uniform1f(u.u_lit, lit);
    gl.uniform1f(u.u_level, clamp(level, 0, 1.5));
    gl.uniform1f(u.u_sc, Math.max(0.05, fullLen / REF_TUBE));
    gl.uniform1f(u.u_left, left);
    gl.uniform1f(u.u_right, right);
    gl.uniform1f(u.u_glow, clamp(P.glow ?? glow, 0, 3));
    gl.uniform1f(
      u.u_beam,
      Math.log10(Math.max(1e-3, (P.intensity ?? intensity) * clamp(P.spill ?? spill, 0.05, 3)))
    );
    gl.uniform1f(u.u_reach, clamp(P.reach ?? reach, 0.1, 3));
    gl.uniform1f(u.u_hair, 1);
    gl.uniform1f(u.u_cornerBlur, clamp(P.cornerBlur ?? 1, 0, 1));
    gl.uniform3f(u.u_bg, bgRGB[0], bgRGB[1], bgRGB[2]);
    gl.uniformMatrix3fv(u.u_cmat, false, paletteMatrix(tubeRGB, lightRGB));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* ── Loop ── */
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

  /* ── Mount / resize ── */
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    if (!initGL(canvas)) {
      console.warn("NeonReveal: WebGL2 context initialisation failed");
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
      const gl = state.gl;
      if (gl) {
        if (state.program) gl.deleteProgram(state.program);
        if (state.buffer) gl.deleteBuffer(state.buffer);
        if (state.vao) gl.deleteVertexArray(state.vao);
      }
      state.gl = null;
      state.program = null;
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

  /* Pause the loop while offscreen */
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
  }, [
    props.paused, colors[0], colors[1], backgroundColor, direction, mirrored,
    glow, spill, reach, intensity, inset,
    typeof length === "object" ? JSON.stringify(length) : length,
    hum,
  ]);

  /* ── Click: stutter during the reveal, otherwise cut and re-ignite ── */
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