"use client";

/**
 * NeonReveal: standalone replica of the React Bits Pro "Neon Reveal" background.
 * No dependencies beyond React. Canvas 2D only.
 *
 * What the reference does (frame-by-frame observation):
 *  1. A faint hairline outline of each tube is visible while "off".
 *  2. The tube ignites as a small glowing dot at its centre and STUTTERS (flicker).
 *  3. The lit segment grows out from the centre along the tube, and the light lobe
 *     grows with it: a small blob first, then an ellipse that sweeps across the frame.
 *  4. Colour of the light: tube colour (cream) right at the tube -> light colour (rose)
 *     -> a deep crimson shade -> background. Two lobes (mirrored) add up in the middle.
 *  5. Content sits ABOVE the light, so dark text only becomes readable where it is lit.
 *  6. Click: light cuts out, the tube collapses to a dot, stutters back on, replays.
 *  7. A slow "hum" breathes the lit tube/light.
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

/* ───────────────────────── helpers ───────────────────────── */

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

function parseColor(input: string): RGB {
  let h = input.trim();
  if (h.startsWith("#")) {
    h = h.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h.slice(0, 6), 16);
    if (!Number.isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = h.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((s) => parseFloat(s));
    return [p[0] || 0, p[1] || 0, p[2] || 0];
  }
  return [0, 0, 0];
}

const mixRGB = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** 256-step colour ramp: intensity 0..1 -> straight-alpha RGBA (works on any background) */
function buildRamp(tube: RGB, light: RGB): Uint8ClampedArray {
  // deep shade of the light colour: darker and pushed toward magenta, as in the reference
  const deep: RGB = [light[0] * 0.8, light[1] * 0.12, light[2] * 0.55];
  const dark: RGB = [light[0] * 0.2, light[1] * 0.02, light[2] * 0.1];
  const stops: { t: number; c: RGB }[] = [
    { t: 0.0, c: [0, 0, 0] },
    { t: 0.16, c: dark },
    { t: 0.4, c: deep },
    { t: 0.62, c: light },
    { t: 0.86, c: mixRGB(light, tube, 0.7) },
    { t: 1.0, c: tube },
  ];
  const out = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1].t) k++;
    const a = stops[k];
    const b = stops[k + 1];
    const c = mixRGB(a.c, b.c, smooth((t - a.t) / (b.t - a.t)));
    const mx = Math.max(c[0], c[1], c[2], 1);
    // premultiplied -> straight: colour normalised, alpha carries brightness
    out[i * 4] = (c[0] / mx) * 255;
    out[i * 4 + 1] = (c[1] / mx) * 255;
    out[i * 4 + 2] = (c[2] / mx) * 255;
    out[i * 4 + 3] = mx;
  }
  return out;
}

const OPPOSITE: Record<NeonDirection, NeonDirection> = { down: "up", up: "down", left: "right", right: "left" };

/** stutter pattern while the tube switches on. 0..1 brightness. */
function stutter(ms: number, span: number, amount: number): number {
  const p = clamp(ms / span);
  if (amount <= 0) return smooth(p);
  const step = Math.floor(ms / 48);
  const on = hash(step * 1.37 + 5.1) < Math.pow(p, 0.7) * 0.9 + 0.05;
  const raw = on ? 0.55 + 0.45 * hash(step + 9.2) : 0.04;
  const forced = smooth((p - 0.8) / 0.2); // always settles on
  return lerp(lerp(smooth(p), raw, amount), 1, forced);
}

/* ───────────────────────── component ───────────────────────── */

const LIGHT_SCALE = 0.25; // light field is computed at 1/4 resolution and upscaled (smooth gradient, cheap)
const IGNITE_MS = 520;
const CUT_MS = 240;

type Phase = "off" | "run" | "cut";

