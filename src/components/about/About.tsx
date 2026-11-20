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

// Mobile browsers resize the viewport (height only) every time the URL bar hides/shows while
// scrolling. Without this, every one of those resizes triggers a full refresh that recomputes all
// start/end/y values mid-scroll → the portrait "jumps up and down". Ignore height-only resizes.
ScrollTrigger.config({ ignoreMobileResize: true });

const blur = (px: number) => `blur(${px}px)`;
// how far the About background overlaps the hero when it has finished sliding up
const OVERLAP_VH = Math.max(0, T.coverSpeed * 100 - T.featherVh);

/* ── helpers ─────────────────────────────────────────────────────────────── */

const isCoarse = () => window.matchMedia("(pointer: coarse)").matches;

// window.innerHeight changes on touch devices while the URL bar animates. Everything we compute
// from "vh" must not change mid-scroll, so on touch devices we lock it to the largest value seen
// for the current width (= the CSS `vh` unit, i.e. the bar-hidden viewport).
let lockW = 0;
let lockH = 0;
const stableVh = () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!isCoarse()) return h;
  if (!lockH || w !== lockW) { lockW = w; lockH = h; }
  else if (h > lockH) lockH = h;
  return lockH;
};

// Portrait blur is NOT animated as a filter any more (that re-rasterises a huge layer on every
// scroll frame). It is a cross-fade between the sharp image and two pre-blurred copies, so each
// frame only changes opacity, which the compositor handles on the GPU.
// MID is how blurry the middle copy is relative to the heaviest one.
const MID = 0.4;
const clamp01 = gsap.utils.clamp(0, 1);

const lastOpacity = new WeakMap<HTMLElement, number>();
const setLayer = (el: HTMLElement, o: number) => {
  const v = o < 0.004 ? 0 : o > 0.996 ? 1 : +o.toFixed(3);
  if (lastOpacity.get(el) === v) return;           // skip redundant style writes
  lastOpacity.set(el, v);
  el.style.opacity = String(v);
  el.style.visibility = v === 0 ? "hidden" : "visible";   // fully faded layers aren't drawn at all
};

// data-reveal = before | active | done. CSS only promotes layers (will-change) while "active" and
// removes the filter entirely once "done", so dozens of words don't each keep a GPU layer forever.
const setReveal = (el: HTMLElement, p: number) => {
  const st = p <= 0 ? "before" : p >= 1 ? "done" : "active";
  if (el.dataset.reveal !== st) el.dataset.reveal = st;
};

