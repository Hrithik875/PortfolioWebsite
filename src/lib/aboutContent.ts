// ─── ABOUT SECTION CONTENT ───────────────────────────────────────────────────
// All copy for the About section lives here. Edit freely.
export type Span = { text: string; italic?: boolean };

export const about = {
  /** Headline: mix roman + italic spans. Italic spans render in Instrument Serif Italic. */
  headline: [
    { text: "As an " },
    { text: "AI/ML engineer", italic: true },
    { text: ", I build intelligent systems that think — blending technical " },
    { text: "precision", italic: true },
    { text: " and craft." },
  ] as Span[],

  paragraph:
    "My name is Hrithik. A final-year AI/ML engineering student at BMSCE, Bangalore, I build memorable intelligent experiences — retrieval systems, streaming ML pipelines, and evaluation frameworks — always seeking the symbiosis between research and design.",

  info: { label: "INFO", href: "#about" },
  image: { src: "/images/about-portrait.webp", alt: "Hrithik M — AI/ML Engineer" },
};

// ─── MOTION TUNING ───────────────────────────────────────────────────────────
export const T = {
  // — reveals (blur / opacity), scrubbed to scroll —
  scrub: 0.6,          // seconds of trailing smoothing on reveals
  textBlur: 14,        // px, headline word starting blur
  lineStagger: 0.55,   // timeline offset between headline lines (each line duration = 1)
  paraBlur: 14,

  // — portrait —
  imageBlur: 44,        // px at a 1920px-wide viewport (scales with viewport width)
  imageVeilFrom: 0.65,  // 0–1: how strongly the page colour covers the portrait at the start
  imageHeightVh: 120,   // portrait height
  imageSpeed: 0.45,     // portrait speed vs the page/text once settled. 1 = same as text, 0.45 = less than half.
  imageEntryVh: 50,     // portrait rides in WITH the About cover (1 + coverSpeed) for this much scroll (vh)...
  imageSettleVh: 30,    // ...then slows to imageSpeed over this much scroll (vh)
  imageScrub: 0.8,      // trailing glide of the portrait in seconds (text reveals use `scrub`). Higher = floatier.

  // — About sliding over the hero —
  coverSpeed: 0.7,     // extra speed of the About background vs the page (0.7 = 1.7× page speed)
  featherVh: 35,       // height of the blurred, fading edge that sits above About (vh)

  nextOverlapVh: 35,   // MUST equal the next section's negative marginTop in page.tsx (-35vh)

  counter: { from: 18, to: 30 },
};