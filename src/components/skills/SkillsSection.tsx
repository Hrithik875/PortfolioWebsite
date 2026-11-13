"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import FlowingMenu, { type FlowingMenuItem } from "./FlowingMenu";

export const SKILL_ITEMS: FlowingMenuItem[] = [
  {
    text: "Programming",
    images: [
      "/images/skills/programming/python.webp",
      "/images/skills/programming/typescript.webp",
      "/images/skills/programming/javascript.webp",
      "/images/skills/programming/cpp.webp",
      "/images/skills/programming/java.webp",
      "/images/skills/programming/sql.webp",
    ],
  },
  {
    text: "Machine Learning",
    images: [
      "/images/skills/machinelearning/pytorch.webp",
      "/images/skills/machinelearning/tensorflow.webp",
      "/images/skills/machinelearning/scikitlearn.webp",
      "/images/skills/machinelearning/numpy.webp",
      "/images/skills/machinelearning/pandas.webp",
      "/images/skills/machinelearning/matplotlib.webp",
      "/images/skills/machinelearning/seaborn.webp",
      "/images/skills/machinelearning/xgboost.webp",
      "/images/skills/machinelearning/mlflow.webp",
    ],
  },
  {
    text: "Generative AI",
    images: [
      "/images/skills/generativeai/openai.webp",
      "/images/skills/generativeai/groq.webp",
      "/images/skills/generativeai/langchain.webp",
      "/images/skills/generativeai/ollama.webp",
      "/images/skills/generativeai/huggingface.webp",
    ],
  },
  {
    text: "Web & Backend",
    images: [
      "/images/skills/webbackend/react.webp",
      "/images/skills/webbackend/nextjs.webp",
      "/images/skills/webbackend/nodejs.webp",
      "/images/skills/webbackend/fastapi.webp",
      "/images/skills/webbackend/flask.webp",
      "/images/skills/webbackend/tailwindcss.webp",
      "/images/skills/webbackend/framermotion.webp",
      "/images/skills/webbackend/vite.webp",
      "/images/skills/webbackend/html.webp",
      "/images/skills/webbackend/css.webp",
      "/images/skills/webbackend/shopify.webp",
    ],
  },
  {
    text: "Data & Databases",
    images: [
      "/images/skills/database/postgresql.webp",
      "/images/skills/database/mongodb.webp",
      "/images/skills/database/mysql.webp",
      "/images/skills/database/redis.webp",
      "/images/skills/database/qdrant.webp",
      "/images/skills/database/supabase.webp",
    ],
  },
  {
    text: "UI/UX Design",
    images: [
      "/images/skills/uiux/figma.webp",
      "/images/skills/uiux/framer.webp",
      "/images/skills/uiux/photoshop.webp",
      "/images/skills/uiux/canva.webp",
    ],
  },
  {
    text: "Engineering & DevOps",
    images: [
      "/images/skills/engineeringanddevops/docker.webp",
      "/images/skills/engineeringanddevops/aws.webp",
      "/images/skills/engineeringanddevops/git.webp",
      "/images/skills/engineeringanddevops/github.webp",
      "/images/skills/engineeringanddevops/githubactions.webp",
      "/images/skills/engineeringanddevops/cloudflare.webp",
      "/images/skills/engineeringanddevops/vercel.webp",
      "/images/skills/engineeringanddevops/apachekafka.webp",
      "/images/skills/engineeringanddevops/apachespark.webp",
      "/images/skills/engineeringanddevops/vscode.webp",
    ],
  },
];

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const RISE_DURATION = 1350;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

// ─── Inline styles for typography matching About section ───────────────────
// Note: font-size, font-weight, letter-spacing, line-height, white-space are
// driven by .skills-heading / .skills-paragraph CSS classes so that media queries
// control responsive sizing without inline specificity conflicts.
const headlineStyle: CSSProperties = {
  fontFamily: "var(--font-about-sans), 'Public Sans', 'Helvetica Neue', Arial, sans-serif",
  color: "rgb(var(--about-fg, 241, 241, 241))",
  margin: 0,
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
};