export function About() {
  const root = useRef<HTMLElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const sharpRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const heavyRef = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const textBlock = useRef<HTMLDivElement>(null);

  const words = useMemo(() => buildWords(about.headline), []);
  const plainHeadline = about.headline.map((p) => p.text).join("");

  useGSAP(
    () => {
      // Reduced motion: CSS shows the static, fully revealed layout.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rootEl = root.current!, bgEl = bg.current!, wrapEl = wrap.current!;
      const sharpEl = sharpRef.current!, midEl = midRef.current!, heavyEl = heavyRef.current!;
      const head = headline.current!, block = textBlock.current!;

      const coarse = isCoarse();
      // On touch devices scroll is native and runs on its own thread; any extra scrub smoothing
      // makes the motion lag behind the finger and then "catch up" (the up/down wobble).
      // scrub:true locks the animation 1:1 to the scroll position.
      const scrubT = coarse ? true : T.scrub;
      const scrubI = coarse ? true : T.imageScrub;
      // On touch, blur is also applied in a few discrete steps (far fewer repaints).
      const stepEase = coarse ? "steps(6)" : "none";

      const vh = stableVh;
      const featherPx = () => (T.featherVh / 100) * vh();
      // page-y of the About section's top edge (= hero height). The root itself is never transformed.
      const rootTop = () => rootEl.getBoundingClientRect().top + window.scrollY;

      // 1 ─ BACKGROUND COVER. The hero is untouched and scrolls at page speed. This layer starts
      //     one feather-height below the viewport (so nothing shows at scroll 0) and rises at
      //     (1 + coverSpeed)× page speed until the hero is gone, so it slides OVER the hero.
      gsap.fromTo(
        bgEl,
        { y: () => featherPx() },
        {
          y: () => featherPx() - T.coverSpeed * rootTop(),
          ease: "none",
          force3D: true,   // stay on a GPU layer for the whole tween (no 3D→2D switch / re-raster at the end)
          scrollTrigger: { start: 0, end: () => rootTop(), scrub: true, invalidateOnRefresh: true },
        }
      );

      // Portrait reveal: sharp → (mid blur) → (heavy blur) cross-fade + page-colour fade.
      //   b = blur level 1 → 0 (eased), v = veil 0.65 → 0 (linear)
      //
      // IMPORTANT: a blurred layer has soft, semi-transparent edges. If the layer below it is still
      // visible, ITS crisp edge shows through the soft fringe. So each lower layer must fade out
      // completely once the layer above it is (almost) fully in. `handOff` keeps a layer at full
      // opacity until the layer above reaches 80 %, then fades it to 0 over the last 20 %.
      const handOff = (above: number) => (above < 0.8 ? 1 : clamp01((1 - above) / 0.2));
      const paintImage = (b: number, v: number) => {
        const h = clamp01((b - MID) / (1 - MID));      // heavy copy coverage (0 → 1)
        const m = clamp01(b / MID);                    // mid copy coverage over the sharp one (0 → 1)
        setLayer(heavyEl, h);
        setLayer(midEl, b >= MID ? handOff(h) : m);
        setLayer(sharpEl, b >= MID ? 0 : handOff(m));
        // the page-colour "veil" is now just the opacity of the portrait over the page background
        wrapEl.style.opacity = (1 - v).toFixed(3);
      };
      const revealImage = (easeName: string, st: ScrollTrigger.Vars, heavyPx: number) => {
        const ease = gsap.parseEase(easeName);
        wrapEl.style.setProperty("--blur-heavy", `${heavyPx.toFixed(1)}px`);
        wrapEl.style.setProperty("--blur-mid", `${(heavyPx * MID).toFixed(1)}px`);
        const rv = { p: 0 };
        const apply = () => paintImage(1 - ease(rv.p), T.imageVeilFrom * (1 - rv.p));
        apply();
        gsap.to(rv, { p: 1, ease: "none", onUpdate: apply, scrollTrigger: st });
        return () => {
          wrapEl.style.removeProperty("--blur-heavy");
          wrapEl.style.removeProperty("--blur-mid");
          wrapEl.style.opacity = "";
          [heavyEl, midEl, sharpEl].forEach((el) => {
            lastOpacity.delete(el);
            el.style.opacity = "";
            el.style.visibility = "";
          });
        };
      };

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        // 2 ─ PORTRAIT TRAVEL. One source of motion: a scrubbed tween on a fixed layer.
        //     Speed profile (px of portrait travel per px of scroll):
        //       0 → entry     : (1 + coverSpeed)×  rides in together with the About cover
        //       entry → +settle: eases down (smoothstep) to T.imageSpeed
        //       after         : constant T.imageSpeed  (text moves at 1×, so the portrait is always slower)
        const endScroll = () => rootTop() + rootEl.offsetHeight - (T.nextOverlapVh / 100) * vh();
        const measure = () => {
          const V = vh();
          const v0 = 1 + T.coverSpeed;
          const s1 = (T.imageEntryVh / 100) * V;
          const dl = Math.max(1, (T.imageSettleVh / 100) * V);
          const y0 = V + featherPx();                          // starts exactly where the bg starts
          const S = Math.max(endScroll(), s1 + dl + 1);

          // The portrait travels completely off the top of the viewport by the time About ends.
          const imgH = wrapEl.offsetHeight || (T.imageHeightVh / 100) * V;
          const targetY = y0 + imgH + 40;

          const entryDist = v0 * s1 + (dl * v0) / 2;
          const remainingScroll = dl / 2 + (S - s1 - dl);
          const v1 = remainingScroll > 0
            ? Math.max(0.35, (targetY - entryDist) / remainingScroll)
            : T.imageSpeed;

          const dist = (s: number) => {
            if (s <= s1) return v0 * s;
            if (s <= s1 + dl) {
              const x = (s - s1) / dl;                         // ∫ smoothstep = x³ − x⁴/2
              return v0 * s1 + dl * (v0 * x - (v0 - v1) * (x ** 3 - (x ** 4) / 2));
            }
            return v0 * s1 + (dl * (v0 + v1)) / 2 + v1 * (s - s1 - dl);
          };

          const Y = dist(S);
          return { y0, S, Y, dist };
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
            force3D: true,
            scrollTrigger: {
              start: 0, end: () => geo.S, scrub: scrubI, invalidateOnRefresh: true,
              onUpdate: syncRail, onRefresh: syncRail,
            },
          }
        );

        // 3 ─ PORTRAIT REVEAL (blur clears late: power3.in)
        const blurMax = gsap.utils.clamp(18, 64, (T.imageBlur * window.innerWidth) / 1920);
        const undoReveal = revealImage(
          "power3.in",
          { start: () => 0.05 * vh(), end: () => 1.75 * vh(), scrub: scrubT, invalidateOnRefresh: true },
          blurMax
        );

        return () => {
          ScrollTrigger.removeEventListener("refreshInit", onRefreshInit);
          railEl.style.visibility = "";
          undoReveal();
        };
      });

      mm.add("(max-width: 1023px)", () => {
        const stage = rail.current!;        // in-flow container, never transformed -> stable trigger

        // scroll distance until the lagging portrait has left the top of the screen
        const lagDist = () => (0.7 * vh() + wrapEl.offsetHeight) / T.mImageSpeed;

        // A) parallax lag: portrait drifts at T.mImageSpeed x page speed (locked 1:1 to scroll)
        gsap.fromTo(
          wrapEl,
          { y: 0 },
          {
            y: () => (1 - T.mImageSpeed) * lagDist(),
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: stage, start: "top 70%", end: () => `+=${lagDist()}`,
              scrub: scrubT, invalidateOnRefresh: true,
            },
          }
        );

        // B) blur + page-colour fade clear as the portrait nears the top
        //    (capped radius: a static blur is cheap on the GPU, a huge one is not, on phones)
        const undoReveal = revealImage(
          "power2.in",
          { trigger: stage, start: "top 98%", end: () => `+=${1.16 * vh()}`, scrub: scrubT, invalidateOnRefresh: true },
          Math.min(T.mImageBlur, 28)
        );

        return () => { undoReveal(); };
      });

      // 4 ─ HEADLINE: per-line blur + opacity reveal.
      //     Desktop: starts later (top 60%) so line 1 becomes fully clear close to the middle of the viewport.
      //     Mobile: keeps original responsive timing (top 85%).
      const isMobile = () => window.innerWidth <= 1023;
      const wordEls = gsap.utils.toArray<HTMLElement>(head.querySelectorAll("[data-word]"));
      let headTl: gsap.core.Timeline | null = null;
      let blockTl: gsap.core.Timeline | null = null;

      const buildHeadline = () => {
        headTl?.scrollTrigger?.kill(true);
        headTl?.kill();
        const mobile = isMobile();
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: head,
            start: mobile ? "top 85%" : "top 60%",
            end: mobile ? "top 30%" : "top 18%",
            scrub: scrubT,
            invalidateOnRefresh: true,
          },
        });
        groupByLine(wordEls).forEach((line, i) => {
          const at = i * T.lineStagger;
          // opacity and blur are separate tweens so blur can be stepped on touch devices
          tl.fromTo(line, { opacity: 0 }, { opacity: 1, ease: "none", duration: 1 }, at);
          tl.fromTo(line, { filter: blur(T.textBlur) }, { filter: blur(0), ease: stepEase, duration: 1 }, at);
        });
        tl.eventCallback("onUpdate", () => setReveal(head, tl.progress()));
        setReveal(head, 0);
        headTl = tl;
      };

      // 5 ─ PARAGRAPH + INFO: one block, blur + opacity in
      //     Mobile: reveals only after the last line of the first paragraph is completely clear.
      //     Desktop: reveals with independent trigger in page flow.
      const buildParagraph = () => {
        blockTl?.scrollTrigger?.kill(true);
        blockTl?.kill();
        const mobile = isMobile();
        const st: ScrollTrigger.Vars = mobile
          ? {
              start: () => (headTl?.scrollTrigger ? headTl.scrollTrigger.end - 5 : "top 60%"),
              end: () => (headTl?.scrollTrigger ? headTl.scrollTrigger.end + 0.25 * vh() : "top 30%"),
              scrub: scrubT,
              invalidateOnRefresh: true,
            }
          : { trigger: block, start: "top 92%", end: "top 62%", scrub: scrubT };
        const tl = gsap.timeline({ scrollTrigger: st });
        tl.fromTo(block, { opacity: 0 }, { opacity: 1, ease: "none", duration: 1 }, 0);
        tl.fromTo(block, { filter: blur(T.paraBlur) }, { filter: blur(0), ease: stepEase, duration: 1 }, 0);
        tl.eventCallback("onUpdate", () => setReveal(block, tl.progress()));
        setReveal(block, 0);
        blockTl = tl;
      };

      const buildAll = () => {
        buildHeadline();
        buildParagraph();
      };
      buildAll();

      let alive = true;
      document.fonts?.ready.then(() => {
        if (!alive) return;
        buildAll();
        ScrollTrigger.refresh();
      });
      let lastW = head.offsetWidth;
      const ro = new ResizeObserver(() => {
        if (Math.abs(head.offsetWidth - lastW) > 1) {
          lastW = head.offsetWidth;
          buildAll();
          ScrollTrigger.refresh();
        }
      });
      ro.observe(head);

      return () => {
        alive = false;
        ro.disconnect();
        mm.revert();
        headTl?.scrollTrigger?.kill(true);
        headTl?.kill();
        blockTl?.scrollTrigger?.kill(true);
        blockTl?.kill();
        delete head.dataset.reveal;
        delete block.dataset.reveal;
      };
    },
    { scope: root }
  );

  const cssVars = {
    "--feather": `${T.featherVh}vh`,
    "--overlap": `${OVERLAP_VH}vh`,
    "--img-h": `${T.imageHeightVh}vh`,
    "--veil-from": T.imageVeilFrom,
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

      {/* portrait: sharp image + two pre-blurred copies that are cross-faded (opacity only) */}
      <div ref={rail} className={s.imageFixed}>
        <div ref={wrap} className={s.imageWrap}>
          <div ref={sharpRef} className={`${s.imageClip} ${s.imageSharp}`}>
            <Image src={about.image.src} alt={about.image.alt} fill priority
                   sizes="(max-width: 1023px) 90vw, 51vw" className={s.image} />
          </div>
          <div ref={midRef} className={`${s.imageClip} ${s.blurMid}`} aria-hidden="true">
            {/* blurred copies don't need full resolution: small, low-quality file = less decode + GPU memory */}
            <Image src={about.image.src} alt="" fill loading="eager" quality={40}
                   sizes="(max-width: 1023px) 40vw, 24vw" className={s.image} />
          </div>
          <div ref={heavyRef} className={`${s.imageClip} ${s.blurHeavy}`} aria-hidden="true">
            <Image src={about.image.src} alt="" fill loading="eager" quality={40}
                   sizes="(max-width: 1023px) 40vw, 24vw" className={s.image} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;