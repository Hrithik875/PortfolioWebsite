"use client";
import { useEffect, useState } from "react";

export type MotionMode = "full" | "lite" | "static";

/**
 * full   : real CSS blur() focus-pull on the portrait + blur on the text lines (desktop / strong GPU)
 * lite   : same choreography, but NO animated blur. The portrait cross-fades from a pre-blurred copy,
 *          text uses opacity + translate only. (phones and weak devices)
 * static : prefers-reduced-motion. No pin, no scrub, plain stacked layout.
 * Returns null until the client has measured, so the effect never builds twice.
 */
export function useMotionMode(): MotionMode | null {
  const [mode, setMode] = useState<MotionMode | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMode("static");
      return;
    }
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const weak = (mem !== undefined && mem <= 4) || (cores !== undefined && cores <= 4);

    setMode(coarse || narrow || weak ? "lite" : "full");
  }, []);

  return mode;
}
