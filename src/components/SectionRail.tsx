"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * The thin vertical rail on the right edge. One segment per section marked with
 * data-rail-section="id" data-rail-label="Label". The active segment fills as you scroll
 * through its section, and its label (About, Projects...) cross-fades with a small blur.
 * Reverses automatically on scroll-up because it is driven by scroll position, not by events.
 */
type Item = { id: string; label: string };

export function SectionRail() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);

  // 1) discover sections after mount
  useEffect(() => {
    const nodes = gsap.utils.toArray<HTMLElement>("[data-rail-section]");
    setItems(nodes.map((n) => ({ id: n.dataset.railSection!, label: n.dataset.railLabel ?? n.dataset.railSection! })));
  }, []);

  // 2) one trigger per section
  useEffect(() => {
    if (!items.length) return;
    const nodes = gsap.utils.toArray<HTMLElement>("[data-rail-section]");
    const triggers = nodes.map((node, i) =>
      ScrollTrigger.create({
        trigger: node,
        start: "top 60%",
        end: "bottom 60%",
        refreshPriority: -1, // measure after pinned sections have created their spacers
        onToggle: (self) => self.isActive && setActive(i),
        onUpdate: (self) => {
          const el = fills.current[i];
          if (el) el.style.transform = `scaleY(${self.progress})`;
        },
        onLeave: () => { const el = fills.current[i]; if (el) el.style.transform = "scaleY(1)"; },
        onLeaveBack: () => { const el = fills.current[i]; if (el) el.style.transform = "scaleY(0)"; },
      })
    );
    return () => triggers.forEach((t) => t.kill());
  }, [items]);

  if (!items.length) return null;

  return (
    <nav
      aria-hidden
      className="section-rail"
      style={{
        position: "fixed",
        right: "1.4vw",
        top: "9vh",
        height: "62vh",
        width: 110,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
        color: "var(--ui-fg, #fff)",
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.id}
          style={{
            position: "relative",
            flex: 1,
            borderRight: "1px solid color-mix(in srgb, var(--ui-fg, currentColor) 22%, transparent)",
          }}
        >
          <span
            ref={(el) => { fills.current[i] = el; }}
            style={{
              position: "absolute",
              right: -1,
              top: 0,
              width: 1,
              height: "100%",
              background: "currentColor",
              transformOrigin: "top",
              transform: "scaleY(0)",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 14,
              top: "16%",
              fontSize: 13,
              whiteSpace: "nowrap",
              opacity: active === i ? 1 : 0,
              filter: active === i ? "blur(0px)" : "blur(6px)",
              transition: "opacity .5s ease, filter .5s ease",
            }}
          >
            {it.label}
          </span>
        </div>
      ))}
    </nav>
  );
}
