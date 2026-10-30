"use client";
import { useEffect, type ReactNode } from "react";
import { LazyMotion, domMax } from "framer-motion";
import Lenis from "lenis";
import { useIntro } from "@/context/IntroContext";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export function LenisProvider({ children }: { children: ReactNode }) {
  const { introDone } = useIntro();

  useEffect(() => {
    if (!introDone) return;

    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    const init = () => {
      // Touch devices / narrow screens keep native scrolling (syncTouch off)
      if (window.innerWidth < 768) {
        ScrollTrigger.refresh();
        return;
      }

      lenis = new Lenis({
        lerp: 0.09,
        smoothWheel: true,
        wheelMultiplier: 0.9,
      });

      lenis.on("scroll", ScrollTrigger.update);
      tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      ScrollTrigger.refresh();
    };

    // Defer so Lenis RAF loop never competes with initial paint
    const timeout = setTimeout(init, 100);

    return () => {
      clearTimeout(timeout);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, [introDone]);

  // LazyMotion loads only the domAnimation feature set (~45 KB) instead of
  // the full framer-motion bundle (~65 KB). All m.* components in the app
  // share this single context without re-loading the engine.
  return <LazyMotion features={domMax}>{children}</LazyMotion>;
}
