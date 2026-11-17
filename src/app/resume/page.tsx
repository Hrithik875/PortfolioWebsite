"use client";

/**
 * Resume page — folded-paper scroll reveal
 * ------------------------------------------------------------------------------
 *   • giant condensed headline that parallaxes at a *varying* speed
 *   • headline is drawn to a canvas and distorted by a fragment shader:
 *       – SCROLL: vertical RGB split, signed + smoothed scroll velocity
 *         (slow = almost clean, fast = strong, flips with direction)
 *       – HOVER: RGB split along the POINTER VELOCITY vector, with a gaussian
 *         falloff around the cursor (per pixel → wedge-shaped fringes)
 *   • a letter-folded sheet of paper (Three.js), scroll-scrubbed and damped
 *   • paper texture drawn straight onto a 2D canvas (resume content, auto-fitted)
 *   • LIGHT / DARK theme aware (live-switches without rebuilding the scene)
 *
 * Dependencies:   npm i three lenis      npm i -D @types/three
 *
 * Optional assets (same-origin paths in /public):
 *   AVATAR_SRC     round photo at the top of the letter
 *   SIGNATURE_SRC  transparent PNG/SVG of the signature
 */

import React, { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import * as THREE from "three";

/* ───────────────────────────── Content ───────────────────────────── */

const LOGO_DARK_SRC = "/logo-dark.svg";
const LOGO_LIGHT_SRC = "/logo-light.svg";
const SIGNATURE_SRC: string | null = null; // e.g. "/signature.png"
const SIGNATURE_FALLBACK_TEXT = "Hrithik";

/**
 * "A quick look about me" — desktop shows these rows as-is,
 * phones show every word on its own line (see build()).
 */
const HEADLINE_ROWS: string[][] = [["A", "quick"], ["Look"], ["About"], ["Me"]];
const HEADLINE_LABEL = HEADLINE_ROWS.map((r) => r.join(" ")).join(" ");

/**
 * Optional compact-only variants (`cTitle`, `cSub`, `c`) are used on phones /
 * portrait tablets, where the text is trimmed a little more so the font can be
 * bigger. They never drop a key fact — they only tighten the wording.
 */
type Block =
  | { t: "section"; text: string }
  | { t: "entry"; title: string; right?: string; sub?: string; cTitle?: string; cSub?: string }
  | { t: "bullet"; text: string; c?: string }
  | { t: "skill"; label: string; text: string; c?: string };

const RESUME: Block[] = [
  { t: "section", text: "Education" },
  {
    t: "entry",
    title: "B. M. S. College of Engineering",
    right: "Sep 2023 – Present",
    sub: "B.E. in AI & Machine Learning, 7th Sem — CGPA 9.83 · Bengaluru",
    cSub: "B.E. in AI & ML, 7th Sem — CGPA 9.83 · Bengaluru",
  },
  {
    t: "entry",
    title: "Aradhana P.U. College",
    right: "2021 – 2023",
    sub: "Pre-University, Karnataka State Board — 97.33% · Bengaluru",
  },

  { t: "section", text: "Technical Skills" },
  { t: "skill", label: "Languages", text: "Python, Java, C++" },
  {
    t: "skill",
    label: "Core Concepts",
    text: "DSA, OOP, Operating Systems, Computer Networks, ML, Deep Learning, LLMs, RAG",
    c: "DSA, OOP, OS, Networks, ML, Deep Learning, LLMs, RAG",
  },
  {
    t: "skill",
    label: "Frameworks",
    text: "FastAPI, Flask, Scikit-learn, TensorFlow, MLflow, NumPy, Pandas, Next.js, Tailwind CSS",
  },
  {
    t: "skill",
    label: "Databases & Backend",
    text: "PostgreSQL, MongoDB, Qdrant, FAISS, DBMS, REST APIs",
  },
  {
    t: "skill",
    label: "DevOps & Cloud",
    text: "Docker, Docker Compose, Kafka, Apache Spark, Git, GitHub Actions, Cloudflare CDN",
  },

  { t: "section", text: "Professional Experience" },
  {
    t: "entry",
    title: "Hewlett Packard Enterprise (HPE) — Career Preview Program",
    cTitle: "HPE — Career Preview Program",
    right: "Feb 2026 – Present",
    sub: "Project Intern · Bengaluru",
  },
  {
    t: "bullet",
    text: "Selected for HPE’s Career Preview Program; 100+ commits to ArchGuide, an enterprise AI architecture decision tool (Next.js, FastAPI).",
  },
  {
    t: "bullet",
    text: "Built a 5-rule document relevance gate with tiered risk scoring (clear/review/reject) that blocks invalid LLM processing; owned frontend, backend security (Firebase JWT, rate limiting, CORS, account-takeover mitigation) and CI/CD hardening (multi-stage Docker).",
    c: "Built a 5-rule document relevance gate with tiered risk scoring (clear/review/reject); owned frontend, backend security (Firebase JWT, rate limiting, CORS, account-takeover mitigation) and CI/CD hardening (multi-stage Docker).",
  },
  {
    t: "entry",
    title: "Samsung PRISM — R&D Program (SRI-B)",
    right: "Nov 2025 – Present",
    sub: "R&D Research Intern · Bengaluru",
  },
  {
    t: "bullet",
    text: "Selected for Samsung PRISM; researching semantic 3D smart-home reconstruction from uncalibrated monocular images (no LiDAR): semantic segmentation and NLP-guided language querying over 3D Gaussian Splats.",
    c: "Selected for Samsung PRISM; researching semantic 3D smart-home reconstruction from uncalibrated monocular images (no LiDAR): semantic segmentation and NLP-guided querying over 3D Gaussian Splats.",
  },
  {
    t: "entry",
    title: "Kshipani Tech Ventures Pvt. Ltd.",
    right: "Oct 2025 – Jan 2026",
    sub: "Technical Intern · Bengaluru",
  },
  {
    t: "bullet",
    text: "Built and deployed velory.co.in on Shopify; handled client requirements, theme customization, content optimization, proposals and documentation.",
  },

  { t: "section", text: "Projects" },
  {
    t: "entry",
    title: "Real-Time Fraud Detection Pipeline",
    right: "2026",
    sub: "Kafka, Spark, PostgreSQL, Flask, Docker",
  },
  {
    t: "bullet",
    text: "Kafka–Spark–PostgreSQL streaming pipeline with Flask APIs and a Chart.js dashboard, processing 3,200+ msg/sec; containerized with Docker Compose.",
    c: "Kafka–Spark–PostgreSQL streaming pipeline with Flask APIs and Chart.js dashboard (3,200+ msg/sec); Docker Compose.",
  },
  {
    t: "bullet",
    text: "5-layer fraud scoring engine (behavioral profiling, velocity anomalies, burst detection) beating rule-based baselines: 83.5% precision, 82.7% recall, AUC 0.964 on the ULB dataset (284K txns; SMOTE).",
    c: "5-layer fraud scoring engine (behavioral profiling, velocity anomalies, burst detection) beating rule-based baselines: 83.5% precision, 82.7% recall, AUC 0.964 (ULB, 284K txns; SMOTE).",
  },
  {
    t: "entry",
    title: "JustiBot — Indian Legal AI Assistant",
    right: "2025 – 2026",
    sub: "FastAPI, Qdrant, Redis, Firebase, Next.js",
  },
  {
    t: "bullet",
    text: "Production-grade RAG over 6,800+ legal chunks (BNS 2023, Constitution, RTI & IT Acts): hybrid retrieval (dense + BM25 + RRF), cross-encoder reranking, confidence-gated fallback search.",
  },
  {
    t: "bullet",
    text: "Query classifier (95% accuracy) routing across two LLM tiers; citation-grounded hallucination checker; offline eval suite (5 metrics, labeled test set).",
    c: "Query classifier (95% accuracy) routing across two LLM tiers; citation-grounded hallucination checker; offline eval suite (5 metrics).",
  },
  {
    t: "bullet",
    text: "Exact + semantic Redis caching (12× speedup), Firebase JWT auth with prompt-injection detection, live observability dashboard (41.4% cost savings).",
    c: "Exact + semantic Redis caching (12× speedup), Firebase JWT auth with prompt-injection detection, observability dashboard (41.4% cost savings).",
  },

  { t: "section", text: "Positions of Responsibility" },
  {
    t: "entry",
    title: "BMSCE ACM Student Chapter",
    right: "2024 – 2026",
    sub: "Webmaster & Technical Head · Bengaluru",
  },
  {
    t: "bullet",
    text: "Led a 5-member team building bmsce.acm.org (React, Tailwind CSS, GSAP): 94% load-time reduction (15s → 875ms) via Cloudflare CDN, WebP/WebM, lazy loading; 500+ monthly visits.",
    c: "Led a 5-member team building bmsce.acm.org (React, Tailwind, GSAP): 94% load-time reduction (15s → 875ms) via Cloudflare CDN, WebP/WebM, lazy loading; 500+ monthly visits.",
  },
  {
    t: "bullet",
    text: "Led a 10+ member technical team across workshops, hackathons, 100 Days of Code, deployments and website architecture.",
    c: "Led a 10+ member technical team across workshops, hackathons, 100 Days of Code and deployments.",
  },
  {
    t: "entry",
    title: "ACM India Council & Chapter Summit",
    right: "2024 – 2026",
    sub: "Regional Lead, Karnataka — Senior Coordinator, ACM India Chapter Summit 2024",
    cSub: "Regional Lead, Karnataka · Sr. Coordinator, Chapter Summit 2024",
  },
  {
    t: "bullet",
    text: "Coordinated ACM chapters across Karnataka as Regional Lead; earlier Senior Coordinator at the ACM India Chapter Summit 2024, supporting national inter-chapter collaboration and operations.",
    c: "Coordinated ACM chapters across Karnataka as Regional Lead; earlier Senior Coordinator at ACM India Chapter Summit 2024 (national inter-chapter collaboration).",
  },
];

/* ───────────────────────────── Themes ───────────────────────────── */

type ThemeName = "light" | "dark";

interface Theme {
  /** page / stage background */
  bg: string;
  /** headline text colour (top layer) */
  ink: string;
  /** the four colour-fringe layers: [-1, +1, -0.5, +0.5] offset multipliers */
  fringe: [string, string, string, string];
  /** paper */
  paper: string;
  paperText: string;
  paperAccent: string; // signature
  /** paper shading (applied to the folded-away faces) */
  shadeMax: number;
  shadeTo: [number, number, number]; // colour the shade mixes toward
  /** signed grain: > 0 darkens the paper, < 0 lightens it */
  grain: number;
  /** multiplier for crease shadows/highlights (negative = creases get lighter) */
  creaseK: number;
}

const THEMES: Record<ThemeName, Theme> = {
  light: {
    bg: "#d9dad6",
    ink: "#000000",
    fringe: ["#f5e100", "#00e8ff", "#e8141c", "#1423ff"],
    paper: "#ffffff",
    paperText: "#171717",
    paperAccent: "#111111",
    shadeMax: 0.17,
    shadeTo: [0, 0, 0],
    grain: 0.1,
    creaseK: 1,
  },
  dark: {
    bg: "#101010",
    ink: "#f3f2ee",
    fringe: ["#f5e100", "#00e8ff", "#ff2a33", "#3c4dff"],
    paper: "#262626",
    paperText: "#ecebe6",
    paperAccent: "#f3f2ee",
    shadeMax: 0.09,
    shadeTo: [1, 1, 1],
    grain: -0.035,
    creaseK: -0.6,
  },
};

/**
 * Works with the usual setups: next-themes (class="dark" / "light" or
 * data-theme), Tailwind darkMode:"class", or a plain `color-scheme`.
 * Falls back to the OS preference. Adjust here if your toggle works differently.
 */
function detectTheme(): ThemeName {
  const roots = [document.documentElement, document.body];
  for (const el of roots) {
    if (!el) continue;
    const attr = (
      el.getAttribute("data-theme") ||
      el.getAttribute("data-mode") ||
      ""
    ).toLowerCase();
    if (el.classList.contains("dark") || attr === "dark") return "dark";
    if (el.classList.contains("light") || attr === "light") return "light";
  }
  const cs = document.documentElement.style.colorScheme;
  if (cs === "dark" || cs === "light") return cs;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeTheme(cb: (t: ThemeName) => void): () => void {
  let cur = detectTheme();
  const check = () => {
    const next = detectTheme();
    if (next !== cur) {
      cur = next;
      cb(next);
    }
  };
  const mo = new MutationObserver(check);
  const opts = {
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-mode", "style"],
  };
  mo.observe(document.documentElement, opts);
  if (document.body) mo.observe(document.body, opts);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", check);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", check);
  };
}

