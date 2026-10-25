"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";
import {
  ART_CARD_LEFT,
  IMPULSE,
  JELLY_Y,
  RINGS,
  bridgePath,
  clamp,
  clamp01,
  contactDistance,
  ringTravel,
  stepSpring,
} from "./heroMotion";

/* ── Tuning ─────────────────────────────────────────────────────────────── */

/** hero scroll distance (in hero heights) over which the rings travel */
const SCROLL_RANGE = 0.8;
/** how quickly the rings catch up with the scroll position (1/s). Higher = tighter, lower = floatier */
const FOLLOW = 13;
/** how much of a ring's silhouette must fit in the side gutter on narrow screens (art units) */
const FIT_UNITS = 120;
/** max horizontal stretch of a ring at high speed (0.035 = 3.5 %) - the "jelly" feel */
const JELLY_MAX = 0.035;
/** ring speed (art units / s) at which the jelly reaches ~76 % of its max */
const JELLY_SPEED = 900;
/** ring speed (art units / s) that produces a full-strength card bump */
const IMPACT_SPEED = 650;
/** a slow scroll still gives at least this fraction of the bump */
const IMPACT_MIN = 0.3;
/** bump multiplier per ring (outer rings hit slightly harder) */
const RING_GAIN = [0.85, 1, 1.15] as const;
/** how much weaker the "release" wobble is when you scroll back up */
const RELEASE_RATIO = 0.4;
/** travel (art units) a ring must back off before the contact is considered released (anti-jitter) */
const RELEASE_BAND = 3;

const SIDES = ["l", "r"] as const;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Drives the hero rings, the liquid bridges and the card's subtle impact wobble
 * from the page scroll position.
 *
 * Design notes
 *  - Everything is a pure function of the smoothed scroll progress `p`, so
 *    scrolling up replays the exact reverse motion. The card bump fires on
 *    both contact and release.
 *  - Layout is measured only on resize (ResizeObserver) - never per frame.
 *  - Per frame we only write transforms (compositor-only) and, for a short
 *    moment around each contact, a tiny SVG path.
 *  - The loop sleeps as soon as nothing is moving.
 *  - The hero height comes from the stage element (100svh), not
 *    window.innerHeight, so the mobile address bar collapsing can't make the
 *    animation jump.
 */
