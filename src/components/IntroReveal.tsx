"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { useIntro } from "@/context/IntroContext";
import "./IntroReveal.css";

export function IntroReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { introDone, setIntroDone, shouldRunIntro } = useIntro();
  const [isFinished, setIsFinished] = useState(() => {
    if (typeof window !== "undefined" && window.location.search.includes("test_intro=1")) {
      return false;
    }
    return introDone || !shouldRunIntro;
  });

  useEffect(() => {
    const isTestMode =
      typeof window !== "undefined" && window.location.search.includes("test_intro=1");

    // If intro is not supposed to run or is already done, mark finished immediately
    if (!isTestMode && (introDone || !shouldRunIntro)) {
      setIsFinished(true);
      return;
    }

    // Respect prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIntroDone(true);
      setIsFinished(true);
      return;
    }

    let isCancelled = false;
    let ctx: gsap.Context | null = null;

    const runTimeline = async () => {
      // 1. Wait for document fonts to settle (fast 250ms ceiling so animation starts immediately)
      try {
        if (typeof document !== "undefined" && document.fonts) {
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 250)),
          ]);
        }
      } catch {
        // Fallback: proceed even if font promise rejected
      }

      if (isCancelled || !containerRef.current) return;

      // 2. Register plugins and create hop ease
      gsap.registerPlugin(CustomEase, SplitText);
      CustomEase.create("hop", ".8, 0, .3, 1");

      ctx = gsap.context(() => {
        const root = containerRef.current;
        if (!root) return;

        const splitTextElements = (
          selector: string,
          type = "words,chars",
          addFirstChar = false
        ) => {
          const elements = root.querySelectorAll(selector);
          elements.forEach((element) => {
            const splitText = new SplitText(element, {
              type,
              wordsClass: "word",
              charsClass: "char",
            });

            if (type.includes("chars")) {
              splitText.chars.forEach((char, index) => {
                const originalText = char.textContent;
                char.innerHTML = `<span>${originalText}</span>`;

                if (addFirstChar && index === 0) {
                  char.classList.add("first-char");
                }
              });
            }
          });
        };

        // Split text matching index.js exactly
        splitTextElements(".intro-title h1", "words, chars", true);
        splitTextElements(".outro-title h1");
        splitTextElements(".tag p", "words");
        splitTextElements(".card h1", "words, chars", true);

        // Recompute isMobile on load/mount
        const isMobile = window.innerWidth <= 1000;
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

        // 1. Single source of truth font sizes
        // M's final size from existing rem values (14rem desktop, 6rem mobile)
        const M_SIZE = (isMobile ? 6 : 14) * rem;
        const H_SIZE = M_SIZE / 2;

        // Base untransformed font size of H in .intro-title h1
        const H_START_SIZE = (isMobile ? 2.5 : 6) * rem;
        const H_SCALE = H_SIZE / H_START_SIZE;

        // 2. Measure DM Sans 700 with canvas measureText
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let mWidth = M_SIZE * 0.85;
        let mAscent = M_SIZE * 0.72;
        let mFontAscent = M_SIZE * 0.85;

        let hWidth = H_SIZE * 0.72;
        let hAscent = H_SIZE * 0.72;
        let hFontAscent = H_SIZE * 0.85;

        // In DM Sans Bold (700), stem thickness is ~11.5% of font size
        let mStemThickness = M_SIZE * 0.115;

        if (ctx) {
          ctx.font = `700 ${M_SIZE}px "DM Sans", sans-serif`;
          const mMetrics = ctx.measureText("M");
          mWidth = mMetrics.width;
          mAscent = mMetrics.actualBoundingBoxAscent;
          mFontAscent = mMetrics.fontBoundingBoxAscent || mAscent;

          ctx.font = `700 ${H_SIZE}px "DM Sans", sans-serif`;
          const hMetrics = ctx.measureText("H");
          hWidth = hMetrics.width;
          hAscent = hMetrics.actualBoundingBoxAscent;
          hFontAscent = hMetrics.fontBoundingBoxAscent || hAscent;

          // Measure DM Sans 700 'M' stem thickness directly via offscreen canvas
          try {
            const cSize = Math.ceil(M_SIZE);
            canvas.width = cSize;
            canvas.height = cSize;
            ctx.font = `700 ${M_SIZE}px "DM Sans", sans-serif`;
            ctx.fillStyle = "black";
            ctx.textBaseline = "top";
            ctx.fillText("M", 0, 0);

            const imgData = ctx.getImageData(0, 0, cSize, cSize);
            const sampleY = Math.floor(mAscent * 0.5);
            let startX = -1;
            let endX = -1;
            for (let x = 0; x < cSize; x++) {
              const alpha = imgData.data[(sampleY * cSize + x) * 4 + 3];
              if (alpha > 128 && startX === -1) {
                startX = x;
              } else if (alpha <= 128 && startX !== -1) {
                endX = x;
                break;
              }
            }
            if (startX !== -1 && endX !== -1 && endX > startX) {
              mStemThickness = endX - startX;
            }
          } catch {
            // Fallback: DM Sans 700 stem thickness is ~11.5% of font size
          }
        }

        // Gap should always be 25% of the font weight or thickness of the letter M
        const gap = 0.25 * mStemThickness;
        const totalLockupWidth = hWidth + gap + mWidth;

        // Horizontally center the lockup in viewport
        const lockupLeft = (window.innerWidth - totalLockupWidth) / 2;
        const targetHLeft = lockupLeft;
        const targetMLeft = lockupLeft + hWidth + gap;

        // M's horizontal center is invariant under font-size scaling because .outro-title is centered on its position
        const outroOffsetRem = isMobile ? 4 : 10;
        const targetMCenter = targetMLeft + mWidth / 2;
        const naturalMCenter = window.innerWidth / 2 + outroOffsetRem * rem;
        const finalX_M = targetMCenter - naturalMCenter;

        // Measure H's natural untransformed position
        const hCharElem = root.querySelector<HTMLElement>(".preloader .intro-title .first-char");
        const hRect = hCharElem?.getBoundingClientRect();
        const hNaturalLeft = hRect && hRect.width > 0 ? hRect.left : window.innerWidth / 2 - 100;
        const finalX_H = targetHLeft - hNaturalLeft;

        // Vertical alignment: Top of H = Top of M
        // M's line box is centered at viewport 50%.
        // Distance from top of M's line box to M's cap height is (mFontAscent - mAscent).
        // H's unscaled line box is also centered at 50%.
        // When scaled by H_SCALE with transform-origin: top left,
        // distance from top of H's box to H's cap height is (hFontAscent - hAscent).
        const finalY_H = (H_START_SIZE - M_SIZE) / 2 + (mFontAscent - mAscent) - (hFontAscent - hAscent);

        // Keep existing pull-apart movement (+3rem on desktop, +1rem on mobile)
        const pullApartDelta = (isMobile ? 1.0 : 3.0) * rem;
        const pullApartX_H = finalX_H + pullApartDelta;

        // Initial positions for split-overlay (identical to preloader final state)
        gsap.set(
          [
            ".split-overlay .intro-title .first-char span",
            ".split-overlay .outro-title .char span",
          ],
          { y: "0%" }
        );

        gsap.set(".split-overlay .intro-title .first-char", {
          x: finalX_H,
          y: finalY_H,
          scale: H_SCALE,
          force3D: true,
        });

        gsap.set(".split-overlay .outro-title .char", {
          x: finalX_M,
          fontSize: `${M_SIZE}px`,
          force3D: true,
        });

        // SplitText and initial transform states are prepared; reveal typography
        root.classList.add("is-ready");

        const tl = gsap.timeline({
          defaults: { ease: "hop" },
          onComplete: () => {
            // Unmount preloader, unlock scroll, notify app
            setIsFinished(true);
            setIntroDone(true);
            if (typeof window !== "undefined") {
              window.scrollTo(0, 0);
            }
          },
        });

        const tags = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".tag"));

        tags.forEach((tag, index) => {
          tl.to(
            tag.querySelectorAll("p .word"),
            {
              y: "0%",
              duration: 0.75,
            },
            0.5 + index * 0.1
          );
        });

        tl.to(
          ".preloader .intro-title .char span",
          {
            y: "0%",
            duration: 0.75,
            stagger: 0.05,
          },
          0.5
        )
          .to(
            ".preloader .intro-title .char:not(.first-char) span",
            {
              y: "100%",
              duration: 0.75,
              stagger: 0.05,
            },
            2
          )
          .to(
            ".preloader .outro-title .char span",
            {
              y: "0%",
              duration: 0.75,
              stagger: 0.075,
            },
            2.5
          )
          .to(
            ".preloader .intro-title .first-char",
            {
              x: pullApartX_H,
              duration: 1,
              force3D: true,
            },
            3.5
          )
          .to(
            ".preloader .outro-title .char",
            {
              x: finalX_M,
              duration: 1,
              force3D: true,
            },
            3.5
          )
          .to(
            ".preloader .intro-title .first-char",
            {
              x: finalX_H,
              y: finalY_H,
              scale: H_SCALE,
              duration: 0.75,
              force3D: true,
            },
            4.5
          )
          .to(
            ".preloader .outro-title .char",
            {
              x: finalX_M,
              fontSize: `${M_SIZE}px`,
              duration: 0.75,
              autoRound: false,
              force3D: true,
              onComplete: () => {
                gsap.set(".preloader", {
                  clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
                });
                gsap.set(".split-overlay", {
                  clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
                });
              },
            },
            4.5
          )
          .to(
            ".container",
            {
              clipPath: "polygon(0% 48%, 100% 48%, 100% 52%, 0% 52%)",
              duration: 1,
            },
            5
          );

        tags.forEach((tag, index) => {
          tl.to(
            tag.querySelectorAll("p .word"),
            {
              y: "100%",
              duration: 0.75,
            },
            5.5 + index * 0.1
          );
        });

        tl.to(
          [".preloader", ".split-overlay"],
          {
            y: (i: number) => (i === 0 ? "-50%" : "50%"),
            duration: 1,
          },
          6
        )
          .to(
            ".container",
            {
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
              duration: 1,
            },
            6
          )
          .to(
            ".container .card",
            {
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
              duration: 0.75,
            },
            6.25
          )
          .to(
            ".container .card h1 .char span",
            {
              y: "0%",
              duration: 0.75,
              stagger: 0.05,
            },
            6.5
          );
      }, containerRef);
    };

    runTimeline();

    return () => {
      isCancelled = true;
      if (containerRef.current) {
        containerRef.current.classList.remove("is-ready");
      }
      if (ctx) {
        ctx.revert();
      }
    };
  }, [introDone, shouldRunIntro, setIntroDone]);

  const handleScrollDown = () => {
    const homeEl = document.getElementById("home");
    if (homeEl) {
      homeEl.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`intro-reveal ${isFinished ? "is-done" : "is-animating"}`}
      aria-label="Introduction Reveal"
    >
      {/* Strict preloader overlays: completely unmounted when timeline completes */}
      {!isFinished && (
        <>
          <div className="preloader">
            <div className="intro-title">
              <h1>HRITHIK M</h1>
            </div>
            <div className="outro-title">
              <h1>M</h1>
            </div>
          </div>

          <div className="split-overlay">
            <div className="intro-title">
              <h1>HRITHIK M</h1>
            </div>
            <div className="outro-title">
              <h1>M</h1>
            </div>
          </div>

          <div className="tags-overlay">
            <div className="tag tag-1">
              <p>Retrieval</p>
            </div>
            <div className="tag tag-2">
              <p>Streaming ML</p>
            </div>
            <div className="tag tag-3">
              <p>Evaluation</p>
            </div>
          </div>
        </>
      )}

      {/* Hero View: revealed by the preloader, then remains as the top hero section */}
      <div className="container">
        <div className="hero-img">
          <img src="/intro-hero.jpg" alt="Hrithik Intro Hero" />
        </div>

        <div className="card">
          <h1>Portfolio</h1>
        </div>

        <footer>
          <button
            type="button"
            onClick={handleScrollDown}
            className="scroll-down-btn"
            aria-label="Scroll down to content"
          >
            <p>Scroll Down</p>
          </button>
          <p>AI/ML Engineer</p>
        </footer>
      </div>
    </div>
  );
}

export default IntroReveal;
