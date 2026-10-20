"use client";
import dynamic from "next/dynamic";

const SpacetimeBackground = dynamic(
  () => import("@/components/SpacetimeBackground").then((m) => ({ default: m.SpacetimeBackground })),
  { ssr: false }
);

export function GlobalBackgroundLoader() {
  return <SpacetimeBackground />;
}
