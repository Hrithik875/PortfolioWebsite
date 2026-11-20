"use client";
import { AnimatePresence, m } from "framer-motion";

const MORPH_SCALE = 4 / 9; // moon outer radius (9) -> sun ring radius (4)
const SPRING = { type: "spring" as const, stiffness: 200, damping: 19 };

const variants = {
  enter: { rotate: -90, scale: MORPH_SCALE, opacity: 0 },
  center: {
    rotate: 0,
    scale: 1,
    opacity: 1,
    transition: { rotate: SPRING, scale: SPRING, opacity: { duration: 0.16, delay: 0.06 } },
  },
  exit: {
    rotate: 90,
    scale: MORPH_SCALE,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const, opacity: { duration: 0.12 } },
  },
};

const layer = "absolute inset-0 flex items-center justify-center";

export function ThemeToggleIcon({ isDark, size = 20 }: { isDark: boolean; size?: number }) {
  const svg = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  return (
    <span className="relative block" style={{ width: size, height: size }}>
      <AnimatePresence initial={false}>
        {isDark ? (
          <m.span key="sun" className={layer} variants={variants} initial="enter" animate="center" exit="exit">
            <svg {...svg}>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </m.span>
        ) : (
          <m.span key="moon" className={layer} variants={variants} initial="enter" animate="center" exit="exit">
            <svg {...svg}>
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </m.span>
        )}
      </AnimatePresence>
    </span>
  );
}

