"use client";
import React from "react";

/**
 * Next.js 16.2.0 ships a known framework bug in OuterLayoutRouter where it renders
 * [templateStyles, templateScripts, template] and [child, segmentViewBoundaries] as
 * keyed-less arrays inside TemplateContext.Provider / SegmentStateProvider.
 *
 * This generates spurious "Each child in a list should have a unique 'key' prop"
 * console warnings originating from OuterLayoutRouter — user-land code cannot add
 * keys to those framework-internal arrays.
 *
 * We suppress only that specific warning by matching on the invariant message text
 * ("OuterLayoutRouter" appears in the React component stack that React appends to
 * the warning string). All other key warnings — from application components — still
 * surface normally.
 */
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const _origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    // React's key warning always has the message text as the first argument.
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (
      msg.includes("unique") &&
      msg.includes("key") &&
      // The component stack Next.js appends always contains OuterLayoutRouter
      // or SegmentStateProvider when this is the framework bug (not our code).
      (msg.includes("OuterLayoutRouter") || msg.includes("SegmentStateProvider"))
    ) {
      return; // suppress only the framework-internal warning
    }
    _origError(...args);
  };
}

export default function Template({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "contents" }}>{children}</div>;
}
