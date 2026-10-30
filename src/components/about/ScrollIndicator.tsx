"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { T } from "@/lib/aboutContent";
import s from "./ScrollIndicator.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Fixed left-hand "(n)" counter. 0 → T.counter.from across the hero, then
 *  from → to across the [data-counter] (About) section. Updated imperatively. */
export function ScrollIndicator() {
  const counter = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>("[data-counter]");
    let a = 0, b = 1;
    const measure = () => {
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY;   // page-y, not offsetTop
      a = top - window.innerHeight * 0.6;
      b = top + target.offsetHeight - window.innerHeight * 0.4;
    };
    measure();
    ScrollTrigger.addEventListener("refresh", measure);

    const main = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (!counter.current) return;
        const y = self.scroll();
        const n =
          y < a
            ? (T.counter.from * Math.max(y, 0)) / (a || 1)
            : gsap.utils.clamp(T.counter.from, T.counter.to, gsap.utils.mapRange(a, b, T.counter.from, T.counter.to, y));
        counter.current.textContent = `(${Math.round(n)})`;
      },
    });

    return () => {
      main.kill();
      ScrollTrigger.removeEventListener("refresh", measure);
    };
  }, []);

  return (
    <div ref={counter} className={s.counter} aria-hidden="true">
      (0)
    </div>
  );
}

export default ScrollIndicator;