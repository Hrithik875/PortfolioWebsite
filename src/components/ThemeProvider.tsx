"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { ThemeProvider as NextThemesProvider, useTheme, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export { useTheme };

/**
 * Atomic theme switch.
 *
 * The browser takes ONE screenshot of the whole page (old theme), we flip the
 * theme synchronously, the browser takes ONE screenshot of the new theme, and
 * then only those two bitmaps are cross-faded on the GPU. No element animates
 * its own colour, so nothing can lag or get out of sync, on any device.
 *
 * Browsers without View Transitions (or users with reduced motion) get an
 * instant, still fully synchronous, switch.
 */
export function useThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const busy = React.useRef(false);

  return React.useCallback(() => {
    if (busy.current) return;
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const root = document.documentElement;

    const apply = () => {
      // Write the DOM first so the "new" snapshot is guaranteed correct,
      // then let next-themes / React catch up synchronously.
      root.setAttribute("data-theme", next);
      root.style.colorScheme = next;
      flushSync(() => setTheme(next));
    };

    const done = () => {
      root.classList.remove("theme-switching");
      busy.current = false;
    };

    busy.current = true;
    root.classList.add("theme-switching"); // kills every per-element colour transition

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!doc.startViewTransition || reduced) {
      apply();
      requestAnimationFrame(() => requestAnimationFrame(done));
      return;
    }

    const t = doc.startViewTransition(apply);
    t.finished.then(done, done);
  }, [resolvedTheme, setTheme]);
}