export type Lens = "Build" | "Ship" | "Investigate" | "Lead";

export type EvidenceStatus = "confirmed" | "unverified" | "needed";

export type ProjectStatus =
  | "Shipped"
  | "Deployed"
  | "Prototype"
  | "In progress"
  | "Research in progress"
  | "Archived";

export type ProjectTier = "Featured" | "Supporting" | "Archive";

export interface Receipt {
  id: string;
  metric: string;
  label: string;
  context: string;
  method?: string;
  date?: string;
  link?: string;
  status: EvidenceStatus;
}

export interface DecisionRecord {
  title: string;
  options: string[];
  chosen: string;
  reason: string;
  cost: string;
}

export interface CaseStudySection {
  problem: string;
  myRole: string;
  constraints?: string[];
  systemArchitecture?: string;
  hardProblems?: { title: string; description: string; solution: string }[];
  evaluation?: { method: string; metrics: string[]; limitations: string };
  operations?: string[];
  results?: string[];
  learnings?: string;
}

export interface Project {
  id: string;
  title: string;
  hook: string;
  description: string;
  bullets: string[];
  status: ProjectStatus;
  statusDate?: string;
  lens: Lens;
  tier: ProjectTier;
  timeframe: string;
  role: string;
  ownership: "Solo" | "Team" | "Lead";
  receipts: Receipt[];
  decisions?: DecisionRecord[];
  caseStudy?: CaseStudySection;
  links?: {
    repo?: string;
    demo?: string;
    writeup?: string;
    caseStudyHref?: string;
  };
  tags?: string[];
}

export interface StartHerePath {
  id: string;
  audience: "Recruiter" | "Engineer" | "Researcher" | "Community";
  line: string;
  stops: {
    title: string;
    description: string;
    href: string;
  }[];
  lens: Lens;
}

export interface ExperienceItem {
  id: string;
  engagement: string;
  role: string;
  timeframe: string;
  type: "Program" | "Internship" | "Research Engagement" | "Appointment";
  lens: Lens;
  description: string;
  highlights: string[];
  evidenceNote?: string;
  status: EvidenceStatus;
  link?: string;
}

export interface LeadershipItem {
  id: string;
  title: string;
  role: string;
  timeframe: string;
  lens: Lens;
  description: string;
  highlights: string[];
  metric?: string;
  status: EvidenceStatus;
  link?: string;
}
