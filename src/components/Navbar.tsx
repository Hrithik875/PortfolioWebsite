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
   LIQUID GLASS NAVBAR

   • ONE glass engine drives desktop pill, theme drop, the sliding selection
     lens and the mobile bar, so every surface looks identical:
       1. backdrop is blurred + saturated,
       2. the rim bends the backdrop like a convex lens (SVG displacement map),
          with chromatic aberration (R / G / B bent by different amounts),
       3. a tone curve keeps whatever is behind it readable for the text,
       4. a light tint, inner glow and a diagonal specular rim sit on top.
   • The pill, logo sphere and theme drop are ONE SVG path rewritten every frame
     from spring values. Content only moves with transform / opacity.
   • The selection lens is its own small glass shape that slides between menu
     items: its leading edge moves first, the trailing edge follows, so it
     stretches and then settles like a drop of water.
   ════════════════════════════════════════════════════════════════════════════ */

type Phase = "top" | "pill" | "sphere";
type Controls = { stop: () => void };
type RGBA = [number, number, number, number];

/* ── Layout tunables ─────────────────────────────────────────────────────── */
const CANVAS_W = 1400; // drawing area of the main liquid shape (centered on page)
const CANVAS_H = 104;
const OX = CANVAS_W / 2; // x = 0 (page center) inside the canvas
const CY = 52; // vertical center of pill + drop (top edge of the 64px pill = 20px)
const SEP_D = 78; // resting distance: pill right-cap center -> drop center
const EDGE_PAD = 22; // inner padding of the pill for logo / buttons

const LENS_W = 640; // drawing area of the selection lens (centered)
const LENS_OX = LENS_W / 2;
const LENS_H = 68; // slightly taller than the pill, like the iOS tab-bar lens
const LENS_PAD = 26; // extra width on each side of the active link

/* ── Glass tunables (shared by desktop, lens and mobile) ─────────────────────
   Names follow the reference LiquidGlass component:
   bevel ~ bezel, scale ~ maxDisp, aberration, tint.                          */
const ENABLE_REFRACTION = true; // false = frost + rim light only (no bending)
type Profile = { bezel: number; maxDisp: number; power: number };
const GLASS = {
  blur: 6, // px of frost under the glass
  saturate: 1.5,
  aberration: 0.14, // 0 = none. R bends 14% more than G, B 14% less.
  main: { bezel: 0.62, maxDisp: 22, power: 2.3 } as Profile, // pill, drop, mobile bar
  lens: { bezel: 0.7, maxDisp: 26, power: 2.1 } as Profile, // selection lens
  lensBlur: 0.8,
  /* Tone curves (11 knots, input 0..1 -> output). They only touch the problem
     colours: dark theme caps highlights so light text always has a dark enough
     base; light theme lifts shadows so dark text always has a light enough base.
     Mid-tones and saturated colours keep their life.                          */
  curveDark: [0, 0.08, 0.16, 0.23, 0.3, 0.35, 0.39, 0.41, 0.43, 0.44, 0.45],
  curveLight: [0.62, 0.66, 0.7, 0.74, 0.78, 0.82, 0.86, 0.9, 0.94, 0.97, 1],
};

const SIZE_SPRING = { type: "spring" as const, stiffness: 200, damping: 27, mass: 1, restDelta: 0.05, restSpeed: 0.05 };
const LOOK_SPRING = { type: "spring" as const, stiffness: 120, damping: 24, restDelta: 0.002, restSpeed: 0.002 };

/* Tint laid over the glass, per phase (top, pill, sphere) */
const LOOKS: Record<"dark" | "light", RGBA[]> = {
  dark: [
    [14, 14, 16, 0.18],
    [14, 14, 16, 0.22],
    [18, 18, 22, 0.3],
  ],
  light: [
    [255, 255, 255, 0.2],
    [255, 255, 255, 0.24],
    [255, 255, 255, 0.32],
  ],
};
const LENS_FILL: Record<"dark" | "light", RGBA> = {
  dark: [255, 255, 255, 0.08],
  light: [255, 255, 255, 0.3],
};

