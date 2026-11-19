"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Mail, Send, Copy, Check } from "lucide-react";
import { PROFILE } from "@/data/portfolio-data";
import ClockPanel from "@/components/ClockPanel";

/* True only at desktop widths (same breakpoint as the navbar: > 1008px). */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1009px)");
    const on = () => setIsDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return isDesktop;
}

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const isDesktop = useIsDesktop();

  const copyEmail = () => {
    navigator.clipboard.writeText(PROFILE.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailto = `mailto:${PROFILE.email}?subject=Portfolio%20Inquiry%20from%20${encodeURIComponent(
      formData.name
    )}&body=${encodeURIComponent(formData.message + "\n\nFrom: " + formData.email)}`;
    window.location.href = mailto;
  };

  return (
    <div className="w-full min-h-screen p-3 min-[1009px]:flex min-[1009px]:gap-3 min-[1009px]:items-start">
      {/* LEFT — radial clock. Desktop only (sticky side panel).
          On phones / tablets it lives behind the clock button in the navbar instead. */}
      <aside className="hidden min-[1009px]:block min-[1009px]:sticky min-[1009px]:top-3 min-[1009px]:h-[calc(100vh-1.5rem)] min-[1009px]:w-[42%] min-[1009px]:shrink-0">
        {isDesktop && <ClockPanel location="BENGALURU, INDIA" timeZone="Asia/Kolkata" />}
      </aside>

      {/* RIGHT — existing contact content */}
      <main className="flex-1 min-w-0 pt-24 min-[1009px]:pt-32 pb-24 px-4 sm:px-8 min-[1009px]:px-10">
        {/* Header */}
        <div className="mb-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] block mb-1">
            Direct Channels
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[color:var(--text-primary)]">
            Get in Touch.
          </h1>
          <p className="text-base sm:text-lg text-[color:var(--text-secondary)] mt-3 max-w-xl font-medium leading-relaxed">
            Open to AI/ML engineering roles graduating in 2026. Or reach out to discuss retrieval evaluation, streaming architectures, or student community leadership.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Direct Channels */}
          <div className="xl:col-span-5 space-y-4">
            <div className="p-6 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] block mb-2">
                Primary Email
              </span>
              <p className="text-sm font-bold text-[color:var(--text-primary)] mb-3 font-mono break-all">
                {PROFILE.email}
              </p>
              <div className="flex gap-2">
                <a
                  href={`mailto:${PROFILE.email}`}
                  className="px-4 py-2 rounded-full bg-[color:var(--text-primary)] text-[color:var(--background)] text-xs font-bold hover:opacity-90 transition-opacity active:scale-95 flex items-center gap-1.5"
                >
                  <Mail size={13} />
                  <span>Open Mail</span>
                </a>
                <button
                  onClick={copyEmail}
                  className="px-3 py-2 rounded-full border border-[color:var(--border)] bg-[color:var(--background)] text-xs font-bold text-[color:var(--text-primary)] hover:border-[color:var(--text-secondary)] transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="p-6 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] block mb-1">
                Socials &amp; Code
              </span>
              <a
                href={PROFILE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-[color:var(--border)]/60 bg-[color:var(--background)] text-xs font-bold hover:border-[color:var(--text-primary)] transition-all"
              >
                <span>LinkedIn Profile</span>
                <ArrowUpRight size={14} />
              </a>
              <a
                href={PROFILE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-[color:var(--border)]/60 bg-[color:var(--background)] text-xs font-bold hover:border-[color:var(--text-primary)] transition-all"
              >
                <span>GitHub Repositories</span>
                <ArrowUpRight size={14} />
              </a>
              <Link
                href="/resume"
                className="flex items-center justify-between p-3 rounded-xl border border-[color:var(--border)]/60 bg-[color:var(--background)] text-xs font-bold hover:border-[color:var(--text-primary)] transition-all"
              >
                <span>Readable Resume</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Message Form */}
          <div className="xl:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="p-8 rounded-[2.5rem] border border-[color:var(--border)] bg-[color:var(--surface)] space-y-4"
            >
              <h3 className="text-lg font-bold text-[color:var(--text-primary)] mb-1">
                Send a Direct Note
              </h3>
              <p className="text-xs text-[color:var(--text-secondary)] mb-4">
                Launches your local mail client with prefilled context.
              </p>

              <div>
                <label className="text-xs font-semibold text-[color:var(--text-primary)] block mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex Mercer"
                  className="w-full px-4 py-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)]/50 focus:outline-none focus:border-[color:var(--text-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[color:var(--text-primary)] block mb-1.5">
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)]/50 focus:outline-none focus:border-[color:var(--text-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[color:var(--text-primary)] block mb-1.5">
                  Message or Role Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Let's connect regarding an AI/ML engineering role at..."
                  className="w-full px-4 py-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)]/50 focus:outline-none focus:border-[color:var(--text-primary)] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[color:var(--text-primary)] text-[color:var(--background)] text-sm font-bold hover:opacity-90 transition-opacity active:scale-95 flex items-center justify-center gap-2 pt-3"
              >
                <Send size={15} />
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}