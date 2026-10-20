import { describe, it, expect } from "vitest";
import {
  PROFILE,
  PROOF_STRIP,
  FEATURED_PROJECTS,
  SUPPORTING_PROJECTS,
  EXPERIENCE_ITEMS,
  LEADERSHIP_ITEMS,
} from "@/data/portfolio-data";

describe("Portfolio Data Integrity", () => {
  it("should have complete profile information", () => {
    expect(PROFILE.name).toBe("Hrithik");
    expect(PROFILE.fullName).toBe("Hrithik M");
    expect(PROFILE.headline).toBeDefined();
    expect(PROFILE.subhead).toBeDefined();
    expect(PROFILE.identityLine).toBeDefined();
    expect(PROFILE.email).toBeDefined();
    expect(PROFILE.github).toContain("github.com");
    expect(PROFILE.linkedin).toContain("linkedin.com");
  });

  it("should have valid proof strip items with receipts", () => {
    expect(PROOF_STRIP.length).toBeGreaterThan(0);
    for (const item of PROOF_STRIP) {
      expect(item.id).toBeDefined();
      expect(item.metric).toBeDefined();
      expect(item.label).toBeDefined();
      expect(item.method).toBeDefined();
      expect(item.context).toBeDefined();
    }
  });

  it("should have valid featured projects with required fields", () => {
    expect(FEATURED_PROJECTS.length).toBeGreaterThanOrEqual(3);
    for (const project of FEATURED_PROJECTS) {
      expect(project.id).toBeDefined();
      expect(project.title).toBeDefined();
      expect(project.hook).toBeDefined();
      expect(project.receipts.length).toBeGreaterThan(0);
    }
  });

  it("should have valid experience records with verified outcomes", () => {
    expect(EXPERIENCE_ITEMS.length).toBeGreaterThan(0);
    for (const exp of EXPERIENCE_ITEMS) {
      expect(exp.role).toBeDefined();
      expect(exp.engagement).toBeDefined();
      expect(exp.timeframe).toBeDefined();
      expect(exp.highlights.length).toBeGreaterThan(0);
    }
  });

  it("should have leadership and supporting projects", () => {
    expect(LEADERSHIP_ITEMS.length).toBeGreaterThan(0);
    expect(SUPPORTING_PROJECTS.length).toBeGreaterThan(0);
  });
});