/* ─────────────────────── Measured from the reference ─────────────────────── */

const PAPER_VW = 0.483;
const PAPER_VW_MOBILE = 0.86;
const PANEL_RATIO = 0.544;

/**
 * All values are in "paper units" (1u = 1% of the paper width).
 * The paper's overall dimensions (ratio) are untouched; only the inner
 * margins / vertical positions of the content changed.
 *
 * Paper height in u: desktop = 0.544 * 3 * 100 ≈ 163, compact ≈ 209.
 */
interface LetterLayout {
  ratio: number;
  /** true → phones / portrait tablets (uses the trimmed `c` text variants) */
  compact: boolean;
  avatarCx: number;
  avatarTop: number;
  avatarD: number;
  colX: number;
  colW: number;
  /** vertical band the resume text is auto-fitted into */
  textTop: number;
  textBottom: number;
  /** upper bound for the auto-fitted body font size */
  maxFont: number;
  sigCx: number;
  sigY: number;
  sigW: number;
}
const DESKTOP_LAYOUT: LetterLayout = {
  ratio: PANEL_RATIO,
  compact: false,
  avatarCx: 50,
  avatarTop: 3.2, // was 7  → sits closer to the top edge
  avatarD: 8.5, // was 12 → smaller photo
  colX: 4.5,
  colW: 91,
  textTop: 14.5, // was 24 → text starts right under the avatar
  textBottom: 152, // was 136 → text runs down to just above the signature
  maxFont: 3.2, // was 2.4
  sigCx: 50,
  sigY: 157.3, // was 142.5 → pushed toward the bottom edge
  sigW: 11, // was 17 → smaller signature
};
const COMPACT_LAYOUT: LetterLayout = {
  ratio: 0.6957,
  compact: true,
  avatarCx: 50,
  avatarTop: 3, // was 6
  avatarD: 14, // was 22
  colX: 4.5,
  colW: 91,
  textTop: 20, // was 33
  textBottom: 195, // was 172
  maxFont: 4.4, // was 2.8
  sigCx: 50,
  sigY: 202, // was 182
  sigW: 17, // was 30
};

/** Scroll choreography, in viewport heights unless noted. */
const PIN_CENTER = 0.425;
const PIN_LENGTH = 1.3;
const FOLD_A_START_BEFORE_PIN = 0.125;
const FOLD_TOP_LENGTH = 1.4;
const FOLD_BOTTOM_LENGTH = 0.9;
const HOLD_AFTER_PAPER = 0.5;

/**
 * Paper "peek" at scroll = 0: how far (in viewport heights) the top of the
 * letter sticks up into the first screen so people see there's more below.
 * It eases back to the original path before the fold animation starts, so the
 * pin / fold / headline timings are untouched.
 */
const PEEK_VH = 0.13; // desktop
const C_PEEK_VH = 0.1; // phones / portrait tablets

/* ───────────── Compact layout (phones / portrait tablets) ───────────── */

const COMPACT_QUERY = "(max-width: 899px) and (orientation: portrait)";
const C_PAPER_VW = 0.8925;
const C_LETTER_MAX_VH = 0.854;
const C_BOTTOM_REST = 0.961;
const C_FOLD_TOP_FROM = 0.579;
const C_FOLD_TOP_TO = 0.381;
const C_FOLD_BOTTOM_FROM = 0.381;
const C_FOLD_BOTTOM_TO = 0.182;
const C_SCROLL_STRETCH = 1;
const C_FOLD_TAU = 0.13;
const C_CAM_DIST_PER_P = 4.1;
const C_Z_LIFT_PER_P = 0.112;
const C_HEADLINE_FONT_VW = 39.7;
const C_HEADLINE_PAD_VW = 0.5;
const C_HEADLINE_FIRST_CAP_TOP = 0.1181;
/**
 * Phones: the last headline line must end above this fraction of the viewport
 * height (the paper peeks up from ~0.9), so every word is visible at scroll 0.
 */
