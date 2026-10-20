"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, ShieldCheck, Briefcase } from "lucide-react";
import { EXPERIENCE_ITEMS, LENS_DETAILS } from "@/data/portfolio-data";

export default function ExperiencePage() {
  return (
    <div className="w-full min-h-screen pt-32 pb-24 px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] block mb-1">
          Career Engagements &amp; Timeline
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[color:var(--text-primary)]">
          Experience.
        </h1>
        <p className="text-base sm:text-lg text-[color:var(--text-secondary)] mt-3 max-w-2xl font-medium leading-relaxed">
          Structured by engagement type: programs, technical internships, research collaborations, and student appointments. With a strict boundary between personal deliverables and team accomplishments.
        </p>
      </div>

      {/* Engagements Timeline */}
      <div className="space-y-8">
        {EXPERIENCE_ITEMS.map((item, idx) => {
          const lensInfo = LENS_DETAILS[item.lens];
          return (
            <div
              key={item.id}
              className="p-8 sm:p-10 rounded-[2.5rem] border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--text-secondary)]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${lensInfo.bgClass} ${lensInfo.textClass}`}
                    >
                      {item.type}
                    </span>
                    <span className="text-xs text-[color:var(--text-secondary)]">
                      Lens: {item.lens}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-[color:var(--text-secondary)]">
                    {item.timeframe}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--text-primary)] mb-1">
                  {item.engagement}
                </h2>
                <p className="text-sm font-semibold text-[color:var(--text-secondary)] mb-4">
                  {item.role}
                </p>

                <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed mb-6 font-normal">
                  {item.description}
                </p>

                <div className="space-y-2 mb-6">
                  {item.highlights.map((h, i) => (
                    <div key={i} className="text-xs text-[color:var(--text-secondary)] flex items-start gap-2.5">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-[color:var(--text-primary)]/70" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {item.link && (
                <div className="pt-4 border-t border-[color:var(--border)]">
                  <Link
                    href={item.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--text-primary)] hover:opacity-75 transition-opacity"
                  >
                    <span>View associated case study / methodology</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
