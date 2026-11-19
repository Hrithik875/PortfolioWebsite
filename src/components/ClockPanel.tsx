"use client";

/**
 * ClockPanel — radial seconds clock
 *
 *  - Time is HH:MM (minutes always red). Digits roll vertically when they change.
 *  - Every second a mono label (00–59) is born on a ring. The ring is STATIONARY between seconds and
 *    advances one step (6°) the instant a new second begins (fast start, soft landing), so the
 *    NEWEST second always rests at 9 o'clock and older seconds trail clockwise around the circle.
 *    Labels never move relative to the ring (not even on hover).
 *  - LABELS ARE DOM ELEMENTS positioned with GPU transforms (translate3d), not canvas text. Canvas
 *    text snaps glyphs to whole pixels vertically, which makes labels "stair-step" up and down near
 *    the top and bottom of the circle. Transforms are sub-pixel and composited, so the motion along
 *    the circular path is perfectly smooth. Threads + glow are still drawn on the canvas.
 *  - New labels flash red, then fade to grey.
 *  - Each label is joined to the centre by a thin "thread". Threads grow out of the hub, sway on
 *    their own rhythm, trail the ring on an under-damped spring and fade toward their outer end.
 *    The pointer only bends them slightly; it never changes brightness.
 *  - A glow ripple periodically travels from the hub to the tip of every thread (independent of hover).
 *  - On the minute change the ring scatters inward and fades, then the minute digit rolls and the new
 *    minute restarts cleanly at 00 (alone), with 01, 02 … arriving on their real seconds.
 *  - Theme follows the site theme (navbar toggle). Colours cross-fade smoothly (THEME_MS).
 *  - SOUND: starts MUTED on every page load. Ticks are scheduled ahead on the WebAudio clock, mapped
 *    to the wall clock through getOutputTimestamp() (latency-compensated) and re-synced if they drift,
 *    so they stay locked to the seconds and keep playing even when the tab is hidden/minimised.
 *  - SYNC: the visuals use ONE time source (the rAF frame timestamp mapped to the wall clock, plus a
 *    one-frame display-latency lead), the ring's step starts exactly on the second boundary with a
 *    fast-start ease (so the motion lands on the tick, not ~150ms after it), and labels are born at
 *    the exact boundary instant rather than whenever the frame noticed it.
 *  - The visual state is derived from the wall clock. If the tab was hidden, it snaps to the
 *    correct time instantly on return (no catch-up animation).
 *
 *  - LAYOUTS
 *      • default (desktop, side panel): city bottom-left, sound bottom-right.
 *      • `fullscreen` (phones / tablets, opened from the navbar clock button): square corners,
 *        the city sits just ABOVE the time (clear of the navbar) and the sound toggle is at the
 *        bottom CENTER.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { JetBrains_Mono, Inter_Tight } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], display: "swap" });
const sans = Inter_Tight({ subsets: ["latin"], weight: ["600"], display: "swap" });

type Theme = "dark" | "light";

/* ------------------------------------------------------------------ */
/*  Site theme bridge (read-only — the navbar toggle owns the theme)   */
/* ------------------------------------------------------------------ */
function readSiteTheme(): Theme {
  const el = document.documentElement;
  const dt = el.getAttribute("data-theme");
  if (dt === "light" || dt === "dark") return dt;
  if (el.classList.contains("light")) return "light";
  if (el.classList.contains("dark")) return "dark";
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
// lineA = thread opacity at the HUB end; it fades to lineA * LINE_END_FRAC at the label end
const DARK = { bg: [6, 6, 6], fg: [255, 242, 239], label: [136, 136, 136], line: [255, 255, 255], lineA: 0.2 } as const;
const LIGHT = { bg: [254, 247, 247], fg: [13, 0, 0], label: [122, 114, 114], line: [13, 0, 0], lineA: 0.24 } as const;

const RED = [225, 29, 46] as const; // #e11d2e — new-label flash
const RED_HEX = "#e11d2e"; // minutes (both themes)

const STEP = Math.PI / 30; // 6° per second
const THEME_MS = 700; // dark <-> light cross-fade duration

// Ring advance: the ring is STATIONARY between seconds. When a new second begins it moves one step
// (6°) along the circle with a fast-start / soft-landing ease, then rests until the next second.
const STEP_MS = 700; // step duration (keep < 1000). Lower = snappier tick, higher = floatier.

// Sync tuning
const VISUAL_LEAD_MS = 16; // ≈ one display frame: the frame being computed is shown this much later
const SYNC_OFFSET_MS = 0; // manual audio nudge: + plays the tick later, − plays it earlier
//   Bluetooth/wireless audio often arrives LATE and browsers don't report it, so the tick sounds
//   after the motion: use a negative value (e.g. -120) to play the tick earlier. If the tick sounds
//   BEFORE the motion, use a positive value.

// Thread look
const LINE_END_FRAC = 0.3; // opacity at the outer end of a thread, as a fraction of the hub-end opacity
const LINE_WIDTH = 1;

// Glow ripple (hub -> tip), independent of hover
const RIPPLE_PERIOD = 2; // seconds for one ripple to travel hub -> tip
const RIPPLE_STAGGER = 0; // per-thread phase spread (0 = all threads pulse together)
const RIPPLE_WIDTH = 0.3; // half-length of the glowing segment, as a fraction of the thread
const RIPPLE_PEAK_DARK = 0.4; // peak glow alpha in dark theme
const RIPPLE_PEAK_LIGHT = 0.5; // peak glow alpha in light theme
const RIPPLE_LINE_WIDTH = 0.6;

// Minute restart timing (ms): the new minute's 00 is born this long after the scatter begins,
// and the minute digit rolls at ROLL_MS. 01, 02 … are born on their own real seconds.
const RESTART_BIRTH_MS = 300;
const ROLL_MS = 300;

// Pointer interaction (threads only bend; nothing changes brightness, labels never move)
const HOVER_RADIUS = 0.42; // × R — how far the pointer's influence reaches
const HOVER_BEND = 0.4; // how strongly a thread's control point is pulled toward the pointer

// Sound — raise these if you still want it louder (keep ≤ ~1)
const VOLUME = { tick: 0.5, accent: 0.8 };
const LOOKAHEAD_S = 65; // seconds of ticks pre-scheduled (must exceed browsers' ~60s background timer throttling)
const RESYNC_DRIFT_S = 0.02; // rebuild the pending schedule if it drifted more than this

// Widths >= this use the desktop side-panel layout (must match the navbar's desktop breakpoint)
const DESKTOP_MIN_WIDTH = 1009;

// Space reserved on small layouts so the ring never touches the floating navbar (top) or the
// sound toggle (bottom)
const TOP_SAFE = 80;
const BOTTOM_SAFE = 64;

// FULLSCREEN layout (opened from the navbar clock button)
const FS_NAV_SAFE = 76; // px reserved for the floating navbar at the top
const FS_CITY_BLOCK = 44; // px reserved BELOW the navbar for the city label (sits above the ring)
const FS_RING_FRAC = 0.43; // ring radius as a fraction of the screen width (was 0.33 -> bigger clock)
const CITY_GAP = 22; // px between the outer edge of the ring and the city label

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const pad2 = (n: number) => String(n).padStart(2, "0");
const mixC = (a: readonly number[], b: readonly number[], t: number) => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const rgb = (c: readonly number[]) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
const rgba = (c: readonly number[], a: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

function paintTheme(el: HTMLElement, m: number) {
  el.style.setProperty("--rc-bg", rgb(mixC(DARK.bg, LIGHT.bg, m)));
  el.style.setProperty("--rc-fg", rgb(mixC(DARK.fg, LIGHT.fg, m)));
}

// A label's DOM node plus a cache of what was last written to it (so unchanged values cost nothing)
type Dom = { el: HTMLSpanElement; tf: string; op: string; cl: string; sh: string };

type Lbl = Dom & {
  n: number;
  born: number;
  seed: number;
  lag: number;
  vel: number; // spring velocity of the trailing control angle
  cs: number; // curve direction (+1 / -1)
  cv: number; // curve depth (radians)
  kd: number; // control-point distance (× lineR)
  sf: number; // sway frequency
  sp: number; // sway phase
  gd: number; // growth duration (ms)
  hov: number; // smoothed pointer influence 0..1 (thread bend only)
  init: boolean;
  drawn: boolean;
  ex: number;
  ey: number;
  p1x: number;
  p1y: number;
  lx: number;
  ly: number;
  mix: number;
};
type Ghost = Dom & {
  n: number;
  ex: number;
  ey: number;
  p1x: number;
  p1y: number;
  lx: number;
  ly: number;
  tx: number;
  ty: number;
  start: number;
  delay: number;
  dur: number;
};

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */
function RollDigit({ value, instant }: { value: string; instant: boolean }) {
  const [s, setS] = useState({ cur: value, prev: null as string | null, key: 0 });
  useEffect(() => {
    setS((o) => {
      if (o.cur === value) return o;
      return { cur: value, prev: o.cur === "–" || instant ? null : o.cur, key: o.key + 1 };
    });
  }, [value, instant]);
  useEffect(() => {
    if (s.prev === null) return;
    const t = setTimeout(() => setS((o) => ({ ...o, prev: null })), 760);
    return () => clearTimeout(t);
  }, [s.key, s.prev]);
  return (
    <span className="rc-digit">
      {s.prev !== null && (
        <span key={"o" + s.key} className="rc-d rc-out" aria-hidden>
          {s.prev}
        </span>
      )}
      <span key={"i" + s.key} className={"rc-d" + (s.prev !== null ? " rc-in" : "")}>
        {s.cur}
      </span>
    </span>
  );
}

function Wave({ on }: { on: boolean }) {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    let raf = 0;
    const W = 28;
    const H = 12;
    const draw = (now: number) => {
      const el = ref.current;
      if (el) {
        let d = "";
        if (!on) {
          d = `M0 ${H / 2} L${W} ${H / 2}`;
        } else {
          const phase = ((now / 2400) % 1) * Math.PI * 2;
          const pts = 28;
          for (let i = 0; i <= pts; i++) {
            const u = i / pts;
            const x = u * W;
            const y = H / 2 - Math.sin(u * Math.PI * 2 * 0.85 + phase) * (H / 2 - 1);
            d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
          }
        }
        el.setAttribute("d", d);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return (
    <svg width="28" height="12" viewBox="0 0 28 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden>
      <path ref={ref} d="" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function ClockPanel({
  location = "BENGALURU, INDIA",
  timeZone = "Asia/Kolkata",
  className = "",
  fullscreen = false,
}: {
  location?: string;
  timeZone?: string;
  className?: string;
  /** Fullscreen layout: square corners, city just above the time, sound toggle bottom-center. */
  fullscreen?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lblHostRef = useRef<HTMLDivElement>(null);

  const [shown, setShown] = useState<{ h: string; m: string; instant: boolean }>({ h: "––", m: "––", instant: true });
  const [layout, setLayout] = useState<{ R: number; cy: number | null }>({ R: 259, cy: null });

  // Sound always starts muted on page load
  const [soundOn, setSoundOn] = useState(false);
  const soundRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const busRef = useRef<GainNode | null>(null);
  const nextTickRef = useRef(0);
  // pending (not yet played) ticks: wall-clock ms -> audio-clock time they were scheduled at
  const pendingRef = useRef<{ t: number; when: number }[]>([]);

  // Theme cross-fade state (0 = dark, 1 = light)
  const themeAnim = useRef({ from: 0, to: 0, start: -1e9, mix: 0 });

  /* ---- theme sync with the site (smooth cross-fade) ---- */
  useEffect(() => {
    const a = themeAnim.current;
    let first = true;
    const sync = () => {
      const to = readSiteTheme() === "light" ? 1 : 0;
      if (first) {
        first = false;
        a.from = a.to = a.mix = to;
        a.start = -1e9;
        if (panelRef.current) paintTheme(panelRef.current, to);
        return;
      }
      if (to === a.to) return;
      a.from = a.mix;
      a.to = to;
      a.start = performance.now();
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => mo.disconnect();
  }, []);

  /* ---- audio: scheduled on the WebAudio clock so it survives background tabs ---- */
  const playAt = useCallback((ac: AudioContext, dest: AudioNode, when: number, sec: number, accent: boolean) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const peak = accent ? VOLUME.accent : VOLUME.tick;
    const dur = accent ? 0.45 : 0.12;
    o.type = "sine";
    o.frequency.value = accent ? 520 : 900 + sec * 10;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(dest);
    o.start(when);
    o.stop(when + dur + 0.05);
  }, []);

  // Maps a wall-clock instant (Date.now() ms) to the audio-clock time at which a sound started
  // then is actually HEARD. Uses the context's output timestamp so hardware/output latency is
  // accounted for, and samples both clocks at the same instant so there is no sampling skew.
  const audioTimeFor = useCallback((ac: AudioContext, wallMs: number) => {
    const perfTarget = performance.now() + (wallMs - Date.now());
    try {
      const ts = ac.getOutputTimestamp?.();
      if (ts && typeof ts.contextTime === "number" && typeof ts.performanceTime === "number" && ts.performanceTime > 0) {
        return ts.contextTime + (perfTarget - ts.performanceTime) / 1000;
      }
    } catch { }
    const lat = (ac as unknown as { outputLatency?: number }).outputLatency || 0;
    return ac.currentTime + (perfTarget - performance.now()) / 1000 - lat;
  }, []);

  // Drops everything already scheduled (used if the audio clock was suspended or drifted)
  const resetSchedule = useCallback(() => {
    const ac = audioRef.current;
    const master = masterRef.current;
    if (!ac || !master) return;
    try {
      busRef.current?.disconnect();
    } catch { }
    const bus = ac.createGain();
    bus.connect(master);
    busRef.current = bus;
    nextTickRef.current = 0;
    pendingRef.current = [];
  }, []);

  const scheduleAhead = useCallback(() => {
    const ac = audioRef.current;
    if (!ac || !busRef.current || ac.state !== "running") return;
    const nowMs = Date.now();

    // Drift check: re-derive when the next upcoming tick SHOULD sound and compare with when it was
    // scheduled. If the audio clock and the wall clock have drifted apart, rebuild the schedule.
    pendingRef.current = pendingRef.current.filter((p) => p.t > nowMs - 100);
    const upcoming = pendingRef.current.find((p) => p.t > nowMs + 150);
    if (upcoming) {
      const fresh = audioTimeFor(ac, upcoming.t + SYNC_OFFSET_MS);
      if (Math.abs(fresh - upcoming.when) > RESYNC_DRIFT_S) resetSchedule();
    }

    const bus = busRef.current;
    if (!bus) return;
    let next = nextTickRef.current;
    if (next < nowMs + 20) next = Math.ceil((nowMs + 20) / 1000) * 1000;
    const horizon = nowMs + LOOKAHEAD_S * 1000;
    while (next < horizon) {
      const sec = Math.floor(next / 1000) % 60;
      const when = audioTimeFor(ac, next + SYNC_OFFSET_MS);
      if (when > ac.currentTime) {
        playAt(ac, bus, when, sec, sec === 0);
        pendingRef.current.push({ t: next, when });
      }
      next += 1000;
    }
    nextTickRef.current = next;
  }, [playAt, audioTimeFor, resetSchedule]);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ac = new AC({ latencyHint: "interactive" });
        const master = ac.createGain();
        master.gain.value = soundRef.current ? 1 : 0;
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.knee.value = 12;
        comp.ratio.value = 6;
        comp.attack.value = 0.002;
        comp.release.value = 0.1;
        master.connect(comp);
        comp.connect(ac.destination);
        audioRef.current = ac;
        masterRef.current = master;
        resetSchedule();
        ac.onstatechange = () => {
          if (ac.state === "running") {
            resetSchedule();
            if (soundRef.current) scheduleAhead();
          }
        };
      } catch {
        return null;
      }
    }
    return audioRef.current;
  }, [resetSchedule, scheduleAhead]);

  const toggleSound = () => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
    const ac = ensureAudio(); // created inside the click = allowed by autoplay policy
    const master = masterRef.current;
    if (!ac || !master) return;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(next ? 1 : 0, ac.currentTime, 0.02);
    if (next) {
      Promise.resolve(ac.resume())
        .catch(() => { })
        .then(() => {
          if (soundRef.current) {
            resetSchedule(); // always start from a fresh, correctly-mapped schedule
            scheduleAhead();
          }
        });
    }
  };

  // Keep topping up / re-syncing the look-ahead, and resume audio if the browser suspended it
  useEffect(() => {
    const id = setInterval(() => {
      if (soundRef.current) scheduleAhead();
    }, 500);
    const onVis = () => {
      const ac = audioRef.current;
      if (!ac || !soundRef.current) return;
      if (ac.state === "suspended") ac.resume().catch(() => { });
      else scheduleAhead(); // re-validate the schedule right away when the tab returns
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      audioRef.current?.close().catch(() => { });
      audioRef.current = null;
      masterRef.current = null;
      busRef.current = null;
      pendingRef.current = [];
    };
  }, [scheduleAhead]);

  /* ---- main render loop ---- */
  useEffect(() => {
    const panel = panelRef.current!;
    const canvas = canvasRef.current!;
    const host = lblHostRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0,
      h = 0,
      dpr = 1,
      R = 259,
      cy = 0;

    const resize = () => {
      // clientWidth/Height ignore CSS transforms (the overlay is scaled while the menu animates)
      w = panel.clientWidth;
      h = panel.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      // Fullscreen (phones / tablets) always uses the compact layout; otherwise decide by width.
      const small = fullscreen || window.innerWidth < DESKTOP_MIN_WIDTH;
      // Fullscreen reserves room for the navbar AND the city label above the ring.
      const top = fullscreen ? FS_NAV_SAFE + FS_CITY_BLOCK : small ? TOP_SAFE : 0;
      const bottom = small ? BOTTOM_SAFE : 0;
      cy = top + (h - top - bottom) / 2;
      if (fullscreen) {
        // Bigger clock: the ring fills most of the screen width
        R = Math.max(60, Math.min(w * FS_RING_FRAC, (h - top - bottom) / 2 - 10));
      } else {
        R = small
          ? Math.max(60, Math.min(w * 0.33, (h - top - bottom) / 2 - 18))
          : Math.min(w * 0.33, h * 0.27);
      }
      host.style.fontSize = Math.round(R * 0.05 * 10) / 10 + "px";
      setLayout({ R, cy });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(panel);
    resize();

    /* ---- pointer (hover) ---- */
    const ptr = { x: 0, y: 0, on: false };
    const onMove = (e: PointerEvent) => {
      const r = panel.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      ptr.on = true;
    };
    const onLeave = () => {
      ptr.on = false;
    };
    panel.addEventListener("pointermove", onMove);
    panel.addEventListener("pointerenter", onMove);
    panel.addEventListener("pointerleave", onLeave);
    panel.addEventListener("pointercancel", onLeave);

    let fmt: Intl.DateTimeFormat;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    } catch {
      fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    }
    const readTime = (wallMs: number) => {
      const p = fmt.formatToParts(new Date(wallMs));
      const g = (t: string) => parseInt(p.find((x) => x.type === t)?.value || "0", 10) % 60;
      const hh = parseInt(p.find((x) => x.type === "hour")?.value || "0", 10) % 24;
      return { h: hh, m: g("minute"), s: g("second") };
    };

    // ONE time source for every visual: the rAF frame timestamp mapped onto the wall clock.
    // (Calling Date.now() at random points inside a frame makes motion judder slightly.)
    let epoch = Date.now() - performance.now();
    let lastCal = performance.now();

    let labels: (Lbl | undefined)[] = [];
    let ghosts: Ghost[] = [];
    let last: { h: number; m: number; s: number } | null = null;
    // Ring angle is derived from the wall clock but STEPPED: it rests between seconds and moves
    // one step when a new second begins. `introOff` is only the small first-load catch-up
    // (starts a few seconds behind, then decays smoothly to 0).
    let introOff = 0;
    let lastSk = -1;
    let snapNext = false;
    let painted = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const showTime = (t: { h: number; m: number }, instant: boolean) =>
      setShown({ h: pad2(t.h), m: pad2(t.m), instant });

    // Every thread gets its own personality so the group moves organically, not in lock-step.
    const newLabel = (n: number, born: number): Lbl => {
      const seed = Math.random();
      const el = document.createElement("span");
      el.className = "rc-lbl";
      el.textContent = pad2(n);
      host.appendChild(el);
      return {
        el,
        tf: "",
        op: "",
        cl: "",
        sh: "",
        n,
        born,
        seed,
        lag: 0,
        vel: 0,
        cs: Math.random() < 0.5 ? -1 : 1,
        cv: 0.14 + Math.random() * 0.5,
        kd: 0.42 + Math.random() * 0.3,
        sf: 0.35 + Math.random() * 0.8,
        sp: Math.random() * Math.PI * 2,
        gd: 750 + Math.random() * 600,
        hov: 0,
        init: false,
        drawn: false,
        ex: 0,
        ey: 0,
        p1x: 0,
        p1y: 0,
        lx: 0,
        ly: 0,
        mix: 0,
      };
    };

    // Writes a label/ghost's transform, opacity, colour and glow — only if something changed.
    const paintEl = (o: Dom, x: number, y: number, a: number, col: string, sh: string) => {
      const tf = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%)`;
      if (tf !== o.tf) {
        o.el.style.transform = tf;
        o.tf = tf;
      }
      const op = a.toFixed(3);
      if (op !== o.op) {
        o.el.style.opacity = op;
        o.op = op;
      }
      if (col !== o.cl) {
        o.el.style.color = col;
        o.cl = col;
      }
      if (sh !== o.sh) {
        o.el.style.textShadow = sh;
        o.sh = sh;
      }
    };

    const killEls = () => {
      for (const l of labels) l?.el.remove();
      for (const g of ghosts) g.el.remove();
    };

    const startReset = (now: number) => {
      const cx = w / 2;
      for (const l of labels) {
        if (!l) continue;
        if (!l.drawn) {
          l.el.remove();
          continue;
        }
        const a = Math.atan2(l.ly - cy, l.lx - cx) + (Math.random() - 0.5) * 1.4;
        const rad = R * (0.12 + Math.random() * 0.7);
        ghosts.push({
          el: l.el,
          tf: l.tf,
          op: l.op,
          cl: l.cl,
          sh: l.sh,
          n: l.n,
          ex: l.ex,
          ey: l.ey,
          p1x: l.p1x,
          p1y: l.p1y,
          lx: l.lx,
          ly: l.ly,
          tx: cx + Math.cos(a) * rad,
          ty: cy + Math.sin(a) * rad,
          start: now,
          delay: Math.random() * 380,
          dur: 700 + Math.random() * 350,
        });
      }
      labels = [];
    };

    // Jump straight to the correct wall-clock state — no animations (used after the tab was hidden)
    const rebuild = (t: { h: number; m: number; s: number }, now: number) => {
      timers.forEach(clearTimeout);
      timers = [];
      killEls();
      ghosts = [];
      labels = [];
      introOff = 0;
      for (let n = 0; n <= t.s; n++) labels[n] = newLabel(n, now - 4000);
      showTime(t, true);
    };

    const tick = (now: number, snap: boolean, wall: number) => {
      const t = readTime(wall);
      const first = last === null;

      if (snap && !first) {
        rebuild(t, now);
        last = t;
        return;
      }

      const minuteChanged = !!last && (t.m !== last.m || t.h !== last.h);
      if (minuteChanged) {
        startReset(now);
        introOff = 0;
        timers.push(setTimeout(() => showTime(t, document.visibilityState !== "visible"), ROLL_MS));
      } else if (first) {
        introOff = Math.min(5, t.s);
        showTime(t, true);
      }
      // The exact instant (in frame-time) the current second began — labels are born THEN, not
      // whenever the frame happened to notice, so their birth is locked to the ring step and tick.
      const boundary = now - (wall % 1000);
      for (let n = 0; n <= t.s; n++) {
        if (labels[n]) continue;
        let born = boundary;
        if (first) born = now + (n / (t.s + 1)) * 900;
        // New minute: 00 is born almost immediately and ALONE; any later second is born strictly
        // after it, so the ring never starts with seconds already elapsed.
        else if (minuteChanged) born = now + RESTART_BIRTH_MS + n * 160;
        labels[n] = newLabel(n, born);
      }
      last = t;
    };

    const draw = (now: number, dt: number, wall: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      const cx = w / 2;
      const m = themeAnim.current.mix;
      const dk = 1 - m; // 1 in dark, 0 in light
      const labelC = mixC(DARK.label, LIGHT.label, m);
      const labelCss = rgb(labelC);
      const lineC = mixC(DARK.line, LIGHT.line, m);
      const lineA = lerp(DARK.lineA, LIGHT.lineA, m);
      const ripplePeak = lerp(RIPPLE_PEAK_DARK, RIPPLE_PEAK_LIGHT, m);
      const lineR = R * 0.93;
      const tt = now / 1000;
      const hoverR = R * HOVER_RADIUS;

      // Stepped ring position on a single circular path. At the start of second s the ring is at
      // (s - 1) and moves to s over STEP_MS with a fast-start ease (so the motion lands ON the tick),
      // then holds perfectly still until the next second begins.
      introOff *= Math.exp(-dt * 7);
      if (introOff < 0.001) introOff = 0;
      const secWhole = Math.floor((wall % 60000) / 1000);
      const msIntoSec = wall % 1000;
      const glide = easeOutQuart(clamp(msIntoSec / STEP_MS));
      const sfv = secWhole - 1 + glide - introOff;

      ctx.lineCap = "round";

      // One thread: a single thin line whose opacity fades from the hub (lineA) to the tip.
      const strokeThread = (p1x: number, p1y: number, qx: number, qy: number, alpha: number) => {
        if (alpha <= 0.002) return;
        const gr = ctx.createLinearGradient(cx, cy, qx, qy);
        gr.addColorStop(0, rgba(lineC, clamp(alpha, 0, 1)));
        gr.addColorStop(1, rgba(lineC, clamp(alpha * LINE_END_FRAC, 0, 1)));
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(p1x, p1y, qx, qy);
        ctx.lineWidth = LINE_WIDTH;
        ctx.strokeStyle = gr;
        ctx.stroke();
      };

      // Glow ripple: a soft bell-shaped bright segment that travels hub -> tip along the drawn curve.
      const drawPulse = (p1x: number, p1y: number, qx: number, qy: number, c: number, wd: number, a: number) => {
        if (a <= 0.003) return;
        const N = 10;
        const bez = (u: number): [number, number] => {
          const k = 1 - u;
          return [k * k * cx + 2 * k * u * p1x + u * u * qx, k * k * cy + 2 * k * u * p1y + u * u * qy];
        };
        ctx.lineCap = "butt";
        ctx.lineWidth = RIPPLE_LINE_WIDTH;
        if (dk > 0.5) ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < N; i++) {
          const u0 = clamp(c - wd + (2 * wd * i) / N);
          const u1 = clamp(c - wd + (2 * wd * (i + 1)) / N);
          if (u1 - u0 < 1e-4) continue;
          const bell = Math.pow(Math.sin((Math.PI * (i + 0.5)) / N), 2);
          const al = a * bell;
          if (al < 0.004) continue;
          const A = bez(u0);
          const B = bez((u0 + u1) / 2);
          const C = bez(u1);
          ctx.beginPath();
          ctx.moveTo(A[0], A[1]);
          ctx.lineTo(B[0], B[1]);
          ctx.lineTo(C[0], C[1]);
          ctx.strokeStyle = rgba(lineC, clamp(al, 0, 1));
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.lineCap = "round";
      };

      // ---- live labels: threads (canvas) + label position (DOM) ----
      for (const l of labels) {
        if (!l) continue;
        const age = now - l.born;
        if (age < 0) continue;
        const th = Math.PI + (sfv - l.n) * STEP;
        if (!l.init) {
          l.lag = th;
          l.vel = 0;
          l.init = true;
        }
        // under-damped spring: each thread trails the ring with its own stiffness, so the bundle
        // ripples as a group instead of rotating rigidly
        const k = 14 + l.seed * 16;
        const c = 2 * Math.sqrt(k) * (0.5 + l.seed * 0.15);
        l.vel += (k * (th - l.lag) - c * l.vel) * dt;
        l.lag += l.vel * dt;

        const sway = Math.sin(tt * l.sf + l.sp) * 0.07 + Math.sin(tt * l.sf * 2.3 + l.sp * 1.7) * 0.03;
        const ca = l.lag - l.cs * l.cv + sway;
        const cd = lineR * l.kd;
        let p1x = cx + Math.cos(ca) * cd;
        let p1y = cy + Math.sin(ca) * cd;
        const ex = cx + Math.cos(th) * lineR;
        const ey = cy + Math.sin(th) * lineR;

        // ---- hover: pointer slightly bends the thread (no brightness / label changes) ----
        let target = 0;
        if (ptr.on) {
          let minD = 1e9;
          for (let i = 1; i <= 4; i++) {
            const u = i / 4;
            const bx = (1 - u) * (1 - u) * cx + 2 * (1 - u) * u * p1x + u * u * ex;
            const by = (1 - u) * (1 - u) * cy + 2 * (1 - u) * u * p1y + u * u * ey;
            minD = Math.min(minD, Math.hypot(bx - ptr.x, by - ptr.y));
          }
          target = Math.exp(-Math.pow(minD / hoverR, 2));
        }
        l.hov += (target - l.hov) * (1 - Math.exp(-dt * (target > l.hov ? 9 : 4)));
        if (l.hov > 0.001) {
          p1x += (ptr.x - p1x) * HOVER_BEND * l.hov;
          p1y += (ptr.y - p1y) * HOVER_BEND * l.hov;
        }

        const pr = easeOutCubic(clamp(age / l.gd));
        const sx = cx + (p1x - cx) * pr;
        const sy = cy + (p1y - cy) * pr;
        const qx = (1 - pr) * (1 - pr) * cx + 2 * (1 - pr) * pr * p1x + pr * pr * ex;
        const qy = (1 - pr) * (1 - pr) * cy + 2 * (1 - pr) * pr * p1y + pr * pr * ey;
        const vis = clamp(age / 300);
        strokeThread(sx, sy, qx, qy, lineA * vis);

        // ---- glow ripple, hub -> tip, repeating; each thread has its own small phase offset ----
        const ph = (tt / RIPPLE_PERIOD + l.seed * RIPPLE_STAGGER) % 1;
        const rc = ph * (1 + 2 * RIPPLE_WIDTH) - RIPPLE_WIDTH;
        drawPulse(sx, sy, qx, qy, rc, RIPPLE_WIDTH, ripplePeak * (1 - 0.45 * ph) * vis);

        // label sits at a FIXED radius on the ring (only the birth ease-in animates it)
        const ea = easeOutCubic(clamp(age / 600));
        const r = R - (1 - ea) * R * 0.1;
        l.ex = ex;
        l.ey = ey;
        l.p1x = p1x;
        l.p1y = p1y;
        l.lx = cx + Math.cos(th) * r;
        l.ly = cy + Math.sin(th) * r;
        l.mix = clamp(age / 1500);
        l.drawn = true;

        // DOM label: colour only depends on age (red bloom -> grey), never on the pointer
        const a = clamp(age / 450);
        const glow = (1 - l.mix) * a;
        const col = rgb(mixC(RED, labelC, l.mix));
        const sh = glow > 0.02 ? `0 0 ${(10 * glow).toFixed(1)}px ${rgba(RED, +(0.9 * glow).toFixed(2))}` : "none";
        paintEl(l, l.lx, l.ly, a, col, sh);
      }

      // ---- ghosts (minute reset): threads (canvas) + labels (DOM) ----
      ghosts = ghosts.filter((g) => {
        const alive = now - g.start - g.delay < g.dur;
        if (!alive) g.el.remove();
        return alive;
      });
      for (const g of ghosts) {
        const u = clamp((now - g.start - g.delay) / g.dur);
        const e = easeInOut(u);
        const ex = g.ex + (cx - g.ex) * e,
          ey = g.ey + (cy - g.ey) * e;
        const p1x = g.p1x + (cx - g.p1x) * e,
          p1y = g.p1y + (cy - g.p1y) * e;
        strokeThread(p1x, p1y, ex, ey, lineA * (1 - u));

        const e2 = easeOutCubic(u);
        const x = g.lx + (g.tx - g.lx) * e2,
          y = g.ly + (g.ty - g.ly) * e2;
        paintEl(g, x, y, 1 - u * u, labelCss, "none");
      }
    };

    let lastT = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const gap = now - lastT;
      const dt = Math.min(0.05, gap / 1000);
      lastT = now;

      // Keep the perf-clock -> wall-clock mapping honest (follows system clock adjustments)
      if (now - lastCal > 1000 || gap > 500) {
        const e2 = Date.now() - performance.now();
        if (Math.abs(e2 - epoch) > 25) epoch = e2;
        lastCal = now;
      }
      const wall = epoch + now + VISUAL_LEAD_MS;

      // A long gap means the tab was hidden/throttled: snap to the real time, no catch-up animation
      const snap = gap > 500 || snapNext;
      snapNext = false;
      const sk = Math.floor(wall / 1000);
      if (snap || sk !== lastSk) {
        lastSk = sk;
        tick(now, snap, wall);
      }

      // theme cross-fade
      const a = themeAnim.current;
      const u = clamp((now - a.start) / THEME_MS);
      const nm = u >= 1 ? a.to : lerp(a.from, a.to, easeSine(u));
      if (nm !== a.mix || !painted) {
        a.mix = nm;
        paintTheme(panel, nm);
        painted = true;
      }

      draw(now, dt, wall);
      raf = requestAnimationFrame(frame);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") snapNext = true;
    };
    document.addEventListener("visibilitychange", onVisible);

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      panel.removeEventListener("pointermove", onMove);
      panel.removeEventListener("pointerenter", onMove);
      panel.removeEventListener("pointerleave", onLeave);
      panel.removeEventListener("pointercancel", onLeave);
      timers.forEach(clearTimeout);
      killEls();
    };
  }, [timeZone, fullscreen]);

  const fontSize = Math.round(layout.R * 0.224);

  // Fullscreen: the city sits ABOVE the whole clock, i.e. above the top edge of the ring
  // (and below the navbar), not on the time digits or inside the ring.
  const cityStyle: React.CSSProperties | undefined = fullscreen
    ? { top: layout.cy != null ? layout.cy - layout.R - CITY_GAP : "18%" }
    : undefined;

  return (
    <div
      ref={panelRef}
      className={`rc-panel${fullscreen ? " rc-fs" : ""} ${mono.className} ${className}`}
      style={{ ["--rc-sans" as string]: sans.style.fontFamily }}
    >
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="rc-canvas" role="img" aria-label="Radial seconds clock" />
      <div ref={lblHostRef} className="rc-lbls" aria-hidden />

      <div
        className="rc-time"
        style={{ fontSize, top: layout.cy ?? "50%" }}
        aria-label={`${shown.h}:${shown.m}`}
      >
        <RollDigit value={shown.h[0]} instant={shown.instant} />
        <RollDigit value={shown.h[1]} instant={shown.instant} />
        <span className="rc-colon" aria-hidden>
          <i />
          <i />
        </span>
        <span className="rc-min">
          <RollDigit value={shown.m[0]} instant={shown.instant} />
          <RollDigit value={shown.m[1]} instant={shown.instant} />
        </span>
      </div>

      <div className="rc-ui rc-city" style={cityStyle}>
        {location}
      </div>

      <button
        type="button"
        className="rc-ui rc-btn rc-right"
        aria-pressed={soundOn}
        onClick={toggleSound}
      >
        <span>SOUND:</span>
        <Wave on={soundOn} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const CSS = `
.rc-panel{--rc-bg:#060606;--rc-fg:#fff2ef;position:relative;width:100%;height:100%;min-height:360px;overflow:hidden;border-radius:16px;background:var(--rc-bg);color:var(--rc-fg);user-select:none;-webkit-user-select:none;isolation:isolate}
.rc-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.rc-lbls{position:absolute;inset:0;pointer-events:none;font-weight:700;letter-spacing:.3px;line-height:1}
.rc-lbl{position:absolute;left:0;top:0;opacity:0;white-space:nowrap;pointer-events:none;will-change:transform,opacity;backface-visibility:hidden;font-variant-numeric:tabular-nums}
.rc-ui{font-size:14.8px;line-height:20px;font-weight:500;text-transform:uppercase;letter-spacing:0;white-space:nowrap}
.rc-city{position:absolute;bottom:41px;left:41px;pointer-events:none}
.rc-time{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;font-family:var(--rc-sans),'Helvetica Neue',Arial,sans-serif;font-weight:600;letter-spacing:-.03em;line-height:1;white-space:nowrap;pointer-events:none;font-variant-numeric:tabular-nums}
.rc-min{display:flex;color:${RED_HEX}}
.rc-digit{position:relative;display:inline-block;width:.58em;height:1.06em;overflow:hidden;text-align:center}
.rc-d{display:block;height:1.06em;line-height:1.06em}
.rc-out{position:absolute;inset:0;animation:rc-out .7s cubic-bezier(.76,0,.24,1) forwards}
.rc-in{animation:rc-in .7s cubic-bezier(.76,0,.24,1) both}
@keyframes rc-out{from{transform:translateY(0)}to{transform:translateY(-105%)}}
@keyframes rc-in{from{transform:translateY(105%)}to{transform:translateY(0)}}
.rc-colon{display:flex;flex-direction:column;gap:.2em;margin:0 .26em}
.rc-colon i{display:block;width:.13em;height:.13em;background:currentColor}
.rc-btn{position:absolute;bottom:41px;display:flex;align-items:center;gap:8px;background:none;border:0;padding:0;margin:0;color:inherit;cursor:pointer;font-family:inherit}
.rc-right{right:41px}
@media (max-width:1008px){
  .rc-ui{font-size:12px}
  .rc-city{left:20px;bottom:20px}
  .rc-btn{bottom:20px}
  .rc-right{right:20px}
}

/* ---- FULLSCREEN layout (phones / tablets): square corners, city above the time, sound bottom-center ---- */
.rc-panel.rc-fs{border-radius:0;min-height:0}
.rc-fs .rc-ui{font-size:13px}
.rc-fs .rc-city{left:50%;bottom:auto;transform:translate(-50%,-100%);text-align:center}
.rc-fs .rc-btn{left:50%;right:auto;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%)}

@media (prefers-reduced-motion:reduce){.rc-out,.rc-in{animation-duration:.01s}}
`;