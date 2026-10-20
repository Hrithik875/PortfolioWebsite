import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PROFILE } from "@/data/portfolio-data";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Hrithik's Portfolio.",
};

const sections = [
  {
    title: "Portfolio & Academic Content",
    body:
      "This site represents the technical portfolio and case studies of Hrithik M. The code demonstrations, architecture breakdowns, and evaluation benchmarks are published for inspection and evaluation purposes.",
  },
  {
    title: "Methodology Boundaries",
    body:
      "All case studies referencing external organizations (such as HPE and Samsung PRISM) reflect technical methodology, algorithms, and general frameworks only. Proprietary assets, confidential specifications, and non-public materials are intentionally excluded.",
  },
  {
    title: "Contact",
    body: `For questions about these terms or permissions, contact Hrithik at ${PROFILE.email}.`,
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen px-6 py-28 md:px-16 md:py-36">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
          Legal
        </p>
        <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">Terms of Service</h1>
        <p className="mb-16 max-w-2xl text-base leading-7 text-[color:var(--text-secondary)] md:text-lg">
          Last updated: October 2026. These terms govern the use and inspection of content on this portfolio.
        </p>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title} className="border-t border-[color:var(--border)] pt-8">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">{section.title}</h2>
              <p className="text-base leading-7 text-[color:var(--text-secondary)]">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