const C_HEADLINE_BOTTOM_LIMIT = 0.86;

/** Smoothing time constants (seconds). */
const FOLD_TAU = 0.11;
const LENIS_LERP = 0.085;

/** Headline travel keyframes (viewport heights). */
const HEADLINE_FIRST_CAP_TOP = 0.142;
const SHIFT_AT_ENTER_END = 0.39;
const SHIFT_AT_PIN_END = 0.46;
const SHIFT_AT_PIN_END_PLUS = 0.726;
const SHIFT_AT_END = 1.103;

/** Anton metrics (fractions of the font size). */
const ANTON_CAP_TOP_IN_LINE = 0.0545;
const ANTON_CAP_BOTTOM_IN_LINE = 0.9135;
const HEADLINE_FONT_VW = 27.4;
const HEADLINE_LINE_HEIGHT = 0.98;
const HEADLINE_TRACKING = 0.06; // em
const HEADLINE_PAD_LEFT_VW = 2.8;
/** Widest headline row may use at most this share of the viewport width. */
const HEADLINE_MAX_WIDTH_SHARE = 0.98;

/** Paper look. */
const BOW_PER_RAD_S = 0.04;
const BOW_MAX = 0.07;

/* ───────────── Headline distortion (all px values at 1884px wide) ───────────── */

/**
 * SCROLL — measured from the reference:
 *   ≈ 800 px/s of scroll  →  ≈ 22 px of split, saturating around 40 px.
 *   Slow scrolling (< ~150 px/s) is nearly clean thanks to the power curve + dead zone.
 */
const SCROLL_REF_SPEED = 800; // px/s
const SCROLL_REF_SPLIT = 22; // px of split at REF speed
const SCROLL_CURVE = 1.55; // >1 → slow = subtle, fast = ramps up hard
const SCROLL_DEAD = 50; // px/s ignored
const SCROLL_MAX = 40; // px cap
const SCROLL_VEL_TAU = 0.12; // s — fringe lags the scroll like the video

/**
 * HOVER — driven by the POINTER VELOCITY vector.
 *   Slow hover = barely anything, fast hover = strong, direction follows the pointer.
 */
const HOVER_REF_SPEED = 1500; // px/s
const HOVER_REF_SPLIT = 30; // px of split at REF speed
const HOVER_CURVE = 1.4;
const HOVER_DEAD = 40; // px/s ignored
const HOVER_MAX = 36; // px cap
const POINTER_VEL_TAU = 0.05; // s — how quickly velocity follows the pointer
const HOVER_SETTLE_TAU = 0.14; // s — how fast the split settles back to clean
/** Falloff radius of the hover area, as a share of the headline font size. */
const HOVER_RADIUS = 0.3;

/* ───────────────────────────── Helpers ───────────────────────────── */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const damp = (cur: number, target: number, tau: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-dt / tau));
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** "#rrggbb" → raw sRGB vec3 (no colour-space conversion, matches CSS). */
const hexToVec3 = (hex: string) =>
  new THREE.Vector3(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );

