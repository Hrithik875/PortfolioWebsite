"use client";

/**
 * NeonReveal: WebGL2 neon-tube reveal background (mobile-optimised).
 *
 * Look (unchanged from the original):
 *  - Spectrum: black → plum → wine → crimson → coral/salmon → peach → cream.
 *  - Fan beam from each tube, lens-shaped lobes converging on the tube tips.
 *  - Tube: white-hot core, yellow rim, amber aura, faint glass hairline when off.
 *  - Choreography: cut → dark hold → spark flicker → cubic ease-out growth → hum.
 *  - Dark surfaces use additive neon; light surfaces use "ink" mode.
 *
 * Performance work (this version):
 *  - Colour ramp + tube profile are baked into a 512x2 lookup texture instead of
 *    28/19-step loops with dynamic array indexing per pixel.
 *  - Per-frame constants hoisted out of the beam function, the "behind the tube"
 *    beam only evaluated in the 1-2px where it matters, far tube skipped when
 *    its aura cannot reach the pixel, one cheap dither hash instead of two sin().
 *  - Small / touch devices render the canvas at 0.5x resolution (upscaled by CSS).
 *    Override with `renderScale`.
 *  - The render loop STOPS when nothing is animating (after the reveal, if hum
 *    is 0). Hum defaults to 0 on small devices; if enabled it runs at ~10fps.
 *  - Steady-state hum pauses while the page is scrolling.
 *  - Resize is debounced and ignores small height changes on mobile (URL bar).
 *  - Fixed a bug where restarting from inside the frame callback started a
 *    second requestAnimationFrame chain (doubling work after every click).
 *  - Clicks are ignored while the cut animation is running (no flash on rapid
 *    taps), tap highlight removed, WebGL context loss is handled.
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
  /** Dark-mode palette: [tube, light]. */
  colors?: [string, string];
  /**
   * Light-mode palette: [core, glow, hot?]. Only used when `backgroundColor` is light.
   * Default: ["#D6004C", "#FF5C84", "#FFC38B"].
   */
  lightColors?: [string, string, string?];
  backgroundColor?: string;
  /** Surface used when `backgroundColor` is "transparent". Default: "#000000". */
  neonBase?: string;
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
  /** Steady-state breathing. Default: 1 on desktop, 0 on small/touch devices. */
  hum?: number;
  flicker?: number;
  cornerBlur?: number;
  interactive?: boolean;
  intro?: boolean;
  paused?: boolean;
  /** Max device pixel ratio. Default 1. */
  dpr?: number;
  /**
   * Internal render resolution multiplier (0.25 – 1).
   * Default: 0.5 on small/touch devices, 1 on desktop.
   */
  renderScale?: number;
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
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
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
  const named = input.trim().toLowerCase();
  if (named === "white") return [1, 1, 1];
  if (named === "black") return [0, 0, 0];
  return [0, 0, 0];
}

const luminance = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

function resolveSurface(bg: string, base: string): { rgb: RGB; css: string | undefined } {
  if (bg.trim().toLowerCase() === "transparent") {
    return { rgb: parseColorToUnit(base), css: undefined };
  }
  return { rgb: parseColorToUnit(bg), css: bg };
}

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/* 3x3 palette remap: identity for the default colours. */
const DEFAULT_TUBE: RGB = [1, 211 / 255, 168 / 255];
const DEFAULT_LIGHT: RGB = [1, 77 / 255, 109 / 255];

const DEFAULT_CORE = "#ff0044ff";
const DEFAULT_GLOW = "#ff0026ff";
const DEFAULT_HOT = "#f8c09eff";

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

/* ───────────────────────── Lookup texture ─────────────────────────
   Row 0: spectrum ramp, indexed by log10(intensity) in [RAMP_MIN, RAMP_MAX]
   Row 1: tube radial profile, indexed by distance in [0, TUBE_MAX] px
   Same knots as the original shader arrays, baked once on the CPU. */

const LUT_W = 512;
const RAMP_MIN = -4.5;
const RAMP_MAX = -0.85;
const TUBE_MAX = 150;

