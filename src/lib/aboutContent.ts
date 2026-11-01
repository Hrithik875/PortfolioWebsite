// ─── ABOUT SECTION CONTENT ───────────────────────────────────────────────────
// All copy for the About section lives here. Edit freely.
export type Span = { text: string; italic?: boolean };

export type AboutData = {
  headline: Span[];
  paragraph: string;
  info: { label: string; href: string };
  image: { src: string; alt: string };
};

export const about: AboutData = {
  /** Headline: mix roman + italic spans. Italic spans render in Instrument Serif Italic. */
  headline: [
    { text: "Thoughtful by " },
    { text: "design", italic: true },
    { text: ", curious by " },
    { text: "nature", italic: true },
    { text: ",\nbringing ideas to life through " },
    { text: "code", italic: true },
    { text: " and " },
    { text: "creativity", italic: true },
    { text: "." },
  ] as Span[],

  paragraph:
    "I'm Hrithik, an aspiring engineer and curious creator based in Bengaluru. Studying AI and Machine Learning, I enjoy blending technology and creativity to turn ideas into meaningful experiences.",

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

  // ── mobile (≤1023px) ──
  mImageSpeed: 0.65,  // portrait speed vs page (1 = same, lower = lags more)
  mImageBlur: 22,     // px, starting blur

  // — About sliding over the hero —
  coverSpeed: 0.7,     // extra speed of the About background vs the page (0.7 = 1.7× page speed)
  featherVh: 35,       // height of the blurred, fading edge that sits above About (vh)

  nextOverlapVh: 35,   // MUST equal the next section's negative marginTop in page.tsx (-35vh)

  counter: { from: 18, to: 30 },
};