/** Monotone cubic interpolation (no overshoot, continuous speed). */
function monotone(xs: number[], ys: number[]) {
  const n = xs.length;
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Recolours a (transparent) image to a single colour, keeping its alpha. */
function tint(img: HTMLImageElement, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/* ──────────────────────────── Paper texture ──────────────────────────── */

const serifFont = (size: number, italic = false) =>
  `${italic ? "italic " : ""}400 ${size}px "Instrument Serif", Georgia, "Times New Roman", serif`;
const sansBold = (size: number) =>
  `700 ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`;

/**
 * Lays out (and optionally draws) the resume into a column.
 * Everything scales with `f` (body font size in canvas px), so the caller can
 * binary-search the largest `f` that fits. Returns the y where the content ends.
 */
function layoutResume(
  g: CanvasRenderingContext2D,
  T: Theme,
  x0: number,
  w: number,
  y0: number,
  f: number,
  draw: boolean,
  compact: boolean,
): number {
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.fillStyle = T.paperText;

  let y = y0;
  let first = true;
  let prev: Block["t"] | null = null;

  /** greedy word wrap using the current g.font */
  const wrap = (text: string, maxW: number, firstW: number) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    let limit = firstW;
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (!cur || g.measureText(test).width <= limit) {
        cur = test;
      } else {
        lines.push(cur);
        cur = word;
        limit = maxW;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  /** shrinks `size` so `text` (in the font made by `mk`) fits `maxW` */
  const fit = (mk: (s: number) => string, size: number, text: string, maxW: number) => {
    g.font = mk(size);
    const m = g.measureText(text).width;
    return m > maxW ? size * (maxW / m) : size;
  };

  /** draws one line, optionally justified to `width` (uses current g.font) */
  const putLine = (line: string, x: number, base: number, width: number, justify: boolean) => {
    if (!draw) return;
    const words = line.split(" ");
    if (!justify || words.length < 2) {
      g.fillText(line, x, base);
      return;
    }
    const widths = words.map((wd) => g.measureText(wd).width);
    const spaceW = g.measureText(" ").width;
    const gap = (width - widths.reduce((a, b) => a + b, 0)) / (words.length - 1);
    if (gap < 0 || gap > spaceW * 2.2) {
      g.fillText(line, x, base);
      return;
    }
    let cx = x;
    words.forEach((wd, k) => {
      g.fillText(wd, cx, base);
      cx += widths[k] + gap;
    });
  };

  const LH = 1.14 * f; // body line pitch

  for (const b of RESUME) {
    if (b.t === "section") {
      if (!first) y += 0.7 * f;
      const hs = 0.7 * f;
      const base = y + hs * 0.85;
      if (draw) {
        g.font = sansBold(hs);
        g.fillStyle = T.paperAccent;
        g.fillText(b.text.toUpperCase(), x0, base);
        g.globalAlpha = 0.5;
        g.fillRect(x0, base + 0.3 * f, w, Math.max(1, 0.05 * f));
        g.globalAlpha = 1;
        g.fillStyle = T.paperText;
      }
      y = base + 0.3 * f + 0.45 * f;
    } else if (b.t === "entry") {
      const title = compact && b.cTitle ? b.cTitle : b.title;
      const subText = compact && b.cSub ? b.cSub : b.sub;
      y += prev === "section" ? 0 : 0.4 * f;
      const base = y + 0.82 * f;
      if (draw) {
        let rightW = 0;
        if (b.right) {
          g.font = serifFont(0.98 * f, true);
          rightW = g.measureText(b.right).width;
        }
        const ts = fit(sansBold, 0.76 * f, title, w - rightW - 0.8 * f);
        g.font = sansBold(ts);
        g.fillText(title, x0, base);
        if (b.right) {
          g.font = serifFont(0.98 * f, true);
          g.textAlign = "right";
          g.fillText(b.right, x0 + w, base);
          g.textAlign = "left";
        }
      }
      if (subText) {
        const subBase = base + 0.98 * f;
        if (draw) {
          const ss = fit((s) => serifFont(s, true), 0.95 * f, subText, w);
          g.font = serifFont(ss, true);
          g.fillText(subText, x0, subBase);
        }
        y = subBase + 0.3 * f;
      } else {
        y = base + 0.3 * f;
      }
    } else if (b.t === "bullet") {
      const text = compact && b.c ? b.c : b.text;
      const ind = 0.95 * f;
      g.font = serifFont(f);
      const lines = wrap(text, w - ind, w - ind);
      lines.forEach((ln, i) => {
        const base = y + 0.8 * f + i * LH;
        if (!draw) return;
        if (i === 0) {
          g.beginPath();
          g.arc(x0 + 0.3 * f, base - 0.27 * f, 0.09 * f, 0, Math.PI * 2);
          g.fill();
        }
        g.font = serifFont(f);
        putLine(ln, x0 + ind, base, w - ind, i < lines.length - 1);
      });
      y += lines.length * LH + 0.1 * f;
    } else {
      // skill line: bold label, then wrapped text
      const text = compact && b.c ? b.c : b.text;
      g.font = sansBold(0.7 * f);
      const label = `${b.label}:`;
      const lw = g.measureText(label).width + 0.4 * f;
      g.font = serifFont(f);
      const lines = wrap(text, w, w - lw);
      lines.forEach((ln, i) => {
        const base = y + 0.8 * f + i * LH;
        if (!draw) return;
        if (i === 0) {
          g.font = sansBold(0.7 * f);
          g.fillText(label, x0, base);
        }
        g.font = serifFont(f);
        g.fillText(ln, i === 0 ? x0 + lw : x0, base);
      });
      y += lines.length * LH + 0.12 * f;
    }
    first = false;
    prev = b.t;
  }
  return y;
}

function drawLetter(
  paperPx: number,
  scale: number,
  logo: HTMLImageElement | null,
  signature: HTMLImageElement | null,
  L: LetterLayout,
  T: Theme,
  isDark: boolean,
): HTMLCanvasElement {
  const W = Math.round(paperPx * scale);
  const H = Math.round(paperPx * L.ratio * 3 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d")!;
  const u = W / 100;

  g.fillStyle = T.paper;
  g.fillRect(0, 0, W, H);

  /* HM logo */
  const ax = L.avatarCx * u;
  const ay = (L.avatarTop + L.avatarD / 2) * u;
  const ar = (L.avatarD / 2) * u;

  if (logo) {
    const logoSize = ar * 2.0;
    g.drawImage(logo, ax - logoSize / 2, ay - logoSize / 2, logoSize, logoSize);
  } else {
    g.fillStyle = T.paperText;
    g.font = `bold ${ar * 1.1}px "Instrument Serif", Georgia, serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("HM", ax, ay);
  }

  /* resume body — find the largest font size that fits the text band */
  const colX = L.colX * u;
  const colW = L.colW * u;
  const top = L.textTop * u;
  const bottom = L.textBottom * u;
  let lo = 0.6 * u;
  let hi = L.maxFont * u;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (layoutResume(g, T, colX, colW, top, mid, false, L.compact) <= bottom) lo = mid;
    else hi = mid;
  }
  g.fillStyle = T.paperText;
  layoutResume(g, T, colX, colW, top, lo, true, L.compact);

  /* signature */
  const sy = L.sigY * u;
  if (signature) {
    const w = L.sigW * u;
    const h = (signature.height / signature.width) * w;
    // a dark signature would vanish on the dark paper → recolour it to the ink colour
    const src: CanvasImageSource = isDark ? tint(signature, T.paperAccent) : signature;
    g.drawImage(src, L.sigCx * u - w / 2, sy - h / 2, w, h);
  } else {
    g.save();
    g.translate(L.sigCx * u, sy);
    g.rotate(-0.07);
    g.font = `${(L.sigW / 2) * u}px "Mrs Saint Delafield", "Homemade Apple", cursive`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = T.paperAccent;
    g.fillText(SIGNATURE_FALLBACK_TEXT, 0, 0);
    g.restore();
  }

  return canvas;
}

/* ──────────────────────── Headline mask texture ──────────────────────── */

/**
 * Draws the headline as a white-on-transparent mask. Padding around the text
 * is transparent so shifted samples never hit a clamped, opaque edge.
 * All sizes are in CSS px; `scale` is the canvas resolution multiplier.
 * (Theme-independent: colours are applied in the shader.)
 */
function drawHeadlineMask(
  rows: string[],
  fs: number,
  pad: number,
  padLeft: number,
  texW: number,
  texH: number,
  scale: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(texW * scale));
  canvas.height = Math.max(1, Math.round(texH * scale));
  const g = canvas.getContext("2d")!;
  g.scale(scale, scale);
  g.font = `400 ${fs}px "Anton", "Bebas Neue", Impact, sans-serif`;
  g.fillStyle = "#ffffff";
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  const track = HEADLINE_TRACKING * fs;
  rows.forEach((row, ri) => {
    const baseline = pad + ri * HEADLINE_LINE_HEIGHT * fs + ANTON_CAP_BOTTOM_IN_LINE * fs;
    let x = pad + padLeft;
    for (const ch of row.toUpperCase()) {
      g.fillText(ch, x, baseline);
      x += g.measureText(ch).width + track; // CSS-style letter-spacing
    }
  });
  return canvas;
}

/** Width (in em) of the widest headline row, incl. letter-spacing. */
function widestRowEm(rows: string[]): number {
  const c = document.createElement("canvas").getContext("2d")!;
  c.font = `400 100px "Anton", "Bebas Neue", Impact, sans-serif`;
  let widest = 0;
  for (const row of rows) {
    let wd = 0;
    for (const ch of row.toUpperCase()) wd += c.measureText(ch).width / 100 + HEADLINE_TRACKING;
    widest = Math.max(widest, wd);
  }
  return widest;
}

/* ───────────────────────────── Shaders ───────────────────────────── */

const VERTEX = /* glsl */ `
uniform float uHalfW;
uniform float uHalfH;
uniform float uBow;
uniform float uParentBow;
uniform float uHingeAng;
uniform float uZDir;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  float u = position.x / uHalfW;
  float t = clamp((uHalfH - position.y) / (2.0 * uHalfH), 0.0, 1.0);
  float h = 1.0 - u * u;
  float dz = -uBow * h * t;
  float carry = -uParentBow * h;
  float dy = carry * sin(uHingeAng);
  dz += carry * cos(uHingeAng);
  p.y += dy;
  p.z += uZDir * dz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const GRAIN_GLSL = /* glsl */ `
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

const FRONT_FRAGMENT = /* glsl */ `
uniform sampler2D uTexture;
uniform float uShade;
uniform vec3  uShadeTo;
uniform float uGrain;
uniform float uCreaseK;
varying vec2 vUv;
${GRAIN_GLSL}

float noise(float x, float seed) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(vec2(i, seed)), hash(vec2(i + 1.0, seed)), u);
}

float foldCrease(vec2 uv, float foldY, float seed) {
  float tilt = (hash(vec2(seed, 91.0)) - 0.5) * 0.012 * (uv.x - 0.5);
  float wobble =
    (noise(uv.x * 2.5, seed) - 0.5) * 0.012 +
    (noise(uv.x * 9.0, seed + 7.0) - 0.5) * 0.005 +
    (noise(uv.x * 37.0, seed + 13.0) - 0.5) * 0.0015;
  float depth = mix(0.35, 1.4, noise(uv.x * 6.0, seed + 19.0));
  float d = uv.y - (foldY + tilt + wobble);
  float crease = exp(-pow(d / 0.0018, 2.0)) * 0.2 * depth;
  float shadow = exp(-pow((d + 0.009) / 0.012, 2.0)) * 0.065 * depth;
  float highlight = exp(-pow((d - 0.0042) / 0.006, 2.0)) * 0.055;
  return -crease - shadow + highlight;
}

void main() {
  vec4 tex = texture2D(uTexture, vUv);
  float grain = hash(gl_FragCoord.xy);
  float creases = foldCrease(vUv, 0.6667, 3.0) + foldCrease(vUv, 0.3333, 11.0);
  vec3 color = tex.rgb - grain * uGrain + creases * uCreaseK;
  color = mix(color, uShadeTo, uShade);
  gl_FragColor = vec4(color, 1.0);
}
`;

const BACK_FRAGMENT = /* glsl */ `
uniform float uShade;
uniform vec3  uShadeTo;
uniform vec3  uBase;
uniform float uGrain;
${GRAIN_GLSL}
void main() {
  float grain = hash(gl_FragCoord.xy);
  vec3 color = uBase - grain * uGrain;
  color = mix(color, uShadeTo, uShade);
  gl_FragColor = vec4(color, 1.0);
}
`;

/** Headline: full-screen quad, geometry is already in clip space. */
const HEADLINE_VERTEX = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * Five coverage samples (one per colour layer). Each layer is displaced by
 *   m * ( scrollVec + hoverVec * gaussian(pixel - pointer) )
 * so the hover split is strongest at the cursor and fades out per PIXEL,
 * which is what produces the wedge-shaped fringes seen in the reference.
 * Layers trail the motion: layer is sampled at (p - m * offset).
 */
const HEADLINE_FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D uMask;
uniform vec2  uRes;      // stage size, css px
uniform float uPR;       // device pixel ratio of this canvas
uniform vec2  uTexSize;  // mask size, css px
uniform vec2  uOrigin;   // mask top-left in stage space, css px
uniform vec2  uScroll;   // px, vertical scroll split
uniform vec2  uHover;    // px, pointer-velocity vector
uniform vec2  uPointer;  // stage space, css px
uniform float uRadius;   // css px
uniform vec3  uBg;
uniform vec3  uInk;
uniform vec3  uC0;
uniform vec3  uC1;
uniform vec3  uC2;
uniform vec3  uC3;

float cov(vec2 p, float m, vec2 off) {
  vec2 q = p - uOrigin - m * off;
  vec2 uv = vec2(q.x / uTexSize.x, 1.0 - q.y / uTexSize.y);
  return texture2D(uMask, uv).a;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uPR - gl_FragCoord.y) / uPR;
  vec2 d = (p - uPointer) / uRadius;
  float fall = exp(-dot(d, d));
  vec2 off = uScroll + uHover * fall;

  vec3 col = uBg;
  col = mix(col, uC0, cov(p, -1.0, off));
  col = mix(col, uC1, cov(p,  1.0, off));
  col = mix(col, uC2, cov(p, -0.5, off));
  col = mix(col, uC3, cov(p,  0.5, off));
  col = mix(col, uInk, cov(p, 0.0, off));
  gl_FragColor = vec4(col, 1.0);
}
`;

/* ───────────────────────────── Scene ───────────────────────────── */

type Teardown = () => void;

interface Refs {
  section: HTMLElement;
  stage: HTMLElement;
  host: HTMLElement;
  headline: HTMLElement;
}

async function build(refs: Refs, isStale: () => boolean): Promise<Teardown | null> {
  const { section, stage, host, headline } = refs;

  try {
    await Promise.all([
      document.fonts.load('400 1em "Instrument Serif"'),
      document.fonts.load('italic 400 1em "Instrument Serif"'),
      document.fonts.load("400 1em Anton"),
      document.fonts.load('400 1em "Mrs Saint Delafield"'),
    ]);
  } catch {
    /* continue with whatever loaded */
  }
  await document.fonts.ready;
  const [logoDarkImg, logoLightImg, signatureImg] = await Promise.all([
    loadImage(LOGO_DARK_SRC),
    loadImage(LOGO_LIGHT_SRC),
    loadImage(SIGNATURE_SRC),
  ]);
  if (isStale()) return null;

  /* ── theme (live) ── */
  let themeName: ThemeName = detectTheme();
  let theme: Theme = THEMES[themeName];
  let logoImg = themeName === "dark" ? logoDarkImg : logoLightImg;

  /* ── geometry of the whole sequence ── */
  const compact = window.matchMedia(COMPACT_QUERY).matches;
  const vw = stage.clientWidth;
  const vh = stage.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const layout = compact ? COMPACT_LAYOUT : DESKTOP_LAYOUT;
  const P = compact
    ? Math.min(vw * C_PAPER_VW, (C_LETTER_MAX_VH * vh) / (3 * layout.ratio))
    : vw < 820
      ? vw * PAPER_VW_MOBILE
      : vw * PAPER_VW;
  const Ph = P * layout.ratio;
  const H = Ph * 3;

  let sEnd: number;
  let foldA0: number;
  let foldA1: number;
  let foldB0: number;
  let foldB1: number;
  let pinTop = 0;
  let sEnter = 0;
  let sUnpin = 0;
  let paperTopAt: (s: number) => number;
  const stretch = compact ? C_SCROLL_STRETCH : 1;
  const peek = (compact ? C_PEEK_VH : PEEK_VH) * vh;

  if (compact) {
    const restTop = C_BOTTOM_REST * vh - H;
    sEnd = vh - restTop;
    foldA0 = vh * (1 - C_FOLD_TOP_FROM);
    foldA1 = vh * (1 - C_FOLD_TOP_TO);
    foldB0 = vh * (1 - C_FOLD_BOTTOM_FROM);
    foldB1 = vh * (1 - C_FOLD_BOTTOM_TO);
    // peek fades out by the time the top fold starts → fold timing unchanged
    const peekEnd = foldA0;
    paperTopAt = (s) => vh - s - peek * (1 - clamp01(s / peekEnd));
  } else {
    pinTop = clamp(PIN_CENTER * vh - Ph / 2, 0.06 * vh, 0.3 * vh);
    sEnter = vh - pinTop;
    sUnpin = sEnter + PIN_LENGTH * vh;
    const sGone = sUnpin + pinTop + H;
    sEnd = sGone + HOLD_AFTER_PAPER * vh;
    foldA0 = sEnter - FOLD_A_START_BEFORE_PIN * vh;
    foldA1 = foldA0 + FOLD_TOP_LENGTH * vh;
    foldB0 = foldA1;
    foldB1 = foldA1 + FOLD_BOTTOM_LENGTH * vh;
    // peek fades out exactly as the paper reaches its pin position
    paperTopAt = (s) =>
      s <= sEnter
        ? vh - s - peek * (1 - clamp01(s / sEnter))
        : s <= sUnpin
          ? pinTop
          : pinTop - (s - sUnpin);
  }

  section.style.height = `${sEnd * stretch + vh}px`;
  const sectionTop = section.getBoundingClientRect().top + window.scrollY;

  /* ── headline rows + font size ── */
  const hlRows = compact
    ? HEADLINE_ROWS.flat() // every word on its own line on phones
    : HEADLINE_ROWS.map((r) => r.join(" "));
  const hlPadLeft = ((compact ? C_HEADLINE_PAD_VW : HEADLINE_PAD_LEFT_VW) / 100) * vw;

  let fs = ((compact ? C_HEADLINE_FONT_VW : HEADLINE_FONT_VW) / 100) * vw;

  // 1) the widest row must never overflow horizontally (any device)
  const fsByWidth = (vw * HEADLINE_MAX_WIDTH_SHARE - hlPadLeft) / widestRowEm(hlRows);
  fs = Math.min(fs, fsByWidth);

  // 2) phones: the last line must end above the paper peek → every word visible
  if (compact) {
    const span =
      (hlRows.length - 1) * HEADLINE_LINE_HEIGHT +
      (ANTON_CAP_BOTTOM_IN_LINE - ANTON_CAP_TOP_IN_LINE);
    const fsByHeight = ((C_HEADLINE_BOTTOM_LIMIT - C_HEADLINE_FIRST_CAP_TOP) * vh) / span;
    fs = Math.min(fs, fsByHeight);
  }

  const hlY0 = HEADLINE_FIRST_CAP_TOP * vh - ANTON_CAP_TOP_IN_LINE * fs;
  const hlYCompact = C_HEADLINE_FIRST_CAP_TOP * vh - ANTON_CAP_TOP_IN_LINE * fs;
  const shiftAt = compact
    ? () => 0
    : monotone(
        [0, sEnter, sUnpin, sUnpin + 0.815 * vh, sEnd],
        [0, SHIFT_AT_ENTER_END, SHIFT_AT_PIN_END, SHIFT_AT_PIN_END_PLUS, SHIFT_AT_END].map(
          (v) => v * vh,
        ),
      );

  /* ── headline mask texture (drawn once) ── */
  const hlPad = Math.ceil(0.2 * fs); // transparent margin ≥ max possible split
  const hlTexW = vw + hlPad * 2;
  const hlTexH = Math.ceil(hlRows.length * HEADLINE_LINE_HEIGHT * fs + hlPad * 2);
  const hlScale = clamp(Math.min(dpr, 1.5, 4096 / hlTexW, 4096 / hlTexH), 0.5, 2);
  const maskTexture = new THREE.CanvasTexture(
    drawHeadlineMask(hlRows, fs, hlPad, hlPadLeft, hlTexW, hlTexH, hlScale),
  );
  maskTexture.minFilter = THREE.LinearFilter;
  maskTexture.magFilter = THREE.LinearFilter;
  maskTexture.generateMipmaps = false;
  maskTexture.wrapS = THREE.ClampToEdgeWrapping;
  maskTexture.wrapT = THREE.ClampToEdgeWrapping;

  const hlRenderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  hlRenderer.setPixelRatio(dpr);
  hlRenderer.setSize(vw, vh);
  Object.assign(hlRenderer.domElement.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "1",
  });
  stage.insertBefore(hlRenderer.domElement, host);

  const hlUniforms = {
    uMask: { value: maskTexture },
    uRes: { value: new THREE.Vector2(vw, vh) },
    uPR: { value: dpr },
    uTexSize: { value: new THREE.Vector2(hlTexW, hlTexH) },
    uOrigin: { value: new THREE.Vector2(-hlPad, 0) },
    uScroll: { value: new THREE.Vector2(0, 0) },
    uHover: { value: new THREE.Vector2(0, 0) },
    uPointer: { value: new THREE.Vector2(-1e5, -1e5) },
    uRadius: { value: HOVER_RADIUS * fs },
    uBg: { value: hexToVec3(theme.bg) },
    uInk: { value: hexToVec3(theme.ink) },
    uC0: { value: hexToVec3(theme.fringe[0]) },
    uC1: { value: hexToVec3(theme.fringe[1]) },
    uC2: { value: hexToVec3(theme.fringe[2]) },
    uC3: { value: hexToVec3(theme.fringe[3]) },
  };
  const hlMaterial = new THREE.ShaderMaterial({
    uniforms: hlUniforms,
    vertexShader: HEADLINE_VERTEX,
    fragmentShader: HEADLINE_FRAGMENT,
    depthTest: false,
    depthWrite: false,
  });
  const hlGeometry = new THREE.PlaneGeometry(2, 2);
  const hlMesh = new THREE.Mesh(hlGeometry, hlMaterial);
  hlMesh.frustumCulled = false;
  const hlScene = new THREE.Scene();
  hlScene.add(hlMesh);
  const hlCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /* ── pointer position + velocity tracking ── */
  let pointerX = -1e5;
  let pointerY = -1e5;
  let pointerOn = false;
  let lastPX = NaN;
  let lastPY = NaN;
  let pdx = 0; // px moved since last frame
  let pdy = 0;
  let pvx = 0; // smoothed pointer velocity, px/s
  let pvy = 0;
  let hvx = 0; // hover split vector actually applied (settles back to 0)
  let hvy = 0;

  const track = (x: number, y: number) => {
    if (!Number.isNaN(lastPX)) {
      pdx += x - lastPX;
      pdy += y - lastPY;
    }
    lastPX = x;
    lastPY = y;
    pointerX = x;
    pointerY = y;
    pointerOn = true;
  };
  const release = () => {
    pointerOn = false;
    lastPX = NaN;
    lastPY = NaN;
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    track(e.clientX, e.clientY);
  };
  const onLeave = () => release();
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) {
      release();
      return;
    }
    track(t.clientX, t.clientY);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("touchstart", onTouch, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  window.addEventListener("touchend", onTouch, { passive: true });
  window.addEventListener("touchcancel", onLeave, { passive: true });

  /* ── WebGL (paper) ── */
  const renderer = new THREE.WebGLRenderer({
    antialias: !compact || dpr < 2,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(dpr);
  renderer.setSize(vw, vh);
  Object.assign(renderer.domElement.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity .35s ease",
  });
  host.appendChild(renderer.domElement);

  const camDist = compact ? C_CAM_DIST_PER_P * P : 3 * vh;
  const camera = new THREE.PerspectiveCamera(
    (2 * Math.atan(vh / 2 / camDist) * 180) / Math.PI,
    vw / vh,
    camDist * 0.25,
    camDist * 3,
  );
  camera.position.set(0, 0, camDist);
  const scene = new THREE.Scene();

  const texScale = Math.min(dpr, 4096 / H);
  const texture = new THREE.CanvasTexture(
    drawLetter(P, texScale, logoImg, signatureImg, layout, theme, themeName === "dark"),
  );
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const disposables: Array<{ dispose: () => void }> = [
    texture,
    maskTexture,
    hlMaterial,
    hlGeometry,
  ];

  /** Every uniform bag that carries a theme-dependent value. */
  const paperShared: Array<{
    uGrain: { value: number };
    uShadeTo: { value: THREE.Vector3 };
    uCreaseK: { value: number };
    uBase: { value: THREE.Vector3 };
  }> = [];

  function makeMats(index: number, bendable: boolean) {
    const shared = {
      uShade: { value: 0 },
      uShadeTo: { value: new THREE.Vector3(...theme.shadeTo) },
      uGrain: { value: theme.grain },
      uCreaseK: { value: theme.creaseK },
      uBase: { value: hexToVec3(theme.paper) },
      uBow: { value: 0 },
      uParentBow: { value: 0 },
      uHingeAng: { value: 0 },
      uHalfW: { value: P / 2 },
      uHalfH: { value: Ph / 2 },
    };
    paperShared.push(shared);
    const front = new THREE.ShaderMaterial({
      side: THREE.FrontSide,
      uniforms: { uTexture: { value: texture }, uZDir: { value: 1 }, ...shared },
      vertexShader: VERTEX,
      fragmentShader: FRONT_FRAGMENT,
    });
    const back = new THREE.ShaderMaterial({
      side: THREE.FrontSide,
      uniforms: { uZDir: { value: -1 }, ...shared },
      vertexShader: VERTEX,
      fragmentShader: BACK_FRAGMENT,
    });
    disposables.push(front, back);
    const seg = bendable ? [28, 18] : [1, 1];
    const geo = new THREE.PlaneGeometry(P, Ph, seg[0], seg[1]);
    const uv = geo.attributes.uv;
    const vMin = 1 - (index + 1) / 3;
    for (let i = 0; i < uv.count; i++) uv.setY(i, vMin + uv.getY(i) / 3);
    disposables.push(geo);
    const backGeo = new THREE.PlaneGeometry(P, Ph, seg[0], seg[1]);
    disposables.push(backGeo);
    const fm = new THREE.Mesh(geo, front);
    const bm = new THREE.Mesh(backGeo, back);
    bm.rotation.y = Math.PI;
    const group = new THREE.Group();
    group.add(fm, bm);
    return { group, shared };
  }

  const p1 = makeMats(0, false);
  const p2 = makeMats(1, true);
  const p3 = makeMats(2, true);

  const paper = new THREE.Group();
  scene.add(paper);
  p1.group.position.y = H / 2 - Ph / 2;
  paper.add(p1.group);

  const topFold = new THREE.Group();
  topFold.position.y = H / 2 - Ph;
  paper.add(topFold);
  p2.group.position.y = -Ph / 2;
  topFold.add(p2.group);

  const bottomFold = new THREE.Group();
  bottomFold.position.y = -Ph;
  topFold.add(bottomFold);
  p3.group.position.y = -Ph / 2;
  bottomFold.add(p3.group);

  const GAP = Math.max(1, P * 0.0012);
  const FOLDED = -Math.PI;

  function layering() {
    const a = topFold.rotation.x / FOLDED;
    const b = bottomFold.rotation.x / FOLDED;
    p2.group.position.z = -GAP * 2 * a;
    bottomFold.position.z = -GAP * 2 * a;
    p3.group.position.z = -GAP * b;
  }

  /* ── state ── */
  const ease = compact ? (x: number) => x : easeInOutCubic;
  const targets = (s: number) => ({
    a1: -Math.PI * (1 - ease(clamp01((s - foldA0) / (foldA1 - foldA0)))),
    a2: -Math.PI * (1 - ease(clamp01((s - foldB0) / (foldB1 - foldB0)))),
  });

  const useLenis = !compact || window.matchMedia("(pointer: fine)").matches;
  const lenis = useLenis ? new Lenis({ lerp: LENIS_LERP }) : null;
  const readScroll = () => (lenis ? lenis.scroll : window.scrollY);
  const scrollToS = (raw: number) => {
    const v = (raw - sectionTop) / stretch;
    return compact ? clamp(v, 0, sEnd) : v;
  };
  const foldTau = compact ? C_FOLD_TAU : FOLD_TAU;
  let s = scrollToS(readScroll());
  let prevS = s;
  let a1 = targets(s).a1;
  let a2 = targets(s).a2;
  let w1 = 0;
  let w2 = 0;
  let velocity = 0;
  let lastY = NaN;
  let lastK = NaN;
  let lastHX = NaN;
  let lastHY = NaN;
  let lastPointerSX = NaN;
  let lastPointerSY = NaN;
  let glShown = false;
  let revealed = false;
  let dirty = true;
  let hlDirty = true;
  let last = performance.now();

  /* ── live theme switching: recolour uniforms + redraw the paper texture ── */
  const applyTheme = (name: ThemeName) => {
    themeName = name;
    theme = THEMES[name];

    hlUniforms.uBg.value.copy(hexToVec3(theme.bg));
    hlUniforms.uInk.value.copy(hexToVec3(theme.ink));
    hlUniforms.uC0.value.copy(hexToVec3(theme.fringe[0]));
    hlUniforms.uC1.value.copy(hexToVec3(theme.fringe[1]));
    hlUniforms.uC2.value.copy(hexToVec3(theme.fringe[2]));
    hlUniforms.uC3.value.copy(hexToVec3(theme.fringe[3]));

    for (const sh of paperShared) {
      sh.uGrain.value = theme.grain;
      sh.uCreaseK.value = theme.creaseK;
      sh.uShadeTo.value.set(...theme.shadeTo);
      sh.uBase.value.copy(hexToVec3(theme.paper));
    }

    const currentLogo = name === "dark" ? logoDarkImg : logoLightImg;
    texture.image = drawLetter(
      P,
      texScale,
      currentLogo,
      signatureImg,
      layout,
      theme,
      name === "dark",
    );
    texture.needsUpdate = true;

    hlDirty = true;
    dirty = true;
  };
  const unsubscribeTheme = subscribeTheme(applyTheme);

  const fringeScale = vw / 1884;
  const SCROLL_CAP = SCROLL_MAX * fringeScale;
  const HOVER_CAP = HOVER_MAX * fringeScale;
  const scrollRefSplit = SCROLL_REF_SPLIT * fringeScale;
  const hoverRefSplit = HOVER_REF_SPLIT * fringeScale;

  /** Scroll speed → signed vertical split. Slow ≈ 0, fast ramps up hard. */
  const scrollSplit = (v: number) => {
    const n = Math.max(0, Math.abs(v) - SCROLL_DEAD) / SCROLL_REF_SPEED;
    const mag = Math.pow(n, SCROLL_CURVE) * scrollRefSplit;
    return Math.sign(v) * Math.min(mag, SCROLL_CAP);
  };

  /** Pointer speed (one axis) → signed split. Slow ≈ 0, fast ramps up hard. */
  const hoverSplit = (v: number) => {
    const n = Math.max(0, Math.abs(v) - HOVER_DEAD) / HOVER_REF_SPEED;
    return Math.sign(v) * Math.pow(n, HOVER_CURVE) * hoverRefSplit;
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 1 / 240, 0.05);
    last = now;
    lenis?.raf(now);

    s = scrollToS(readScroll());
    const ds = s - prevS;
    prevS = s;

    /* ── scroll velocity → vertical headline split ── */
    velocity = damp(velocity, ds / dt, SCROLL_VEL_TAU, dt);
    let k = scrollSplit(velocity);
    if (Math.abs(k) < 0.05) k = 0;

    /* ── pointer velocity (smoothed; decays to 0 when the pointer stops) ── */
    pvx = damp(pvx, pdx / dt, POINTER_VEL_TAU, dt);
    pvy = damp(pvy, pdy / dt, POINTER_VEL_TAU, dt);
    pdx = 0;
    pdy = 0;
    if (Math.abs(pvx) < 1) pvx = 0;
    if (Math.abs(pvy) < 1) pvy = 0;

    // velocity → offset vector (curve per axis, magnitude capped, direction preserved)
    let vecX = hoverSplit(pvx);
    let vecY = hoverSplit(pvy);
    const vecMag = Math.hypot(vecX, vecY);
    if (vecMag > HOVER_CAP) {
      const sc = HOVER_CAP / vecMag;
      vecX *= sc;
      vecY *= sc;
    }
    hvx = damp(hvx, vecX, HOVER_SETTLE_TAU, dt);
    hvy = damp(hvy, vecY, HOVER_SETTLE_TAU, dt);
    if (Math.abs(hvx) < 0.02 && vecX === 0) hvx = 0;
    if (Math.abs(hvy) < 0.02 && vecY === 0) hvy = 0;

    /* ── pointer in stage space (kept at its last position while the split fades out) ── */
    let psx = lastPointerSX;
    let psy = lastPointerSY;
    if (pointerOn || hvx !== 0 || hvy !== 0) {
      const rect = stage.getBoundingClientRect();
      psx = pointerX - rect.left;
      psy = pointerY - rect.top;
    }

    /* ── headline parallax ── */
    const y = compact ? hlYCompact : hlY0 - shiftAt(clamp(s, 0, sEnd));

    if (
      hlDirty ||
      y !== lastY ||
      k !== lastK ||
      hvx !== lastHX ||
      hvy !== lastHY ||
      psx !== lastPointerSX ||
      psy !== lastPointerSY
    ) {
      lastY = y;
      lastK = k;
      lastHX = hvx;
      lastHY = hvy;
      lastPointerSX = psx;
      lastPointerSY = psy;
      hlUniforms.uOrigin.value.set(-hlPad, y - hlPad);
      hlUniforms.uScroll.value.set(0, k);
      hlUniforms.uHover.value.set(hvx, hvy);
      hlUniforms.uPointer.value.set(Number.isNaN(psx) ? -1e5 : psx, Number.isNaN(psy) ? -1e5 : psy);
      hlRenderer.render(hlScene, hlCamera);
      hlDirty = false;
      if (!glShown) {
        glShown = true;
        section.classList.add("rs-gl"); // hide the DOM headline, canvas takes over
      }
    }

    /* fold angles: scrubbed target + critically-damped follow */
    const t = targets(s);
    const n1 = damp(a1, t.a1, foldTau, dt);
    const n2 = damp(a2, t.a2, foldTau, dt);
    const r1 = (n1 - a1) / dt;
    const r2 = (n2 - a2) / dt;
    a1 = Math.abs(n1 - t.a1) < 1e-4 ? t.a1 : n1;
    a2 = Math.abs(n2 - t.a2) < 1e-4 ? t.a2 : n2;
    w1 = damp(w1, r1, 0.06, dt);
    w2 = damp(w2, r2, 0.06, dt);

    const moving =
      Math.abs(ds) > 0.01 ||
      Math.abs(w1) > 1e-3 ||
      Math.abs(w2) > 1e-3 ||
      a1 !== topFold.rotation.x ||
      a2 !== bottomFold.rotation.x;

    if (moving || dirty) {
      topFold.rotation.x = a1;
      bottomFold.rotation.x = a2;
      layering();

      const open1 = clamp01((a1 + Math.PI) / 0.6);
      const open2 = clamp01((a2 + Math.PI) / 0.6);
      const bow1 = clamp(w1 * BOW_PER_RAD_S, -BOW_MAX, BOW_MAX) * P * open1;
      const bow2 = clamp(w2 * BOW_PER_RAD_S, -BOW_MAX, BOW_MAX) * P * open2;
      const stack = (1 - Math.cos(a2)) / 2;
      const b1 = Math.abs(bow1) < 0.01 ? 0 : bow1;
      const b2 = Math.abs(bow2) < 0.01 ? 0 : bow2;
      p2.shared.uBow.value = b1;
      p3.shared.uBow.value = b2 + stack * b1;
      p3.shared.uParentBow.value = b1;
      p3.shared.uHingeAng.value = a2;
      p2.shared.uShade.value = theme.shadeMax * Math.pow(Math.abs(Math.sin(a1)), 1.15);
      p3.shared.uShade.value = theme.shadeMax * Math.pow(Math.abs(Math.sin(a1 + a2)), 1.15);

      const zLift = compact
        ? (C_Z_LIFT_PER_P * P * (0.7 * Math.abs(a1) + 0.3 * Math.abs(a2))) / Math.PI
        : 0;
      paper.position.set(0, vh / 2 - (paperTopAt(s) + H / 2), zLift);
      renderer.render(scene, camera);
      dirty = false;

      if (!revealed) {
        revealed = true;
        renderer.domElement.style.opacity = "1";
      }
    }
  };

  let raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    unsubscribeTheme();
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("touchstart", onTouch);
    window.removeEventListener("touchmove", onTouch);
    window.removeEventListener("touchend", onTouch);
    window.removeEventListener("touchcancel", onLeave);
    lenis?.destroy();
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
    renderer.domElement.remove();
    hlRenderer.dispose();
    hlRenderer.domElement.remove();
    section.classList.remove("rs-gl");
    section.style.height = "";
  };
}

/* ───────────────────────────── Page ───────────────────────────── */

export default function ResumePage() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<ThemeName>("light");

  /* keep the DOM/CSS side (background, DOM headline, flat fallback) in sync */
  useEffect(() => {
    setTheme(detectTheme());
    return subscribeTheme(setTheme);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const host = hostRef.current;
    const headline = headlineRef.current;
    if (!section || !stage || !host || !headline) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.classList.add("rs-fallback");
      return;
    }

    let teardown: Teardown | null = null;
    let token = 0;
    let resizeTimer: number | undefined;
    let lastWidth = window.innerWidth;

    const start = async () => {
      const mine = ++token;
      teardown?.();
      teardown = null;
      try {
        const result = await build(
          { section, stage, host, headline },
          () => mine !== token,
        );
        if (mine !== token) {
          result?.();
          return;
        }
        teardown = result;
        section.classList.remove("rs-fallback");
      } catch (err) {
        console.error("[resume] paper effect failed, showing flat letter", err);
        section.classList.add("rs-fallback");
      }
    };

    start();

    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(start, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      token++;
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      teardown?.();
      teardown = null;
    };
  }, []);

  return (
    <main className="rs-root" data-rs-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="rs-section" ref={sectionRef}>
        <div className="rs-stage" ref={stageRef}>
          {/* Plain DOM headline: accessible text + fallback. Hidden once the canvas takes over. */}
          <div
            className="rs-hl"
            ref={headlineRef}
            role="heading"
            aria-level={1}
            aria-label={HEADLINE_LABEL}
          >
            <div className="rs-layer" aria-hidden="true">
              {HEADLINE_ROWS.map((row, ri) => (
                <span className="rs-row" key={ri}>
                  {row.map((word, wi) => (
                    <React.Fragment key={wi}>
                      {wi > 0 ? " " : null}
                      <span className="rs-word">{word}</span>
                    </React.Fragment>
                  ))}
                </span>
              ))}
            </div>
          </div>
          <div className="rs-host" ref={hostRef} />
        </div>

        {/* Accessible / no-WebGL / reduced-motion copy of the resume */}
        <article className="rs-flat">
          <div className="rs-flat-logo-wrap">
            <img
              src={theme === "dark" ? LOGO_DARK_SRC : LOGO_LIGHT_SRC}
              alt="Hrithik HM Logo"
              className="rs-flat-logo"
            />
          </div>
          {RESUME.map((b, i) => {
            switch (b.t) {
              case "section":
                return <h2 key={i}>{b.text}</h2>;
              case "entry":
                return (
                  <h3 key={i}>
                    {b.title}
                    {b.right ? <span> · {b.right}</span> : null}
                    {b.sub ? <em>{b.sub}</em> : null}
                  </h3>
                );
              case "skill":
                return (
                  <p key={i}>
                    <strong>{b.label}:</strong> {b.text}
                  </p>
                );
              default:
                return (
                  <p key={i} className="rs-b">
                    • {b.text}
                  </p>
                );
            }
          })}
        </article>
      </section>
    </main>
  );
}