export const NeonReveal = forwardRef<NeonRevealHandle, NeonRevealProps>(function NeonReveal(props, ref) {
  const {
    colors = ["#FF9FFC", "#B163E9"],
    backgroundColor = "transparent",
    direction = "down",
    expandFrom = "center",
    trigger = "mount",
    revealDelay = 0,
    revealDuration = 2500,
    easing = "out",
    thickness = 3,
    glow = 1,
    spill = 1,
    reach = 1,
    intensity = 1,
    feather = 0.15,
    inset = 24,
    length = 0.9,
    mirrored = false,
    hum = 1,
    flicker = 1,
    interactive = true,
    intro = true,
    paused = false,
    dpr = 2,
    scrollThreshold = 0.3,
    onStart,
    onComplete,
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
    t0: 0, // virtual time the current run started
    clock: 0, // virtual clock (freezes when paused)
    kick: -1e9, // last click-during-reveal time
    started: false,
    done: false,
    visible: true,
    last: 0,
    w: 0,
    h: 0,
    dpr: 1,
    ramp: null as Uint8ClampedArray | null,
    rampKey: "",
    off: null as HTMLCanvasElement | null,
    img: null as ImageData | null,
    raf: 0,
  });

  const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* ── start / replay ── */
  const play = useCallback(() => {
    const s = S.current;
    s.phase = "run";
    s.t0 = s.clock;
    s.started = false;
    s.done = false;
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({ replay: () => cutThenPlay() }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const cutThenPlay = () => {
    const s = S.current;
    if (s.phase === "off") return play();
    s.phase = "cut";
    s.t0 = s.clock;
    wake();
  };

  /* ── draw ── */
  const draw = (dtMs: number) => {
    const s = S.current;
    const P = propsRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !s.w || !s.h) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!P.paused) s.clock += dtMs;
    const W = s.w;
    const H = s.h;
    const dprNow = s.dpr;
    const tubeRGB = parseColor((P.colors ?? colors)[0]);
    const lightRGB = parseColor((P.colors ?? colors)[1]);
    const key = `${tubeRGB}|${lightRGB}`;
    if (s.rampKey !== key || !s.ramp) {
      s.ramp = buildRamp(tubeRGB, lightRGB);
      s.rampKey = key;
    }

    const D = P.revealDelay ?? 0;
    const T = Math.max(50, P.revealDuration ?? 2500);
    const ease = EASE[P.easing ?? "out"] ?? EASE.out;
    const flickerAmt = clamp(P.flicker ?? 1);
    const ign = flickerAmt > 0 ? IGNITE_MS : 160;

    /* ── timeline -> tubeLevel / grow / sweep / lightLevel ── */
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
          grow = ease(clamp(tt / 0.4));
          sweep = ease(clamp(tt));
          // the light "catches" with a short stutter right after the tube is fully on
          lightLevel = stutter(e - ign, 420, flickerAmt * 0.8) * 1;
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

    // click while revealing makes the tube/light stutter
    const sinceKick = s.clock - s.kick;
    if (sinceKick < 420 && s.phase === "run") {
      const k = stutter(sinceKick, 420, 1);
      tubeLevel *= lerp(0.15, 1, k);
      lightLevel *= lerp(0.1, 1, k);
    }

    // hum: slow breathing of the lit tube and light
    const humAmt = clamp(P.hum ?? 1, 0, 2);
    const breathe = 0.5 + 0.5 * Math.sin((s.clock / 1000) * 2.1) * 0.8 + 0.1 * Math.sin((s.clock / 1000) * 5.3);
    const humMul = 1 - 0.07 * humAmt * breathe;
    tubeLevel *= humMul;
    lightLevel *= 1 - 0.05 * humAmt * breathe;

    /* ── background ── */
    ctx.setTransform(dprNow, 0, 0, dprNow, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    if (P.backgroundColor && P.backgroundColor !== "transparent") {
      ctx.fillStyle = P.backgroundColor;
      ctx.fillRect(0, 0, W, H);
    }

    /* ── tube geometry ── */
    const dir = P.direction ?? "down";
    const dirs: NeonDirection[] = P.mirrored ? [dir, OPPOSITE[dir]] : [dir];
    const ins = P.inset ?? 24;
    const lenFrac = clamp(P.length ?? 0.9, 0.05, 1);
    const thick = P.thickness ?? 3;
    const gl = P.glow ?? 1;
    const expand = P.expandFrom ?? "center";
    const horizontalAxis = (d: NeonDirection) => d === "down" || d === "up";

    type Tube = {
      vertical: boolean; // tube runs vertically (left/right directions)
      pos: number; // x (vertical) or y (horizontal) of the tube line
      sgn: number; // +1 light goes toward +axis
      A: number; // along extent
      Pp: number; // perpendicular extent
      lo: number;
      hi: number;
      t0: number;
      t1: number;
    };

    const tubes: Tube[] = dirs.map((d) => {
      const vertical = !horizontalAxis(d);
      const A = vertical ? H : W;
      const Pp = vertical ? W : H;
      let pos: number;
      let sgn: number;
      if (d === "right") (pos = ins), (sgn = 1);
      else if (d === "left") (pos = W - ins), (sgn = -1);
      else if (d === "down") (pos = ins), (sgn = 1);
      else (pos = H - ins), (sgn = -1);
      const len = A * lenFrac;
      const t0 = (A - len) / 2;
      const t1 = t0 + len;
      const ln = len * grow;
      let lo: number;
      let hi: number;
      if (expand === "center") (lo = A / 2 - ln / 2), (hi = A / 2 + ln / 2);
      else if (expand === "left") (lo = t0), (hi = t0 + ln);
      else (hi = t1), (lo = t1 - ln);
      return { vertical, pos, sgn, A, Pp, lo, hi, t0, t1 };
    });

    /* ── light field (low-res, per pixel) ── */
    const spillAmt = (P.spill ?? 1) * (P.intensity ?? 1) * lightLevel;
    if (spillAmt > 0.002 && sweep > 0.002) {
      const lw = Math.max(2, Math.ceil(W * LIGHT_SCALE));
      const lh = Math.max(2, Math.ceil(H * LIGHT_SCALE));
      if (!s.off || s.off.width !== lw || s.off.height !== lh) {
        s.off = document.createElement("canvas");
        s.off.width = lw;
        s.off.height = lh;
        s.img = null;
      }
      const octx = s.off.getContext("2d")!;
      if (!s.img) s.img = octx.createImageData(lw, lh);
      const data = s.img.data;
      const ramp = s.ramp!;
      const reachAmt = P.reach ?? 1;
      const soft = 1 + clamp(P.feather ?? 0.15, 0, 1) * 2;

      // per-tube reach radii
      const prep = tubes.map((t) => ({
        Rb: Math.max(1, t.Pp * 0.78 * reachAmt * sweep * soft),
        Ra: Math.max(1, t.A * 0.5 * (0.35 + 0.65 * sweep)),
      }));

      for (let j = 0; j < lh; j++) {
        const y = (j + 0.5) / LIGHT_SCALE;
        for (let i = 0; i < lw; i++) {
          const x = (i + 0.5) / LIGHT_SCALE;
          let rem = 1;
          for (let k = 0; k < tubes.length; k++) {
            const t = tubes[k];
            const r = prep[k];
            let a: number;
            let b: number;
            if (t.vertical) {
              a = H - y;
              b = t.sgn * (x - t.pos);
            } else {
              a = x;
              b = t.sgn * (y - t.pos);
            }
            if (b < 0) b = -b * 2.5; // spill behind the tube dies quickly
            const da = a < t.lo ? t.lo - a : a > t.hi ? a - t.hi : 0;
            const q = Math.sqrt((b / r.Rb) * (b / r.Rb) + (da / r.Ra) * (da / r.Ra));
            if (q < 1) {
              const I = Math.pow(1 - q, 1.28);
              rem *= 1 - clamp(I * spillAmt);
            }
          }
          let I = 1 - rem;
          // tiny noise to kill banding on the long smooth gradients
          I = clamp(I + (hash(i * 7.31 + j * 13.17) - 0.5) / 255);
          const idx = ((I * 255) | 0) * 4;
          const o = (j * lw + i) * 4;
          data[o] = ramp[idx];
          data[o + 1] = ramp[idx + 1];
          data[o + 2] = ramp[idx + 2];
          data[o + 3] = ramp[idx + 3];
        }
      }
      octx.putImageData(s.img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(s.off, 0, 0, W, H);
    }

    /* ── tubes ── */
    const tint = (a: number) => `rgba(${tubeRGB[0] | 0},${tubeRGB[1] | 0},${tubeRGB[2] | 0},${clamp(a)})`;
    const lightTint = (a: number) => `rgba(${lightRGB[0] | 0},${lightRGB[1] | 0},${lightRGB[2] | 0},${clamp(a)})`;
    const toXY = (t: Tube, a: number): [number, number] => (t.vertical ? [t.pos, H - a] : [a, t.pos]);

    for (const t of tubes) {
      ctx.lineCap = "round";
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;

      // faint hairline outline of the (unlit) tube
      {
        const [x0, y0] = toXY(t, t.t0);
        const [x1, y1] = toXY(t, t.t1);
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      if (tubeLevel <= 0.003) continue;
      const lit = (P.intensity ?? 1) * tubeLevel;
      const [x0, y0] = toXY(t, t.lo);
      const [x1, y1] = toXY(t, t.hi);
      const dot = t.hi - t.lo < 0.5;

      ctx.globalCompositeOperation = "lighter";

      // wide soft halo (light colour)
      ctx.shadowColor = lightTint(0.9);
      ctx.shadowBlur = (16 + 34 * gl) * dprNow * lit;
      ctx.strokeStyle = lightTint(0.35 * gl * lit);
      ctx.lineWidth = thick + 4 * gl;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1 + (dot ? 0.01 : 0), y1);
      ctx.stroke();

      // tube body (tube colour) with tight glow
      ctx.shadowColor = tint(1);
      ctx.shadowBlur = (6 + 12 * gl) * dprNow * lit;
      ctx.strokeStyle = tint(0.95 * lit);
      ctx.lineWidth = dot ? thick * 1.6 : thick;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1 + (dot ? 0.01 : 0), y1);
      ctx.stroke();

      // hot core
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255,250,240,${clamp(0.85 * lit)})`;
      ctx.lineWidth = Math.max(1, thick * 0.38);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1 + (dot ? 0.01 : 0), y1);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
  };

  /* ── loop ── */
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

  /* ── sizing ── */
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
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
      s.off = null;
      s.img = null;
      draw(0);
      wake();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(S.current.raf);
      S.current.raf = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── trigger ── */
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
    // manual: waits for replay() or click
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, scrollThreshold]);

  /* pause the loop when scrolled away (mount/manual triggers) */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || trigger === "inView") return;
    const io = new IntersectionObserver(([e]) => {
      S.current.visible = e.isIntersecting;
      if (e.isIntersecting) wake();
    });
    io.observe(root);
    return () => io.disconnect();
  }, [trigger]);

  /* re-render once when paused toggles or visual props change */
  useEffect(() => {
    draw(0);
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, colors[0], colors[1], backgroundColor, direction, mirrored, thickness, glow, spill, reach, intensity, feather, inset, length, hum, expandFrom]);

  /* ── click to re-ignite ── */
  const onClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    const target = e.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select,summary,[role='button'],[role='link']")) return;
    const s = S.current;
    if (s.phase === "run" && !s.done) {
      s.kick = s.clock; // mid-reveal: just make it stutter
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
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, display: "block", pointerEvents: "none" }} />
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
            // matches the reference: dark content is only readable where the light reaches
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
