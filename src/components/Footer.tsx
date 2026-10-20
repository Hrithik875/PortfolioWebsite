"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { m, Variants } from "framer-motion";
import { PROFILE } from "@/data/portfolio-data";
import { useIntro } from "@/context/IntroContext";

export function Footer() {
  const { introDone } = useIntro();
  if (!introDone) return null;

  const footerLinks = [
    {
      title: "Navigation",
      links: [
        { name: "Home", href: "/" },
        { name: "Work", href: "/work" },
        { name: "Research", href: "/research" },
        { name: "Experience", href: "/experience" },
      ],
    },
    {
      title: "Profile",
      links: [
        { name: "Leadership", href: "/leadership" },
        { name: "About", href: "/about" },
        { name: "Resume (PDF)", href: "/resume" },
        { name: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Lenses",
      links: [
        { name: "Build (AI/ML Systems)", href: "/work?lens=Build" },
        { name: "Ship (Platforms & Web)", href: "/work?lens=Ship" },
        { name: "Investigate (Research)", href: "/research" },
        { name: "Lead (Community)", href: "/leadership" },
      ],
    },
  ];

  const brandName = "HRITHIK.";

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { y: "110%", opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <footer className="w-full relative z-[1] bg-transparent border-t border-[color:var(--border)] overflow-hidden flex flex-col justify-between">
      {/* Top Content Section */}
      <div className="w-full px-6 md:px-16 pt-24 md:pt-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-20 md:mb-32">
          <div className="lg:col-span-1">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[color:var(--text-primary)]">
              I build AI systems <br />
              <span className="opacity-40 font-black">you can inspect.</span>
            </h2>
            <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed max-w-sm">
              Retrieval, streaming ML, and deterministic evaluation with verifiable receipts for every number.
            </p>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-10">
            {footerLinks.map((column, i) => (
              <div key={i}>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] mb-6">
                  {column.title}
                </h4>
                <ul className="space-y-4">
                  {column.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-[color:var(--text-primary)] hover:opacity-60 transition-opacity"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Text Section - Optimized for Single Line & No Wrap */}
        <div className="relative w-full overflow-hidden pb-4">
          <m.h1
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
            className="text-[14vw] font-bold tracking-[-0.01em] leading-[0.85] text-[color:var(--text-primary)] pointer-events-none select-none flex flex-nowrap whitespace-nowrap"
          >
            {brandName.split("").map((char, index) => (
              <span key={index} className="inline-block overflow-hidden">
                <m.span variants={letterVariants} style={{ display: "inline-block" }}>
                  {char}
                </m.span>
              </span>
            ))}
          </m.h1>
        </div>
      </div>

      {/* Bottom Legal/Social Bar */}
      <div className="w-full px-6 md:px-16 pb-12 pt-12 border-t border-[color:var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <Logo className="w-7 h-7" />
          <span className="font-bold text-lg tracking-tighter text-[color:var(--text-primary)]">HRITHIK.</span>
          <span className="text-xs text-[color:var(--text-secondary)] ml-2 hidden sm:inline">
            Receipts on every claim
          </span>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-xs font-medium text-[color:var(--text-secondary)]">
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[color:var(--text-primary)] transition-colors flex items-center gap-1"
          >
            LinkedIn <ArrowUpRight size={12} />
          </a>
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[color:var(--text-primary)] transition-colors flex items-center gap-1"
          >
            GitHub <ArrowUpRight size={12} />
          </a>
          <a
            href={`mailto:${PROFILE.email}`}
            className="hover:text-[color:var(--text-primary)] transition-colors"
          >
            {PROFILE.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