/* ───────────────────────────── Styles ───────────────────────────── */

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital@0;1&family=Mrs+Saint+Delafield&display=swap");

html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }

.rs-root {
  --rs-bg: ${THEMES.light.bg};
  --rs-ink: ${THEMES.light.ink};
  --rs-paper: #f4f4f4;
  --rs-paper-ink: ${THEMES.light.paperText};
  background: var(--rs-bg);
  color: var(--rs-ink);
}
.rs-root[data-rs-theme="dark"] {
  --rs-bg: ${THEMES.dark.bg};
  --rs-ink: ${THEMES.dark.ink};
  --rs-paper: ${THEMES.dark.paper};
  --rs-paper-ink: ${THEMES.dark.paperText};
}

.rs-section { position: relative; width: 100%; min-height: 530svh; background: var(--rs-bg); }

.rs-stage {
  position: sticky; top: 0; height: 100svh; width: 100%;
  overflow: hidden; background: var(--rs-bg);
}

.rs-hl { position: absolute; left: 0; top: 0; width: 100%; }
.rs-layer {
  width: 100%; padding-left: ${HEADLINE_PAD_LEFT_VW}vw; box-sizing: border-box;
  color: var(--rs-ink);
}
.rs-row {
  display: block; white-space: pre;
  font-family: "Anton", "Bebas Neue", Impact, sans-serif;
  font-weight: 400;
  font-size: ${HEADLINE_FONT_VW}vw;
  line-height: ${HEADLINE_LINE_HEIGHT};
  letter-spacing: ${HEADLINE_TRACKING}em;
  text-transform: uppercase;
  position: relative;
}
.rs-word { display: inline; }