const italicAccentStyle: CSSProperties = {
  fontFamily: "var(--font-about-serif), 'Spectral', Georgia, serif",
  fontStyle: "italic",
  fontWeight: 600,
  fontSize: "1.05em",
  lineHeight: 1,
  letterSpacing: "-0.01em",
  color: "#d20c0c",
};

const paragraphStyle: CSSProperties = {
  fontFamily: "var(--font-about-sans), 'Public Sans', 'Helvetica Neue', Arial, sans-serif",
  fontWeight: 480,
  color: "rgb(var(--about-fg, 241, 241, 241))",
  margin: 0,
};

export function SkillsSection({ className = "" }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingClipRef = useRef<HTMLDivElement>(null);
  const headingInnerRef = useRef<HTMLHeadingElement>(null);
  const paraClipRef = useRef<HTMLDivElement>(null);
  const paraInnerRef = useRef<HTMLParagraphElement>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const [triggerMenuIntro, setTriggerMenuIntro] = useState(false);

  useIsoLayoutEffect(() => {
    const headingInner = headingInnerRef.current;
    const paraInner = paraInnerRef.current;
    const menuWrap = menuWrapRef.current;
    if (!headingInner || !paraInner || !menuWrap) return;

    const reduced = prefersReduced();

    if (reduced) {
      // Show everything immediately with no animation
      headingInner.style.transform = "translateY(0)";
      headingInner.style.opacity = "1";
      paraInner.style.transform = "translateY(0)";
      paraInner.style.opacity = "1";
      menuWrap.style.opacity = "1";
      menuWrap.style.filter = "blur(0px)";
      setTriggerMenuIntro(true);
      return;
    }

    // Pre-hide elements before viewport entry
    headingInner.style.transform = "translateY(110%)";
    headingInner.style.opacity = "0";
    paraInner.style.transform = "translateY(110%)";
    paraInner.style.opacity = "0";
    menuWrap.style.opacity = "0";
    menuWrap.style.filter = "blur(16px)";

    let played = false;
    let timers: number[] = [];

    const clearAllTimers = () => {
      timers.forEach(window.clearTimeout);
      timers = [];
    };

    const reset = () => {
      if (!played) return;
      played = false;
      clearAllTimers();
      setTriggerMenuIntro(false);

      headingInner.style.transition = "none";
      headingInner.style.transform = "translateY(110%)";
      headingInner.style.opacity = "0";

      paraInner.style.transition = "none";
      paraInner.style.transform = "translateY(110%)";
      paraInner.style.opacity = "0";

      menuWrap.style.transition = "none";
      menuWrap.style.opacity = "0";
      menuWrap.style.filter = "blur(16px)";
    };

    const play = () => {
      if (played) return;
      played = true;
      clearAllTimers();

      // Ensure elements start from pre-hidden state
      headingInner.style.transition = "none";
      headingInner.style.transform = "translateY(110%)";
      headingInner.style.opacity = "0";
      paraInner.style.transition = "none";
      paraInner.style.transform = "translateY(110%)";
      paraInner.style.opacity = "0";
      menuWrap.style.transition = "none";
      menuWrap.style.opacity = "0";
      menuWrap.style.filter = "blur(16px)";

      // Force reflow
      void headingInner.offsetHeight;

      // 1. Heading rises up at t=0
      headingInner.style.transition = `transform ${RISE_DURATION}ms ${EASE}, opacity ${RISE_DURATION}ms ${EASE}`;
      headingInner.style.transform = "translateY(0)";
      headingInner.style.opacity = "1";

      // 2. Paragraph rises up at t=150ms
      timers.push(
        window.setTimeout(() => {
          paraInner.style.transition = `transform ${RISE_DURATION}ms ${EASE}, opacity ${RISE_DURATION}ms ${EASE}`;
          paraInner.style.transform = "translateY(0)";
          paraInner.style.opacity = "1";
        }, 150)
      );

      // 3. FlowingMenu blurs in at t=450ms
      timers.push(
        window.setTimeout(() => {
          menuWrap.style.transition = `opacity 900ms ease, filter 900ms ease`;
          menuWrap.style.opacity = "1";
          menuWrap.style.filter = "blur(0px)";
        }, 450)
      );

      // 4. FlowingMenu's category headers animate and band sweeps at t=650ms
      timers.push(
        window.setTimeout(() => {
          setTriggerMenuIntro(true);
        }, 650)
      );
    };

    let rafId = 0;
    const check = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!headingClipRef.current) return;
        const rect = headingClipRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const isMobile = window.innerWidth < 1024;

        // Trigger threshold: 65% from bottom on desktop (y = 0.35 * vh), 58% from bottom on mobile (y = 0.42 * vh)
        const triggerY = isMobile ? vh * 0.42 : vh * 0.35;
        // Reset threshold: when element scrolls back down to bottom 25% (or off-screen)
        const resetY = vh * 0.75;

        if (rect.top <= triggerY && rect.bottom >= 0) {
          if (!played) {
            play();
          }
        } else if (rect.top > resetY) {
          if (played) {
            reset();
          }
        }
      });
    };

    // Initial check on mount
    check();

    // Listen to native scroll & resize
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });

    // Also listen to Lenis smooth scroll if present
    const win = window as unknown as {
      __lenis?: {
        on: (event: string, cb: () => void) => void;
        off: (event: string, cb: () => void) => void;
      };
    };
    win.__lenis?.on("scroll", check);

    return () => {
      cancelAnimationFrame(rafId);
      clearAllTimers();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      win.__lenis?.off("scroll", check);
    };
  }, []);

  return (
    <section
      id="skills"
      ref={sectionRef}
      className={`skills-section ${className}`}
    >
      {/* ── Layout wrapper: purely CSS-driven flex — NO inline flex overrides ── */}
      <div className="skills-layout">
        {/* ── LEFT PANEL: 35% desktop, full width mobile ── */}
        <div className="skills-left-panel">
          {/* Heading with overflow-hidden clip */}
          <div
            ref={headingClipRef}
            style={{ overflow: "hidden" }}
          >
            <h2
              ref={headingInnerRef}
              style={headlineStyle}
              className="skills-heading"
            >
              My{" "}
              <em style={italicAccentStyle}>Playground</em>
            </h2>
          </div>

          {/* Paragraph with overflow-hidden clip */}
          <div
            ref={paraClipRef}
            style={{ overflow: "hidden" }}
            className="skills-para-clip"
          >
            <p
              ref={paraInnerRef}
              style={paragraphStyle}
              className="skills-paragraph"
            >
              A collection of tools, technologies, and ideas I use to turn
              problems into practical solutions and concepts into meaningful
              experiences.
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: 65% desktop, full width mobile ── */}
        <div
          ref={menuWrapRef}
          className="skills-right-panel"
          style={{ position: "relative" }}
        >
          <FlowingMenu
            items={SKILL_ITEMS}
            speed={60}
            stretch={0.6}
            magnet={0.25}
            followCursor={0.4}
            direction="left"
            duration={0.5}
            bandInset={0}
            bandRadius={0}
            carryContent={false}
            dividers
            dimInactive={false}
            align="center"
            showIndex={false}
            showArrow={false}
            imageShape="pill"
            imageLayout="group"
            intro
            triggerIntro={triggerMenuIntro}
            ariaLabel="Skills"
            textColor="var(--text-primary)"
            bgColor="var(--background)"
            marqueeBgColor="var(--text-primary)"
            marqueeTextColor="var(--background)"
            borderColor="var(--border)"
          />
        </div>
      </div>
    </section>
  );
}

export default SkillsSection;
