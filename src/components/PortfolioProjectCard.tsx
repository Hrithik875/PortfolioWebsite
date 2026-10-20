"use client";

import React from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowUpRight, CheckCircle2, ShieldCheck, Terminal, Layers } from "lucide-react";
import { Project, Lens } from "@/types/portfolio";
import { LENS_DETAILS } from "@/data/portfolio-data";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function PortfolioProjectCard({ project, index }: ProjectCardProps) {
  const lensInfo = LENS_DETAILS[project.lens];

  return (
    <m.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 p-7 sm:p-10 text-left group transition-all h-full
        bg-gradient-to-br from-[color:var(--surface)]/95 via-[color:var(--surface)]/80 to-[color:var(--surface)]/50
        md:backdrop-blur-[80px] md:backdrop-saturate-[1.8]
        border border-[color:var(--border)] hover:border-[color:var(--text-secondary)]/50
        rounded-[2.5rem]
        duration-500 cursor-default
        shadow-[0_20px_50px_rgba(0,0,0,0.3)]
        overflow-hidden flex flex-col justify-between"
    >
      {/* Subtle Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none" />

      <div>
        {/* Top Header: Lens & Status Badges */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${lensInfo.bgClass} ${lensInfo.textClass}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Lens: {project.lens}
            </span>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--text-secondary)]">
              {project.status}
            </span>
          </div>

          <span className="text-xs font-mono text-[color:var(--text-secondary)]">
            {project.timeframe}
          </span>
        </div>

        {/* Title */}
        <h3 className="relative z-10 text-2xl sm:text-3xl font-black mb-2 tracking-tighter text-[color:var(--text-primary)]">
          {project.title}
        </h3>

        {/* Hook */}
        <p className="relative z-10 text-sm font-semibold text-[color:var(--text-primary)]/80 italic mb-4">
          &ldquo;{project.hook}&rdquo;
        </p>

        {/* Description */}
        <p className="relative z-10 text-sm text-[color:var(--text-secondary)] leading-relaxed mb-6 font-normal">
          {project.description}
        </p>

        {/* Bullets (Mechanisms) */}
        <ul className="relative z-10 space-y-2 mb-8">
          {project.bullets.map((bullet, i) => (
            <li
              key={i}
              className="text-xs text-[color:var(--text-secondary)] flex items-start gap-2 leading-relaxed"
            >
              <CheckCircle2
                size={14}
                className="shrink-0 mt-0.5 text-[color:var(--text-primary)]/60"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Area: Receipts & Case Study Link */}
      <div className="relative z-10 pt-4 border-t border-[color:var(--border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {project.receipts.map((receipt) => (
            <span
              key={receipt.id}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono border border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--text-primary)]"
              title={receipt.context}
            >
              <span className="font-bold">{receipt.metric}</span>
              <span className="text-[color:var(--text-secondary)] ml-1">
                {receipt.label}
              </span>
              {receipt.status === "unverified" && (
                <span className="text-amber-400 font-bold ml-0.5">†</span>
              )}
            </span>
          ))}
        </div>

        <Link
          href={project.links?.caseStudyHref || `/work#${project.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--text-primary)] hover:opacity-75 transition-opacity ml-auto"
        >
          <span>Examine dossier</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </m.div>
  );
}
