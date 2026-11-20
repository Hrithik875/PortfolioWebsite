"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { T } from "@/lib/aboutContent";
import s from "./ScrollIndicator.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Fixed left-hand "(n)" counter. 0 → T.counter.from across the hero, then
 *  from → to across the [data-counter] (About) section. Updated imperatively.
 *  It is hidden on small screens, so no ScrollTrigger / scroll work is done there at all. */
export function ScrollIndicator() {
  const counter = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>("[data-counter]");
    const mql = window.matchMedia("(min-width: 1024px)");
    let a = 0, b = 1;
    let last = -1;
    let main: ScrollTrigger | null = null;

    const measure = () => {
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY;   // page-y, not offsetTop
      a = top - window.innerHeight * 0.6;
      b = top + target.offsetHeight - window.innerHeight * 0.4;
    };

    const start = () => {
      if (main) return;
      measure();
      ScrollTrigger.addEventListener("refresh", measure);
      main = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const el = counter.current;
          if (!el) return;
          const y = self.scroll();
          const n = Math.round(
            y < a
              ? (T.counter.from * Math.max(y, 0)) / (a || 1)
              : gsap.utils.clamp(T.counter.from, T.counter.to, gsap.utils.mapRange(a, b, T.counter.from, T.counter.to, y))
          );
          if (n === last) return;            // only touch the DOM when the number actually changes
          last = n;
          el.textContent = `(${n})`;
        },
      });
    };

    const stop = () => {
      main?.kill();
      main = null;
      ScrollTrigger.removeEventListener("refresh", measure);
    };

    const sync = () => (mql.matches ? start() : stop());
    sync();
    mql.addEventListener("change", sync);

    return () => {
      mql.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return (
    <div ref={counter} className={s.counter} aria-hidden="true">
      (0)
    </div>
  );
}

export default ScrollIndicator;