"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, GraduationCap, Compass, Sparkles } from "lucide-react";
import { PROFILE, LENS_DETAILS } from "@/data/portfolio-data";

export default function AboutPage() {
  const principles = [
    {
      title: "1. Evidence over assertion",
      desc: "Anyone can write a claim on a portfolio. If a number matters enough to state, it matters enough to link to the dataset, hardware, and measurement code that produced it.",
      example: "0.964 AUC with SMOTE balance linked to held-out test split under Kafka streaming load.",
    },
    {
      title: "2. Raw artifacts as standard of proof",
      desc: "Dashboards, benchmark logs, and reproducible notebooks are the currency of technical credibility. I avoid adjectives when a metric exists.",
      example: "Documenting median load reduction from 15-20 s to ~875 ms on the ACM platform.",
    },
    {
      title: "3. Mechanical & auditable methods",
      desc: "LLMs are probabilistic, but the systems wrapping them shouldn't be unpredictable. Wherever decisions have business or architectural weight, I implement deterministic scoring layers.",
      example: "ArchGuide requirement-to-signal equations that output verifiable decision traces.",
    },
    {
      title: "4. Complete validated work over patches",
      desc: "An ML model that only runs in an interactive notebook isn't a finished product. I package systems with containerization, API contracts, and observability.",
      example: "Dockerized JustiBot and Fraud Detection pipelines with Prometheus metrics.",
    },
    {
      title: "5. Build only what you can defend under questioning",
      desc: "I do not list technologies I've merely read about, nor do I present research in progress as completed production software. Transparency builds lasting trust.",
      example: "Explicitly labeling Samsung PRISM and HPE work as methodology only with no proprietary disclosures.",
    },
  ];

  const skillsWithEvidence = [
    {
      lens: "Build" as const,
      skills: [
        { name: "Retrieval-Augmented Generation (RAG)", proof: "JustiBot, ArchGuide", href: "/work#justibot" },
        { name: "Hybrid Search & Vector Indices", proof: "Dense + BM25 RRF in JustiBot", href: "/work#justibot" },
        { name: "Streaming ML & Distributed Ingestion", proof: "Kafka + Spark in Fraud Detection", href: "/work#fraud-detection" },
        { name: "Evaluation & Fallback Gates", proof: "5-metric evaluation suite", href: "/research#justibot-experiments" },
      ],
    },
    {
      lens: "Ship" as const,
      skills: [
        { name: "Next.js & Modern Web Architecture", proof: "BMSCE ACM Chapter Platform", href: "/work#acm-platform" },
        { name: "API Engineering & Containerization", proof: "FastAPI / Flask / Docker", href: "/work#fraud-detection" },
        { name: "Performance & Edge Optimization", proof: "Cloudflare migration to ~875ms", href: "/work#acm-platform" },
        { name: "Storefront & E-Commerce Logic", proof: "Velvory at Kshipani Ventures", href: "/experience" },
      ],
    },
    {
      lens: "Investigate" as const,
      skills: [
        { name: "3D Scene Reconstruction", proof: "Samsung PRISM Methodology", href: "/research" },
        { name: "3D Gaussian Splatting & View Synthesis", proof: "PRISM spatial queries", href: "/research" },
        { name: "Model Evaluation & Integrity", proof: "Held-out testbed separation", href: "/research#fraud-models" },
      ],
    },
    {
      lens: "Lead" as const,
      skills: [
        { name: "Technical Community Architecture", proof: "100 Days of Code (1,200+ regs)", href: "/leadership#100-days-of-code" },
        { name: "Engineering Team Direction", proof: "UTSAV 2026 9-person team", href: "/leadership" },
        { name: "Cross-Chapter Governance", proof: "ACM India Regional Lead", href: "/leadership" },
      ],
    },
  ];

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
          Identity &amp; Philosophy
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[color:var(--text-primary)]">
          About Me.
        </h1>
      </div>

      {/* Narrative Section */}
      <section className="p-8 sm:p-10 rounded-[2.5rem] border border-[color:var(--border)] bg-[color:var(--surface)] mb-16 leading-relaxed">
        <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--text-primary)] mb-6 tracking-tight">
          Engineering at the Intersection of ML &amp; Measurable Systems
        </h2>

        <div className="space-y-4 text-sm sm:text-base text-[color:var(--text-secondary)] font-normal leading-relaxed">
          <p>
            I am a final-year Artificial Intelligence &amp; Machine Learning engineering student at BMSCE, Bengaluru. I work primarily on retrieval systems, streaming machine learning pipelines, and the rigorous evaluation layers that make intelligent applications inspectable.
          </p>
          <p>
            Too much of modern AI engineering treats models as infallible or impenetrable black boxes. My goal is the opposite: to build deterministic harnesses, hybrid retrieval mechanisms, and streaming pipelines where every recommendation has an audit trace and every claimed number is backed by an inspectable receipt.
          </p>
          <p>
            Beyond coding, I lead the technical initiatives of our ACM Student Chapter. I treat community infrastructure with the same engineering rigor as production software—optimizing load times, automating submission queues, and mentoring developers.
          </p>
        </div>
      </section>

      {/* How I Work Section */}
      <section className="mb-16">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
            Guiding Principles
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--text-primary)] mt-1">
            How I Work
          </h2>
          <p className="text-xs text-[color:var(--text-secondary)] mt-1">
            Five non-negotiable standards that govern my projects and collaborations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((p, idx) => (
            <div
              key={idx}
              className="p-6 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--text-secondary)]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-[color:var(--text-primary)] mb-2">
                  {p.title}
                </h3>
                <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed mb-4">
                  {p.desc}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[color:var(--background)] border border-[color:var(--border)]/70 text-[11px] text-[color:var(--text-secondary)] font-mono">
                <span className="text-[color:var(--text-primary)] font-bold">Proof:</span> {p.example}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills with Evidence (No bare keyword lists) */}
      <section className="mb-16">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
            Verified Competencies
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--text-primary)] mt-1">
            Skills with Evidence
          </h2>
          <p className="text-xs text-[color:var(--text-secondary)] mt-1">
            Every capability links directly to the project where it was implemented and evaluated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skillsWithEvidence.map((group) => {
            const lensInfo = LENS_DETAILS[group.lens];
            return (
              <div
                key={group.lens}
                className="p-6 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)]"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[color:var(--border)]">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${lensInfo.bgClass} ${lensInfo.textClass}`}
                  >
                    Lens: {group.lens}
                  </span>
                  <span className="text-xs text-[color:var(--text-secondary)] font-mono">
                    {group.skills.length} Capabilities
                  </span>
                </div>

                <div className="space-y-3">
                  {group.skills.map((s, i) => (
                    <Link
                      key={i}
                      href={s.href}
                      className="block p-3 rounded-xl bg-[color:var(--background)] border border-[color:var(--border)]/60 hover:border-[color:var(--text-primary)] transition-all group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[color:var(--text-primary)] group-hover:underline">
                          {s.name}
                        </span>
                        <ArrowUpRight size={12} className="text-[color:var(--text-secondary)] group-hover:text-[color:var(--text-primary)]" />
                      </div>
                      <span className="text-[11px] text-[color:var(--text-secondary)] mt-0.5 block">
                        Demonstrated in: {s.proof}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Education & Academic Record */}
      <section id="education" className="p-8 sm:p-10 rounded-[2.5rem] border border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="flex items-center gap-3 mb-4">
          <GraduationCap size={24} className="text-[color:var(--text-primary)]" />
          <h2 className="text-2xl font-black text-[color:var(--text-primary)]">
            Education &amp; Credentials
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]">
            <span className="text-[color:var(--text-secondary)] block mb-1">Bachelor of Engineering</span>
            <p className="text-sm font-bold text-[color:var(--text-primary)]">
              Artificial Intelligence &amp; Machine Learning
            </p>
            <p className="text-[color:var(--text-secondary)] mt-0.5">
              BMS College of Engineering (BMSCE), Bengaluru
            </p>
            <p className="mt-2 text-emerald-400 font-bold font-mono">
              CGPA: 9.83 (Official Record)
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]">
            <span className="text-[color:var(--text-secondary)] block mb-1">Pre-University &amp; Honors</span>
            <p className="text-sm font-bold text-[color:var(--text-primary)]">
              Pre-University Examination: 97.33% †
            </p>
            <p className="text-[color:var(--text-secondary)] mt-0.5">
              HPE Career Preview Program Certificate of Appreciation †
            </p>
            <p className="mt-2 text-[color:var(--text-secondary)]">
              Graduation: 2026
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
