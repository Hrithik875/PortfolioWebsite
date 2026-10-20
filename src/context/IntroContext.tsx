"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Configure reveal animation frequency:
 * - "always": Runs on every full page load of the home route
 * - "once-per-session": Runs only once per browser session via sessionStorage
 */
export const INTRO_REVEAL_MODE: "always" | "once-per-session" = "always";

interface IntroContextType {
  introDone: boolean;
  setIntroDone: (done: boolean) => void;
  shouldRunIntro: boolean;
}

const IntroContext = createContext<IntroContextType>({
  introDone: true,
  setIntroDone: () => {},
  shouldRunIntro: false,
});

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [introDone, setIntroDoneState] = useState<boolean>(() => {
    // Non-home routes never wait on intro
    return !isHome;
  });

  const [shouldRunIntro, setShouldRunIntro] = useState<boolean>(isHome);

  useEffect(() => {
    if (!isHome) {
      setIntroDoneState(true);
      setShouldRunIntro(false);
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("intro-loading");
      }
      return;
    }

    // Check prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIntroDoneState(true);
      setShouldRunIntro(false);
      document.documentElement.classList.remove("intro-loading");
      return;
    }

    const isTestMode =
      typeof window !== "undefined" && window.location.search.includes("test_intro=1");

    // Check once-per-session mode
    if (!isTestMode && INTRO_REVEAL_MODE === "once-per-session") {
      try {
        const seen = sessionStorage.getItem("portfolio_intro_seen");
        if (seen === "true") {
          setIntroDoneState(true);
          setShouldRunIntro(false);
          document.documentElement.classList.remove("intro-loading");
          return;
        }
      } catch {
        // sessionStorage blocked or unavailable
      }
    }

    // Ensure intro-loading class is present on html while intro is active
    document.documentElement.classList.add("intro-loading");
    setIntroDoneState(false);
    setShouldRunIntro(true);
  }, [isHome]);

  const setIntroDone = (done: boolean) => {
    setIntroDoneState(done);
    if (done) {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("intro-loading");
      }
      if (INTRO_REVEAL_MODE === "once-per-session") {
        try {
          sessionStorage.setItem("portfolio_intro_seen", "true");
        } catch {
          // sessionStorage blocked
        }
      }
    }
  };

  return (
    <IntroContext.Provider value={{ introDone, setIntroDone, shouldRunIntro }}>
      {children}
    </IntroContext.Provider>
  );
}

export const useIntro = () => useContext(IntroContext);
