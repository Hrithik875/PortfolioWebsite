"use client";
import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Hero -> About handoff. As the hero's bottom edge leaves, its content drifts up slower than the page,
 * dims and (on capable devices) softens, while the dark About section and the blurred portrait rise underneath.
 * Fully scrubbed, so scrolling back up restores the hero exactly.
 */
export function useHeroOutro(
  heroRef: RefObject<HTMLElement | null>,
  innerRef: RefObject<HTMLElement | null>,
  opts: { blur?: boolean; enabled?: boolean } = {}
) {
  useLayoutEffect(() => {
    if (opts.enabled === false) return;
    if (!heroRef.current || !innerRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.to(innerRef.current, {
        yPercent: -14,
        opacity: 0.12,
        ...(opts.blur ? { filter: "blur(6px)" } : {}),
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "bottom bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, opts.blur]);
}