export function useHeroScroll(
  rootRef: RefObject<HTMLElement | null>,
  cardRef: RefObject<HTMLElement | null>
) {
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    const card = cardRef.current;
    const stage = root?.querySelector<HTMLElement>(".hero-stage") ?? null;
    if (!root || !card || !stage) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const ringEls = RINGS.map((_, i) => SIDES.map((s) => stage.querySelector<SVGElement>(`[data-ring="${s}${i + 1}"]`)));
    const bridgeEls = RINGS.map((_, i) => SIDES.map((s) => stage.querySelector<SVGPathElement>(`[data-bridge="${s}${i + 1}"]`)));

    /* ── layout (measured on resize only) ── */
    let k = 1; // px per art unit
    let heroH = 1;
    let cardHalfArt = 153.7; // half the card width, in art units

    const measure = () => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const cardW = card.offsetWidth; // layout width: ignores the bounce transform
      if (!W || !H || !cardW) return false;
      const gutter = (W - cardW) / 2;
      // same cover-scaling as the original art, but on narrow screens shrink the rings
      // so they still peek out of the gutter next to the card instead of sitting off-screen
      const kCover = Math.max(W / 1024.5, H / 576);
      k = clamp(Math.min(kCover, gutter / FIT_UNITS), 0.15, 6);
      heroH = H;
      cardHalfArt = cardW / 2 / k;
      stage.style.setProperty("--k", k.toFixed(4));
      stage.style.setProperty("--cl", `${gutter.toFixed(2)}px`);
      stage.style.setProperty("--cy", `${(H / 2).toFixed(2)}px`);
      return true;
    };

    /* ── state ── */
    const readTarget = () => clamp01(Math.max(0, window.scrollY) / (heroH * SCROLL_RANGE));

    let p = 0; // smoothed progress
    let target = 0; // raw progress from scroll
    const prevT = [0, 0, 0];
    const speed = [0, 0, 0]; // smoothed |ring speed|, art units / s
    const jelly = [0, 0, 0];
    const contact = [false, false, false];
    let squash = 0; // card compression (0 = rest), driven by a spring
    let squashV = 0;
    let raf = 0;
    let last = 0;

    // tiny write caches so unchanged values never touch the DOM
    const lastRing = new Map<Element, string>();
    const lastBridge = new Map<Element, string>();
    let lastCard = "";

    const setRing = (el: Element | null, value: string) => {
      if (!el || lastRing.get(el) === value) return;
      lastRing.set(el, value);
      (el as HTMLElement).style.transform = value;
    };
    const setBridge = (el: Element | null, d: string) => {
      if (!el || lastBridge.get(el) === d) return;
      lastBridge.set(el, d);
      el.setAttribute("d", d);
    };

    const bump = (direction: 1 | -1, ringSpeed: number, ring: number) => {
      if (reduced) return;
      const strength = clamp(ringSpeed / IMPACT_SPEED, IMPACT_MIN, 1) * RING_GAIN[ring];
      squashV += (direction === 1 ? 1 : -RELEASE_RATIO) * IMPULSE * strength;
    };

    const frame = (dt: number, initial: boolean): boolean => {
      target = readTarget();
      if (reduced || initial) {
        p = target;
      } else {
        p += (target - p) * (1 - Math.exp(-FOLLOW * dt));
        if (Math.abs(target - p) < 5e-5) p = target;
      }
      let busy = p !== target;

      // card edge currently (it narrows a hair while squashed), in art units
      const wallX = ART_CARD_LEFT + squash * cardHalfArt;

      for (let i = 0; i < RINGS.length; i++) {
        const t = ringTravel(i, p);
        const v = initial ? 0 : Math.abs(t - prevT[i]) / dt;
        prevT[i] = t;
        speed[i] += (v - speed[i]) * (initial ? 1 : 1 - Math.exp(-18 * dt));

        // jelly: stretch along the direction of travel, relaxes smoothly at rest
        let j = reduced ? 0 : JELLY_MAX * Math.tanh(speed[i] / JELLY_SPEED);
        if (j < 0.0008) j = 0;
        jelly[i] = j;
        if (j > 0) busy = true;

        const dx = (t * k).toFixed(2);
        const scale = j === 0 ? "" : ` scale(${(1 + j).toFixed(4)}, ${(1 - JELLY_Y * j).toFixed(4)})`;
        setRing(ringEls[i][0], `translate3d(${dx}px,0,0)${scale}`);
        setRing(ringEls[i][1], `translate3d(-${dx}px,0,0)${scale}`);

        // contact with the card (with a small dead-band so scroll jitter can't re-trigger it)
        const touching = t >= contactDistance(i);
        if (!contact[i] && touching) {
          contact[i] = true;
          if (!initial) bump(1, speed[i], i);
        } else if (contact[i] && t <= contactDistance(i) - RELEASE_BAND) {
          contact[i] = false;
          if (!initial) bump(-1, speed[i], i);
        }

        // liquid bridge between this ring's tip and the card edge
        let d = "";
        if (!reduced) {
          const tip = RINGS[i].apex + t + (RINGS[i].apex - RINGS[i].center) * j;
          d = bridgePath(i, tip, wallX, j);
        }
        setBridge(bridgeEls[i][0], d);
        setBridge(bridgeEls[i][1], d);
      }

      // card: one tiny damped spring (compress in x, bulge slightly in y)
      if (!reduced && (squash !== 0 || squashV !== 0)) {
        [squash, squashV] = stepSpring(squash, squashV, dt);
        if (Math.abs(squash) < 2e-5 && Math.abs(squashV) < 2e-4) {
          squash = 0;
          squashV = 0;
        } else {
          busy = true;
        }
      }
      const cardT =
        squash === 0
          ? "translate(-50%, -50%)"
          : `translate(-50%, -50%) scale(${(1 - squash).toFixed(5)}, ${(1 + squash * 0.5).toFixed(5)})`;
      if (cardT !== lastCard) {
        lastCard = cardT;
        card.style.transform = cardT;
      }

      return busy;
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = clamp((now - last) / 1000, 0.001, 0.05);
      last = now;
      if (frame(dt, false)) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    /* ── boot ── */
    // snap straight to the current scroll position (reload mid-page, back-navigation, late first measure)
    const snap = () => {
      frame(1 / 60, true);
      for (let i = 0; i < RINGS.length; i++) contact[i] = ringTravel(i, p) >= contactDistance(i);
    };

    let ready = measure();
    if (ready) snap();

    const onScroll = () => {
      if (ready) wake();
    };
    const onResize = () => {
      const wasReady = ready;
      ready = measure();
      if (!ready) return;
      if (!wasReady) snap();
      wake();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    ro?.observe(stage);
    ro?.observe(card);
    if (!ro) window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef, cardRef]);
}