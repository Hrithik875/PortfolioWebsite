"use client";

import React, { useRef, useEffect, useState } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
  Briefcase,
  Users,
  Compass,
  Layers,
  FlaskConical,
  GraduationCap,
  Award,
} from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedScroll";
import { Magnetic } from "@/components/Magnetic";
import { ReadyToArchitect } from "@/components/CTA";
import { PortfolioProjectCard } from "@/components/PortfolioProjectCard";
import WhatIfEditor from "@/components/WhatIfEditor";
import {
  PROFILE,
  PROOF_STRIP,
  START_HERE_PATHS,
  FEATURED_PROJECTS,
  CONDITIONAL_SLOTS,
  EXPERIENCE_ITEMS,
  LEADERSHIP_ITEMS,
  LENS_DETAILS,
} from "@/data/portfolio-data";

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2, 0.28], [1, 1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2, 0.28], [1, 1, 0.98]);

  return (
    <div
      className="w-full relative min-h-screen flex flex-col items-center overflow-x-hidden pt-0"
      ref={containerRef}
    >
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. IDENTITY & POSITIONING (HERO) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <m.section
        id="home"
        style={isDesktop ? { opacity: heroOpacity, scale: heroScale } : undefined}
        className="min-h-[92vh] flex flex-col items-center justify-center pt-28 pb-16 px-4 w-full max-w-5xl mx-auto text-center z-10"
      >
        <AnimatedSection delay={0.1}>
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[color:var(--border)] text-[0.7rem] font-bold uppercase tracking-widest bg-[color:var(--surface)]/50 backdrop-blur-md text-[color:var(--text-secondary)]">
            <Sparkles size={12} className="text-[color:var(--text-primary)]" />
            <span>AI/ML Engineering &amp; Evaluation · BMSCE</span>
          </div>
        </AnimatedSection>

        <div className="mb-8 text-[min(11vw,5.5rem)] leading-[1.08] font-black tracking-[-0.04em] text-[color:var(--text-primary)] relative">
          <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[color:var(--text-primary)]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

          <h1 className="flex flex-col items-center">
            <span className="block overflow-hidden h-[1.2em] -mb-[0.1em]">
              <span className="block hero-rise">I build AI systems</span>
            </span>
            <span className="block overflow-hidden h-[1.2em]">
              <span className="block text-[color:var(--text-secondary)] hero-rise-delay">
                you can inspect.
              </span>
            </span>
          </h1>
        </div>

        <AnimatedSection delay={0.2} className="max-w-2xl mx-auto">
          <p className="text-lg sm:text-xl text-[color:var(--text-primary)] font-semibold leading-relaxed tracking-tight mb-4">
            {PROFILE.subhead}
          </p>
          <p className="text-sm sm:text-base text-[color:var(--text-secondary)] font-medium leading-relaxed tracking-tight">
            {PROFILE.identityLine}
          </p>
        </AnimatedSection>

        {/* Actions & Availability */}
        <AnimatedSection delay={0.35} className="mt-10 flex flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Magnetic>
              <Link
                href="#work"
                className="px-8 py-4 rounded-full text-[color:var(--background)] bg-[color:var(--primary)] font-bold text-sm hover:invert transition-all flex items-center justify-center gap-2.5 shadow-2xl active:scale-95"
              >
                View my work <ArrowRight size={16} />
              </Link>
            </Magnetic>

            <Magnetic>
              <Link
                href="/resume"
                className="px-8 py-4 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] font-bold text-sm text-[color:var(--text-primary)] hover:border-[color:var(--text-primary)] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                Resume (PDF) <ArrowUpRight size={16} />
              </Link>
            </Magnetic>
          </div>

          <p className="text-xs font-semibold text-[color:var(--text-secondary)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{PROFILE.availabilityLine}</span>
          </p>
        </AnimatedSection>
      </m.section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. START-HERE PATHS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="paths" className="w-full py-20 px-6 max-w-6xl mx-auto z-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
            Curated Routes
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mt-2 text-[color:var(--text-primary)]">
            Four ways in.
          </h2>
          <p className="text-sm sm:text-base text-[color:var(--text-secondary)] mt-2">
            Depending on what you want to know. Each stop links directly to the canonical evidence.
          </p>
        </div>

        {/* 2x2 Grid for Path Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {START_HERE_PATHS.map((path, idx) => {
            const lensInfo = LENS_DETAILS[path.lens];
            return (
              <m.div
                key={path.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5% 0px" }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--text-secondary)]/50 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)]">
                      For the {path.audience}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${lensInfo.bgClass} ${lensInfo.textClass}`}
                    >
                      Lens: {path.lens}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-[color:var(--text-primary)] mb-2 tracking-tight">
                    {path.line}
                  </h3>

                  <div className="mt-6 space-y-3">
                    {path.stops.map((stop, sIdx) => (
                      <Link
                        key={sIdx}
                        href={stop.href}
                        className="block p-3 rounded-xl border border-[color:var(--border)]/70 bg-[color:var(--background)] hover:border-[color:var(--text-primary)] transition-all group/stop"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[color:var(--text-primary)] group-hover/stop:translate-x-0.5 transition-transform">
                            {stop.title}
                          </span>
                          <ArrowRight size={14} className="text-[color:var(--text-secondary)] group-hover/stop:text-[color:var(--text-primary)]" />
                        </div>
                        <p className="text-xs text-[color:var(--text-secondary)] mt-1">
                          {stop.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. STRONGEST EVIDENCE & FEATURED WORK */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="work" className="w-full py-20 px-6 max-w-6xl mx-auto z-20">
        {/* Proof Strip */}
        <div id="proof" className="mb-20">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
              Verifiable Metrics
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-1 text-[color:var(--text-primary)]">
              The Proof Strip
            </h2>
            <p className="text-xs sm:text-sm text-[color:var(--text-secondary)] mt-1">
              Every number links to its receipt. Click any card to inspect measurement conditions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {PROOF_STRIP.map((item) => {
              const isSelected = selectedReceipt === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSelectedReceipt(isSelected ? null : item.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-[color:var(--text-primary)] bg-[color:var(--text-primary)]/10 shadow-md"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--text-secondary)]/50"
                  }`}
                >
                  <p className="text-xl sm:text-2xl font-black text-[color:var(--text-primary)] tracking-tight">
                    {item.metric}
                  </p>
                  <p className="text-xs font-semibold text-[color:var(--text-secondary)] mt-1 line-clamp-1">
                    {item.label}
                  </p>
                  <span className="inline-block mt-2 text-[10px] text-[color:var(--text-secondary)] underline decoration-dotted">
                    {isSelected ? "Hide receipt" : "Inspect receipt"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Expanded Receipt Viewer */}
          {selectedReceipt && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-5 rounded-2xl border border-[color:var(--text-primary)]/30 bg-[color:var(--surface)] text-sm max-w-2xl mx-auto"
            >
              {(() => {
                const item = PROOF_STRIP.find((p) => p.id === selectedReceipt);
                if (!item) return null;
                return (
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[color:var(--border)] mb-3">
                      <span className="font-bold text-[color:var(--text-primary)]">
                        Receipt: {item.metric} {item.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {item.status === "confirmed" ? "Verified" : "Unverified †"}
                      </span>
                    </div>
                    <p className="text-xs text-[color:var(--text-secondary)] mb-2">
                      <strong className="text-[color:var(--text-primary)]">Context:</strong> {item.context}
                    </p>
                    <p className="text-xs text-[color:var(--text-secondary)] mb-3">
                      <strong className="text-[color:var(--text-primary)]">Methodology:</strong> {item.method}
                    </p>
                    <Link
                      href={item.link || "/work"}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[color:var(--text-primary)] underline"
                    >
                      <span>Jump to full case study</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                );
              })()}
            </m.div>
          )}
        </div>

        {/* Featured Projects Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
              Signature Work
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[color:var(--text-primary)] mt-1">
              Featured Systems
            </h2>
          </div>
          <Link
            href="/work"
            className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors flex items-center gap-1.5"
          >
            <span>Complete Catalogue ({FEATURED_PROJECTS.length + 4} Projects)</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* 4 Flagship Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {FEATURED_PROJECTS.map((project, idx) => (
            <PortfolioProjectCard key={project.id} project={project} index={idx} />
          ))}
        </div>

        {/* Two Conditional Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Research Slot: Samsung PRISM */}
          <div className="p-8 rounded-[2.5rem] border border-[color:var(--cag-border)] bg-[color:var(--surface)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold border bg-amber-950/60 border-amber-500/30 text-amber-400">
                  Lens: {CONDITIONAL_SLOTS.research.lens} (Research Slot)
                </span>
                <span className="text-[11px] font-semibold text-[color:var(--text-secondary)] border border-[color:var(--border)] px-2 py-0.5 rounded-full">
                  {CONDITIONAL_SLOTS.research.status}
                </span>
              </div>

              <h3 className="text-2xl font-black text-[color:var(--text-primary)] mb-1">
                {CONDITIONAL_SLOTS.research.title}
              </h3>
              <p className="text-xs text-amber-400 font-semibold mb-3">
                {CONDITIONAL_SLOTS.research.subtitle}
              </p>
              <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed mb-6">
                {CONDITIONAL_SLOTS.research.description}
              </p>

              <ul className="space-y-2 mb-6">
                {CONDITIONAL_SLOTS.research.highlights.map((h, i) => (
                  <li key={i} className="text-xs text-[color:var(--text-secondary)] flex items-start gap-2">
                    <FlaskConical size={14} className="shrink-0 mt-0.5 text-amber-400" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={CONDITIONAL_SLOTS.research.link}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--text-primary)] hover:opacity-75 transition-opacity pt-4 border-t border-[color:var(--border)]"
            >
              <span>Read research methodology</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Currently Building Slot: AI ERP Assistant */}
          <div className="p-8 rounded-[2.5rem] border border-[color:var(--finetuning-border)] bg-[color:var(--surface)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold border bg-blue-950/60 border-blue-500/30 text-blue-400">
                  Lens: {CONDITIONAL_SLOTS.currentlyBuilding.lens} (Currently Building)
                </span>
                <span className="text-[11px] font-semibold text-[color:var(--text-secondary)] border border-[color:var(--border)] px-2 py-0.5 rounded-full">
                  {CONDITIONAL_SLOTS.currentlyBuilding.status}
                </span>
              </div>

              <h3 className="text-2xl font-black text-[color:var(--text-primary)] mb-1">
                {CONDITIONAL_SLOTS.currentlyBuilding.title}
              </h3>
              <p className="text-xs text-blue-400 font-semibold mb-3">
                {CONDITIONAL_SLOTS.currentlyBuilding.subtitle}
              </p>
              <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed mb-6">
                {CONDITIONAL_SLOTS.currentlyBuilding.description}
              </p>

              <ul className="space-y-2 mb-6">
                {CONDITIONAL_SLOTS.currentlyBuilding.highlights.map((h, i) => (
                  <li key={i} className="text-xs text-[color:var(--text-secondary)] flex items-start gap-2">
                    <Layers size={14} className="shrink-0 mt-0.5 text-blue-400" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={CONDITIONAL_SLOTS.currentlyBuilding.link}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--text-primary)] hover:opacity-75 transition-opacity pt-4 border-t border-[color:var(--border)]"
            >
              <span>View architectural roadmap</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. ONE DEMONSTRATION (ARCHGUIDE WHAT-IF) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="demo" className="w-full py-20 px-6 max-w-6xl mx-auto z-20">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
            Touchable Proof
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[color:var(--text-primary)] mt-1">
            One Demonstration
          </h2>
          <p className="text-sm text-[color:var(--text-secondary)] max-w-xl mx-auto mt-2">
            ArchGuide What-If: Change one requirement and watch the ranking and its cost estimate change.
          </p>
        </div>

        <WhatIfEditor />
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. EXPERIENCE & LEADERSHIP */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="experience" className="w-full py-20 px-6 max-w-6xl mx-auto z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Experience Rail */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
                Timeline
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[color:var(--text-primary)] mt-1">
                Experience Rail
              </h2>
            </div>

            <div className="space-y-6">
              {EXPERIENCE_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--text-secondary)]/50 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-[color:var(--text-primary)]">
                      {item.engagement}
                    </h3>
                    <span className="text-xs font-mono text-[color:var(--text-secondary)]">
                      {item.timeframe}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[color:var(--text-secondary)] mb-3 flex items-center gap-2">
                    <span>{item.role}</span>
                    <span>·</span>
                    <span className="text-[color:var(--text-primary)]">{item.type}</span>
                  </p>

                  <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <ul className="space-y-1.5">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="text-[11px] text-[color:var(--text-secondary)] flex items-start gap-2">
                        <CheckCircle2 size={12} className="shrink-0 mt-0.5 text-[color:var(--text-primary)]/70" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Leadership & Education Rail */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
                Community Impact
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[color:var(--text-primary)] mt-1">
                Leadership
              </h2>
            </div>

            <div className="space-y-5">
              {LEADERSHIP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl border border-[color:var(--hybrid-border)] bg-[color:var(--surface)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-bold text-[color:var(--text-primary)]">
                      {item.title}
                    </h4>
                    {item.metric && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-400">
                        {item.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[color:var(--text-secondary)] mb-2">
                    {item.role} ({item.timeframe})
                  </p>
                  <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Compact Education Line */}
            <div className="p-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] mb-3 flex items-center gap-2">
                <GraduationCap size={16} className="text-[color:var(--text-primary)]" />
                <span>Education &amp; Academic Standing</span>
              </h4>
              <p className="text-xs text-[color:var(--text-primary)] font-semibold leading-relaxed">
                {PROFILE.education}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 6. CLOSING & CONTACT (CTA WITH 3D PARTICLES) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <ReadyToArchitect />
    </div>
  );
}