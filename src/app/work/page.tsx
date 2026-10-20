"use client";

import React, { useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Layers,
  Database,
  ExternalLink,
} from "lucide-react";
import {
  FEATURED_PROJECTS,
  SUPPORTING_PROJECTS,
  CONDITIONAL_SLOTS,
  LENS_DETAILS,
} from "@/data/portfolio-data";
import { Lens } from "@/types/portfolio";
import { PortfolioProjectCard } from "@/components/PortfolioProjectCard";

const ALL_LENSES: Lens[] = ["Build", "Ship", "Investigate", "Lead"];

export default function WorkPage() {
  const [activeLens, setActiveLens] = useState<string>("All");

  const filteredFeatured = FEATURED_PROJECTS.filter(
    (p) => activeLens === "All" || p.lens === activeLens
  );

  const filteredSupporting = SUPPORTING_PROJECTS.filter(
    (p) => activeLens === "All" || p.lens === activeLens
  );

  return (
    <div className="w-full min-h-screen pt-32 pb-24 px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[color:var(--text-primary)]">
          Work &amp; Systems.
        </h1>
        <p className="text-base sm:text-lg text-[color:var(--text-secondary)] mt-3 max-w-2xl font-medium leading-relaxed">
          I build intelligent systems you can inspect, ship them as complete products, and document the decisions behind them. No black boxes.
        </p>
      </div>

      {/* Lens Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-16 pb-6 border-b border-[color:var(--border)]">
        <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] mr-2 flex items-center gap-1.5">
          <Filter size={14} /> Filter by Lens:
        </span>
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => setActiveLens("All")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeLens === "All"
              ? "bg-[color:var(--text-primary)] text-[color:var(--background)] shadow-sm"
              : "bg-[color:var(--surface)] text-[color:var(--text-secondary)] border border-[color:var(--border)] hover:text-[color:var(--text-primary)]"
          }`}
        >
          All Lenses
        </button>

        {ALL_LENSES.map((lens) => {
          const info = LENS_DETAILS[lens];
          const isSelected = activeLens === lens;
          return (
            <button
              key={lens}
              type="button"
              suppressHydrationWarning
              onClick={() => setActiveLens(lens)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                isSelected
                  ? `${info.bgClass} ${info.textClass} border-current shadow-sm`
                  : "bg-[color:var(--surface)] text-[color:var(--text-secondary)] border-[color:var(--border)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              {lens}
            </button>
          );
        })}
      </div>

      {/* Tier 1: Featured Systems */}
      <section className="mb-20">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
            Tier 1
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--text-primary)] mt-1">
            Featured Systems
          </h2>
          <p className="text-xs text-[color:var(--text-secondary)] mt-1">
            Signature architectures with verified metrics and decision records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredFeatured.map((p, i) => (
            <div key={p.id} id={p.id}>
              <PortfolioProjectCard project={p} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* Tier 2: Supporting Work */}
      <section className="mb-20">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
            Tier 2
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--text-primary)] mt-1">
            Supporting Work
          </h2>
          <p className="text-xs text-[color:var(--text-secondary)] mt-1">
            Production web platforms, storefront engineering, and architectural prototypes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSupporting.map((item) => {
            const lensInfo = LENS_DETAILS[item.lens];
            return (
              <div
                key={item.id}
                id={item.id}
                className="p-6 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--text-secondary)]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${lensInfo.bgClass} ${lensInfo.textClass}`}
                    >
                      {item.lens}
                    </span>
                    <span className="text-[10px] font-mono text-[color:var(--text-secondary)]">
                      {item.timeframe}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[color:var(--text-primary)] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[color:var(--text-secondary)] mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[color:var(--border)]">
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[color:var(--background)] border border-[color:var(--border)] text-[color:var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tier 3: Archive Tier */}
      <section className="p-8 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
            Tier 3
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[color:var(--text-primary)] mt-1">
            Archive Tier
          </h2>
          <p className="text-xs text-[color:var(--text-secondary)] mt-1">
            Compact inventory of experiments, automation utilities, and earlier projects.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              year: "2025",
              title: "Semantic Gaussians Reading Analysis",
              role: "Research Investigation",
              lens: "Investigate",
              note: "Detailed architectural breakdown of semantic spatial queries in 3D representations.",
            },
            {
              year: "2024",
              title: "ACM Chapter Event Registration Bot",
              role: "Developer",
              lens: "Ship",
              note: "Automated verification bot handling multi-track submissions for hackathons.",
            },
            {
              year: "2024",
              title: "DSA & Graph Optimization Testbed",
              role: "Author",
              lens: "Build",
              note: "C++ and Python implementations of low-latency graph traversals and memory profiling.",
            },
          ].map((arch, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[color:var(--border)]/60 bg-[color:var(--background)] gap-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[color:var(--text-secondary)] font-bold">
                  {arch.year}
                </span>
                <span className="font-bold text-[color:var(--text-primary)]">
                  {arch.title}
                </span>
              </div>
              <span className="text-[color:var(--text-secondary)]">{arch.note}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
