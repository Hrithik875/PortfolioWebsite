"use client";
import React from "react";

/**
 * Next.js 16.2.0 framework-internal bug in OuterLayoutRouter renders
 * TemplateContext.Provider and SegmentStateProvider child arrays
 * without unique React keys.
 *
 * This development-only filter intercepts any remaining warning where
 * "OuterLayoutRouter" or "SegmentStateProvider" is reported in the
 * component stack, while preserving all valid application key warnings.
 */
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const _origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const full = args
      .map((a) => (typeof a === "string" ? a : a instanceof Error ? a.message : ""))
      .join(" ");
    if (
      full.includes("unique") &&
      full.includes("key") &&
      (full.includes("OuterLayoutRouter") || full.includes("SegmentStateProvider"))
    ) {
      return;
    }
    _origError(...args);
  };
}

export default function Template({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "contents" }}>{children}</div>;
}
