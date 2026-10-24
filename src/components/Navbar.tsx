"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { m, animate, useMotionValue, AnimatePresence, Variants } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { useIntro } from "@/context/IntroContext";

/* ════════════════════════════════════════════════════════════════════════════
   LIQUID GLASS NAVBAR  (look + behaviour modelled on the "liquid glass switcher")

   Glass recipe (same on the desktop pill, the theme drop and the mobile bar):
     • light glass tint (12% of #bbbbbc, constant, like the reference)
     • backdrop-filter: blur(8px) -> edge refraction (SVG displacement map)
       -> saturate(150%)
     • a stack of inset box-shadows: light + dark reflections on the rim and a
       soft drop shadow under the glass
   Active item: a tinted glass pill that slides behind the text, always inside
   the bar. It slides with 400ms cubic-bezier(1, 0, .4, 1) and stretches
   (scaleX 1 -> 1.1 -> 1) from the side it is travelling toward.

   Load sequence: glass stays invisible until tiles are decoded + theme is
   resolved -> glass fades in as the sphere -> pill stretches out.
   ════════════════════════════════════════════════════════════════════════════ */

type Phase = "top" | "pill" | "sphere";
type Controls = { stop: () => void };
type RGBA = [number, number, number, number];

/* ── Layout tunables ─────────────────────────────────────────────────────── */
const CANVAS_W = 1400; // drawing area of the liquid shape (centered on page)
const CANVAS_H = 104;
const OX = CANVAS_W / 2; // x = 0 (page center) inside the canvas
const CY = 52; // vertical center of pill + drop (top edge of the 64px pill = 20px)
const SEP_D = 78; // resting distance: pill right-cap center -> drop center
const EDGE_PAD = 22; // inner padding of the pill for logo / buttons
const HL_PAD = 2; // highlighter extends this far past the active link on each side
const HL_INSET = 26; // highlighter is this much shorter than the bar (13px top + 13px bottom)
const INTRO_DELAY = 450; // ms between the sphere appearing and the pill stretching out
const GLASS_FADE = "opacity .5s cubic-bezier(1, 0, 0.4, 1)";

/* ── Glass tunables ──────────────────────────────────────────────────────── */
const ENABLE_REFRACTION = true; // false = frost + rim only (no edge bending)
const TONE_MAP = false; // false = exact reference look. true = legibility tone curves (darkens/lifts backdrop)
type Profile = { bezel: number; maxDisp: number; power: number };
const GLASS = {
  blur: 8, // px, same as the reference
  saturate: "150%",
  preBlur: 2, // px, small extra softening of the refracted backdrop (reference: feGaussianBlur)
  aberration: 0, // 0 = clean edge like the reference. Try 0.12 for a rainbow fringe.
  main: { bezel: 0.55, maxDisp: 18, power: 2.2 } as Profile, // edge bending profile
  /* Only used when TONE_MAP = true */
  curveDark: [0, 0.07, 0.14, 0.2, 0.26, 0.3, 0.34, 0.36, 0.38, 0.39, 0.4],
  curveLight: [0.5, 0.54, 0.58, 0.63, 0.69, 0.75, 0.81, 0.87, 0.92, 0.96, 1],
};

const SIZE_SPRING = { type: "spring" as const, stiffness: 200, damping: 27, mass: 1, restDelta: 0.05, restSpeed: 0.05 };
const LOOK_SPRING = { type: "spring" as const, stiffness: 120, damping: 24, restDelta: 0.002, restSpeed: 0.002 };
const SLIDE = { duration: 0.4, ease: [1, 0, 0.4, 1] as [number, number, number, number] };

/* Glass tint per phase (top, pill, sphere). Reference: --c-glass (#bbbbbc) at 12%, always. */
const LOOKS: Record<"dark" | "light", RGBA[]> = {
  dark: [
    [187, 187, 188, 0.12],
    [187, 187, 188, 0.12],
    [187, 187, 188, 0.12],
  ],
  light: [
    [187, 187, 188, 0.12],
    [187, 187, 188, 0.12],
    [187, 187, 188, 0.12],
  ],
};

const mix = (a: RGBA, b: RGBA, t: number): RGBA => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
  a[3] + (b[3] - a[3]) * t,
];
const rgba = (c: RGBA) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;

/* ── Edge refraction map (Chromium only; others get frost + rim) ─────────────
   Built once from small tiles. Every pixel stores a vector pointing from the
   glass edge toward its centre, strongest at the edge, so the background looks
   bent along the rim. The tiles are placed on the live shape every frame, so
   the bend always hugs the real edge, whatever the width.                   */
type TileKind = "capL" | "capR" | "strip" | "disc";
const MAP_S = 2; // supersampling
const REF_R = 32; // reference radius the tiles are drawn at

function makeTileData(kind: TileKind, P: Profile): { w: number; h: number; data: Uint8ClampedArray } {
  const R = REF_R;
  const w = kind === "strip" ? 4 : kind === "disc" ? 2 * R * MAP_S : R * MAP_S;
  const h = 2 * R * MAP_S;
  const data = new Uint8ClampedArray(w * h * 4);
  const b = P.bezel * R;
  const M = P.maxDisp;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const x = (i + 0.5) / MAP_S;
      const y = (j + 0.5) / MAP_S;
      let vx = 0;
      let vy = 0;
      let alpha = 1;
      if (kind === "strip") {
        const dEdge = Math.min(y, 2 * R - y);
        const t = Math.min(1, dEdge / b);
        vy = (y < R ? 1 : -1) * M * Math.pow(1 - t, P.power);
      } else {
        const cx = kind === "capR" ? 0 : R;
        const dist = Math.hypot(x - cx, y - R);
        alpha = Math.min(1, Math.max(0, R - dist + 0.5));
        if (dist > 0.001) {
          const t = Math.min(1, Math.max(0, R - dist) / b);
          const mag = M * Math.pow(1 - t, P.power);
          vx = ((cx - x) / dist) * mag;
          vy = ((R - y) / dist) * mag;
        }
      }
      const k = (j * w + i) * 4;
      data[k] = Math.round(127.5 + (127.5 * vx) / M);
      data[k + 1] = Math.round(127.5 + (127.5 * vy) / M);
      data[k + 2] = 128;
      data[k + 3] = Math.round(alpha * 255);
    }
  }
  return { w, h, data };
}

const tileCache: Partial<Record<TileKind, HTMLCanvasElement>> = {};
function tileCanvas(kind: TileKind): HTMLCanvasElement | null {
  const hit = tileCache[kind];
  if (hit) return hit;
  const { w, h, data } = makeTileData(kind, GLASS.main);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(w, h);
  img.data.set(data);
  ctx.putImageData(img, 0, 0);
  tileCache[kind] = c;
  return c;
}