const mix = (a: RGBA, b: RGBA, t: number): RGBA => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
  a[3] + (b[3] - a[3]) * t,
];
const rgba = (c: RGBA) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;
const withBoost = (c: RGBA, boost: number): RGBA => [c[0], c[1], c[2], Math.min(1, c[3] + boost)];

/* ── Edge refraction maps (Chromium only; others get frost + rim light) ──────
   Drawn once from small tiles. Each pixel stores a vector pointing from the
   glass edge toward its centre, strongest at the edge, so the background looks
   bent along the rim like a convex water slab.                               */
type TileKind = "capL" | "capR" | "strip" | "disc";
type ProfileName = "main" | "lens";
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

const tileCache: Record<string, HTMLCanvasElement | undefined> = {};
function tileCanvas(kind: TileKind, name: ProfileName): HTMLCanvasElement | null {
  const key = `${name}:${kind}`;
  const hit = tileCache[key];
  if (hit) return hit;
  const { w, h, data } = makeTileData(kind, GLASS[name]);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(w, h);
  img.data.set(data);
  ctx.putImageData(img, 0, 0);
  tileCache[key] = c;
  return c;
}

/* A full stadium map of any size (used by the mobile bar). */
function composeStadiumMap(w: number, h: number): string | null {
  const strip = tileCanvas("strip", "main");
  const capL = tileCanvas("capL", "main");
  const capR = tileCanvas("capR", "main");
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
  disc?: SVGFEImageElement | null;
};
/* Moves the map tiles to the live shape (attribute writes only, no layout). */
function placeTiles(fi: TileEls, left: number, w: number, R: number, cy: number) {
  const place = (el: SVGFEImageElement | null | undefined, x: number, wd: number) => {
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

function stadiumPath(w: number, h: number, ox: number, cy: number): string {
  const R = h / 2;
  const xl = ox - w / 2 + R;
  const xr = ox + w / 2 - R;
  const f = (n: number) => Math.round(n * 100) / 100;
  return (
    `M${f(xl)} ${f(cy - R)}H${f(xr)}A${f(R)} ${f(R)} 0 0 1 ${f(xr)} ${f(cy + R)}` +
    `H${f(xl)}A${f(R)} ${f(R)} 0 0 1 ${f(xl)} ${f(cy - R)}Z`
  );
}

/* Chromium can bend the backdrop with an SVG filter. Safari / Firefox get frost + rim light only. */
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

/* Backdrop recipes. With the SVG chain: frost -> bend rim -> tone curve.
   Without it: frost + brightness (still readable, just less vivid).          */
const fallbackBackdrop = (theme: "dark" | "light") =>
  `blur(10px) saturate(1.6) brightness(${theme === "dark" ? 0.55 : 1.1})`;
const chainBackdrop = (id: string) => `blur(${GLASS.blur}px) saturate(${GLASS.saturate}) url(#${id})`;
const lensBackdrop = (on: boolean, theme: "dark" | "light") =>
  on
    ? `blur(${GLASS.lensBlur}px) saturate(1.35) brightness(${theme === "dark" ? 1.12 : 1.04}) url(#lg-lens)`
    : `blur(2px) saturate(1.3) brightness(1.08)`;

const GLASS_CSS = `
.lg-link{color:var(--text-primary);color:color-mix(in srgb,var(--text-primary) 82%,transparent);transition:color .25s ease}
.lg-link:hover,.lg-link-active{color:var(--text-primary)}
.lg-link-active{font-weight:700}
.lg-ink[data-lg="dark"]{text-shadow:0 1px 2px rgba(0,0,0,.45),0 0 12px rgba(0,0,0,.3)}
.lg-ink[data-lg="dark"] svg.lucide{filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}
.lg-ink[data-lg="light"]{text-shadow:0 1px 1px rgba(255,255,255,.55),0 0 10px rgba(255,255,255,.4)}
.lg-ink[data-lg="light"] svg.lucide{filter:drop-shadow(0 1px 1px rgba(255,255,255,.65))}
.lg-ink .lg-noink,.lg-ink .lg-noink *{text-shadow:none}
.lg-ink .lg-noink svg.lucide{filter:none}
`;

/* Three-channel bend (chromatic aberration) + optional tone curve. Reads "map". */
function bendChain(scale: number, curve: number[] | null) {
  const ab = GLASS.aberration;
  const keep = (r: number, g: number, b: number) => `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
  return (
    <>
      <feDisplacementMap in="SourceGraphic" in2="map" scale={scale * (1 + ab)} xChannelSelector="R" yChannelSelector="G" result="dR" />
      <feColorMatrix in="dR" type="matrix" values={keep(1, 0, 0)} result="cR" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result="dG" />
      <feColorMatrix in="dG" type="matrix" values={keep(0, 1, 0)} result="cG" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale={scale * (1 - ab)} xChannelSelector="R" yChannelSelector="G" result="dB" />
      <feColorMatrix in="dB" type="matrix" values={keep(0, 0, 1)} result="cB" />
      <feBlend in="cR" in2="cG" mode="screen" result="rg" />
      <feBlend in="rg" in2="cB" mode="screen" result={curve ? "bent" : undefined} />
      {curve && (
        <feComponentTransfer in="bent">
          <feFuncR type="table" tableValues={curve.join(" ")} />
          <feFuncG type="table" tableValues={curve.join(" ")} />
          <feFuncB type="table" tableValues={curve.join(" ")} />
        </feComponentTransfer>
      )}
    </>
  );
}

/* Tint, inner glow and diagonal specular rim: identical on every surface. */
function GlassPaint(props: {
  id: string;
  theme: "dark" | "light";
  lens?: boolean;
  d?: string;
  fill?: string;
  pathRef?: React.Ref<SVGPathElement>;
  fillRef?: React.Ref<SVGUseElement>;
}) {
  const { id, theme, lens, d, fill, pathRef, fillRef } = props;
  const dark = theme === "dark";
  const rim = lens ? [0.95, 0.42, 0.1, 0.42, 0.9] : [0.85, 0.3, 0.07, 0.3, 0.8];
  const glowTop = lens ? (dark ? 0.2 : 0.5) : dark ? 0.14 : 0.4;
  const glowBot = lens ? (dark ? 0.14 : 0.14) : dark ? 0.09 : 0.1;
  const botColor = dark ? "#fff" : "#000";
  const shape = `#${id}-shape`;
  return (
    <>
      <defs>
        <path id={`${id}-shape`} ref={pathRef} d={d ?? ""} />
        <clipPath id={`${id}-clip`}>
          <use href={shape} />
        </clipPath>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          {[0, 0.16, 0.5, 0.84, 1].map((o, i) => (
            <stop key={o} offset={o} stopColor="#fff" stopOpacity={rim[i]} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-glow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={glowTop} />
          <stop offset="0.3" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.7" stopColor={botColor} stopOpacity={0} />
          <stop offset="1" stopColor={botColor} stopOpacity={glowBot} />
        </linearGradient>
      </defs>
      <use ref={fillRef} href={shape} style={fill ? { fill } : undefined} />
      <use href={shape} fill="none" stroke={`url(#${id}-glow)`} strokeWidth={18} clipPath={`url(#${id}-clip)`} />
      <use href={shape} fill="none" stroke={`url(#${id}-glow)`} strokeWidth={8} clipPath={`url(#${id}-clip)`} />
      <use href={shape} fill="none" stroke={dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.18)"} strokeWidth={1} />
      <use href={shape} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={1.6} />
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

const phaseForScroll = (y: number): Phase => (y >= 250 ? "sphere" : y >= 50 ? "pill" : "top");

const NAV_LINKS = [
  { name: "Work", href: "/work" },
  { name: "Research", href: "/research" },
  { name: "Experience", href: "/experience" },
  { name: "Leadership", href: "/leadership" },
  { name: "About", href: "/about" },
];

type TileUrls = {
  main: Record<TileKind, string>;
  lens: Record<"strip" | "capL" | "capR", string>;
};

export function Navbar() {
  const { introDone } = useIntro();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("sphere");
  const [refract, setRefract] = useState(false);
  const [tiles, setTiles] = useState<TileUrls | null>(null);
  const [mobileMap, setMobileMap] = useState<{ url: string; w: number; h: number } | null>(null);
  const [boost, setBoost] = useState(0);

  const { setTheme, resolvedTheme } = useTheme();
  const currentTheme = mounted ? resolvedTheme : "dark";
  const expanded = phase !== "sphere";
  const glassTheme: "dark" | "light" = currentTheme === "light" ? "light" : "dark";
  const activeIdx = NAV_LINKS.findIndex((l) => pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href)));

  /* ── Spring-driven numbers (no React renders while these animate) ── */
  const W = useMotionValue(60); // pill width
  const H = useMotionValue(60); // pill height
  const DV = useMotionValue(0); // drop distance (0 = merged inside the pill)
  const NU = useMotionValue(1); // neck strength
  const LOOK = useMotionValue(2); // 0 top, 1 pill, 2 sphere (tint blend)
  const PULSE = useMotionValue(0); // jelly wobble
  const HOVER = useMotionValue(0);
  const LX = useMotionValue(0); // selection lens: left edge (px from page center)
  const RX = useMotionValue(0); // selection lens: right edge
  const LK = useMotionValue(0); // selection lens: height kick while travelling
  const LO = useMotionValue(0); // selection lens: open amount 0..1

  /* ── DOM refs written to directly each frame ── */
  const pathRef = useRef<SVGPathElement | null>(null);
  const fillRef = useRef<SVGUseElement | null>(null);
  const fiRef = useRef<TileEls>({ disc: null, strip: null, capL: null, capR: null });
  const lensFiRef = useRef<TileEls>({ strip: null, capL: null, capR: null });
  const lensPathRef = useRef<SVGPathElement | null>(null);
  const lensWrapRef = useRef<HTMLDivElement | null>(null);
  const lensBackRef = useRef<HTMLDivElement | null>(null);
  const centerInnerRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const mobileBarRef = useRef<HTMLDivElement | null>(null);
  const boostRef = useRef(0);
  const blurRef = useRef<HTMLDivElement | null>(null);
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
  const loTargetRef = useRef(0);
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
    const path = pathRef.current;
    if (!path) return;
    const grow = PULSE.get() * 5 + HOVER.get() * 3;
    const baseW = W.get();
    const baseH = H.get();
    const h = baseH + grow * 2;
    const w = Math.max(baseW + grow * 2, h);
    const R = h / 2;
    const D = Math.max(0, DV.get());

    const dStr = buildLiquidPath(w, h, D, NU.get());
    path.setAttribute("d", dStr);

    const set = LOOKS[themeNameRef.current];
    const L = Math.min(2, Math.max(0, LOOK.get()));
    const i = Math.min(1, Math.floor(L));
    const t = L - i;
    if (fillRef.current) fillRef.current.style.fill = rgba(withBoost(mix(set[i], set[i + 1], t), boostRef.current));

    if (blurRef.current) blurRef.current.style.clipPath = `path("${dStr}")`;

    // Refraction map tiles follow the live shape.
    const fi = fiRef.current;
    if (fi.capL && fi.capR && fi.strip && fi.disc) {
      placeTiles(fi, OX - w / 2, w, R, CY);
      // The drop's own lens is only drawn once it has left the pill.
      const x = OX + w / 2 - R + D - R;
      fi.disc.setAttribute("x", x.toFixed(2));
      fi.disc.setAttribute("y", (CY - R).toFixed(2));
      fi.disc.setAttribute("width", (D > 2 * R * 0.98 ? 2 * R : 0).toFixed(2));
      fi.disc.setAttribute("height", (2 * R).toFixed(2));
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
      const vis = Math.min(1, Math.max(0, (D - 30) / 40));
      btn.style.opacity = vis.toFixed(3);
      btn.style.pointerEvents = vis > 0.8 ? "auto" : "none";
    }
  }, [W, H, DV, NU, LOOK, PULSE, HOVER]);

  /* ── Draw one frame of the selection lens ── */
  const renderLens = useCallback(() => {
    const wrap = lensWrapRef.current;
    const path = lensPathRef.current;
    if (!wrap || !path) return;
    const open = Math.max(0, LO.get());
    if (open < 0.01) {
      if (wrap.style.visibility !== "hidden") wrap.style.visibility = "hidden";
      return;
    }
    if (wrap.style.visibility !== "visible") wrap.style.visibility = "visible";
    const hh = Math.max(2, (LENS_H + LK.get() * 9) * Math.min(1.05, open));
    const l = LX.get();
    const r = RX.get();
    const w = Math.max(r - l, hh) * (0.7 + 0.3 * Math.min(1, open));
    const c = (l + r) / 2;
    const d = stadiumPath(w, hh, LENS_OX + c, CY);
    path.setAttribute("d", d);
    if (lensBackRef.current) lensBackRef.current.style.clipPath = `path("${d}")`;
    placeTiles(lensFiRef.current, LENS_OX + c - w / 2, w, hh / 2, CY);
  }, [LX, RX, LK, LO]);

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

  /* ── Selection lens: slide to the active menu item ── */
  const syncLens = useCallback(
    (animateMove: boolean) => {
      const idx = activeIdxRef.current;
      const inner = centerInnerRef.current;
      const el = idx >= 0 ? linkRefs.current[idx] : null;
      if (expandedRef.current && el && inner) {
        const cx = el.offsetLeft + el.offsetWidth / 2 - inner.offsetWidth / 2;
        const wd = Math.max(el.offsetWidth + 2 * LENS_PAD, LENS_H);
        const l = cx - wd / 2;
        const r = cx + wd / 2;
        const closed = LO.get() < 0.05 || !lensPlacedRef.current;
        if (!animateMove || closed || reduceRef.current) {
          ctl.current["lx"]?.stop();
          ctl.current["rx"]?.stop();
          LX.set(l);
          RX.set(r);
        } else if (Math.abs(l - LX.get()) > 0.5 || Math.abs(r - RX.get()) > 0.5) {
          // Leading edge moves fast, trailing edge lags: the lens stretches, then settles.
          const goingRight = cx > (LX.get() + RX.get()) / 2;
          const fast = { type: "spring" as const, stiffness: 420, damping: 27, restDelta: 0.1, restSpeed: 0.1 };
          const slow = { type: "spring" as const, stiffness: 190, damping: 22, restDelta: 0.1, restSpeed: 0.1 };
          play("lx", LX, l, goingRight ? slow : fast);
          play("rx", RX, r, goingRight ? fast : slow);
          play("lk", LK, 0.001, {
            type: "spring",
            velocity: 60,
            stiffness: 240,
            damping: 15,
            restDelta: 0.004,
            restSpeed: 0.01,
          });
        }
        lensPlacedRef.current = true;
        if (loTargetRef.current !== 1) {
          loTargetRef.current = 1;
          play("lo", LO, 1, {
            type: "spring",
            stiffness: 220,
            damping: 22,
            delay: closed && animateMove ? 0.5 : 0,
          });
        }
      } else {
        if (!el) lensPlacedRef.current = false;
        if (loTargetRef.current !== 0) {
          loTargetRef.current = 0;
          play("lo", LO, 0, { type: "spring", stiffness: 260, damping: 28 });
        }
      }
    },
    [LX, RX, LK, LO, play]
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

  /* ── Glass capabilities, refraction tiles ── */
  useEffect(() => {
    if (!introDone) return;
    const contrast = window.matchMedia("(prefers-contrast: more)").matches;
    const lowTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
    const ok = canRefract();
    const b = (canBackdrop() ? 0 : 0.28) + (contrast ? 0.18 : 0) + (lowTransparency ? 0.55 : 0) + (ok ? 0 : 0.2);
    boostRef.current = b;
    setBoost(b);
    if (!ok) return;
    const mk = <K extends string>(kinds: K[], name: ProfileName) => {
      const out = {} as Record<K, string>;
      for (const k of kinds) {
        const c = tileCanvas(k as unknown as TileKind, name);
        if (!c) return null;
        out[k] = c.toDataURL("image/png");
      }
      return out;
    };
    const main = mk<TileKind>(["disc", "strip", "capL", "capR"], "main");
    const lens = mk<"strip" | "capL" | "capR">(["strip", "capL", "capR"], "lens");
    if (!main || !lens) return;
    setTiles({ main, lens });
    setRefract(true);
  }, [introDone]);

  /* Mobile bar: same glass, map sized to the bar */
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
    const unsubs = [LX, RX, LK, LO].map((mv) => mv.on("change", schedule));
    renderLens();
    return () => unsubs.forEach((u) => u());
  }, [introDone, renderLens, LX, RX, LK, LO]);

  useEffect(() => {
    themeNameRef.current = currentTheme === "light" ? "light" : "dark";
    render();
  }, [currentTheme, render, boost]);

  /* Lens follows the route and the pill state */
  useEffect(() => {
    if (!introDone) return;
    syncLens(true);
  }, [introDone, pathname, expanded, activeIdx, syncLens]);

  useEffect(() => {
    if (!introDone) return;
    const inner = centerInnerRef.current;
    if (!inner) return;
    const onChange = () => syncLens(false);
    const ro = new ResizeObserver(onChange);
    ro.observe(inner);
    window.addEventListener("resize", onChange);
    document.fonts?.ready.then(onChange);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onChange);
    };
  }, [introDone, syncLens]);

  /* ── Intro / initial phase / resize ── */
  useEffect(() => {
    if (!introDone) return;
    setMounted(true);
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const measure = () => {
      const vw = window.innerWidth;
      dimsRef.current = { top: Math.min(1040, vw - 180), pill: Math.min(840, vw - 180) };
      return vw >= 768;
    };
    desktopRef.current = measure();

    let startTimer: ReturnType<typeof setTimeout> | null = null;
    const y = window.scrollY || 0;
    const target = phaseForScroll(y);
    if (target === "sphere") {
      go("sphere", true);
    } else {
      // Starts as the sphere, then stretches out into the pill.
      startTimer = setTimeout(() => go(target), 150);
    }

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const forcePill = () => {
    forcedRef.current = true;
    go("pill");
  };

  const navLinks = NAV_LINKS;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsMobileMenuOpen(false);
    progRef.current = true;
    if (desktopRef.current) go("pill");
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
  const lensBd = lensBackdrop(refract && !!tiles, glassTheme);
  const mobTint = rgba(withBoost(LOOKS[glassTheme][1], boost));

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
              <feImage ref={(el) => { fiRef.current.disc = el; }} href={tiles.main.disc} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="disc" />
              <feImage ref={(el) => { fiRef.current.strip = el; }} href={tiles.main.strip} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="strip" />
              <feImage ref={(el) => { fiRef.current.capL = el; }} href={tiles.main.capL} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="capL" />
              <feImage ref={(el) => { fiRef.current.capR = el; }} href={tiles.main.capR} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="capR" />
              <feMerge result="map">
                <feMergeNode in="base" />
                <feMergeNode in="disc" />
                <feMergeNode in="strip" />
                <feMergeNode in="capL" />
                <feMergeNode in="capR" />
              </feMerge>
              {bendChain(GLASS.main.maxDisp * 2, curve)}
            </filter>

            <filter
              id="lg-lens"
              filterUnits="userSpaceOnUse"
              primitiveUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={LENS_W}
              height={CANVAS_H}
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodColor="rgb(128,128,128)" result="base" />
              <feImage ref={(el) => { lensFiRef.current.strip = el; }} href={tiles.lens.strip} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="strip" />
              <feImage ref={(el) => { lensFiRef.current.capL = el; }} href={tiles.lens.capL} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="capL" />
              <feImage ref={(el) => { lensFiRef.current.capR = el; }} href={tiles.lens.capR} x={0} y={0} width={0} height={0} preserveAspectRatio="none" result="capR" />
              <feMerge result="map">
                <feMergeNode in="base" />
                <feMergeNode in="strip" />
                <feMergeNode in="capL" />
                <feMergeNode in="capR" />
              </feMerge>
              {bendChain(GLASS.lens.maxDisp * 2, null)}
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

      {/* ═══ Mobile: same liquid glass as desktop ═══ */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50 px-3 pt-3 pointer-events-none">
        <div
          ref={mobileBarRef}
          data-lg={glassTheme}
          className="lg-ink relative pointer-events-auto mx-auto flex items-center justify-between gap-2 h-14 pl-4 pr-2.5 rounded-full"
          style={{ background: mobileMap ? undefined : mobTint }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ backdropFilter: mobBackdrop, WebkitBackdropFilter: mobBackdrop }}
          />
          {mobileMap && (
            <svg
              aria-hidden="true"
              width={mobileMap.w}
              height={mobileMap.h}
              viewBox={`0 0 ${mobileMap.w} ${mobileMap.h}`}
              className="absolute inset-0 pointer-events-none overflow-visible"
            >
              <GlassPaint
                id="lgm"
                theme={glassTheme}
                d={stadiumPath(mobileMap.w, mobileMap.h, mobileMap.w / 2, mobileMap.h / 2)}
                fill={mobTint}
              />
            </svg>
          )}
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
        {/* Liquid layer: pill + logo sphere + theme drop (single SVG path) */}
        <div
          className="absolute top-0 pointer-events-none"
          style={{ left: "50%", marginLeft: -OX, width: CANVAS_W, height: CANVAS_H, transform: "translateZ(0)" }}
        >
          {/* Frosted + refracting backdrop, clipped to the live liquid shape */}
          <div
            ref={blurRef}
            className="absolute inset-0"
            style={{ backdropFilter: mainBackdrop, WebkitBackdropFilter: mainBackdrop }}
          />
          <svg
            width={CANVAS_W}
            height={CANVAS_H}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="absolute inset-0 overflow-visible"
            aria-hidden="true"
          >
            <GlassPaint id="lg" theme={glassTheme} pathRef={pathRef} fillRef={fillRef} fill="rgba(0,0,0,0)" />
          </svg>
        </div>

        {/* Sphere state: logo + click target */}
        <div
          ref={logoRef}
          className="absolute left-1/2 pointer-events-none"
          style={{ top: CY, transform: "translate3d(-50%,-50%,0)", willChange: "transform" }}
        >
          <m.div
            initial={false}
            animate={phase === "sphere" ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.6, rotate: -20 }}
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
            pointerEvents: phase === "sphere" ? "auto" : "none",
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
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative px-3 py-2 font-medium text-sm tracking-tight rounded-full z-10 flex items-center whitespace-nowrap ${
                    isActive ? "lg-link-active" : "lg-link"
                  }`}
                >
                  {link.name}
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

        {/* Selection lens: clear glass that slides between menu items (above the links, below the drop) */}
        <div
          ref={lensWrapRef}
          className="absolute top-0 pointer-events-none"
          style={{
            left: "50%",
            marginLeft: -LENS_OX,
            width: LENS_W,
            height: CANVAS_H,
            transform: "translateZ(0)",
            visibility: "hidden",
          }}
        >
          <div
            ref={lensBackRef}
            className="absolute inset-0"
            style={{ backdropFilter: lensBd, WebkitBackdropFilter: lensBd }}
          />
          <svg
            width={LENS_W}
            height={CANVAS_H}
            viewBox={`0 0 ${LENS_W} ${CANVAS_H}`}
            className="absolute inset-0 overflow-visible"
            aria-hidden="true"
          >
            <GlassPaint
              id="lgl"
              theme={glassTheme}
              lens
              pathRef={lensPathRef}
              fill={rgba(withBoost(LENS_FILL[glassTheme], boost * 0.4))}
            />
          </svg>
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