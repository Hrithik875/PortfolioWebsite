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
   LIQUID NAVBAR (desktop only)

   How it stays smooth:
   • The pill, the logo sphere and the theme drop are ONE SVG <path>. Its "d"
     attribute is rewritten every frame from a few spring-driven numbers.
     Nothing animates width / height / padding / border / left, so there is no
     layout work and no React re-render while animating.
   • The pill content (logo, links, buttons) never changes size. It is only
     moved with transform: translate3d (GPU compositor) and faded with opacity.
   • React state changes only when the phase changes (top / pill / sphere).
   • The water-drop look is real geometry (metaball neck between two circles),
     not a CSS blur filter.
   ════════════════════════════════════════════════════════════════════════════ */

type Phase = "top" | "pill" | "sphere";
type Controls = { stop: () => void };
type RGBA = [number, number, number, number];

/* ── Tunables ─────────────────────────────────────────────────────────────── */
const CANVAS_W = 1400; // width of the SVG drawing area (centered on the page)
const CANVAS_H = 104;
const OX = CANVAS_W / 2; // x = 0 (page center) inside the canvas
const CY = 52; // vertical center of pill + drop (top edge of the 64px pill = 20px)
const SEP_D = 78; // resting distance: pill right-cap center -> drop center
const EDGE_PAD = 22; // inner padding of the pill for logo / buttons
const BLUR_PX = 0; // optional glass blur (0 = off, smoothest). Try 10-14 on fast machines.

const SIZE_SPRING = { type: "spring" as const, stiffness: 200, damping: 27, mass: 1, restDelta: 0.05, restSpeed: 0.05 };
const LOOK_SPRING = { type: "spring" as const, stiffness: 120, damping: 24, restDelta: 0.002, restSpeed: 0.002 };

/* Glass look for the 3 phases: [fill, stroke] */
const LOOKS: Record<"dark" | "light", { fill: RGBA; stroke: RGBA }[]> = {
  dark: [
    { fill: [18, 18, 20, 0.3], stroke: [255, 255, 255, 0.08] },
    { fill: [18, 18, 20, 0.52], stroke: [255, 255, 255, 0.14] },
    { fill: [30, 30, 34, 0.72], stroke: [255, 255, 255, 0.28] },
  ],
  light: [
    { fill: [255, 255, 255, 0.35], stroke: [0, 0, 0, 0.07] },
    { fill: [255, 255, 255, 0.6], stroke: [0, 0, 0, 0.12] },
    { fill: [255, 255, 255, 0.78], stroke: [0, 0, 0, 0.25] },
  ],
};

const mix = (a: RGBA, b: RGBA, t: number): RGBA => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
  a[3] + (b[3] - a[3]) * t,
];
const rgba = (c: RGBA) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;

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

export function Navbar() {
  const { introDone } = useIntro();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("sphere");

  const { setTheme, resolvedTheme } = useTheme();
  const currentTheme = mounted ? resolvedTheme : "dark";
  const expanded = phase !== "sphere";

  /* ── Spring-driven numbers (no React renders while these animate) ── */
  const W = useMotionValue(60); // pill width
  const H = useMotionValue(60); // pill height
  const DV = useMotionValue(0); // drop distance (0 = merged inside the pill)
  const NU = useMotionValue(1); // neck strength
  const LOOK = useMotionValue(2); // 0 top, 1 pill, 2 sphere (fill / stroke blend)
  const PULSE = useMotionValue(0); // jelly wobble
  const HOVER = useMotionValue(0);

  /* ── DOM refs written to directly each frame ── */
  const pathRef = useRef<SVGPathElement | null>(null);
  const blurRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const themeBtnRef = useRef<HTMLButtonElement | null>(null);

  const themeNameRef = useRef<"dark" | "light">("dark");
  const phaseRef = useRef<Phase>("sphere");
  const dimsRef = useRef({ top: 1040, pill: 840 });
  const desktopRef = useRef(true);
  const reduceRef = useRef(false);
  const forcedRef = useRef(false);
  const progRef = useRef(false);
  const progTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctl = useRef<Record<string, Controls | undefined>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── Draw one frame ── */
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
    path.style.fill = rgba(mix(set[i].fill, set[i + 1].fill, t));
    path.style.stroke = rgba(mix(set[i].stroke, set[i + 1].stroke, t));

    if (blurRef.current) blurRef.current.style.clipPath = `path("${dStr}")`;

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
        Object.values(ctl.current).forEach((c) => c?.stop());
        ctl.current = {};
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
    themeNameRef.current = currentTheme === "light" ? "light" : "dark";
    render();
  }, [currentTheme, render]);

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

  const navLinks = [
    { name: "Work", href: "/work" },
    { name: "Research", href: "/research" },
    { name: "Experience", href: "/experience" },
    { name: "Leadership", href: "/leadership" },
    { name: "About", href: "/about" },
  ];

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

  return (
    <>
      {/* ═══ Mobile: simple, robust fixed bar (UNTOUCHED) ═══ */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50 px-3 pt-3 pointer-events-none">
        <div className="pointer-events-auto mx-auto flex items-center justify-between gap-2 h-14 pl-4 pr-2.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/85 backdrop-blur-md shadow-lg shadow-black/10">
          <Link href="/" className="flex items-center gap-2 min-w-0 active:scale-95 transition-transform">
            <Logo className="w-7 h-7 shrink-0" priority />
            <span className="font-bold text-lg tracking-tighter truncate text-[color:var(--text-primary)]">
              Hrithik.
            </span>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
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
        className="hidden md:block fixed top-0 left-0 w-full z-50 pointer-events-none"
        style={{ height: CANVAS_H }}
      >
        {/* Liquid layer: pill + logo sphere + theme drop (single SVG path) */}
        <div
          className="absolute top-0 pointer-events-none"
          style={{ left: "50%", marginLeft: -OX, width: CANVAS_W, height: CANVAS_H, transform: "translateZ(0)" }}
        >
          {BLUR_PX > 0 && (
            <div
              ref={blurRef}
              className="absolute inset-0"
              style={{ backdropFilter: `blur(${BLUR_PX}px)`, WebkitBackdropFilter: `blur(${BLUR_PX}px)` }}
            />
          )}
          <svg
            width={CANVAS_W}
            height={CANVAS_H}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="absolute inset-0 overflow-visible"
            aria-hidden="true"
          >
            <path ref={pathRef} d="" strokeWidth={1} />
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
            variants={centerVariants}
            initial="hidden"
            animate={expanded ? "visible" : "hidden"}
            className={`flex items-center gap-0.5 p-1 ${expanded ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  tabIndex={expanded ? 0 : -1}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative px-3 py-2 font-medium text-sm tracking-tight transition-colors rounded-full z-10 flex items-center whitespace-nowrap ${
                    isActive
                      ? "text-[color:var(--background)] font-bold"
                      : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <m.div
                      layoutId="navbar-active-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      className="absolute inset-0 bg-[color:var(--text-primary)] rounded-full -z-10 shadow-sm"
                    />
                  )}
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
              className={`${actionBase} border border-[color:var(--border)] bg-[color:var(--text-primary)] text-[color:var(--background)] hover:opacity-90`}
            >
              <span>Resume</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/contact"
              tabIndex={expanded ? 0 : -1}
              className={`${actionBase} border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] hover:border-[color:var(--text-primary)]`}
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