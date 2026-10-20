"use client";

import React from "react";

interface LogoProps {
  className?: string;
  alt?: string;
  priority?: boolean;
}

export function Logo({
  className = "w-7 h-7",
  alt = "Hrithik HM Logo",
  priority = false,
}: LogoProps) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 relative overflow-hidden select-none ${className}`}
      aria-label={alt}
    >
      {/* Dark theme SVG logo (Red H + White M) */}
      <img
        src="/logo-dark.svg"
        alt={alt}
        width={742}
        height={473}
        className="logo-dark-theme w-full h-full object-contain pointer-events-none"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      {/* Light theme SVG logo (Red H + Black M) */}
      <img
        src="/logo-light.svg"
        alt={alt}
        width={742}
        height={473}
        className="logo-light-theme w-full h-full object-contain pointer-events-none"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </span>
  );
}

export default Logo;