const RAMP_L = [
  -4.5, -4.0, -3.7, -3.4, -3.3, -3.2, -3.1, -3.0, -2.9, -2.8, -2.7, -2.6, -2.5, -2.4,
  -2.3, -2.2, -2.1, -2.0, -1.9, -1.8, -1.7, -1.6, -1.5, -1.4, -1.3, -1.2, -1.0, -0.85,
];
const RAMP_C: number[][] = [
  [0, 0, 0], [5, 0, 2], [13, 0, 6], [26.4, 1.3, 13.3], [30.4, 0, 15.1], [37, 0, 19.1],
  [42.4, 0, 22.2], [50.5, 0, 26.7], [57.4, 0, 30.9], [66, 0, 34.9], [78.2, 0, 40.5],
  [92.2, 0, 45.8], [106.1, 0, 50.8], [122.1, 0, 55.2], [139.9, 0, 58.4], [158.2, 0, 60.9],
  [176.3, 0, 65.1], [190.2, 0, 70.4], [201.7, 19.4, 75.4], [210.3, 47, 76.7],
  [216.8, 74.4, 77.3], [219.7, 102.9, 81.6], [220.3, 130.4, 94.1], [220.9, 154.8, 112.8],
  [225.2, 175.5, 131.8], [232.7, 192.8, 148], [249.1, 221.8, 162.8], [252, 230, 174],
];
const TUBE_D = [
  0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 8.5, 10.5, 14.5, 18.5, 22.5, 26.5, 33.5, 45, 60, 80, 110, 150,
];
const TUBE_C: number[][] = [
  [255, 252, 237], [255, 246, 150], [236, 199, 77], [194, 141, 30], [171, 118, 9],
  [158, 107, 8], [150, 99, 5], [136, 88, 4], [121, 75, 5], [97, 57, 3], [80, 46, 3],
  [66, 37, 2], [58, 30, 1], [46, 24, 0], [40, 19, 0], [30, 11, 0], [18, 5, 0], [6, 1, 0], [0, 0, 0],
];

function interp(xs: number[], cs: number[][], x: number): number[] {
  if (x <= xs[0]) return cs[0];
  for (let i = 1; i < xs.length; i++) {
    if (x < xs[i]) {
      const f = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
      return cs[i - 1].map((c, k) => c + (cs[i][k] - c) * f);
    }
  }
  return cs[cs.length - 1];
}

let LUT_CACHE: Uint8Array | null = null;
function getLUT(): Uint8Array {
  if (LUT_CACHE) return LUT_CACHE;
  const data = new Uint8Array(LUT_W * 2 * 4);
  for (let i = 0; i < LUT_W; i++) {
    const t = i / (LUT_W - 1);
    const r = interp(RAMP_L, RAMP_C, RAMP_MIN + t * (RAMP_MAX - RAMP_MIN));
    const o = i * 4;
    data[o] = Math.round(r[0]);
    data[o + 1] = Math.round(r[1]);
    data[o + 2] = Math.round(r[2]);
    data[o + 3] = 255;
    const c = interp(TUBE_D, TUBE_C, t * TUBE_MAX);
    const o2 = (LUT_W + i) * 4;
    data[o2] = Math.round(c[0]);
    data[o2 + 1] = Math.round(c[1]);
    data[o2 + 2] = Math.round(c[2]);
    data[o2 + 3] = 255;
  }
  LUT_CACHE = data;
  return data;
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
uniform float u_dpr;      // canvas pixels per CSS px (already includes render scale)
uniform float u_inset;
uniform float u_yc;
uniform float u_full;
uniform float u_lit;
uniform float u_level;
uniform float u_sc;
uniform float u_left;
uniform float u_right;
uniform float u_glow;
uniform float u_beam;
uniform float u_reach;
uniform float u_hair;
uniform float u_cornerBlur;
uniform vec3  u_bg;
uniform float u_light;
uniform vec3  u_inkCore;
uniform vec3  u_inkGlow;
uniform vec3  u_inkHot;
uniform mat3  u_cmat;
uniform sampler2D u_lut;  // row 0 (v=.25): spectrum ramp, row 1 (v=.75): tube profile

const float LUT_W = ${LUT_W}.0;
const float RAMP_MIN = ${RAMP_MIN.toFixed(2)};
const float RAMP_SPAN = ${(RAMP_MAX - RAMP_MIN).toFixed(2)};
const float TUBE_MAX = ${TUBE_MAX.toFixed(1)};

vec3 ramp(float l) {
  float x = clamp((l - RAMP_MIN) / RAMP_SPAN, 0.0, 1.0);
  return texture(u_lut, vec2((x * (LUT_W - 1.0) + 0.5) / LUT_W, 0.25)).rgb;
}

vec3 tubeProfile(float d) {
  float x = clamp(d / TUBE_MAX, 0.0, 1.0);
  return texture(u_lut, vec2((x * (LUT_W - 1.0) + 0.5) / LUT_W, 0.75)).rgb;
}

/* ---- error function (Abramowitz & Stegun 7.1.26) ---- */
float erf_(float x) {
  float s = x < 0.0 ? -1.0 : 1.0;
  x = abs(x);
  if (x >= 3.5) return s;
  float t = 1.0 / (1.0 + 0.3275911 * x);
  float y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-x * x);
  return s * y;
}

