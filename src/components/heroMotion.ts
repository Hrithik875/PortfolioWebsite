/**
 * heroMotion.ts
 * Pure math for the hero rings (no DOM, no React) so it can be unit-tested.
 *
 * All distances are in "art units": the coordinate system of the original SVG
 * (viewBox 1024.5 x 576), measured from the LEFT side with the card's left
 * edge at ART_CARD_LEFT. The right side is an exact mirror, so everything here
 * is described once, for the left side.
 */

export const ART_CARD_LEFT = 358.575; // card left edge in art units (card is 30% wide)
export const ART_CY = 288; // vertical centre line
export const ART_WIDTH = 1024; // right-hand art mirrors the left about x = 512

export interface RingSpec {
  /** x of the ring's outer tip (the part that faces the card) */
  apex: number;
  /** x centre of the ring's bounding box (used for the jelly stretch) */
  center: number;
  /** [start, end] of this ring's motion inside the 0..1 scroll progress */
  window: readonly [number, number];
}

/** index 0 = ring nearest the card (innermost), 2 = outermost */
export const RINGS: readonly RingSpec[] = [
  { apex: 323.082, center: 234.348, window: [0.0, 0.5] },
  { apex: 169.453, center: 109.373, window: [0.14, 0.78] },
  { apex: 57.363, center: 28.678, window: [0.28, 0.94] },
];

/**
 * How far every ring travels in total. 372 > ART_CARD_LEFT (358.6), so even the
 * outermost ring (whose left edge starts at x = 0) ends fully behind the card.
 * All rings share the same final travel, which is what guarantees they can
 * never visibly overlap each other (see ringTravel).
 */
export const TRAVEL = 372;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v: number) => clamp(v, 0, 1);
export const smooth01 = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/**
 * Travel (art units) of ring `i` at scroll progress `p` (0..1).
 *
 * Every ring uses the SAME easing curve and the SAME total distance; only the
 * [start, end] window differs, and both start and end increase from the inner
 * ring to the outer ring. For a shared monotone curve that means
 *   travel(0, p) >= travel(1, p) >= travel(2, p)   for every p,
 * i.e. an outer ring can never overtake the ring in front of it. That removes
 * the overlap glitch by construction instead of by tuning.
 */
export function ringTravel(i: number, p: number): number {
  const [a, b] = RINGS[i].window;
  return TRAVEL * smooth01((p - a) / (b - a));
}

/** travel at which ring `i`'s tip touches the card's left edge */
export const contactDistance = (i: number) => ART_CARD_LEFT - RINGS[i].apex;

// ─── Card spring ────────────────────────────────────────────────────────────

export const SPRING_FREQ_HZ = 3.4; // wobble speed
export const SPRING_DAMPING = 0.5; // 0.5 = one visible overshoot, then settles
export const BOUNCE_PEAK = 0.009; // peak squash of the card at full impact (0.9 %)

const omega = 2 * Math.PI * SPRING_FREQ_HZ;

/** velocity impulse that produces a peak displacement of `peak` for this spring */
export function impulseForPeak(peak: number): number {
  const z = SPRING_DAMPING;
  const wd = omega * Math.sqrt(1 - z * z);
  const tp = Math.atan2(wd, z * omega) / wd; // time of first peak
  const peakPerVelocity = (Math.exp(-z * omega * tp) * Math.sin(wd * tp)) / wd;
  return peak / peakPerVelocity;
}

export const IMPULSE = impulseForPeak(BOUNCE_PEAK);

/** semi-implicit Euler with sub-steps, stable at any frame rate */
export function stepSpring(x: number, v: number, dt: number): [number, number] {
  const n = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / n;
  for (let k = 0; k < n; k++) {
    const a = -omega * omega * x - 2 * SPRING_DAMPING * omega * v;
    v += a * h;
    x += v * h;
  }
  return [x, v];
}

// ─── Liquid bridge ──────────────────────────────────────────────────────────