/* once the WebGL headline is live, keep the DOM copy for screen readers only */
.rs-section.rs-gl .rs-hl { opacity: 0; pointer-events: none; user-select: none; }

.rs-host { position: absolute; inset: 0; pointer-events: none; z-index: 2; }

/* visually hidden unless we fall back */
.rs-flat {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}
.rs-fallback { min-height: 0 !important; height: auto !important; }
.rs-fallback .rs-stage { position: relative; height: auto; min-height: 100svh; }
.rs-fallback .rs-host { display: none; }
.rs-fallback .rs-flat {
  position: relative; width: min(92vw, 680px); height: auto; overflow: visible;
  clip: auto; white-space: normal;
  margin: -30svh auto 20svh; padding: 2.4rem 2rem;
  background: var(--rs-paper); color: var(--rs-paper-ink); z-index: 3;
  font-family: "Instrument Serif", Georgia, serif; font-size: 1.05rem; line-height: 1.5;
  text-align: left;
}
.rs-flat-logo-wrap {
  display: flex; justify-content: center; margin-bottom: 2rem;
}
.rs-flat-logo {
  width: 72px; height: auto;
}
.rs-fallback .rs-flat h2 {
  font: 700 .78rem/1.2 Helvetica, Arial, sans-serif; text-transform: uppercase;
  margin: 1.4rem 0 .5rem; padding-bottom: .25rem;
  border-bottom: 1px solid currentColor;
}
.rs-fallback .rs-flat h3 {
  font: 700 .86rem/1.3 Helvetica, Arial, sans-serif; margin: .8rem 0 .2rem;
}
.rs-fallback .rs-flat h3 span { font: italic 400 1rem Georgia, serif; }
.rs-fallback .rs-flat h3 em {
  display: block; font: italic 400 1rem/1.3 "Instrument Serif", Georgia, serif;
}
.rs-fallback .rs-flat p { margin: .25rem 0; }
.rs-fallback .rs-flat p.rs-b { padding-left: .9rem; text-indent: -.9rem; }

/* ── compact layout: phones / portrait tablets ── */
@media (max-width: 899px) and (orientation: portrait) {
  .rs-section { min-height: 190svh; }
  .rs-layer { padding-left: ${C_HEADLINE_PAD_VW}vw; }
  /* never taller than the screen: 5 lines must end above the paper peek */
  .rs-row { font-size: min(${C_HEADLINE_FONT_VW}vw, 12.8svh); white-space: normal; }
  .rs-word { display: block; }
}
`;