/* ---- fan beam (lengths in reference pixels) ---- */
const float B_D0 = 83.4124;
const float B_S  = 1.0954;
const float B_KAP_60 = 1.308681;
const float INV_SQRT2 = 0.70710678;
const float B_SIG0 = 11.5536;
const float B_SIG1 = 0.0823;
const float B_G = -0.1322;
const float B_EX = 3.2038;
const float B_GAM = 0.8054;
const float B_ABR = 0.9569;
const float B_LA = -2.3103;
const float BACK_GAIN = 0.55;
const float BACK_FALL = 34.0;

// hAmp = pow(hh/200, B_G) and sigAdd = B_SIG0 + B_SIG1*hh are per-frame constants,
// computed once in main() instead of once per beam evaluation.
float beamI(float dx, float yp, float hh, float hAmp, float sigAdd) {
  dx = max(dx, 0.0);
  float sig = B_KAP_60 * pow(dx + 1.0, B_GAM) + sigAdd;
  float invSig = INV_SQRT2 / sig;
  float P = 0.5 * (erf_((hh - yp) * invSig) + erf_((hh + yp) * invSig));
  if (P <= 0.0) return 0.0;
  float A = pow(1.0 + pow(dx / B_D0, B_ABR), -B_S / B_ABR) * hAmp;
  return A * pow(P, B_EX);
}

vec3 levelScale(vec3 c, float l) {
  return vec3(c.r * l, c.g * pow(l, 1.45), c.b * pow(l, 1.9));
}

/* ---- light mode ---- */
float lightFade(float l) {
  return pow(clamp((l + 4.2) / 2.2, 0.0, 1.0), 1.8);
}

vec3 inkRamp(float l) {
  vec3 cCoral = mix(u_inkCore, u_inkHot, 0.50);
  vec3 cCream = mix(u_inkHot, vec3(1.0, 0.97, 0.88), 0.65);
  if (l < -2.0) {
    vec3 hue = mix(u_inkGlow, u_inkCore, smoothstep(-3.2, -2.2, l));
    return mix(u_bg, hue, lightFade(l));
  }
  if (l < -1.6) return mix(u_inkCore, cCoral,  (l + 2.0) / 0.4);
  if (l < -1.2) return mix(cCoral,   u_inkHot, (l + 1.6) / 0.4);
  return mix(u_inkHot, cCream, clamp((l + 1.2) / 0.35, 0.0, 1.0));
}