/** a ring stretched by +j horizontally is squashed by JELLY_Y * j vertically */
export const JELLY_Y = 0.4;

/** distance (art units) at which a liquid thread starts reaching for the card */
export const BRIDGE_REACH = 30;
/** vertical extent of the fillet along the card edge at full strength */
export const BRIDGE_FILLET = 64;
/** the fillet has fully relaxed once the corner where ring meets card is this high */
const BRIDGE_MAX_CORNER = 118;

type Cubic = readonly [number, number, number, number, number, number, number, number];

/**
 * The tip of every ring, copied from the SVG path data: the cubic Béziers that
 * run into the apex, for the upper and the lower half. Using the real outline
 * (not a circle) lets the liquid fillet leave the ring exactly tangentially.
 * Each cubic is [x0,y0, x1,y1, x2,y2, x3,y3].
 */
const OUTLINE_SRC: readonly { top: Cubic[]; bottom: Cubic[] }[] = [
  {
    top: [[169.453, 133.047, 255.828, 136.344, 323.082, 204.258, 323.082, 288.656]],
    bottom: [[323.082, 288.656, 323.082, 372.395, 255.828, 440.965, 169.453, 442.945]],
  },
  {
    top: [
      [57.363, 133.047, 88.352, 135.684, 114.066, 152.168, 133.188, 178.543],
      [133.188, 178.543, 152.309, 205.578, 169.453, 243.16, 169.453, 284.699],
    ],
    bottom: [
      [169.453, 292.613, 169.453, 333.492, 152.309, 371.074, 133.188, 398.109],
      [133.188, 398.109, 114.066, 424.48, 88.352, 441.625, 57.363, 442.945],
    ],
  },
  {
    top: [
      [-0.004, 133.047, 3.293, 135.684, 11.207, 138.98, 15.164, 145.574],
      [15.164, 145.574, 22.414, 152.828, 29.008, 164.039, 34.945, 177.883],
      [34.945, 177.883, 45.492, 204.258, 57.363, 240.523, 57.363, 280.082],
    ],
    bottom: [
      [57.363, 288.656, 57.363, 331.512, 46.152, 371.074, 34.945, 398.766],
      [34.945, 398.766, 29.008, 412.613, 22.414, 423.824, 15.164, 431.734],
      [15.164, 431.734, 9.23, 437.668, 3.293, 441.625, -0.004, 442.285],
    ],
  },
];

/** outline of one half of a ring tip as a monotone table: height h above the centre line -> drop d behind the apex */
interface Outline {
  h: Float64Array;
  d: Float64Array;
}

function buildOutline(apex: number, cubics: Cubic[], upper: boolean): Outline {
  const pts: [number, number][] = [];
  for (const c of cubics) {
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      const u = 1 - t;
      const x = u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6];
      const y = u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7];
      pts.push([upper ? ART_CY - y : y - ART_CY, apex - x]);
    }
  }
  pts.sort((a, b) => a[0] - b[0]);
  // flat edge at the very tip: d = 0 up to the first sample
  const h = new Float64Array(pts.length + 1);
  const d = new Float64Array(pts.length + 1);
  h[0] = Math.min(-2, pts[0][0] - 1e-3);
  d[0] = 0;
  let last = 0;
  pts.forEach(([hh, dd], i) => {
    last = Math.max(last, dd); // enforce monotone (removes float noise)
    h[i + 1] = hh;
    d[i + 1] = last;
  });
  return { h, d };
}

const OUTLINES = OUTLINE_SRC.map((o, i) => ({
  top: buildOutline(RINGS[i].apex, o.top, true),
  bottom: buildOutline(RINGS[i].apex, o.bottom, false),
}));