/* A full stadium map of any size (used by the mobile bar). */
function composeStadiumMap(w: number, h: number): string | null {
  const strip = tileCanvas("strip");
  const capL = tileCanvas("capL");
  const capR = tileCanvas("capR");
  if (!strip || !capL || !capR) return null;
  const S = 2;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * S));
  c.height = Math.max(1, Math.round(h * S));
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "rgb(128,128,128)";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = "high";
  const R = h / 2;
  ctx.drawImage(strip, (R - 0.5) * S, 0, (w - 2 * R + 1) * S, h * S);
  ctx.drawImage(capL, 0, 0, R * S, h * S);
  ctx.drawImage(capR, (w - R) * S, 0, R * S, h * S);
  return c.toDataURL("image/png");
}

type TileEls = {
  strip: SVGFEImageElement | null;
  capL: SVGFEImageElement | null;
  capR: SVGFEImageElement | null;
  disc: SVGFEImageElement | null;
};
/* Moves the map tiles onto the live shape (attribute writes only, no layout). */
function placeTiles(fi: TileEls, left: number, w: number, R: number, cy: number) {
  const place = (el: SVGFEImageElement | null, x: number, wd: number) => {
    if (!el) return;
    el.setAttribute("x", x.toFixed(2));
    el.setAttribute("y", (cy - R).toFixed(2));
    el.setAttribute("width", Math.max(0, wd).toFixed(2));
    el.setAttribute("height", (2 * R).toFixed(2));
  };
  place(fi.strip, left + R - 0.5, w - 2 * R + 1);
  place(fi.capL, left, R);
  place(fi.capR, left + w - R, R);
}

