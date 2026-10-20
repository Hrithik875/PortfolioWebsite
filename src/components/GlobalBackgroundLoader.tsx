"use client";
import dynamic from "next/dynamic";
import { useIntro } from "@/context/IntroContext";

const SpacetimeBackground = dynamic(
  () => import("@/components/SpacetimeBackground").then((m) => ({ default: m.SpacetimeBackground })),
  { ssr: false }
);

export function GlobalBackgroundLoader() {
  const { introDone } = useIntro();
  if (!introDone) return null;
  return <SpacetimeBackground />;
}
