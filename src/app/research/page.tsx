"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FlaskConical, ShieldAlert, CheckCircle2, Clock } from "lucide-react";

export default function ResearchPage() {
  return (
    <div className="w-full min-h-screen pt-32 pb-24 px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold border bg-amber-950/60 border-amber-500/30 text-amber-400">
            Lens: Investigate
          </span>
          <span className="text-xs text-[color:var(--text-secondary)]">Research &amp; Methodology</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[color:var(--text-primary)]">
          Research.
        </h1>
        <p className="text-base sm:text-lg text-[color:var(--text-secondary)] mt-3 max-w-2xl font-medium leading-relaxed">
          Investigation-led work, experimental setups, and empirical evaluations. Structured around technical research questions and auditable findings.
        </p>
      </div>

      {/* Confidentiality & Governance Alert */}
      <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 mb-14 flex items-start gap-3.5">
        <ShieldAlert size={20} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
          <strong className="text-[color:var(--text-primary)] block mb-0.5 font-bold">
            Methodology Boundary &amp; Disclosure Policy:
          </strong>
          All research discussions (including Samsung PRISM and HPE engagements) strictly cover open technical methodologies, public academic representations, and benchmark procedures. No proprietary corporate specifications, internal datasets, or client use-cases are disclosed.
        </div>
      </div>

      {/* Featured Research: Samsung PRISM */}
      <section className="mb-20 p-8 sm:p-10 rounded-[2.5rem] border border-[color:var(--cag-border)] bg-[color:var(--surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
            Featured Research Engagement
          </span>
          <span className="text-xs font-mono text-[color:var(--text-secondary)]">
            From Oct 2025 † · Team of Six
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-[color:var(--text-primary)] mb-2 tracking-tight">
          3D Scene Reconstruction &amp; Semantic Understanding
        </h2>
        <p className="text-sm font-semibold text-amber-400/90 mb-6 italic">
          Samsung PRISM Engagement † — Academic methodology and milestone log
        </p>

        {/* Technical Research Question */}
        <div className="p-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] mb-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] mb-1.5">
            Technical Research Question
          </h4>
          <p className="text-sm font-bold text-[color:var(--text-primary)] leading-relaxed">
            How can explicit 3D Gaussian Splatting representations be augmented with high-dimensional 2D semantic feature fields to enable zero-shot, real-time natural language spatial object querying in complex indoor environments without compromising rendering throughput?
          </p>
        </div>

        {/* Methodology Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]">
            <h4 className="text-sm font-bold text-[color:var(--text-primary)] mb-2">
              1. Explicit 3D Gaussians
            </h4>
            <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
              Utilizing 3D Gaussian Splatting over volumetric NeRFs to achieve 60+ FPS real-time rasterization while maintaining photorealistic view synthesis across multi-camera captures.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]">
            <h4 className="text-sm font-bold text-[color:var(--text-primary)] mb-2">
              2. Semantic Distillation
            </h4>
            <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
              Distilling foundation segmentation models (SAM, CLIP, DINO) into per-Gaussian semantic embedding vectors, enabling direct spatial indexing from text queries.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]">
            <h4 className="text-sm font-bold text-[color:var(--text-primary)] mb-2">
              3. Spatial Query Gate
            </h4>
            <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
              Evaluating cosine similarity thresholds to isolate 3D object bounding ellipsoids from continuous natural language prompts while filtering spatial noise.
            </p>
          </div>
        </div>

        {/* Milestone Progress Log */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] mb-4 flex items-center gap-2">
            <Clock size={14} /> Milestone Progress Log
          </h4>
          <div className="space-y-3">
            {[
              {
                status: "Validated",
                title: "Multi-view image acquisition and point-cloud initialization",
                desc: "Successfully calibrated camera extrinsics and COLMAP sparse point clouds.",
              },
              {
                status: "Validated",
                title: "Baseline 3D Gaussian Splatting rasterization pipeline",
                desc: "Verified rendering frame rates and PSNR fidelity on sample benchmark spaces.",
              },
              {
                status: "In Progress",
                title: "Semantic feature vector assignment and query resolution",
                desc: "Actively investigating memory optimization to prevent high GPU VRAM inflation when storing multi-channel embeddings per Gaussian.",
              },
            ].map((m, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-[color:var(--border)]/70 bg-[color:var(--background)] flex items-start gap-3"
              >
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                    m.status === "Validated"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {m.status}
                </span>
                <div>
                  <h5 className="text-xs font-bold text-[color:var(--text-primary)]">
                    {m.title}
                  </h5>
                  <p className="text-xs text-[color:var(--text-secondary)] mt-0.5">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Investigations Section */}
      <section className="space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
            Empirical Investigations
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--text-primary)] mt-1">
            Technical Experiments
          </h2>
        </div>

        {/* Investigation 1: JustiBot Retrieval Ablation */}
        <div id="justibot-experiments" className="p-8 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[color:var(--text-primary)]">
              JustiBot: Retrieval Ablation &amp; Confidence Gate Study
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">5-Metric Suite</span>
          </div>
          <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed mb-6">
            Evaluating retrieval hit-rate and precision under 4 configurations: BM25 lexical search only, Dense embeddings only, Reciprocal Rank Fusion (Dense + BM25), and Hybrid + Cross-Encoder Reranking.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-[color:var(--text-secondary)]">
                  <th className="py-2.5 pr-4 font-bold">Retrieval Setup</th>
                  <th className="py-2.5 px-4 font-bold">Hit Rate @ 5</th>
                  <th className="py-2.5 px-4 font-bold">MRR @ 5</th>
                  <th className="py-2.5 px-4 font-bold">Avg Latency</th>
                  <th className="py-2.5 pl-4 font-bold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]/40 font-mono text-[color:var(--text-primary)]">
                <tr>
                  <td className="py-2.5 pr-4">1. Lexical (BM25) Only</td>
                  <td className="py-2.5 px-4">0.72</td>
                  <td className="py-2.5 px-4">0.61</td>
                  <td className="py-2.5 px-4">18ms</td>
                  <td className="py-2.5 pl-4 font-sans text-[color:var(--text-secondary)]">Misses semantic paraphrases</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">2. Dense Vector Only</td>
                  <td className="py-2.5 px-4">0.78</td>
                  <td className="py-2.5 px-4">0.67</td>
                  <td className="py-2.5 px-4">45ms</td>
                  <td className="py-2.5 pl-4 font-sans text-[color:var(--text-secondary)]">Fails on exact legal section numbers</td>
                </tr>
                <tr className="bg-[color:var(--text-primary)]/5 font-bold">
                  <td className="py-2.5 pr-4">3. Hybrid (RRF)</td>
                  <td className="py-2.5 px-4 text-emerald-400">0.89</td>
                  <td className="py-2.5 px-4 text-emerald-400">0.82</td>
                  <td className="py-2.5 px-4">62ms</td>
                  <td className="py-2.5 pl-4 font-sans text-[color:var(--text-secondary)]">Captures both exact sections &amp; concepts</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">4. Hybrid + Cross-Encoder</td>
                  <td className="py-2.5 px-4 text-emerald-400">0.93</td>
                  <td className="py-2.5 px-4 text-emerald-400">0.88</td>
                  <td className="py-2.5 px-4">140ms</td>
                  <td className="py-2.5 pl-4 font-sans text-[color:var(--text-secondary)]">Highest precision, higher inference budget</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Investigation 2: Fraud Detection Model Comparison */}
        <div id="fraud-models" className="p-8 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[color:var(--text-primary)]">
              Fraud Detection: Streaming Testbed vs Model Separation
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">AUC 0.964</span>
          </div>
          <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed mb-4">
            Comparing Random Forest vs Logistic Regression on high-frequency imbalanced transaction streams. SMOTE applied exclusively to training folds to prevent evaluation data leakage.
          </p>
          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] text-xs text-[color:var(--text-secondary)] leading-relaxed">
            <strong className="text-[color:var(--text-primary)]">Evaluation Integrity Note:</strong> The evaluation testbed runs as a detached process from the system-under-test. Streaming throughput measured over Kafka producer partitions under 3,200+ msg/sec burst simulations.
          </div>
        </div>
      </section>
    </div>
  );
}
