"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

declare global {
  interface Window {
    __SPACETIME_INITIALIZED__?: boolean;
    __SPACETIME_TIER__?: "low" | "high";
    __currentSpacetimeTheme?: "dark" | "light";
    setSpacetimeTheme?: (mode: "dark" | "light") => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TweenMax?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render?: (a: any) => void;
    onMouseMove?: (e: MouseEvent) => void;
    onTouchMove?: (e: TouchEvent) => void;
    onResize?: () => void;
    resizeTm?: ReturnType<typeof setTimeout> | number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderer?: any;
  }
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
}

export function SpacetimeBackground() {
  const initializedRef = useRef(false);
  const { resolvedTheme } = useTheme();

  // Helper to check if diagnostic switch ?bg=off is active
  const isBgOff = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bg") === "off";

  // Helper to determine the active theme
  const getActiveTheme = (): "dark" | "light" => {
    if (typeof document !== "undefined") {
      const dataTheme = document.documentElement.getAttribute("data-theme");
      if (dataTheme === "light" || dataTheme === "dark") {
        return dataTheme;
      }
      if (document.documentElement.classList.contains("light")) return "light";
      if (document.documentElement.classList.contains("dark")) return "dark";
    }
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      return resolvedTheme;
    }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  };

  // Helper for tier detection
  const checkIsLowTier = (): boolean => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    const bg = params.get("bg");
    if (bg === "low") return true;
    if (bg === "desktop" || bg === "high") return false;

    const isCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const isNarrow = window.innerWidth < 900;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    const isLowCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 6;
    const isLowMem = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;

    return Boolean(isCoarse || isNarrow || isLowCpu || isLowMem);
  };

  // Sync theme whenever resolvedTheme updates from next-themes
  useEffect(() => {
    if (isBgOff) return;
    const currentMode = resolvedTheme === "light" ? "light" : "dark";
    window.__currentSpacetimeTheme = currentMode;
    if (typeof window.setSpacetimeTheme === "function") {
      window.setSpacetimeTheme(currentMode);
    }
  }, [resolvedTheme, isBgOff]);

  // MutationObserver & prefers-color-scheme listener to keep theme in sync
  useEffect(() => {
    if (isBgOff) return;
    const currentMode = getActiveTheme();
    window.__currentSpacetimeTheme = currentMode;
    if (typeof window.setSpacetimeTheme === "function") {
      window.setSpacetimeTheme(currentMode);
    }

    // Observer for data-theme and class on <html>
    const observer = new MutationObserver(() => {
      const mode = getActiveTheme();
      window.__currentSpacetimeTheme = mode;
      if (typeof window.setSpacetimeTheme === "function") {
        window.setSpacetimeTheme(mode);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    // Media query listener for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const mode = getActiveTheme();
      window.__currentSpacetimeTheme = mode;
      if (typeof window.setSpacetimeTheme === "function") {
        window.setSpacetimeTheme(mode);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      observer.disconnect();
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [isBgOff]);

  // Script loading and WebGL initialization
  useEffect(() => {
    // Step 0: If ?bg=off is active, do not load scripts or initialize WebGL
    if (isBgOff) return;

    if (initializedRef.current || window.__SPACETIME_INITIALIZED__) {
      return;
    }
    initializedRef.current = true;

    let isCancelled = false;

    const startSpacetime = async () => {
      try {
        // Step 1: Load three.min.js
        await loadScript("/spacetime/three.min.js", "spacetime-three");
        if (isCancelled) return;

        // Step 2: Load TweenMax.min.js
        await loadScript("/spacetime/TweenMax.min.js", "spacetime-tweenmax");
        if (isCancelled) return;

        // Step 3: Ensure canvas and shaders are ready in the DOM
        const canvas = document.querySelector("#scene") as HTMLCanvasElement | null;
        const vShader = document.getElementById("wrapVertexShader");
        const fShader = document.getElementById("wrapFragmentShader");

        if (!canvas || !vShader || !fShader) {
          await new Promise((r) => requestAnimationFrame(r));
        }

        // Give DOM a frame to settle, canvas dimension fallback is handled inside demo2.js
        await new Promise((r) => requestAnimationFrame(r));

        if (isCancelled) return;

        // Ensure window.__currentSpacetimeTheme and tier are set before demo2.js executes
        window.__currentSpacetimeTheme = getActiveTheme();
        window.__SPACETIME_TIER__ = checkIsLowTier() ? "low" : "high";

        // Step 4: Load demo2.js
        await loadScript("/spacetime/demo2.js", "spacetime-demo2");

        window.__SPACETIME_INITIALIZED__ = true;

        // Apply theme immediately on first frame
        if (typeof window.setSpacetimeTheme === "function") {
          window.setSpacetimeTheme(window.__currentSpacetimeTheme);
        }
      } catch (err) {
        console.error("Failed to initialize Spacetime WebGL background:", err);
      }
    };

    startSpacetime();

    return () => {
      isCancelled = true;
      if (typeof window !== "undefined") {
        if (window.TweenMax && window.render) {
          window.TweenMax.ticker.removeEventListener("tick", window.render);
        }
        if (window.onMouseMove) {
          window.removeEventListener("mousemove", window.onMouseMove);
        }
        if (window.onTouchMove) {
          window.removeEventListener("touchmove", window.onTouchMove);
        }
        if (window.onResize) {
          window.removeEventListener("resize", window.onResize);
        }
        if (window.resizeTm) {
          clearTimeout(window.resizeTm as number);
        }
        window.__SPACETIME_INITIALIZED__ = false;
        initializedRef.current = false;
        const demoScript = document.getElementById("spacetime-demo2");
        if (demoScript) {
          demoScript.remove();
        }
      }
    };
  }, [isBgOff]);

  // Step 0: Diagnostic switch ?bg=off completely skips rendering canvas
  if (isBgOff) {
    return null;
  }

  return (
    <>
      {/* The WebGL canvas: fixed behind everything, full viewport, dedicated compositor layer */}
      <canvas
        id="scene"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          zIndex: 0,
          pointerEvents: "none",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />

      {/* Shaders: with uTime, uIsLowTier, uPointSize, initialPosition, animDelay and dotColor uniform */}
      <script
        type="x-shader/x-vertex"
        id="wrapVertexShader"
        dangerouslySetInnerHTML={{
          __html: `
  uniform float uTime;
  uniform float uIsLowTier;
  uniform float uPointSize;
  attribute vec3 initialPosition;
  attribute float animDelay;

  float backEaseOut(float p) {
    float s = 1.70158;
    p = p - 1.0;
    return p * p * ((s + 1.0) * p + s) + 1.0;
  }

  void main() {
    vec3 pos = position;
    if (uIsLowTier > 0.5) {
      if (uTime >= animDelay) {
        float elapsed = uTime - animDelay;
        float cycle = mod(elapsed, 8.0);
        float factor;
        if (cycle < 4.0) {
          float p = cycle / 4.0;
          factor = 1.0 - backEaseOut(p);
        } else {
          float p = (cycle - 4.0) / 4.0;
          factor = backEaseOut(p);
        }
        pos = vec3(initialPosition.x * factor, initialPosition.y, initialPosition.z * factor);
      } else {
        pos = initialPosition;
      }
    }
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    gl_PointSize = uPointSize;
    gl_Position = projectionMatrix * mvPosition;
  }
`,
        }}
      />
      <script
        type="x-shader/x-fragment"
        id="wrapFragmentShader"
        dangerouslySetInnerHTML={{
          __html: `
  uniform sampler2D texture;
  uniform vec3 dotColor;
  void main(){
    vec4 textureColor = texture2D( texture, gl_PointCoord );
    if ( textureColor.a < 0.3 ) discard;
    gl_FragColor = vec4(dotColor, 0.4) * textureColor;
  }
`,
        }}
      />
    </>
  );
}

export default SpacetimeBackground;
