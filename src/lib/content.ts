// ─── ALL COPY LIVES HERE ───
export type Span = { text: string; italic?: boolean };

export const hero = {
  line: "Basically, I make websites",
};

export const about = {
  // italic spans render in the serif italic face, everything else in the sans
  headline: [
    { text: "As an " },
    { text: "AI engineer", italic: true },
    { text: ", I build intelligent products that think, blending technical precision and " },
    { text: "craft", italic: true },
    { text: "." },
  ] as Span[],
  paragraph:
    "My name is Hrithik. A final-year AI/ML engineering student in Bangalore, I build memorable intelligent experiences, always seeking the symbiosis between research and design.",
  info: { label: "INFO", href: "#about" },
  version: { label: "V3.0", href: "#" },
  image: { src: "/images/about-portrait.webp", alt: "Portrait" },
};

// ─── MOTION TUNING (measured from the reference video) ───
export const T = {
  scrub: 0.8,            // seconds of smoothing between scroll and animation (0 = hard lock)
  imageBlur: 28,         // px, starting blur of the portrait
  imageBrightFrom: 0.25, // starting brightness of the portrait
  imageSpeed: 0.45,      // portrait scroll speed relative to text (1 = same, lower = slower)
  textBlur: 14,          // px, starting blur of headline lines
  lineStagger: 0.55,     // overlap between consecutive headline lines (line length = 1)
  paraBlur: 14,
  v3Blur: 12,
  v3Speed: 1.5,          // "→ V3.0" moves faster than the page
  counter: { from: 18, to: 30 },
};
