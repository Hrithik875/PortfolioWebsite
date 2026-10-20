"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Users, Trophy, Globe, Code2, CheckCircle2 } from "lucide-react";
import { LEADERSHIP_ITEMS, LENS_DETAILS } from "@/data/portfolio-data";

export default function LeadershipPage() {
  const leadLens = LENS_DETAILS.Lead;

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
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${leadLens.bgClass} ${leadLens.textClass}`}>
            Lens: Lead
          </span>
          <span className="text-xs text-[color:var(--text-secondary)]">Community &amp; Organizational Impact</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[color:var(--text-primary)]">
          Leadership.
        </h1>
        <p className="text-base sm:text-lg text-[color:var(--text-secondary)] mt-3 max-w-2xl font-medium leading-relaxed">
          I contribute to technical communities through both engineering and organization: running web platforms as real products, scaling developer sprints, and coordinating cross-functional teams.
        </p>
      </div>

      {/* Featured Anchor: BMSCE ACM Student Chapter */}
      <section className="mb-16 p-8 sm:p-10 rounded-[2.5rem] border border-[color:var(--hybrid-border)] bg-[color:var(--surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            Primary Leadership Appointment
          </span>
          <span className="text-xs font-mono text-[color:var(--text-secondary)] font-bold">
            2024 – Present
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-[color:var(--text-primary)] mb-2 tracking-tight">
          Webmaster &amp; Technical Head
        </h2>
        <p className="text-sm font-semibold text-[color:var(--text-secondary)] mb-6">
          BMSCE ACM Student Chapter
        </p>

        <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed mb-6 font-normal">
          Directing all digital engineering, website operations, and developer enablement. Built the chapter website and treated it not as a static brochure, but as an actively maintained product supporting hackathon registrations, student showcases, and recruitment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]">
            <span className="text-xs text-[color:var(--text-secondary)] font-semibold block mb-1">
              Performance Overhaul
            </span>
            <p className="text-lg font-black text-red-400">
              15-20 s → ~875 ms †
            </p>
            <p className="text-xs text-[color:var(--text-secondary)] mt-1">
              Median page load reduction after Cloudflare edge migration and bundle optimization.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]">
            <span className="text-xs text-[color:var(--text-secondary)] font-semibold block mb-1">
              Team Coordination
            </span>
            <p className="text-lg font-black text-[color:var(--text-primary)]">
              Cross-Functional
            </p>
            <p className="text-xs text-[color:var(--text-secondary)] mt-1">
              Coordinating designers and frontend contributors for flagship events and recruitment drives.
            </p>
          </div>
        </div>

        <Link
          href="/work#acm-platform"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--text-primary)] hover:opacity-75 transition-opacity pt-2"
        >
          <span>Examine chapter website case study</span>
          <ArrowUpRight size={14} />
        </Link>
      </section>

      {/* Major Initiatives Grid */}
      <section className="mb-16">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] mb-6">
          Flagship Initiatives &amp; Coordination
        </h3>

        <div className="space-y-6">
          {LEADERSHIP_ITEMS.map((item) => (
            <div
              key={item.id}
              id={item.id}
              className="p-8 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--hybrid-border)] transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-2xl font-black text-[color:var(--text-primary)]">
                  {item.title}
                </h4>
                {item.metric && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-400">
                    {item.metric}
                  </span>
                )}
              </div>

              <p className="text-xs font-bold text-[color:var(--text-secondary)] mb-4">
                {item.role} · {item.timeframe}
              </p>

              <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed mb-4">
                {item.description}
              </p>

              <div className="space-y-1.5">
                {item.highlights.map((h, i) => (
                  <div key={i} className="text-xs text-[color:var(--text-secondary)] flex items-start gap-2">
                    <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-red-400" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Summits & Regional Roles Timeline */}
      <section className="p-8 rounded-[2.5rem] border border-[color:var(--border)] bg-[color:var(--surface)]">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] mb-6">
          Summits &amp; Regional Representation
        </h3>

        <div className="space-y-4">
          {[
            {
              event: "ACM India Annual Summit, IIT Hyderabad †",
              role: "Student Chapter Delegate & Participant",
              timeframe: "2025",
              scope: "Engaged in national panels on computing education and student leadership initiatives.",
            },
            {
              event: "ACM India Chapter Summit †",
              role: "Senior Coordinator",
              timeframe: "2025",
              scope: "Coordinated logistics and regional agenda tracks for multi-chapter representations.",
            },
            {
              event: "ACM India Council, Karnataka Region †",
              role: "Regional Lead Representative",
              timeframe: "2025 – 2026",
              scope: "Facilitated cross-chapter communication, collaborative hackathons, and resource sharing across Karnataka student branches.",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[color:var(--border)]/60 bg-[color:var(--background)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <h5 className="font-bold text-[color:var(--text-primary)]">
                  {s.event}
                </h5>
                <p className="text-[color:var(--text-secondary)] mt-0.5">{s.scope}</p>
              </div>
              <span className="font-mono font-bold text-[color:var(--text-secondary)] shrink-0">
                {s.timeframe}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
