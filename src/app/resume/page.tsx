"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download, FileText, CheckCircle2 } from "lucide-react";
import { PROFILE, EXPERIENCE_ITEMS, FEATURED_PROJECTS } from "@/data/portfolio-data";

export default function ResumePage() {
  return (
    <div className="w-full min-h-screen pt-32 pb-24 px-6 max-w-4xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-8 border-b border-[color:var(--border)]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[color:var(--text-primary)]">
            Resume.
          </h1>
          <p className="text-xs text-[color:var(--text-secondary)] mt-1 font-mono">
            Canonical public version · Updated October 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="mailto:hrithik.ml.eng@gmail.com?subject=Resume%20PDF%20Request"
            className="px-5 py-2.5 rounded-full bg-[color:var(--text-primary)] text-[color:var(--background)] font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* On-Page Readable Resume Document */}
      <div className="p-8 sm:p-12 rounded-[2.5rem] border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] space-y-10 shadow-2xl">
        {/* Identity & Header */}
        <div className="border-b border-[color:var(--border)] pb-8">
          <h2 className="text-3xl font-black tracking-tight text-[color:var(--text-primary)]">
            Hrithik M
          </h2>
          <p className="text-sm font-semibold text-[color:var(--text-secondary)] mt-1">
            Artificial Intelligence &amp; Machine Learning Engineer · BMSCE, Bengaluru
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--text-secondary)] mt-3 font-mono">
            <span>{PROFILE.email}</span>
            <span>·</span>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">
              LinkedIn
            </a>
            <span>·</span>
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="hover:underline">
              GitHub
            </a>
          </div>
        </div>

        {/* Education */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] mb-4">
            Education
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 text-xs">
              <div>
                <h4 className="font-bold text-sm text-[color:var(--text-primary)]">
                  B.E. in Artificial Intelligence and Machine Learning
                </h4>
                <p className="text-[color:var(--text-secondary)]">
                  BMS College of Engineering (BMSCE), Bengaluru
                </p>
              </div>
              <div className="sm:text-right font-mono">
                <span className="text-emerald-400 font-bold block">CGPA: 9.83</span>
                <span className="text-[color:var(--text-secondary)]">Graduating 2026</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 text-xs pt-2">
              <div>
                <h4 className="font-bold text-xs text-[color:var(--text-primary)]">
                  Pre-University Education
                </h4>
                <p className="text-[color:var(--text-secondary)]">Science &amp; Mathematics</p>
              </div>
              <div className="sm:text-right font-mono text-[color:var(--text-secondary)]">
                <span>97.33% †</span>
              </div>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] mb-4">
            Engagements &amp; Experience
          </h3>
          <div className="space-y-6">
            {EXPERIENCE_ITEMS.map((item) => (
              <div key={item.id} className="text-xs space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <h4 className="text-sm font-bold text-[color:var(--text-primary)]">
                    {item.engagement}
                  </h4>
                  <span className="font-mono text-[color:var(--text-secondary)]">
                    {item.timeframe}
                  </span>
                </div>
                <p className="font-semibold text-[color:var(--text-secondary)]">
                  {item.role} ({item.type})
                </p>
                <p className="text-[color:var(--text-secondary)] leading-relaxed">
                  {item.description}
                </p>
                <ul className="space-y-1 pt-1">
                  {item.highlights.map((h, i) => (
                    <li key={i} className="text-[11px] text-[color:var(--text-secondary)] flex items-start gap-2">
                      <span className="text-[color:var(--text-primary)] mt-0.5">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Selected Systems & Projects */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] mb-4">
            Featured Systems
          </h3>
          <div className="space-y-5">
            {FEATURED_PROJECTS.map((proj) => (
              <div key={proj.id} className="text-xs space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <h4 className="text-sm font-bold text-[color:var(--text-primary)]">
                    {proj.title} <span className="font-normal text-[color:var(--text-secondary)]">({proj.hook})</span>
                  </h4>
                  <span className="font-mono text-[color:var(--text-secondary)]">
                    {proj.timeframe}
                  </span>
                </div>
                <p className="text-[color:var(--text-secondary)] leading-relaxed">
                  {proj.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                  {proj.receipts.map((r) => (
                    <span key={r.id} className="px-2 py-0.5 rounded border border-[color:var(--border)] bg-[color:var(--background)]">
                      {r.metric} {r.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Competencies */}
        <section className="pt-2 border-t border-[color:var(--border)]">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] mb-4">
            Technical Stack
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-[color:var(--text-primary)] block mb-1">
                AI/ML &amp; Systems
              </span>
              <p className="text-[color:var(--text-secondary)] leading-relaxed">
                Python, PyTorch, Scikit-Learn, Kafka, Apache Spark, Vector Databases, BM25, Cross-Encoders, RAG, SMOTE.
              </p>
            </div>
            <div>
              <span className="font-bold text-[color:var(--text-primary)] block mb-1">
                Web &amp; Infrastructure
              </span>
              <p className="text-[color:var(--text-secondary)] leading-relaxed">
                TypeScript, Next.js, React, TailwindCSS, FastAPI, Flask, PostgreSQL, Docker, Cloudflare, Linux.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
