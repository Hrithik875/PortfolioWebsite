"use client";

import { useEffect } from "react";

/**
 * PreventZoom:
 * Locks the browser zoom level to 100% and prevents zooming in or out across all browsers.
 * Handles:
 * - Ctrl / Cmd + Mouse Wheel (trackpad pinch / wheel zoom)
 * - Keyboard zoom shortcuts (Ctrl/Cmd + '+', '-', '=', '_', '0')
 * - Safari/WebKit gesture events (gesturestart, gesturechange, gestureend)
 * - Multitouch pinch zoom gestures (touchmove with touches.length > 1)
 * - Rapid double-tap zoom gestures on touchscreens
 */
export function PreventZoom() {
  useEffect(() => {
    // 1. Prevent Ctrl/Cmd + wheel / trackpad pinch zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // 2. Prevent keyboard shortcuts: Ctrl/Cmd + (+, -, =, _, 0, NumpadAdd, NumpadSubtract, Numpad0)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const isZoomKey =
          e.key === "+" ||
          e.key === "-" ||
          e.key === "=" ||
          e.key === "_" ||
          e.key === "0" ||
          e.code === "Equal" ||
          e.code === "Minus" ||
          e.code === "Digit0" ||
          e.code === "NumpadAdd" ||
          e.code === "NumpadSubtract" ||
          e.code === "Numpad0" ||
          e.keyCode === 187 ||
          e.keyCode === 189 ||
          e.keyCode === 107 ||
          e.keyCode === 109 ||
          e.keyCode === 48 ||
          e.keyCode === 96;

        if (isZoomKey) {
          e.preventDefault();
        }
      }
    };

    // 3. Prevent Safari / WebKit gesture events (trackpad / touch pinch zoom)
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // 4. Prevent multi-touch pinch zoom
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 5. Prevent double tap to zoom on touch devices
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Attach listeners with passive: false where needed to allow preventDefault
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("gesturestart", handleGesture, { passive: false });
    document.addEventListener("gesturechange", handleGesture, { passive: false });
    document.addEventListener("gestureend", handleGesture, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("gesturestart", handleGesture);
      document.removeEventListener("gesturechange", handleGesture);
      document.removeEventListener("gestureend", handleGesture);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return null;
}
