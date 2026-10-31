"use client";
import { Fragment, useMemo, useRef, type CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { about, T } from "@/lib/aboutContent";
import { buildWords, groupByLine } from "@/lib/splitWords";
import s from "./About.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const blur = (px: number) => `blur(${px}px)`;
// how far the About background overlaps the hero when it has finished sliding up
const OVERLAP_VH = Math.max(0, T.coverSpeed * 100 - T.featherVh);

export function About() {
  const root = useRef<HTMLElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const textBlock = useRef<HTMLDivElement>(null);

  const words = useMemo(() => buildWords(about.headline), []);
  const plainHeadline = about.headline.map((p) => p.text).join("");

  useGSAP(
    () => {
      // Reduced motion: CSS shows the static, fully revealed layout.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rootEl = root.current!, bgEl = bg.current!, wrapEl = wrap.current!;
      const clip = clipRef.current!, veil = veilRef.current!;
      const head = headline.current!, block = textBlock.current!;

      const vh = () => window.innerHeight;
      const featherPx = () => (T.featherVh / 100) * vh();
      // page-y of the About section's top edge (= hero height). The root itself is never transformed.
      const rootTop = () => rootEl.getBoundingClientRect().top + window.scrollY;

      // 1 ─ BACKGROUND COVER. The hero is untouched and scrolls at page speed. This layer starts
      //     one feather-height below the viewport (so nothing shows at scroll 0) and rises at
      //     (1 + coverSpeed)× page speed until the hero is gone, so it slides OVER the hero.
      //     scrub:true → locked 1:1 to the (Lenis-smoothed) scroll position, no extra lag.
      gsap.fromTo(
        bgEl,
        { y: () => featherPx() },
        {
          y: () => featherPx() - T.coverSpeed * rootTop(),
          ease: "none",
          scrollTrigger: { start: 0, end: () => rootTop(), scrub: true, invalidateOnRefresh: true },
        }
      );

      // 2 ─ PORTRAIT TRAVEL. One source of motion: a scrubbed tween on a fixed layer.
      //     Speed profile (px of portrait travel per px of scroll):
      //       0 → entry     : (1 + coverSpeed)×  rides in together with the About cover
      //       entry → +settle: eases down (smoothstep) to T.imageSpeed
      //       after         : constant T.imageSpeed  (text moves at 1×, so the portrait is always slower)
      //     The tween ends when the next section's top reaches the viewport top (it fully covers the
      //     portrait by then), at which point the fixed layer is hidden.
      const endScroll = () => rootTop() + rootEl.offsetHeight - (T.nextOverlapVh / 100) * vh();
      const measure = () => {
        const V = vh();
        const v0 = 1 + T.coverSpeed, v1 = T.imageSpeed;
        const s1 = (T.imageEntryVh / 100) * V;
        const dl = Math.max(1, (T.imageSettleVh / 100) * V);
        const dist = (s: number) => {
          if (s <= s1) return v0 * s;
          if (s <= s1 + dl) {
            const x = (s - s1) / dl;                         // ∫ smoothstep = x³ − x⁴/2
            return v0 * s1 + dl * (v0 * x - (v0 - v1) * (x ** 3 - (x ** 4) / 2));
          }
          return v0 * s1 + (dl * (v0 + v1)) / 2 + v1 * (s - s1 - dl);
        };
        const y0 = V + featherPx();                          // starts exactly where the bg starts
        const S = Math.max(endScroll(), s1 + dl + 1);
        return { y0, S, Y: dist(S), dist };
      };
      let geo = measure();
      const onRefreshInit = () => { geo = measure(); };
      ScrollTrigger.addEventListener("refreshInit", onRefreshInit);
      const travelEase = (u: number) => geo.dist(u * geo.S) / geo.Y;
      const railEl = rail.current!;
      const syncRail = (self: ScrollTrigger) => { railEl.style.visibility = self.progress >= 1 ? "hidden" : "visible"; };
      gsap.fromTo(
        wrapEl,
        { y: () => geo.y0 },
        {
          y: () => geo.y0 - geo.Y,
          ease: travelEase,
          scrollTrigger: {
            start: 0, end: () => geo.S, scrub: T.imageScrub, invalidateOnRefresh: true,
            onUpdate: syncRail, onRefresh: syncRail,
          },
        }
      );

      // 3 ─ PORTRAIT REVEAL: the whole shape (edges too) starts heavily blurred + covered by the page
      //     colour → sharp + clear.
      //     Blur clears late (power3.in): soft while the headline reads, clean as the paragraph lands.
      const blurMax = () => gsap.utils.clamp(18, 64, (T.imageBlur * window.innerWidth) / 1920);
      const rv = { b: blurMax(), v: T.imageVeilFrom };
      const paint = () => {
        clip.style.filter = blur(+rv.b.toFixed(2));
        veil.style.opacity = rv.v.toFixed(3);
      };
      paint();
      gsap
        .timeline({ scrollTrigger: { start: () => 0.05 * vh(), end: () => 1.75 * vh(), scrub: T.scrub, invalidateOnRefresh: true } })
        .to(rv, { b: 0, ease: "power3.in", duration: 1, onUpdate: paint }, 0)
        .to(rv, { v: 0, ease: "none", duration: 1, onUpdate: paint }, 0);

      // 4 ─ HEADLINE: per-line blur + opacity reveal. Text is in normal page flow, so these
      //     screen-position triggers are exact. Lines are re-measured on font load and resize.
      const wordEls = gsap.utils.toArray<HTMLElement>(head.querySelectorAll("[data-word]"));
      let headTl: gsap.core.Timeline | null = null;
      const buildHeadline = () => {
        headTl?.scrollTrigger?.kill(true);
        headTl?.kill();
        const tl = gsap.timeline({ scrollTrigger: { trigger: head, start: "top 85%", end: "top 30%", scrub: T.scrub } });
        groupByLine(wordEls).forEach((line, i) => {
          tl.fromTo(
            line,
            { opacity: 0, filter: blur(T.textBlur) },
            { opacity: 1, filter: blur(0), ease: "none", duration: 1 },
            i * T.lineStagger
          );
        });
        headTl = tl;
      };
      buildHeadline();
      let alive = true;
      document.fonts?.ready.then(() => {
        if (!alive) return;
        buildHeadline();
        ScrollTrigger.refresh();
      });
      let lastW = head.offsetWidth;
      const ro = new ResizeObserver(() => {
        if (Math.abs(head.offsetWidth - lastW) > 1) { lastW = head.offsetWidth; buildHeadline(); }
      });
      ro.observe(head);

      // 5 ─ PARAGRAPH + INFO: one block, blur + opacity in
      gsap.fromTo(
        block,
        { opacity: 0, filter: blur(T.paraBlur) },
        {
          opacity: 1, filter: blur(0), ease: "none",
          scrollTrigger: { trigger: block, start: "top 92%", end: "top 62%", scrub: T.scrub },
        }
      );

      return () => {
        alive = false;
        ro.disconnect();
        ScrollTrigger.removeEventListener("refreshInit", onRefreshInit);
        headTl?.scrollTrigger?.kill(true);
        headTl?.kill();
      };
    },
    { scope: root }
  );

  const cssVars = {
    "--feather": `${T.featherVh}vh`,
    "--overlap": `${OVERLAP_VH}vh`,
    "--img-h": `${T.imageHeightVh}vh`,
  } as CSSProperties;

  return (
    <section ref={root} id="about" data-counter className={s.root} style={cssVars}>
      {/* background + blurred feather that slides over the hero */}
      <div ref={bg} className={s.bg} aria-hidden="true">
        <div className={s.feather}>
          <div className={`${s.featherBlur} ${s.fb1}`} />
          <div className={`${s.featherBlur} ${s.fb2}`} />
          <div className={`${s.featherBlur} ${s.fb3}`} />
          <div className={s.featherTint} />
        </div>
      </div>

      {/* portrait (fixed layer, driven entirely by the travel tween) */}
      <div ref={rail} className={s.imageFixed}>
        <div ref={wrap} className={s.imageWrap}>
          <div ref={clipRef} className={s.imageClip}>
            <Image src={about.image.src} alt={about.image.alt} fill priority sizes="51vw" className={s.image} />
            <div ref={veilRef} className={s.veil} />
          </div>
        </div>
      </div>

      <div className={s.content}>
        <h2 ref={headline} className={s.headline} aria-label={plainHeadline}>
          {words.map((w, i) => (
            <Fragment key={i}>
              <span data-word aria-hidden="true" className={s.word}>
                {w.parts.map((p, j) =>
                  p.italic ? <em key={j} className={s.serif}>{p.text}</em> : <Fragment key={j}>{p.text}</Fragment>
                )}
              </span>
              {w.breakAfter ? <br className={s.break} /> : null}
              {w.spaceAfter ? " " : null}
            </Fragment>
          ))}
        </h2>

        <div ref={textBlock} className={s.textBlock}>
          <p className={s.paragraph}>{about.paragraph}</p>
          <a href={about.info.href} className={s.info}>{about.info.label}</a>
        </div>
      </div>
    </section>
  );
}

export default About;