/** drop behind the apex at height h, and its slope dd/dh */
function sample(o: Outline, h: number): [number, number] {
  const n = o.h.length;
  if (h <= o.h[0]) return [0, 0];
  if (h >= o.h[n - 1]) {
    const m = (o.d[n - 1] - o.d[n - 5]) / Math.max(1e-6, o.h[n - 1] - o.h[n - 5]);
    return [o.d[n - 1] + m * (h - o.h[n - 1]), m];
  }
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (o.h[mid] <= h) lo = mid;
    else hi = mid;
  }
  const dh = Math.max(1e-6, o.h[hi] - o.h[lo]);
  const m = (o.d[hi] - o.d[lo]) / dh;
  return [o.d[lo] + m * (h - o.h[lo]), m];
}

/** height at which the outline has dropped `pen` behind the apex (where ring meets the card edge) */
function heightAtDrop(o: Outline, pen: number): number {
  let lo = 0;
  let hi = 400;
  for (let k = 0; k < 28; k++) {
    const mid = (lo + hi) / 2;
    if (sample(o, mid)[0] < pen) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const RELAX = OUTLINES.map((o) => Math.min(46, sample(o.top, BRIDGE_MAX_CORNER)[0]));

/**
 * Liquid fillet between ring `i`'s tip and the card edge.
 *
 *  gap  > 0 : the ring is approaching - a thin thread grows from the tip and reaches the card
 *  gap <= 0 : the ring is sliding under the card - a concave fillet hugs the corner, then relaxes
 *
 * The shape is drawn UNDER the ring and UNDER the card, so only the concave
 * neck between them shows. Returns "" when there is nothing to draw.
 */
export function bridgePath(i: number, tipX: number, wallX: number, jelly = 0): string {
  const gap = wallX - tipX;
  const pen = Math.max(0, -gap);
  const relax = RELAX[i];
  if (gap >= BRIDGE_REACH || pen >= relax) return "";

  const s = gap > 0 ? smooth01(1 - gap / BRIDGE_REACH) : 1 - smooth01(pen / relax);
  if (s < 0.004) return "";

  const { top, bottom } = OUTLINES[i];
  // the ring is drawn stretched by (1 + jelly) horizontally and squashed vertically;
  // follow that same stretched outline so the join stays exactly tangent
  const kx = 1 + jelly;
  const ky = 1 - JELLY_Y * jelly;
  const hc = pen > 0 ? heightAtDrop(top, pen / kx) * ky : 0; // corner height where the ring meets the wall
  const rise = BRIDGE_FILLET * s;
  const hS = hc + rise; // fillet leaves the ring here
  const hE = hc + rise * 1.15; // and meets the card edge here
  const apex = tipX; // tipX is the apex's current x

  const half = (o: Outline) => {
    const [dSrc, mSrc] = sample(o, hS / ky);
    const dS = dSrc * kx;
    const m = (mSrc * kx) / ky; // slope of the stretched outline: tangent toward the apex is (m, 1) in screen coords
    const sx = apex - dS;
    const norm = Math.sqrt(1 + m * m);
    const chord = Math.max(0.5, wallX - sx);
    const a = Math.min(0.62 * chord + 0.18 * rise, 0.82 * hS * norm);
    const b = Math.min(0.62 * chord + 0.18 * rise, 0.82 * hE);
    return {
      sx,
      p1x: sx + (a * m) / norm,
      p1h: hS - a / norm,
      p2h: hE - b,
    };
  };

  const T = half(top);
  const B = half(bottom);
  const c = ART_CY;
  const f = (n: number) => n.toFixed(2);
  const wx = wallX + 40; // runs under the card, never visible
  const inX = apex - 30; // runs inside the ring body, never visible

  return (
    `M${f(T.sx)} ${f(c - hS)}` +
    `C${f(T.p1x)} ${f(c - T.p1h)} ${f(wallX)} ${f(c - T.p2h)} ${f(wallX)} ${f(c - hE)}` +
    `L${f(wx)} ${f(c - hE)}L${f(wx)} ${f(c + hE)}L${f(wallX)} ${f(c + hE)}` +
    `C${f(wallX)} ${f(c + B.p2h)} ${f(B.p1x)} ${f(c + B.p1h)} ${f(B.sx)} ${f(c + hS)}` +
    `L${f(inX)} ${f(c)}Z`
  );
}