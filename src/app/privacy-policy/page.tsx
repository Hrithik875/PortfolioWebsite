import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PROFILE } from "@/data/portfolio-data";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Hrithik's Portfolio.",
};

const sections = [
  {
    title: "Information We Collect",
    body:
      "This website is an engineering portfolio. It does not sell user information, use third-party ad tracking, or store unnecessary personally identifiable information. Standard web traffic and performance telemetry may be logged to maintain edge caching and availability.",
  },
  {
    title: "How We Use Information",
    body:
      "Information provided via direct contact or email inquiries is used solely to respond to recruitment, collaboration, or technical evaluation inquiries.",
  },
  {
    title: "Data Sharing",
    body:
      "We do not sell, rent, or trade your personal information. Minimal server infrastructure data may be processed by hosting and edge caching providers (such as Cloudflare/Vercel) to serve static assets securely.",
  },
  {
    title: "Contact",
    body: `For questions regarding this policy, contact Hrithik at ${PROFILE.email}.`,
  },
];

export default function PrivacyPolicyPage() {
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
        <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">Privacy Policy</h1>
        <p className="mb-16 max-w-2xl text-base leading-7 text-[color:var(--text-secondary)] md:text-lg">
          Last updated: October 2026. This policy explains how visitor privacy is respected on this portfolio.
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