void main() {
  vec2 p = gl_FragCoord.xy / u_dpr;
  p.y = u_res.y - p.y;

  bool isLight = u_light > 0.5;

  float hhFull = u_full * 0.5;
  float hhLit  = max(u_lit * 0.5, 0.0);
  float yp = p.y - u_yc;
  float ay = abs(yp);

  float xl = p.x - u_inset;
  float xr = (u_res.x - u_inset) - p.x;

  // ---- corner feather ----
  float fadeRange = u_cornerBlur * 0.22;
  float halfH = u_res.y * 0.5;
  float topDist  = p.y / halfH;
  float botDist  = (u_res.y - p.y) / halfH;
  float minTB = min(topDist, botDist);
  float vFade = smoothstep(0.0, fadeRange, minTB);

  float leftDist  = clamp(xl / (u_inset * 1.5 + 1.0), 0.0, 1.0);
  float rightDist = clamp(xr / (u_inset * 1.5 + 1.0), 0.0, 1.0);
  float cTB = smoothstep(0.0, fadeRange * 0.7, minTB);
  float lCorner = cTB + smoothstep(0.0, 0.5, leftDist);
  float rCorner = cTB + smoothstep(0.0, 0.5, rightDist);
  float hFade = clamp(min(lCorner, rCorner) * 0.5, 0.0, 1.0);

  float cornerFade = mix(1.0, min(vFade, mix(1.0, hFade, 0.5)), u_cornerBlur);

  // ---- beam intensity (sum of both tubes) in reference px ----
  float Itot = 0.0;
  float hhn = hhLit / u_sc;
  float ypn = yp / u_sc;
  if (u_level > 0.0005 && hhLit > 0.5) {
    float hAmp = pow(hhn / 200.0, B_G);
    float sigAdd = B_SIG0 + B_SIG1 * hhn;
    float invR = 1.0 / (u_sc * u_reach);

    if (u_left  > 0.5 && xl > 2.5) Itot += beamI(xl * invR, ypn, hhn, hAmp, sigAdd) * smoothstep(2.5, 6.0, xl);
    if (u_right > 0.5 && xr > 2.5) Itot += beamI(xr * invR, ypn, hhn, hAmp, sigAdd) * smoothstep(2.5, 6.0, xr);

    // light behind the tube: only exists within a few px of the tube axis
    bool backL = u_left  > 0.5 && xl < 0.0;
    bool backR = u_right > 0.5 && xr < 0.0;
    if (backL || backR) {
      float nearI = beamI(6.0 / u_reach, ypn, hhn, hAmp, sigAdd);
      float bl = 0.0;
      if (backL) bl += nearI * exp(-(-xl) / (BACK_FALL * u_sc)) * smoothstep(-1.0, 3.0, -xl);
      if (backR) bl += nearI * exp(-(-xr) / (BACK_FALL * u_sc)) * smoothstep(-1.0, 3.0, -xr);
      Itot += bl * BACK_GAIN;
    }
  }

  Itot *= cornerFade;

  float lI = log2(max(Itot, 1e-9)) * 0.30102999566 + B_LA * 0.4342944819 + u_beam
           + log2(max(u_level, 1e-6)) * 0.30102999566;

  vec3 col = vec3(0.0);
  if (!isLight) col = ramp(lI);   // light mode never reads the dark ramp

  // ---- tubes ----
  float totalHair = 0.0;
  float tubeLum = 0.0;
  for (int k = 0; k < 2; k++) {
    float present = (k == 0) ? u_left : u_right;
    if (present < 0.5) continue;
    float dxa = abs(p.x - ((k == 0) ? u_inset : (u_res.x - u_inset)));
    if (dxa > TUBE_MAX) continue;  // aura profile is black beyond this

    float over = max(0.0, ay - hhLit);
    float dseg = sqrt(dxa * dxa + over * over);
    float cap = clamp(over / 2.0, 0.0, 1.0);

    float overF = max(0.0, ay - hhFull);
    float endF = 1.0 - smoothstep(0.0, 2.0, overF);
    float gl = exp(-dxa * dxa / (2.0 * 1.8 * 1.8)) * endF;
    totalHair += gl * u_hair * cornerFade;
    if (!isLight) {
      col = max(col, vec3(59.0, 50.0, 46.0) / 255.0 * 1.04 * gl * u_hair * cornerFade);
    }

    if (u_level > 0.0005 && hhLit > 0.5) {
      float inside = 1.0 - smoothstep(-0.5, 1.0, ay - hhLit);
      float dLookup = mix(max(dseg + 1.2 * cap, 4.5), dxa, inside);
      vec3 tc = tubeProfile(dLookup);
      float auraMask = smoothstep(3.0, 6.0, dLookup);
      tc *= mix(1.0, u_glow, auraMask);
      tc = levelScale(tc, u_level);
      float tipFade = mix(cornerFade, 1.0, smoothstep(0.0, 6.0, dLookup) * (1.0 - cornerFade));
      if (isLight) {
        tubeLum = max(tubeLum, dot(tc * tipFade, vec3(0.33333)));
      } else {
        col = max(col, tc * tipFade);
      }
    }
  }

  if (isLight) {
    vec3 ink = inkRamp(lI);
    float fade = lightFade(lI);

    float hotW  = smoothstep(0.12, 0.50, tubeLum) * 0.85;
    float coreW = smoothstep(0.62, 0.92, tubeLum);
    ink = mix(ink, u_inkHot, hotW);
    ink = mix(ink, vec3(1.0, 0.97, 0.88), coreW);

    float hairW = clamp(totalHair, 0.0, 1.0)
                * (1.0 - smoothstep(0.30, 0.75, fade))
                * (1.0 - 0.85 * clamp(u_level, 0.0, 1.0));
    vec3 hairCol = mix(u_bg, u_inkCore, 0.45);
    col = mix(ink, hairCol, hairW);
  } else {
    col = u_cmat * col;
    col = max(col, u_bg);
  }

  // cheap interleaved-gradient-noise dither (one hash instead of two sin())
  float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  col += (n - 0.5) / 255.0;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

/* ───────────────────────── Timeline ───────────────────────── */

const CUT_MS = 220;
const HOLD_MS = 260;
const IGNITE_MS = 540;
const SPARK_PX = 30;
const FLICKER_STEP_MS = 64;
const KICK_MS = 420;

type Phase = "off" | "run" | "cut";
const UNIFORMS = [
  "u_res", "u_dpr", "u_inset", "u_yc", "u_full", "u_lit", "u_level", "u_sc",
  "u_left", "u_right", "u_glow", "u_beam", "u_reach", "u_hair", "u_cornerBlur",
  "u_bg", "u_light", "u_inkCore", "u_inkGlow", "u_inkHot", "u_cmat", "u_lut",
] as const;

export const NeonReveal = forwardRef<NeonRevealHandle, NeonRevealProps>(function NeonReveal(props, ref) {
  const {
    colors = ["#FFD3A8", "#FF4D6D"],
    lightColors = [DEFAULT_CORE, DEFAULT_GLOW, DEFAULT_HOT],
    backgroundColor = "#000000ff",
    neonBase = "#000000",
    direction = "right",
    trigger = "mount",
    glow = 1,
    spill = 0.85,
    reach = 0.85,
    intensity = 0.85,
    inset = 1,
    length,
    mirrored = true,
    hum, // undefined → 1 on desktop, 0 on small devices
    interactive = true,
    scrollThreshold = 0.3,
    renderScale,
    children,
    className,
    style,
  } = props;

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const resizeRef = useRef<((force?: boolean) => void) | null>(null);

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
    level: 0,
    small: false,
    soft: false, // true when we had to fall back from the strict context
    reduced: false,
    scrollUntil: 0,
    lastClick: 0,
    gl: null as WebGL2RenderingContext | null,
    program: null as WebGLProgram | null,
    buffer: null as WebGLBuffer | null,
    vao: null as WebGLVertexArrayObject | null,
    tex: null as WebGLTexture | null,
    uniforms: {} as Record<string, WebGLUniformLocation | null>,
    cachedColorsKey: "",
    cachedTubeRGB: [0, 0, 0] as RGB,
    cachedLightRGB: [0, 0, 0] as RGB,
    cachedBgKey: "",
    cachedBgRGB: [0, 0, 0] as RGB,
    cachedInkKey: "",
    cachedInkCore: [0, 0, 0] as RGB,
    cachedInkGlow: [0, 0, 0] as RGB,
    cachedInkHot: [0, 0, 0] as RGB,
    cachedCmat: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) as ReturnType<typeof paletteMatrix>,
  });

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

  /* ── WebGL setup (also used to recover from context loss) ── */
  const releaseGL = () => {
    const s = S.current;
    const gl = s.gl;
    if (gl && !gl.isContextLost()) {
      if (s.program) gl.deleteProgram(s.program);
      if (s.buffer) gl.deleteBuffer(s.buffer);
      if (s.vao) gl.deleteVertexArray(s.vao);
      if (s.tex) gl.deleteTexture(s.tex);
    }
    s.gl = null;
    s.program = null;
    s.buffer = null;
    s.vao = null;
    s.tex = null;
  };

  const initGL = (canvas: HTMLCanvasElement) => {
    const attrs: WebGLContextAttributes = {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: S.current.small ? "low-power" : "high-performance",
    };
    // Prefer a hardware context; if the browser refuses, take whatever it
    // offers but render much smaller so it stays cheap.
    let gl = canvas.getContext("webgl2", { ...attrs, failIfMajorPerformanceCaveat: true });
    S.current.soft = false;
    if (!gl) {
      gl = canvas.getContext("webgl2", attrs);
      S.current.soft = !!gl;
    }
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

    // lookup texture (spectrum ramp + tube profile)
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, LUT_W, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, getLUT());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(prog, name);

    gl.useProgram(prog);
    gl.uniform1i(uniforms.u_lut, 0);
    gl.disable(gl.DITHER);
    gl.disable(gl.BLEND);

    const s = S.current;
    s.gl = gl;
    s.program = prog;
    s.buffer = buf;
    s.vao = vao;
    s.tex = tex;
    s.uniforms = uniforms;
    return true;
  };

  /* ── Frame. Returns true while more frames are needed. ── */
  const draw = (dtMs: number): boolean => {
    const s = S.current;
    const P = propsRef.current;
    const gl = s.gl;
    if (!gl || !s.program || !s.w || !s.h || gl.isContextLost()) return false;

    if (!P.paused) s.clock += dtMs;

    // dark-mode palette
    const cols = P.colors ?? colors;
    const colKey = `${cols[0]}|${cols[1]}`;
    if (colKey !== s.cachedColorsKey) {
      s.cachedColorsKey = colKey;
      s.cachedTubeRGB = parseColorToUnit(cols[0]);
      s.cachedLightRGB = parseColorToUnit(cols[1]);
      s.cachedCmat = paletteMatrix(s.cachedTubeRGB, s.cachedLightRGB);
    }

    // light-mode palette
    const inks = P.lightColors ?? lightColors;
    const hotColor = inks[2] ?? DEFAULT_HOT;
    const inkKey = `${inks[0]}|${inks[1]}|${hotColor}`;
    if (inkKey !== s.cachedInkKey) {
      s.cachedInkKey = inkKey;
      s.cachedInkCore = parseColorToUnit(inks[0]);
      s.cachedInkGlow = parseColorToUnit(inks[1]);
      s.cachedInkHot = parseColorToUnit(hotColor);
    }

    // surface
    const bgProp = P.backgroundColor ?? backgroundColor;
    const baseProp = P.neonBase ?? neonBase;
    const bgKey = `${bgProp}|${baseProp}`;
    if (bgKey !== s.cachedBgKey) {
      s.cachedBgKey = bgKey;
      s.cachedBgRGB = resolveSurface(bgProp, baseProp).rgb;
    }
    const bgRGB = s.cachedBgRGB;
    const isLightSurface = luminance(bgRGB) > 0.35;

    const D = P.revealDelay ?? 0;
    const T = Math.max(50, P.revealDuration ?? 2600);
    const ease = EASE[P.easing ?? "out"] ?? EASE.out;
    const flickerAmt = clamp(P.flicker ?? 1);

    const defaultLen = 0.6;
    let targetLen = defaultLen;
    const lenProp = P.length ?? length;
    if (typeof lenProp === "number") {
      targetLen = lenProp;
    } else if (lenProp && typeof lenProp === "object") {
      targetLen = (s.small ? lenProp.mobile : lenProp.desktop) ?? defaultLen;
    }

    const fullLen = s.h * clamp(targetLen, 0.1, 1);
    const sparkLen = Math.min(SPARK_PX, fullLen);

    let lit = 0;
    let levelTarget = 0;
    let instant = false;
    const staticFrame = s.reduced || P.intro === false;

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
          lit = sparkLen;
          const p = e / IGNITE_MS;
          const step = Math.floor(e / FLICKER_STEP_MS);
          const on = p > 0.88 || hash(step * 1.91 + 3.7) < 0.3 + 0.7 * p;
          levelTarget = on ? 1 : 1 - 0.9 * flickerAmt;
          if (flickerAmt <= 0) levelTarget = 1;
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
        play(); // sets phase="run"; loop() will not double-schedule (guarded)
        return true;
      }
      if (f >= 1) lit = 0;
    }

    // click during the reveal makes the tube stutter
    const sinceKick = s.clock - s.kick;
    const kickActive = sinceKick < KICK_MS && s.phase === "run";
    if (kickActive) {
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

    // slow breathing at steady state (off by default on small devices)
    const humProp = P.hum ?? hum;
    const humAmt = s.reduced ? 0 : clamp(humProp ?? (s.small || s.soft ? 0 : 1), 0, 3);
    if (humAmt > 0) {
      const tsec = s.clock / 1000;
      const breathe = 0.6 * Math.sin(tsec * 1.3) + 0.4 * Math.sin(tsec * 2.9 + 1.0);
      level *= 1 + 0.04 * humAmt * breathe;
    }

    const dprNow = s.dpr;
    const isMirrored = P.mirrored !== false;
    const dir = P.direction ?? direction;
    const left = isMirrored || dir !== "left" ? 1 : 0;
    const right = isMirrored || dir === "left" ? 1 : 0;

    const REF_TUBE = 680;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
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
    gl.uniform1f(u.u_light, isLightSurface ? 1 : 0);
    gl.uniform3f(u.u_inkCore, s.cachedInkCore[0], s.cachedInkCore[1], s.cachedInkCore[2]);
    gl.uniform3f(u.u_inkGlow, s.cachedInkGlow[0], s.cachedInkGlow[1], s.cachedInkGlow[2]);
    gl.uniform3f(u.u_inkHot, s.cachedInkHot[0], s.cachedInkHot[1], s.cachedInkHot[2]);
    gl.uniformMatrix3fv(u.u_cmat, false, s.cachedCmat);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // does anything still need animating? If not, the loop stops completely.
    if (s.phase === "cut") return true;
    if (s.phase === "run" && !s.done) return true;
    if (kickActive) return true;
    if (humAmt > 0 && lit > 0 && s.level > 0.001) return true;
    return false;
  };

  /* ── Loop ── */
  const loop = (now: number) => {
    const s = S.current;
    s.raf = 0;
    if (!s.gl || !s.visible || (typeof document !== "undefined" && document.hidden) || propsRef.current.paused) {
      s.last = 0;
      return;
    }

    const kickActive = s.clock - s.kick < KICK_MS;
    const revealing = (s.phase === "run" && !s.done) || kickActive;

    // steady-state hum: don't compete with scrolling
    if (!revealing && s.phase === "run" && now < s.scrollUntil) {
      s.raf = requestAnimationFrame(loop);
      return;
    }

    // frame-rate caps (slightly under the target interval to absorb rAF jitter)
    //   reveal: 60fps desktop / 30fps mobile · cut: 30fps · hum: 30fps desktop / 10fps mobile
    const minInterval = revealing ? (s.small ? 30 : 14) : s.phase === "cut" ? 30 : s.small ? 95 : 30;
    // first frame after a (re)start: draw immediately instead of waiting.
    // On mobile, minInterval can be 30–95ms so a fake elapsed of 16 would
    // always fail the throttle check and the loop would reschedule forever.
    const first = s.last === 0;
    const elapsed = first ? 16 : now - s.last;
    if (!first && elapsed < minInterval) {
      s.raf = requestAnimationFrame(loop);
      return;
    }
    s.last = now;

    const more = draw(Math.min(64, elapsed));
    if (more) {
      if (!s.raf) s.raf = requestAnimationFrame(loop); // guard: play() may already have woken us
    } else {
      s.last = 0; // idle: zero GPU/CPU cost until something calls wake()
    }
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

    const state = S.current;
    const detectSmall = () =>
      window.innerWidth < 1024 || !!window.matchMedia?.("(pointer: coarse)").matches;
    state.small = detectSmall();

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    state.reduced = !!mq?.matches;

    if (!initGL(canvas)) {
      console.warn("NeonReveal: WebGL2 unavailable or too slow; skipping effect");
      return;
    }

    const apply = (force = false) => {
      const s = S.current;
      const P = propsRef.current;
      s.small = detectSmall();
      const w = Math.max(1, root.offsetWidth);
      const h = Math.max(1, root.offsetHeight);

      // Mobile URL-bar show/hide changes the height by tens of px while scrolling.
      // Reallocating the GL buffer for that is what causes jank, so ignore it.
      if (!force && s.w) {
        const dw = Math.abs(w - s.w);
        const dh = Math.abs(h - s.h);
        const hTol = s.small ? Math.max(96, s.h * 0.12) : 0.5;
        if (dw < 1 && dh <= hTol) return;
      }

      const scale = clamp(
        P.renderScale ?? renderScale ?? (s.soft ? 0.3 : s.small ? 0.5 : 1),
        0.25,
        1
      );
      const d = Math.min(window.devicePixelRatio || 1, P.dpr ?? 1) * scale;
      const cw = Math.max(1, Math.round(w * d));
      const ch = Math.max(1, Math.round(h * d));
      s.w = w;
      s.h = h;
      s.dpr = cw / w;
      // assigning width/height clears + reallocates, so only do it when it changes
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;

      // redraw in the same task so the cleared buffer is never presented
      if (draw(0)) wake();
    };
    resizeRef.current = apply;
    apply(true);

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => apply(false), 120);
    });
    ro.observe(root);

    const onVisibility = () => {
      if (document.hidden) {
        if (state.raf) {
          cancelAnimationFrame(state.raf);
          state.raf = 0;
        }
      } else if (state.visible) {
        state.last = 0;
        if (draw(0)) wake();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onScroll = () => {
      state.scrollUntil = performance.now() + 140;
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    const onMotionPref = () => {
      state.reduced = !!mq?.matches;
      if (draw(0)) wake();
    };
    mq?.addEventListener?.("change", onMotionPref);

    const onLost = (e: Event) => {
      e.preventDefault(); // allow restoration
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      state.gl = null;
      state.program = null;
      state.buffer = null;
      state.vao = null;
      state.tex = null;
    };
    const onRestored = () => {
      if (initGL(canvas)) {
        apply(true);
        wake();
      }
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
      mq?.removeEventListener?.("change", onMotionPref);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      ro.disconnect();
      cancelAnimationFrame(state.raf);
      state.raf = 0;
      resizeRef.current = null;
      releaseGL();
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
              else if (!s.done) wake();
              else if (draw(0)) wake();
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

  /* Pause the loop while offscreen (small rootMargin so it starts just before entering view) */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || trigger === "inView") return;
    const io = new IntersectionObserver(
      ([e]) => {
        const s = S.current;
        s.visible = e.isIntersecting;
        if (e.isIntersecting) {
          s.last = 0;
          if (draw(0)) wake();
        } else if (s.raf) {
          cancelAnimationFrame(s.raf);
          s.raf = 0;
        }
      },
      { rootMargin: "80px" }
    );
    io.observe(root);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  /* Re-render when props change (theme switches etc.). Works even when the loop is idle. */
  useEffect(() => {
    resizeRef.current?.(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.paused, colors[0], colors[1], lightColors[0], lightColors[1], lightColors[2],
    backgroundColor, neonBase, direction, mirrored,
    glow, spill, reach, intensity, inset, hum, renderScale, props.dpr,
    typeof length === "object" ? JSON.stringify(length) : length,
  ]);

  /* ── Click: stutter during the reveal, otherwise cut and re-ignite ── */
  const onClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    const target = e.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select,summary,[role='button'],[role='link']")) return;
    const s = S.current;
    if (!s.gl) return;
    // ignore taps while the cut is running (re-triggering it restarts at full
    // brightness = visible flash) and ignore rapid double taps
    if (s.phase === "cut") return;
    const now = performance.now();
    if (now - s.lastClick < 250) return;
    s.lastClick = now;

    if (s.phase === "run" && !s.done) {
      s.kick = s.clock;
      wake();
    } else if (s.phase === "off") {
      play();
    } else {
      cutThenPlay();
    }
  };

  const surfaceCss = resolveSurface(backgroundColor, neonBase).css;

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
        backgroundColor: surfaceCss,
        cursor: interactive ? "pointer" : undefined,
        WebkitTapHighlightColor: "transparent", // no grey flash on tap
        touchAction: "manipulation",             // no double-tap delay
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
          width: "100%",   // CSS size is independent of the (smaller) render buffer
          height: "100%",
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