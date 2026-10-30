"use client";
import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * The "(22)" number fixed at the left edge, vertically centred.
 * In the reference it counts up with page scroll and counts back down on reverse.
 * Written straight to the DOM (no React state) so it never causes re-renders while scrolling.
 */
export function ScrollCounter() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (ref.current) ref.current.textContent = String(Math.round(self.progress * 100));
      },
    });
    return () => st.kill();
  }, []);

  return (
    <div
      aria-hidden
      className="scroll-counter"
      style={{
        position: "fixed",
        left: "2.2vw",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 40,
        fontSize: 13,
        fontVariantNumeric: "tabular-nums",
        pointerEvents: "none",
        color: "var(--ui-fg, #fff)",
      }}
    >
      (<span ref={ref}>0</span>)
    </div>
  );
}