/* Chromium can bend the backdrop with an SVG filter. Safari / Firefox get frost + rim only. */
function canRefract(): boolean {
  const nav = navigator as Navigator & {
    userAgentData?: { brands: { brand: string }[] };
    deviceMemory?: number;
  };
  const chromium = nav.userAgentData
    ? nav.userAgentData.brands.some((b) => /Chromium/i.test(b.brand))
    : /Chrome\//.test(nav.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(nav.userAgent);
  const weak = (nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2;
  const noTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
  return ENABLE_REFRACTION && chromium && !weak && !noTransparency;
}
function canBackdrop(): boolean {
  return (
    typeof CSS !== "undefined" &&
    (CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)"))
  );
}

/* Builds + DECODES every edge-map tile before the glass is shown, so the filter
   never renders a frame without its map (that was part of the load glitch). */
async function prepareGlass(): Promise<{ boost: number; urls: Record<TileKind, string> | null }> {
  const contrast = window.matchMedia("(prefers-contrast: more)").matches;
  const lowTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
  const ok = canRefract();
  const boost = (canBackdrop() ? 0 : 0.28) + (contrast ? 0.18 : 0) + (lowTransparency ? 0.55 : 0) + (ok ? 0 : 0.18);
  if (!ok) return { boost, urls: null };

  const kinds: TileKind[] = ["disc", "strip", "capL", "capR"];
  const urls: Partial<Record<TileKind, string>> = {};
  for (const k of kinds) {
    const c = tileCanvas(k);
    if (!c) return { boost, urls: null };
    urls[k] = c.toDataURL("image/png");
  }
  const decode = (url: string) => {
    const img = new Image();
    img.src = url;
    return img.decode ? img.decode().catch(() => undefined) : Promise.resolve();
  };
  await Promise.race([
    Promise.all(kinds.map((k) => decode(urls[k] as string))),
    new Promise((r) => setTimeout(r, 800)),
  ]);
  return { boost, urls: urls as Record<TileKind, string> };
}

/* Backdrop recipes. Reference order: blur -> refraction -> saturate.
   Without the SVG chain: frost + brightness (still readable, less vivid).    */
const chainBackdrop = (id: string) => `blur(${GLASS.blur}px) url(#${id}) saturate(${GLASS.saturate})`;
const fallbackBackdrop = (theme: "dark" | "light") =>
  `blur(${GLASS.blur}px) saturate(${GLASS.saturate}) brightness(${theme === "dark" ? 0.55 : 1.1})`;

/* Glass rim + highlighter styling: the same box-shadow stacks as the reference. */
const GLASS_CSS = `
[data-lg]{--c-glass:#bbbbbc;--c-light:#fff;--c-dark:#000}
[data-lg="light"]{--glass-reflex-dark:1;--glass-reflex-light:1}
[data-lg="dark"]{--glass-reflex-dark:2;--glass-reflex-light:.3}

.lg-shade{
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb,var(--c-light) calc(var(--glass-reflex-light) * 10%),transparent),
    inset 1.8px 3px 0px -2px color-mix(in srgb,var(--c-light) calc(var(--glass-reflex-light) * 90%),transparent),
    inset -2px -2px 0px -2px color-mix(in srgb,var(--c-light) calc(var(--glass-reflex-light) * 80%),transparent),
    inset -3px -8px 1px -6px color-mix(in srgb,var(--c-light) calc(var(--glass-reflex-light) * 60%),transparent),
    inset -0.3px -1px 4px 0px color-mix(in srgb,var(--c-dark) calc(var(--glass-reflex-dark) * 12%),transparent),
    inset -1.5px 2.5px 0px -2px color-mix(in srgb,var(--c-dark) calc(var(--glass-reflex-dark) * 20%),transparent),
    inset 0px 3px 4px -2px color-mix(in srgb,var(--c-dark) calc(var(--glass-reflex-dark) * 20%),transparent),
    inset 2px -6.5px 1px -4px color-mix(in srgb,var(--c-dark) calc(var(--glass-reflex-dark) * 10%),transparent),
    0px 1px 5px 0px color-mix(in srgb,var(--c-dark) calc(var(--glass-reflex-dark) * 10%),transparent),
    0px 6px 16px 0px color-mix(in srgb,var(--c-dark) calc(var(--glass-reflex-dark) * 8%),transparent);
}
.lg-hl{
  background-color:color-mix(in srgb,var(--c-glass) 36%,transparent);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb,var(--c-light) calc(var(--glass-reflex-light) * 10%),transparent),
    inset 2px 1px 0px -1px color-mix(in srgb,var(--c-light) calc(var(--glass-reflex-light) * 90%),transparent),
    inset -1.5px -1px 0px -1px color-mix(in srgb,var(--c-light) calc(var(--glass-reflex-light) * 80%),transparent),
    inset -2px -6px 1px -5px color-mix(in srgb,var(--c-light) calc(var(--glass-reflex-light) * 60%),transparent),
    inset -1px 2px 3px -1px color-mix(in srgb,var(--c-dark) calc(var(--glass-reflex-dark) * 20%),transparent),
    inset 0px -4px 1px -2px color-mix(in srgb,var(--c-dark) calc(var(--glass-reflex-dark) * 10%),transparent),
    0px 3px 6px 0px color-mix(in srgb,var(--c-dark) calc(var(--glass-reflex-dark) * 8%),transparent);
}

/* Link text. The label reserves the BOLD width so switching the active item never
   changes the width of the link row (that used to interrupt the highlighter slide). */
.lg-link{color:var(--text-primary);color:color-mix(in srgb,var(--text-primary) 82%,transparent);transition:color .25s ease}
.lg-link:hover,.lg-link-active{color:var(--text-primary)}
.lg-link-active{font-weight:700}
.lg-label{display:inline-flex;flex-direction:column;align-items:center}
.lg-label::after{content:attr(data-label);font-weight:700;height:0;overflow:hidden;visibility:hidden;pointer-events:none;user-select:none}

/* Text stays readable on any background: very soft halo opposite to the text tone */
.lg-ink[data-lg="dark"]{text-shadow:0 1px 2px rgba(0,0,0,.25)}
.lg-ink[data-lg="dark"] svg.lucide{filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))}
.lg-ink[data-lg="light"]{text-shadow:0 1px 1px rgba(255,255,255,.35)}
.lg-ink[data-lg="light"] svg.lucide{filter:drop-shadow(0 1px 1px rgba(255,255,255,.4))}
.lg-ink .lg-noink,.lg-ink .lg-noink *{text-shadow:none}
.lg-ink .lg-noink svg.lucide{filter:none}
`;

/* Edge bend (+ optional rainbow fringe) (+ optional tone curve). Reads the "map" result. */
function bendChain(scale: number, curve: number[]) {
  const ab = GLASS.aberration;
  const table = curve.join(" ");
  const pre = <feGaussianBlur in="SourceGraphic" stdDeviation={GLASS.preBlur} result="src" />;
  const tone = TONE_MAP ? (
    <feComponentTransfer in="bent">
      <feFuncR type="table" tableValues={table} />
      <feFuncG type="table" tableValues={table} />
      <feFuncB type="table" tableValues={table} />
    </feComponentTransfer>
  ) : null;
  if (ab <= 0) {
    return (
      <>
        {pre}
        <feDisplacementMap in="src" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result="bent" />
        {tone}
      </>
    );
  }
  const keep = (r: number, g: number, b: number) => `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
  return (
    <>
      {pre}
      <feDisplacementMap in="src" in2="map" scale={scale * (1 + ab)} xChannelSelector="R" yChannelSelector="G" result="dR" />
      <feColorMatrix in="dR" type="matrix" values={keep(1, 0, 0)} result="cR" />
      <feDisplacementMap in="src" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result="dG" />
      <feColorMatrix in="dG" type="matrix" values={keep(0, 1, 0)} result="cG" />
      <feDisplacementMap in="src" in2="map" scale={scale * (1 - ab)} xChannelSelector="R" yChannelSelector="G" result="dB" />
      <feColorMatrix in="dB" type="matrix" values={keep(0, 0, 1)} result="cB" />
      <feBlend in="cR" in2="cG" mode="screen" result="rg" />
      <feBlend in="rg" in2="cB" mode="screen" result="bent" />
      {tone}
    </>
  );
}

/* ── Liquid geometry ──────────────────────────────────────────────────────────
   A stadium (the pill) + a circle (the theme drop) of the same radius on one
   horizontal axis. While they are close, a metaball "neck" bridges them.
   w,h  = pill size   D = distance from the pill's right cap center to the drop
   nu   = neck strength (1 = fully attached, 0 = detached)                      */
function buildLiquidPath(w: number, h: number, D: number, nu: number): string {
  const R = h / 2;
  const width = Math.max(w, 2 * R);
  const xL = OX - width / 2 + R;
  const xR = OX + width / 2 - R;
  const d = Math.max(0, D);
  const xS = xR + d;
  const cy = CY;
  const f = (n: number) => Math.round(n * 100) / 100;

  const dCap = 2 * R + 64;
  const s = Math.min(1, d / dCap);
  const stretch = R * nu * Math.pow(1 - s, 1.4);
  const overlap = R * Math.max(0, 1 - d / (2.1 * R));
  const n = Math.max(stretch, overlap);

  const stadium =
    `M${f(xL)} ${f(cy - R)}H${f(xR)}A${f(R)} ${f(R)} 0 0 1 ${f(xR)} ${f(cy + R)}` +
    `H${f(xL)}A${f(R)} ${f(R)} 0 0 1 ${f(xL)} ${f(cy - R)}Z`;

  if (n < 0.6) {
    // Detached: two separate sub-paths (no inner outlines).
    return (
      stadium +
      `M${f(xS)} ${f(cy - R)}A${f(R)} ${f(R)} 0 0 1 ${f(xS)} ${f(cy + R)}A${f(R)} ${f(R)} 0 0 1 ${f(xS)} ${f(cy - R)}Z`
    );
  }

  // Solve the join angle so the neck is a smooth concave bridge.
  const lo0 = Math.max(0.2, Math.acos(Math.min(1, d / (2 * R))));
  const hi0 = Math.PI / 2;
  const fAt = (phi: number) => {
    const gg = d - 2 * R * Math.cos(phi);
    return (0.25 * gg * Math.cos(phi)) / Math.sin(phi) - (R * Math.sin(phi) - n);
  };
  let phi: number;
  if (fAt(hi0) >= 0) phi = hi0;
  else if (fAt(lo0) <= 0) phi = lo0;
  else {
    let lo = lo0;
    let hi = hi0;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (fAt(mid) > 0) lo = mid;
      else hi = mid;
    }
    phi = (lo + hi) / 2;
  }
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const p0x = xR + R * cosP;
  const p0y = cy - R * sinP;
  const p3x = xS - R * cosP;
  const g = Math.max(0, p3x - p0x);
  const a = g / (3 * sinP);
  const p1x = p0x + a * sinP;
  const p1y = p0y + a * cosP;
  const p2x = p3x - a * sinP;
  const p2y = p1y;
  const my = (y: number) => 2 * cy - y;

  return (
    `M${f(xL)} ${f(cy - R)}H${f(xR)}` +
    `A${f(R)} ${f(R)} 0 0 1 ${f(p0x)} ${f(p0y)}` +
    `C${f(p1x)} ${f(p1y)} ${f(p2x)} ${f(p2y)} ${f(p3x)} ${f(p0y)}` +
    `A${f(R)} ${f(R)} 0 1 1 ${f(p3x)} ${f(my(p0y))}` +
    `C${f(p2x)} ${f(my(p2y))} ${f(p1x)} ${f(my(p1y))} ${f(p0x)} ${f(my(p0y))}` +
    `A${f(R)} ${f(R)} 0 0 1 ${f(xR)} ${f(cy + R)}` +
    `H${f(xL)}A${f(R)} ${f(R)} 0 0 1 ${f(xL)} ${f(cy - R)}Z`
  );
}

/* The clip the glass layer must have from its very first paint (the 60px sphere).
   Without it the layer is an unclipped 1400x104 rectangle until the first draw. */
const INITIAL_PATH = buildLiquidPath(60, 60, 0, 1);

const phaseForScroll = (y: number): Phase => (y >= 250 ? "sphere" : y >= 50 ? "pill" : "top");

const NAV_LINKS = [
  { name: "Work", href: "/work" },
  { name: "Research", href: "/research" },
  { name: "Experience", href: "/experience" },
  { name: "Leadership", href: "/leadership" },
  { name: "About", href: "/about" },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function Navbar() {
  const { introDone } = useIntro();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("sphere");
  const [refract, setRefract] = useState(false);
  const [tiles, setTiles] = useState<Record<TileKind, string> | null>(null);
  const [mobileMap, setMobileMap] = useState<{ url: string; w: number; h: number } | null>(null);
  const [boost, setBoost] = useState(0);
  const [glassReady, setGlassReady] = useState(false); // glass is built, decoded and may fade in
  const [pendingIdx, setPendingIdx] = useState<number | null>(null); // optimistic active item (set on click)

  const { setTheme, resolvedTheme } = useTheme();
  const currentTheme = mounted ? resolvedTheme : "dark";
  const expanded = phase !== "sphere";
  const glassTheme: "dark" | "light" = currentTheme === "light" ? "light" : "dark";
  const pathIdx = NAV_LINKS.findIndex((l) => pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href)));
  const activeIdx = pendingIdx ?? pathIdx;

  /* ── Spring-driven numbers (no React renders while these animate) ── */
  const W = useMotionValue(60); // pill width
  const H = useMotionValue(60); // pill height
  const DV = useMotionValue(0); // drop distance (0 = merged inside the pill)
  const NU = useMotionValue(1); // neck strength
  const LOOK = useMotionValue(2); // 0 top, 1 pill, 2 sphere (tint blend)
  const PULSE = useMotionValue(0); // jelly wobble
  const HOVER = useMotionValue(0);
  const LX = useMotionValue(0); // highlighter: left edge (px from page center)
  const RX = useMotionValue(0); // highlighter: right edge
  const LS = useMotionValue(0); // highlighter: stretch amount 0..1..0 while it slides
  const LO = useMotionValue(0); // highlighter: opacity

  /* ── DOM refs written to directly each frame ── */
  const blurRef = useRef<HTMLDivElement | null>(null);
  const pillShadeRef = useRef<HTMLDivElement | null>(null);
  const dropShadeRef = useRef<HTMLDivElement | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const fiRef = useRef<TileEls>({ disc: null, strip: null, capL: null, capR: null });
  const centerInnerRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const mobileBarRef = useRef<HTMLDivElement | null>(null);
  const boostRef = useRef(0);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const themeBtnRef = useRef<HTMLButtonElement | null>(null);

  const themeNameRef = useRef<"dark" | "light">("dark");
  const phaseRef = useRef<Phase>("sphere");
  const activeIdxRef = useRef(activeIdx);
  const expandedRef = useRef(expanded);
  activeIdxRef.current = activeIdx;
  expandedRef.current = expanded;
  const lensPlacedRef = useRef(false);
  const lensIdxRef = useRef(-1);
  const lensDirRef = useRef(1);
  const lensKRef = useRef(0.1);
  const loTargetRef = useRef(0);
  const slideUntilRef = useRef(0); // timestamp until which the highlighter is mid-slide
  const resyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dimsRef = useRef({ top: 1040, pill: 840 });
  const desktopRef = useRef(true);
  const reduceRef = useRef(false);
  const forcedRef = useRef(false);
  const progRef = useRef(false);
  const progTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctl = useRef<Record<string, Controls | undefined>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── Draw one frame of the main liquid shape ── */
  const render = useCallback(() => {
    const back = blurRef.current;
    if (!back) return;
    const grow = PULSE.get() * 5 + HOVER.get() * 3;
    const baseW = W.get();
    const baseH = H.get();
    const h = baseH + grow * 2;
    const w = Math.max(baseW + grow * 2, h);
    const R = h / 2;
    const D = Math.max(0, DV.get());

    // Glass: clip the backdrop layer to the live liquid shape and tint it.
    const dStr = buildLiquidPath(w, h, D, NU.get());
    back.style.clipPath = `path("${dStr}")`;
    const set = LOOKS[themeNameRef.current];
    const L = Math.min(2, Math.max(0, LOOK.get()));
    const i = Math.min(1, Math.floor(L));
    back.style.backgroundColor = rgba(mix(set[i], set[i + 1], L - i));

    // Edge-bend map tiles follow the live shape.
    const fi = fiRef.current;
    if (fi.capL && fi.capR && fi.strip && fi.disc) {
      placeTiles(fi, OX - w / 2, w, R, CY);
      fi.disc.setAttribute("x", (OX + w / 2 - R + D - R).toFixed(2));
      fi.disc.setAttribute("y", (CY - R).toFixed(2));
      fi.disc.setAttribute("width", (D > 2 * R * 0.98 ? 2 * R : 0).toFixed(2));
      fi.disc.setAttribute("height", (2 * R).toFixed(2));
    }

    // Rim shading (inset box-shadows) for the pill and the theme drop.
    const ps = pillShadeRef.current;
    if (ps) {
      ps.style.width = `${w.toFixed(2)}px`;
      ps.style.height = `${h.toFixed(2)}px`;
      ps.style.transform = `translate3d(${(OX - w / 2).toFixed(2)}px,${(CY - h / 2).toFixed(2)}px,0)`;
    }
    const ds = dropShadeRef.current;
    if (ds) {
      const xS = OX + w / 2 - R + D;
      ds.style.width = `${(2 * R).toFixed(2)}px`;
      ds.style.height = `${(2 * R).toFixed(2)}px`;
      ds.style.transform = `translate3d(${(xS - R).toFixed(2)}px,${(CY - R).toFixed(2)}px,0)`;
      ds.style.opacity = clamp01((D - 2 * R * 0.9) / (2 * R * 0.3)).toFixed(3);
    }

    // Content is glued to the pill edges and moves on the GPU only.
    const hw = baseW / 2;
    if (leftRef.current) leftRef.current.style.transform = `translate3d(${(-hw + EDGE_PAD).toFixed(2)}px,-50%,0)`;
    if (rightRef.current)
      rightRef.current.style.transform = `translate3d(calc(${(hw - EDGE_PAD).toFixed(2)}px - 100%),-50%,0)`;
    if (logoRef.current)
      logoRef.current.style.transform = `translate3d(-50%,-50%,0) scale(${(1 + grow / 30).toFixed(3)})`;

    // Theme button rides on the drop.
    const btn = themeBtnRef.current;
    if (btn) {
      const xS = (Math.max(baseW, baseH) - baseH) / 2 + D;
      btn.style.transform = `translate3d(${(xS - 32).toFixed(2)}px,${CY - 32}px,0) scale(${(R / 32).toFixed(4)})`;
      const vis = clamp01((D - 30) / 40);
      btn.style.opacity = vis.toFixed(3);
      btn.style.pointerEvents = vis > 0.8 ? "auto" : "none";
    }
  }, [W, H, DV, NU, LOOK, PULSE, HOVER]);

  /* ── Draw the active-item highlighter (always inside the bar) ── */
  const renderLens = useCallback(() => {
    const el = lensRef.current;
    if (!el) return;
    const open = clamp01(LO.get());
    if (open < 0.01) {
      if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
      return;
    }
    if (el.style.visibility !== "visible") el.style.visibility = "visible";
    const hh = Math.max(2, H.get() - HL_INSET);
    let l = LX.get();
    let r = RX.get();
    // Stretch toward the side it is travelling to (scaleX 1 -> 1.1 -> 1 from that edge).
    const w2 = (r - l) * (1 + lensKRef.current * LS.get());
    if (lensDirRef.current > 0) r = l + w2;
    else l = r - w2;
    el.style.width = `${w2.toFixed(2)}px`;
    el.style.height = `${hh.toFixed(2)}px`;
    el.style.transform = `translate3d(${l.toFixed(2)}px,${(CY - hh / 2).toFixed(2)}px,0)`;
    el.style.opacity = open.toFixed(3);
  }, [LX, RX, LS, LO, H]);

  /* ── Controller helpers ── */
  const play = useCallback((key: string, mv: typeof W, to: number, opts: Parameters<typeof animate>[2]) => {
    ctl.current[key]?.stop();
    ctl.current[key] = animate(mv, to, opts as never) as Controls;
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const kickPulse = useCallback(
    (velocity: number) => {
      play("pulse", PULSE, 0.001, {
        type: "spring",
        velocity,
        stiffness: 420,
        damping: 10,
        restDelta: 0.004,
        restSpeed: 0.01,
      });
    },
    [play, PULSE]
  );

  /* ── Highlighter: slide to the active menu item ── */
  const syncLens = useCallback(
    (animateMove: boolean) => {
      const idx = activeIdxRef.current;
      const inner = centerInnerRef.current;
      const el = idx >= 0 ? linkRefs.current[idx] : null;
      if (expandedRef.current && el && inner) {
        const cx = el.offsetLeft + el.offsetWidth / 2 - inner.offsetWidth / 2;
        const wd = el.offsetWidth + 2 * HL_PAD;
        const l = cx - wd / 2;
        const r = cx + wd / 2;
        const closed = LO.get() < 0.05 || !lensPlacedRef.current;
        if (!animateMove || closed || reduceRef.current) {
          ctl.current["lx"]?.stop();
          ctl.current["rx"]?.stop();
          ctl.current["ls"]?.stop();
          LX.set(l);
          RX.set(r);
          LS.set(0);
        } else if (Math.abs(l - LX.get()) > 0.5 || Math.abs(r - RX.get()) > 0.5) {
          const steps = Math.max(1, Math.abs(idx - lensIdxRef.current));
          lensDirRef.current = cx > (LX.get() + RX.get()) / 2 ? 1 : -1;
          lensKRef.current = Math.min(0.2, 0.1 + 0.025 * (steps - 1));
          slideUntilRef.current = performance.now() + 600; // observers must not interrupt this slide
          play("lx", LX, l, SLIDE);
          play("rx", RX, r, SLIDE);
          ctl.current["ls"]?.stop();
          ctl.current["ls"] = animate(LS, [0, 1, 0], { duration: 0.44, ease: [0.25, 0.1, 0.25, 1] }) as Controls;
        }
        lensIdxRef.current = idx;
        lensPlacedRef.current = true;
        if (loTargetRef.current !== 1) {
          loTargetRef.current = 1;
          play("lo", LO, 1, { duration: 0.3, ease: [1, 0, 0.4, 1], delay: closed && animateMove ? 0.55 : 0 });
        }
      } else {
        if (!el) {
          lensPlacedRef.current = false;
          lensIdxRef.current = -1;
        }
        if (loTargetRef.current !== 0) {
          loTargetRef.current = 0;
          play("lo", LO, 0, { duration: 0.2, ease: "easeOut" });
        }
      }
    },
    [LX, RX, LS, LO, play]
  );

  const applyPhase = useCallback(
    (next: Phase, prev: Phase, instant: boolean) => {
      const dims = dimsRef.current;
      const t =
        next === "top"
          ? { w: dims.top, h: 64, look: 0 }
          : next === "pill"
          ? { w: dims.pill, h: 60, look: 1 }
          : { w: 60, h: 60, look: 2 };
      clearTimers();

      if (instant) {
        ["w", "h", "look", "d", "nu", "pulse"].forEach((k) => ctl.current[k]?.stop());
        W.set(t.w);
        H.set(t.h);
        LOOK.set(t.look);
        DV.set(next === "sphere" ? 0 : SEP_D);
        NU.set(next === "sphere" ? 1 : 0);
        PULSE.set(0);
        return;
      }

      play("w", W, t.w, SIZE_SPRING);
      play("h", H, t.h, SIZE_SPRING);
      play("look", LOOK, t.look, LOOK_SPRING);

      if (next === "sphere" && prev !== "sphere") {
        // MERGE: the drop is pulled into the logo sphere, neck forms, sphere jiggles.
        play("nu", NU, 1, { type: "spring", stiffness: 240, damping: 26 });
        play("d", DV, 0, { type: "spring", stiffness: 140, damping: 19, delay: 0.08, restDelta: 0.2, restSpeed: 0.2 });
        later(() => kickPulse(38), 430);
      } else if (next !== "sphere" && prev === "sphere") {
        // SEPARATE: drop stretches out of the pill, neck thins, snaps, drop bounces.
        const alreadyOut = DV.get() > 6;
        const delay = alreadyOut ? 0.04 : 0.5;
        if (!alreadyOut) NU.set(1);
        play("d", DV, SEP_D, { type: "spring", stiffness: 170, damping: 12, mass: 1, delay, restDelta: 0.2, restSpeed: 0.2 });
        play("nu", NU, 0, { type: "spring", stiffness: 120, damping: 17, delay: delay + 0.1 });
        later(() => kickPulse(-14), (delay + 0.2) * 1000);
      }
    },
    [W, H, DV, NU, LOOK, PULSE, play, later, clearTimers, kickPulse]
  );

  const go = useCallback(
    (next: Phase, instant = false) => {
      const prev = phaseRef.current;
      if (next === prev && !instant) return;
      phaseRef.current = next;
      setPhase(next);
      applyPhase(next, prev, instant || reduceRef.current);
    },
    [applyPhase]
  );

  /* Mobile bar: same glass, edge map sized to the bar */
  useEffect(() => {
    if (!introDone || !refract) return;
    const el = mobileBarRef.current;
    if (!el) return;
    const build = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const url = composeStadiumMap(w, h);
      if (url) setMobileMap((prev) => (prev && prev.w === w && prev.h === h ? prev : { url, w, h }));
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => ro.disconnect();
  }, [introDone, refract]);

  useEffect(() => {
    render();
    renderLens();
  }, [tiles, render, renderLens]);

  /* ── Draw whenever any value changes (batched: one draw per frame) ── */
  useEffect(() => {
    if (!introDone) return;
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        render();
      });
    };
    const unsubs = [W, H, DV, NU, LOOK, PULSE, HOVER].map((mv) => mv.on("change", schedule));
    render();
    return () => unsubs.forEach((u) => u());
  }, [introDone, render, W, H, DV, NU, LOOK, PULSE, HOVER]);

  useEffect(() => {
    if (!introDone) return;
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        renderLens();
      });
    };
    const unsubs = [LX, RX, LS, LO, H].map((mv) => mv.on("change", schedule));
    renderLens();
    return () => unsubs.forEach((u) => u());
  }, [introDone, renderLens, LX, RX, LS, LO, H]);

  useEffect(() => {
    themeNameRef.current = currentTheme === "light" ? "light" : "dark";
    render();
  }, [currentTheme, render, boost]);

  /* Highlighter follows the (optimistic) active item and the pill state */
  useEffect(() => {
    if (!introDone) return;
    syncLens(true);
  }, [introDone, pathname, expanded, activeIdx, syncLens]);

  /* Re-measure on resize / font load, but never interrupt a running slide */
  useEffect(() => {
    if (!introDone) return;
    const inner = centerInnerRef.current;
    if (!inner) return;
    const onChange = () => {
      const left = slideUntilRef.current - performance.now();
      if (left > 0) {
        if (resyncTimer.current) clearTimeout(resyncTimer.current);
        resyncTimer.current = setTimeout(() => syncLens(false), left + 30);
        return;
      }
      syncLens(false);
    };
    const ro = new ResizeObserver(onChange);
    ro.observe(inner);
    window.addEventListener("resize", onChange);
    document.fonts?.ready.then(onChange);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onChange);
      if (resyncTimer.current) clearTimeout(resyncTimer.current);
    };
  }, [introDone, syncLens]);

  /* ── Boot: build + decode the glass, fade it in as the sphere, then open the pill ── */
  useEffect(() => {
    if (!introDone) return;
    let cancelled = false;
    let startTimer: ReturnType<typeof setTimeout> | null = null;

    setMounted(true);
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const measure = () => {
      const vw = window.innerWidth;
      dimsRef.current = { top: Math.min(1040, vw - 180), pill: Math.min(840, vw - 180) };
      return vw >= 768;
    };
    desktopRef.current = measure();

    const start = () => {
      if (cancelled) return;
      setGlassReady(true); // glass + logo fade in as the sphere
      const target = phaseForScroll(window.scrollY || 0);
      if (target === "sphere") go("sphere", true);
      else startTimer = setTimeout(() => go(target), reduceRef.current ? 0 : INTRO_DELAY);
    };

    prepareGlass().then(({ boost: b, urls }) => {
      if (cancelled) return;
      boostRef.current = b;
      setBoost(b);
      if (urls) {
        setTiles(urls);
        setRefract(true);
      }
      // two frames: lets the filter + tiles commit and be placed before anything is visible
      requestAnimationFrame(() => requestAnimationFrame(start));
    });

    const onResize = () => {
      const wasDesktop = desktopRef.current;
      desktopRef.current = measure();
      if (!desktopRef.current) return;
      if (!wasDesktop) go(phaseForScroll(window.scrollY || 0), true);
      else applyPhase(phaseRef.current, phaseRef.current, true);
      render();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      if (startTimer) clearTimeout(startTimer);
      window.removeEventListener("resize", onResize);
      clearTimers();
      Object.values(ctl.current).forEach((c) => c?.stop());
      ctl.current = {};
    };
  }, [introDone, go, applyPhase, render, clearTimers]);

  /* ── Scroll: same thresholds as before, but direction-based and event-driven ── */
  useEffect(() => {
    if (!mounted || !introDone) return;
    let lastY = window.scrollY || 0;
    let accum = 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      const dy = y - lastY;
      lastY = y;
      if (!desktopRef.current || dy === 0) return;
      accum = Math.sign(dy) === Math.sign(accum) ? accum + dy : dy;

      let next: Phase | null = null;
      if (progRef.current) next = y < 50 ? "top" : "pill";
      else if (y < 50) next = "top";
      else if (y < 250) next = "pill";
      else if (forcedRef.current) {
        if (accum > 80) {
          forcedRef.current = false;
          next = "sphere";
        } else next = "pill";
      } else if (accum > 24) next = "sphere";
      else if (accum < -24) next = "pill";

      if (next) go(next);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted, introDone, go]);

  /* Route settled: close the drawer, drop the optimistic active item, and sync navbar phase to scroll */
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setPendingIdx(null);
    if (desktopRef.current && mounted) {
      requestAnimationFrame(() => {
        go(phaseForScroll(window.scrollY || 0));
      });
    }
  }, [pathname, mounted, go]);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const forcePill = () => {
    forcedRef.current = true;
    go("pill");
  };

  const navLinks = NAV_LINKS;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsMobileMenuOpen(false);
    progRef.current = true;
    if (progTimeout.current) clearTimeout(progTimeout.current);
    progTimeout.current = setTimeout(() => {
      progRef.current = false;
    }, 1000);

    if (pathname === "/" && href.startsWith("/#")) {
      e.preventDefault();
      const id = href.split("#")[1];
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* Desktop link click: start the highlighter slide NOW instead of waiting for the route */
  const handleDesktopLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, idx: number) => {
    setPendingIdx(idx);
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => setPendingIdx(null), 4000); // safety if navigation never lands
    handleNavClick(e, href);
  };

  if (!introDone) return null;

  /* ── "Raise up" reveal for the pill content (opacity + transform only) ── */
  const reveal = (delay: number): Variants => ({
    hidden: { opacity: 0, y: 26, scale: 0.97, transition: { duration: 0.14, ease: "easeOut" } },
    visible: { opacity: 1, y: 0, scale: 1, transition: { delay, type: "spring", stiffness: 260, damping: 26 } },
  });
  const leftVariants = reveal(0.3);
  const centerVariants = reveal(0.38);
  const rightVariants = reveal(0.46);

  const actionBase =
    "flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold leading-none whitespace-nowrap active:scale-95 transition-[opacity,border-color,transform] duration-200";

  const curve = glassTheme === "dark" ? GLASS.curveDark : GLASS.curveLight;
  const mainBackdrop = refract && tiles ? chainBackdrop("lg-main") : fallbackBackdrop(glassTheme);
  const mobBackdrop = refract && mobileMap ? chainBackdrop("lg-mob") : fallbackBackdrop(glassTheme);
  // Extra legibility veil, only used where the SVG chain is not available.
  const scrimColor = boost > 0 ? (glassTheme === "dark" ? `rgba(10,10,12,${boost})` : `rgba(255,255,255,${boost})`) : null;
  const scrim = scrimColor ? `linear-gradient(${scrimColor},${scrimColor})` : undefined;
  const mobTint = rgba(LOOKS[glassTheme][1]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLASS_CSS }} />

      {/* SVG filters that bend the backdrop along the glass edges (Chromium only) */}
      {refract && tiles && (
        <svg width={0} height={0} className="absolute pointer-events-none" aria-hidden="true" focusable="false">
          <defs>
            <filter
              id="lg-main"
              filterUnits="userSpaceOnUse"
              primitiveUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={CANVAS_W}
              height={CANVAS_H}
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodColor="rgb(128,128,128)" result="base" />
              <feImage ref={(el) => { fiRef.current.disc = el; }} href={tiles.disc} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="disc" />
              <feImage ref={(el) => { fiRef.current.strip = el; }} href={tiles.strip} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="strip" />
              <feImage ref={(el) => { fiRef.current.capL = el; }} href={tiles.capL} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="capL" />
              <feImage ref={(el) => { fiRef.current.capR = el; }} href={tiles.capR} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="capR" />
              <feMerge result="map">
                <feMergeNode in="base" />
                <feMergeNode in="disc" />
                <feMergeNode in="strip" />
                <feMergeNode in="capL" />
                <feMergeNode in="capR" />
              </feMerge>
              {bendChain(GLASS.main.maxDisp * 2, curve)}
            </filter>

            {mobileMap && (
              <filter
                id="lg-mob"
                filterUnits="userSpaceOnUse"
                primitiveUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={mobileMap.w}
                height={mobileMap.h}
                colorInterpolationFilters="sRGB"
              >
                <feImage href={mobileMap.url} x={0} y={0} width={mobileMap.w} height={mobileMap.h} preserveAspectRatio="none" result="map" />
                {bendChain(GLASS.main.maxDisp * 2, curve)}
              </filter>
            )}
          </defs>
        </svg>
      )}

      {/* ═══ Mobile: the same glass recipe, applied straight to the bar ═══ */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50 px-3 pt-3 pointer-events-none">
        <div
          ref={mobileBarRef}
          data-lg={glassTheme}
          className="lg-shade lg-ink relative pointer-events-auto mx-auto flex items-center justify-between gap-2 h-14 pl-4 pr-2.5 rounded-full"
          style={{
            backgroundColor: mobTint,
            backgroundImage: scrim,
            backdropFilter: mobBackdrop,
            WebkitBackdropFilter: mobBackdrop,
            opacity: glassReady ? 1 : 0,
            transition: GLASS_FADE,
          }}
        >
          <Link href="/" className="relative z-10 flex items-center gap-2 min-w-0 active:scale-95 transition-transform">
            <Logo className="w-7 h-7 shrink-0" priority />
            <span className="font-bold text-lg tracking-tighter truncate text-[color:var(--text-primary)]">
              Hrithik.
            </span>
          </Link>
          <div className="relative z-10 flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              suppressHydrationWarning
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[color:var(--text-primary)]/5 border border-[color:var(--border)] text-[color:var(--text-primary)] active:scale-90 transition-transform"
            >
              {mounted ? (resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />) : <Sun size={16} />}
            </button>
            <button
              type="button"
              suppressHydrationWarning
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[color:var(--text-primary)] active:scale-90 transition-transform"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Desktop: one liquid shape + GPU-moved content ═══ */}
      <div
        data-lg={glassTheme}
        className="lg-ink hidden md:block fixed top-0 left-0 w-full z-50 pointer-events-none"
        style={{ height: CANVAS_H }}
      >
        {/* Liquid layer: pill + logo sphere + theme drop.
            NOTE: never put opacity/filter on an ancestor of the backdrop layer (it would
            become the backdrop root and the glass would see nothing). Fades live on the
            glass elements themselves. */}
        <div
          className="absolute top-0 pointer-events-none"
          style={{ left: "50%", marginLeft: -OX, width: CANVAS_W, height: CANVAS_H, transform: "translateZ(0)" }}
        >
          {/* Frosted + edge-bending backdrop, clipped to the live liquid shape.
              Starts clipped to the sphere and invisible: no rectangle can ever show. */}
          <div
            ref={blurRef}
            className="absolute inset-0"
            style={{
              clipPath: `path("${INITIAL_PATH}")`,
              opacity: glassReady ? 1 : 0,
              transition: GLASS_FADE,
              backdropFilter: mainBackdrop,
              WebkitBackdropFilter: mainBackdrop,
              backgroundImage: scrim,
            }}
          />
          {/* Rim reflections + soft shadow (same inset box-shadow stack as the reference) */}
          <div
            ref={pillShadeRef}
            className="lg-shade absolute left-0 top-0 rounded-full pointer-events-none"
            style={{
              width: 60,
              height: 60,
              transform: `translate3d(${OX - 30}px,${CY - 30}px,0)`,
              contain: "layout style",
              opacity: glassReady ? 1 : 0,
              transition: GLASS_FADE,
            }}
          />
          <div
            ref={dropShadeRef}
            className="lg-shade absolute left-0 top-0 rounded-full pointer-events-none"
            style={{ width: 60, height: 60, opacity: 0, transform: "translate3d(0,0,0)", contain: "layout style" }}
          />
        </div>

        {/* Sphere state: logo + click target */}
        <div
          ref={logoRef}
          className="absolute left-1/2 pointer-events-none"
          style={{ top: CY, transform: "translate3d(-50%,-50%,0)", willChange: "transform" }}
        >
          <m.div
            initial={false}
            animate={
              phase === "sphere" && glassReady
                ? { opacity: 1, scale: 1, rotate: 0 }
                : { opacity: 0, scale: 0.6, rotate: -20 }
            }
            transition={
              phase === "sphere"
                ? { type: "spring", stiffness: 260, damping: 20, delay: 0.28 }
                : { duration: 0.12, ease: "easeOut" }
            }
          >
            <Logo className="w-7 h-7" priority />
          </m.div>
        </div>
        <button
          type="button"
          aria-label="Open navigation"
          tabIndex={phase === "sphere" ? 0 : -1}
          onClick={forcePill}
          onPointerEnter={() => play("hover", HOVER, 1, { type: "spring", stiffness: 300, damping: 18 })}
          onPointerLeave={() => play("hover", HOVER, 0, { type: "spring", stiffness: 300, damping: 18 })}
          className="absolute left-1/2 rounded-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--text-primary)]"
          style={{
            top: CY,
            width: 64,
            height: 64,
            transform: "translate3d(-50%,-50%,0)",
            pointerEvents: phase === "sphere" && glassReady ? "auto" : "none",
          }}
        />

        {/* Left block: logo + name (glued to the pill's left edge) */}
        <div
          ref={leftRef}
          className="absolute left-1/2 pointer-events-none"
          style={{ top: CY, transform: "translate3d(-498px,-50%,0)", willChange: "transform" }}
        >
          <m.div
            variants={leftVariants}
            initial="hidden"
            animate={expanded ? "visible" : "hidden"}
            className={expanded ? "pointer-events-auto" : "pointer-events-none"}
          >
            <Link
              href="/"
              tabIndex={expanded ? 0 : -1}
              className="flex items-center gap-2.5 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 flex items-center justify-center">
                <Logo className="w-8 h-8" priority />
              </div>
              <span className="font-bold text-xl tracking-tighter whitespace-nowrap text-[color:var(--text-primary)]">
                Hrithik.
              </span>
            </Link>
          </m.div>
        </div>

        {/* Active-item highlighter: tinted glass pill that slides BEHIND the text, inside the bar */}
        <div
          ref={lensRef}
          className="lg-hl absolute left-1/2 top-0 rounded-full pointer-events-none"
          style={{
            width: 0,
            height: 0,
            opacity: 0,
            visibility: "hidden",
            transform: "translate3d(0,0,0)",
            contain: "layout style",
          }}
        />

        {/* Center block: nav links (always centered, never moves) */}
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{ top: CY, transform: "translate3d(-50%,-50%,0)" }}
        >
          <m.div
            ref={centerInnerRef}
            variants={centerVariants}
            initial="hidden"
            animate={expanded ? "visible" : "hidden"}
            className={`relative flex items-center gap-0.5 p-1 ${expanded ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            {navLinks.map((link, i) => {
              const isActive = i === activeIdx;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  ref={(el) => {
                    linkRefs.current[i] = el;
                  }}
                  tabIndex={expanded ? 0 : -1}
                  onClick={(e) => handleDesktopLinkClick(e, link.href, i)}
                  className={`relative px-3 py-2 font-medium text-sm tracking-tight rounded-full z-10 flex items-center whitespace-nowrap ${
                    isActive ? "lg-link-active" : "lg-link"
                  }`}
                >
                  <span className="lg-label" data-label={link.name}>
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </m.div>
        </div>

        {/* Right block: Resume + Contact (same size in every phase) */}
        <div
          ref={rightRef}
          className="absolute left-1/2 pointer-events-none"
          style={{ top: CY, transform: "translate3d(calc(498px - 100%),-50%,0)", willChange: "transform" }}
        >
          <m.div
            variants={rightVariants}
            initial="hidden"
            animate={expanded ? "visible" : "hidden"}
            className={`flex items-center gap-2 ${expanded ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <Link
              href="/resume"
              tabIndex={expanded ? 0 : -1}
              className={`lg-noink ${actionBase} border border-[color:var(--border)] bg-[color:var(--text-primary)] text-[color:var(--background)] hover:opacity-90`}
            >
              <span>Resume</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/contact"
              tabIndex={expanded ? 0 : -1}
              className={`lg-noink ${actionBase} border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] hover:border-[color:var(--text-primary)]`}
            >
              <span>Contact</span>
            </Link>
          </m.div>
        </div>

        {/* Theme drop: rides on the liquid path, position/opacity written each frame */}
        <button
          ref={themeBtnRef}
          type="button"
          suppressHydrationWarning
          aria-label="Toggle theme"
          aria-hidden={!expanded}
          tabIndex={expanded ? 0 : -1}
          onClick={toggleTheme}
          className="absolute left-1/2 top-0 rounded-full flex items-center justify-center text-[color:var(--text-primary)]"
          style={{
            width: 64,
            height: 64,
            opacity: 0,
            pointerEvents: "none",
            transform: "translate3d(0,0,0)",
            willChange: "transform, opacity",
          }}
        >
          <span className="flex items-center justify-center w-full h-full rounded-full transition-transform duration-200 hover:scale-110 active:scale-90">
            {mounted ? (
              resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />
            ) : (
              <div className="w-[18px] h-[18px]" />
            )}
          </span>
        </button>
      </div>

      {/* ═══ Mobile Menu Drawer (UNTOUCHED) ═══ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden bg-[color:var(--background)] pt-20 px-6 flex flex-col justify-between pb-8"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <m.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className={`flex items-center justify-between w-full px-6 py-4 rounded-full text-lg font-bold transition-all border ${
                        isActive
                          ? "bg-[color:var(--text-primary)] text-[color:var(--background)] border-transparent"
                          : "bg-[color:var(--text-primary)]/5 text-[color:var(--text-secondary)] border-[color:var(--border)]"
                      }`}
                    >
                      <span>{link.name}</span>
                    </Link>
                  </m.div>
                );
              })}
            </div>

            {/* Mobile Actions: Resume & Contact */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col gap-3"
            >
              <Link
                href="/resume"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[color:var(--text-primary)] text-[color:var(--background)] font-bold text-base"
              >
                <span>View Resume</span>
                <ArrowUpRight size={16} />
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-full border border-[color:var(--border)] text-[color:var(--text-primary)] font-bold text-base"
              >
                <span>Get in Touch</span>
              </Link>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}