"use client";

import React, { useEffect, useState } from "react";
import ClockPanel from "@/components/ClockPanel";

/**
 * ClockOverlay — full-screen clock for phones / tablets (everything below the desktop breakpoint).
 *
 *  - Rendered by the Navbar and toggled by the clock button next to the theme switch.
 *  - Sits at z-[45]: ABOVE the page, BELOW the navbar (z-50), so the navbar stays visible on top.
 *  - Mounted only while open (the render loop and audio stop when it closes; sound is muted on every open).
 *  - Behaves like a page: when the hamburger menu opens, the Navbar pushes #clock-overlay-push back
 *    exactly like #page-shell (shrink + slide left). While the menu is open a tap-catcher sits on top
 *    and tapping the shrunken clock closes the menu.
 *  - Closes on Escape and when the screen grows to desktop width (the Navbar closes it on route change).
 */

const DESKTOP_MIN_WIDTH = 1009; // keep in sync with the navbar
const FADE_MS = 420;

export default function ClockOverlay({
  open,
  onClose,
  menuOpen = false,
  onMenuTap,
  location = "BENGALURU, INDIA",
  timeZone = "Asia/Kolkata",
}: {
  open: boolean;
  onClose: () => void;
  /** true while the mobile hamburger menu is open (the clock is pushed back behind it) */
  menuOpen?: boolean;
  /** called when the shrunken clock is tapped while the menu is open */
  onMenuTap?: () => void;
  location?: string;
  timeZone?: string;
}) {
  const [mounted, setMounted] = useState(false); // exists in the DOM
  const [visible, setVisible] = useState(false); // faded in

  /* mount -> fade in, fade out -> unmount */
  useEffect(() => {
    if (open) {
      setMounted(true);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), FADE_MS + 30);
    return () => clearTimeout(t);
  }, [open]);

  /* Escape closes (only when the menu is not open); growing to desktop width closes */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !menuOpen) onClose();
    };
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
    const onChange = () => {
      if (mq.matches) onClose();
    };
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    onChange();
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [open, onClose, menuOpen]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clock"
      className="fixed inset-0 z-[45] min-[1009px]:hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.985)",
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.32, 0.72, 0, 1), transform ${FADE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
        // While the menu is open the full-screen wrapper must NOT catch taps, otherwise it sits on
        // top of the menu links. Only the (shrunken) clock below catches them.
        pointerEvents: open && !menuOpen ? "auto" : "none",
        touchAction: menuOpen ? "auto" : "none",
      }}
    >
      {/* The Navbar transforms THIS element (by id) when the hamburger menu opens/closes */}
      <div
        id="clock-overlay-push"
        className="absolute inset-0 overflow-hidden"
        style={{ willChange: "transform", pointerEvents: open ? "auto" : "none" }}
      >
        <ClockPanel fullscreen location={location} timeZone={timeZone} />

        {/* While the menu is open, tapping the pushed-back clock closes the menu (like the other pages) */}
        {menuOpen && (
          <div
            aria-label="Close menu"
            className="absolute inset-0 z-20 cursor-pointer"
            style={{ touchAction: "none" }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenuTap?.();
            }}
          />
        )}
      </div>
    </div>
  );
}