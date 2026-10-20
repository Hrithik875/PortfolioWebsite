import {
  Project,
  Receipt,
  StartHerePath,
  ExperienceItem,
  LeadershipItem,
  Lens,
} from "@/types/portfolio";

export const PROFILE = {
  name: "Hrithik",
  fullName: "Hrithik M",
  title: "Hrithik | AI/ML engineer",
  headline: "I build AI systems you can inspect.",
  subhead:
    "I build intelligent systems you can inspect, ship them as complete products, investigate the hard problems behind them, and help technical communities grow.",
  identityLine:
    "Final-year B.E. student in Artificial Intelligence and Machine Learning at BMSCE, Bengaluru. I work on retrieval, streaming ML and the evaluation behind them, and I lead the technical side of our ACM student chapter.",
  availabilityLine:
    "Graduating 2026. Open to AI/ML engineering roles.",
  education:
    "B.E. in Artificial Intelligence and Machine Learning, BMSCE · CGPA 9.83 · Pre-University 97.33% † · HPE Certificate of Appreciation †",
  email: "hrithik.ml.eng@gmail.com",
  github: "https://github.com",
  linkedin: "https://linkedin.com",
  currentFocus:
    "Right now I am working on getting the AI ERP Assistant running end to end without any cloud dependency.",
};

export const LENS_DETAILS: Record<
  Lens,
  { label: string; description: string; colorVar: string; borderVar: string; textClass: string; bgClass: string }
> = {
  Build: {
    label: "Build",
    description: "AI/ML systems: RAG, LLM applications, streaming ML",
    colorVar: "var(--rag-bg)",
    borderVar: "var(--rag-border)",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-950/60 border-emerald-500/30",
  },
  Ship: {
    label: "Ship",
    description: "Full-stack products, web platforms, dashboards, performance",
    colorVar: "var(--finetuning-bg)",
    borderVar: "var(--finetuning-border)",
    textClass: "text-blue-400",
    bgClass: "bg-blue-950/60 border-blue-500/30",
  },
  Investigate: {
    label: "Investigate",
    description: "Research engineering and experiments",
    colorVar: "var(--cag-bg)",
    borderVar: "var(--cag-border)",
    textClass: "text-amber-400",
    bgClass: "bg-amber-950/60 border-amber-500/30",
  },
  Lead: {
    label: "Lead",
    description: "Technical leadership and community impact",
    colorVar: "var(--hybrid-bg)",
    borderVar: "var(--hybrid-border)",
    textClass: "text-red-400",
    bgClass: "bg-red-950/60 border-red-500/30",
  },
};

export const PROOF_STRIP: Receipt[] = [
  {
    id: "fraud-auc",
    metric: "0.964 AUC",
    label: "at 3,200+ msg/sec",
    context: "Real-time fraud detection pipeline",
    method: "Spark Streaming + Kafka ingestion benchmark under simulated burst conditions",
    date: "2026",
    link: "/work#fraud-detection",
    status: "confirmed",
  },
  {
    id: "legal-chunks",
    metric: "6,800+",
    label: "Legal text chunks",
    context: "Official Indian legal texts indexed in JustiBot †",
    method: "Dense + BM25 reciprocal rank fusion over vectorized corpus",
    date: "2026",
    link: "/work#justibot",
    status: "unverified",
  },
  {
    id: "acm-speed",
    metric: "15-20s → ~875ms",
    label: "Median page load",
    context: "BMSCE ACM chapter site Cloudflare edge migration †",
    method: "Edge caching, bundle splitting and asset compression audit",
    date: "2025",
    link: "/work#acm-platform",
    status: "unverified",
  },
  {
    id: "code-regs",
    metric: "1,200+",
    label: "Registrations in ~3 days",
    context: "100 Days of Code chapter initiative †",
    method: "Official organizer registration export",
    date: "2025",
    link: "/leadership#100-days-of-code",
    status: "unverified",
  },
  {
    id: "cgpa",
    metric: "9.83",
    label: "CGPA",
    context: "B.E. in Artificial Intelligence and Machine Learning, BMSCE",
    method: "Official academic transcript as of Semester 6",
    date: "2026",
    link: "/about#education",
    status: "confirmed",
  },
];

export const START_HERE_PATHS: StartHerePath[] = [
  {
    id: "recruiter",
    audience: "Recruiter",
    line: "The short version.",
    lens: "Build",
    stops: [
      {
        title: "Resume (PDF)",
        description: "One canonical public page with verified academic & technical record",
        href: "/resume",
      },
      {
        title: "Fraud Detection",
        description: "Streaming ML pipeline: Kafka, Spark, 0.964 AUC at 3,200+ msg/s",
        href: "/work#fraud-detection",
      },
      {
        title: "Experience",
        description: "HPE Career Preview Program, Samsung PRISM, Kshipani & ACM",
        href: "/experience",
      },
    ],
  },
  {
    id: "engineer",
    audience: "Engineer",
    line: "How I make decisions.",
    lens: "Build",
    stops: [
      {
        title: "ArchGuide Decision Records",
        description: "Deterministic scoring vs LLM-only, relevance gates, cost analysis",
        href: "/work#archguide",
      },
      {
        title: "Fraud Detection Architecture",
        description: "Kafka ingestion, SMOTE imbalance handling, low-latency scoring",
        href: "/work#fraud-detection",
      },
      {
        title: "JustiBot Retrieval Evaluation",
        description: "Dense + BM25 fusion, cross-encoder reranker, confidence gate",
        href: "/work#justibot",
      },
    ],
  },
  {
    id: "researcher",
    audience: "Researcher",
    line: "The method.",
    lens: "Investigate",
    stops: [
      {
        title: "Samsung PRISM Methodology",
        description: "3D scene reconstruction, Gaussian splatting & semantic segmentation",
        href: "/research",
      },
      {
        title: "JustiBot Retrieval Ablation",
        description: "Five-metric evaluation suite and retrieval rank experiments",
        href: "/research#justibot-experiments",
      },
      {
        title: "Fraud Model Comparison †",
        description: "Logistic Regression vs Random Forest with integrity separation",
        href: "/research#fraud-models",
      },
    ],
  },
  {
    id: "community",
    audience: "Community",
    line: "How I lead.",
    lens: "Lead",
    stops: [
      {
        title: "ACM Digital Platform",
        description: "Engineering and operating the chapter web platform as a product",
        href: "/work#acm-platform",
      },
      {
        title: "Leadership Record",
        description: "Webmaster & Technical Head, team coordination, regional representation",
        href: "/leadership",
      },
      {
        title: "100 Days of Code †",
        description: "Scaling community initiative to 1,200+ student registrations",
        href: "/leadership#100-days-of-code",
      },
    ],
  },
];

export const FEATURED_PROJECTS: Project[] = [
  {
    id: "justibot",
    title: "JustiBot",
    hook: "Legal question answering with retrieval you can measure.",
    description:
      "An Indian legal assistant built over official legal texts. Dense and BM25 retrieval are merged with reciprocal rank fusion, a cross-encoder reranks the results, and a confidence gate decides when the system should fall back instead of answering.",
    bullets: [
      "Five-metric evaluation suite for retrieval relevance & faithfulness",
      "Query classification and hallucination detection with threshold gates",
      "Containerized deployment with real-time observability dashboards",
    ],
    status: "Prototype",
    statusDate: "2026",
    lens: "Build",
    tier: "Featured",
    timeframe: "2025 - 2026",
    role: "AI/ML Engineer",
    ownership: "Solo",
    receipts: [
      {
        id: "justibot-corpus",
        metric: "6,800+",
        label: "legal chunks",
        context: "Official Indian legal texts vectorized †",
        status: "unverified",
      },
      {
        id: "justibot-eval",
        metric: "5 metrics",
        label: "evaluation suite",
        context: "Hit-rate, MRR, NDCG, faithfulness & answer relevance",
        status: "confirmed",
      },
    ],
    decisions: [
      {
        title: "Hybrid Retrieval vs Dense-Only",
        options: ["Dense Vector (BERT/all-MiniLM)", "Lexical BM25", "Reciprocal Rank Fusion (Dense + BM25)"],
        chosen: "Reciprocal Rank Fusion",
        reason: "Legal terminology demands exact keyword citation while handling natural language questions.",
        cost: "Dual index maintenance and cross-encoder rerank latency overhead.",
      },
      {
        title: "Confidence Gate vs Always-Answer",
        options: ["Always Answer with Disclaimer", "Confidence-Gated Fallback"],
        chosen: "Confidence-Gated Fallback",
        reason: "In high-stakes domains like legal inquiry, an honest fallback prevents hallucinated citations.",
        cost: "Slightly lower response rate on ambiguous or multi-hop questions.",
      },
    ],
    links: {
      writeup: "/work#justibot",
      caseStudyHref: "/work#justibot",
    },
    tags: ["RAG", "BM25", "Vector Search", "FastAPI", "Cross-Encoder", "Docker"],
  },
  {
    id: "fraud-detection",
    title: "Real-Time Fraud Detection",
    hook: "Scoring transactions at 3,200+ messages per second.",
    description:
      "A streaming pipeline: Kafka ingestion, Spark Structured Streaming and a five-layer detection engine †, with PostgreSQL storage, a Flask API and a monitoring dashboard.",
    bullets: [
      "AUC 0.964 achieved, with severe class imbalance handled using SMOTE",
      "Containerized end-to-end with Prometheus/Grafana observability dashboards",
      "Sub-second scoring pipeline under simulated heavy transactional stream load",
    ],
    status: "Prototype",
    statusDate: "2026",
    lens: "Build",
    tier: "Featured",
    timeframe: "2025 - 2026",
    role: "ML Systems Engineer",
    ownership: "Solo",
    receipts: [
      {
        id: "fraud-rate",
        metric: "3,200+ msg/s",
        label: "throughput",
        context: "Kafka + Spark streaming pipeline load test",
        status: "confirmed",
      },
      {
        id: "fraud-auc-receipt",
        metric: "0.964 AUC",
        label: "model score",
        context: "Evaluated on held-out test split with SMOTE balance",
        status: "confirmed",
      },
    ],
    decisions: [
      {
        title: "Streaming Engine Selection",
        options: ["Raw Python Consumer", "Flink", "Spark Structured Streaming"],
        chosen: "Spark Structured Streaming with Kafka",
        reason: "Micro-batching guarantees fault tolerance, windowed aggregations, and high message throughput.",
        cost: "Higher cluster memory footprint and min 200ms micro-batch latency.",
      },
    ],
    links: {
      writeup: "/work#fraud-detection",
      caseStudyHref: "/work#fraud-detection",
    },
    tags: ["Apache Kafka", "Apache Spark", "SMOTE", "Scikit-Learn", "PostgreSQL", "Flask"],
  },
  {
    id: "archguide",
    title: "ArchGuide",
    hook: "Choosing between RAG, fine-tuning, CAG and hybrid, with the reasoning shown.",
    description:
      "Turns a requirements description into 12 structured signals †, scores the architecture options deterministically, and ranks them with cost analysis and What-If editing. Built as a team project in the HPE Career Preview Program; I worked on the RAG portion †.",
    bullets: [
      "Deterministic scoring layer wrapped around LLM extraction to guarantee auditable results",
      "Decision traces and sensitivity breakdown for every recommended architecture †",
      "Relevance gate and input boundary checks added during system hardening",
    ],
    status: "Deployed",
    statusDate: "2026",
    lens: "Build",
    tier: "Featured",
    timeframe: "Feb - Jul 2026 †",
    role: "RAG & Pipeline Engineer",
    ownership: "Team",
    receipts: [
      {
        id: "archguide-signals",
        metric: "12 signals",
        label: "structured extraction",
        context: "Requirements mapped to technical architectural vectors †",
        status: "unverified",
      },
      {
        id: "archguide-cert",
        metric: "HPE",
        label: "Certificate of Appreciation",
        context: "Team delivery in HPE Career Preview Program †",
        status: "unverified",
      },
    ],
    decisions: [
      {
        title: "Deterministic Scoring vs LLM Direct Recommendation",
        options: ["LLM Prompt Generation", "Deterministic Scoring Engine"],
        chosen: "Deterministic Scoring Engine",
        reason: "Direct LLM recommendations produce non-repeatable drift. Deterministic equations allow auditable sensitivity analysis.",
        cost: "Requires formal rule definitions and maintenance of scoring weights.",
      },
    ],
    links: {
      demo: "#demo",
      writeup: "/work#archguide",
      caseStudyHref: "/work#archguide",
    },
    tags: ["Next.js", "TypeScript", "Deterministic Scoring", "RAG", "LLM Pipelines"],
  },
  {
    id: "acm-platform",
    title: "BMSCE ACM Digital Platform",
    hook: "A chapter website built and run as a product.",
    description:
      "As Webmaster and Technical Head of the BMSCE ACM Student Chapter, I built the chapter site and coordinated the design team †, keeping performance and usability at the core.",
    bullets: [
      "Median load time cut from 15-20 s to about 875 ms after a Cloudflare migration †",
      "Centralized event registrations, chapter member directories and showcase portal",
      "Ongoing reliability, automated deployment workflows and design coordination",
    ],
    status: "Shipped",
    statusDate: "2025",
    lens: "Ship",
    tier: "Featured",
    timeframe: "2024 - 2026",
    role: "Webmaster & Technical Head",
    ownership: "Lead",
    receipts: [
      {
        id: "acm-load",
        metric: "~875 ms",
        label: "median load time",
        context: "Down from 15-20s after CDN & caching overhaul †",
        status: "unverified",
      },
    ],
    links: {
      writeup: "/work#acm-platform",
      caseStudyHref: "/work#acm-platform",
    },
    tags: ["Next.js", "Cloudflare", "Performance", "Team Leadership", "Web Infrastructure"],
  },
];

export const CONDITIONAL_SLOTS = {
  research: {
    id: "samsung-prism",
    title: "Samsung PRISM: 3D Scene Reconstruction & Semantic Understanding",
    subtitle: "Research engagement in a team of six † — Methodology only",
    description:
      "3D scene reconstruction and semantic understanding from images and video †. A technical write-up of the methods: 3D Gaussian Splatting, neural rendering and semantic segmentation models †, detailing validated milestones versus active investigations. Strictest boundary: methodology only, never client use-cases or proprietary specifications.",
    status: "Research in progress" as const,
    lens: "Investigate" as const,
    tier: "Featured" as const,
    highlights: [
      "Investigating 3D Gaussian Splatting for photorealistic real-time view synthesis",
      "Integrating semantic segmentation embeddings for 3D language-guided spatial queries",
      "Benchmarking compute budgets, rendering frame-rates and reconstruction quality",
    ],
    link: "/research",
  },
  currentlyBuilding: {
    id: "ai-erp-assistant",
    title: "AI ERP Assistant",
    subtitle: "Academic ERP assistant with voice, text & local execution",
    description:
      "An intelligent academic ERP assistant with RAG, voice & text interaction, and tool calls into ERP systems. Designed with a dual-mode architecture: runs either fully on AWS, or fully local with zero cloud dependency.",
    status: "In progress" as const,
    lens: "Ship" as const,
    tier: "Featured" as const,
    highlights: [
      "Dual execution modes: Cloud-native (AWS) vs Completely air-gapped local model stack",
      "Structured function calling for student ERP grades, schedules and attendance records",
      "Streaming audio transcription and low-latency synthesis integration",
    ],
    link: "/work#ai-erp-assistant",
  },
};

export const SUPPORTING_PROJECTS: Project[] = [
  {
    id: "rocs-2025",
    title: "ROCS 2025 Website",
    hook: "Conference web presence for international symposium.",
    description: "Built and delivered the official website for ROCS 2025 conference †.",
    bullets: ["Responsive schedule layout", "High-traffic registration portal"],
    status: "Shipped",
    lens: "Ship",
    tier: "Supporting",
    timeframe: "2025",
    role: "Lead Developer",
    ownership: "Solo",
    receipts: [],
    tags: ["Web", "React", "Cloudflare"],
  },
  {
    id: "velvory",
    title: "Velvory E-Commerce Infrastructure",
    hook: "Custom Shopify engineering at Kshipani Tech Ventures †.",
    description: "Delivered custom theme logic, conversion-optimized checkout components, and catalog automation.",
    bullets: ["Storefront optimization", "Inventory automation"],
    status: "Shipped",
    lens: "Ship",
    tier: "Supporting",
    timeframe: "2025 - 2026",
    role: "Technical Intern",
    ownership: "Solo",
    receipts: [],
    tags: ["Shopify", "Liquid", "JavaScript"],
  },
  {
    id: "conversation-os",
    title: "ConversationOS",
    hook: "Experimental conversational knowledge workspace.",
    description: "Four-phase architecture exploration for structured conversational intelligence.",
    bullets: ["Four build phases completed", "Viewer interface under active refactor"],
    status: "In progress",
    lens: "Build",
    tier: "Supporting",
    timeframe: "2025",
    role: "Developer",
    ownership: "Solo",
    receipts: [],
    tags: ["AI", "React", "Vector DB"],
  },
  {
    id: "portfolio-meta",
    title: "This Portfolio: Evidence-First Architecture",
    hook: "ArchGuide design system repurposed with verifiable receipts.",
    description: "Built on Next.js, Framer Motion and Lenis smooth scroll, with an auditable evidence ledger for every claim.",
    bullets: ["Strict typography and motion parity with original ArchGuide", "Zero invented claims"],
    status: "Shipped",
    lens: "Ship",
    tier: "Supporting",
    timeframe: "2026",
    role: "Developer",
    ownership: "Solo",
    receipts: [],
    tags: ["Next.js", "Framer Motion", "TailwindCSS"],
  },
];

export const EXPERIENCE_ITEMS: ExperienceItem[] = [
  {
    id: "hpe",
    engagement: "HPE Career Preview Program",
    role: "Team Project — RAG Engineer",
    timeframe: "Feb – Jul 2026 †",
    type: "Program",
    lens: "Build",
    description:
      "Collaborated in a team to build ArchGuide, a deterministic architectural decision tool. Personally owned the RAG recommendation logic, signal extraction requirements, and relevance gate integration. Methodology only.",
    highlights: [
      "Engineered the RAG architecture evaluation pipeline and deterministic scoring weights",
      "Awarded HPE Certificate of Appreciation for technical delivery †",
      "Strict confidentiality upheld: methodology only, zero proprietary use-case disclosure",
    ],
    status: "unverified",
    link: "/work#archguide",
  },
  {
    id: "samsung",
    engagement: "Samsung PRISM",
    role: "Research Engagement — Team of Six †",
    timeframe: "From Oct 2025 †",
    type: "Research Engagement",
    lens: "Investigate",
    description:
      "Working on 3D scene reconstruction and semantic understanding from images and video †. Investigating 3D Gaussian Splatting and spatial semantic segmentation. Strictly non-employment academic research engagement; methodology only.",
    highlights: [
      "Comparative methodology on Gaussian Splatting vs NeRF representations",
      "Exploration of multi-view semantic feature extraction pipelines",
      "Progress tracked through milestone-gated technical logs",
    ],
    status: "unverified",
    link: "/research",
  },
  {
    id: "kshipani",
    engagement: "Kshipani Tech Ventures",
    role: "Technical Intern",
    timeframe: "Oct 2025 – Jan 2026 †",
    type: "Internship",
    lens: "Ship",
    description:
      "Delivered custom Shopify storefront engineering and operational tools for Velvory †, improving user flows and catalog integration.",
    highlights: [
      "Developed high-converting storefront components and liquid templates",
      "Automated product synchronization workflows and third-party API hooks",
    ],
    status: "unverified",
  },
  {
    id: "acm-exec",
    engagement: "BMSCE ACM Student Chapter",
    role: "Webmaster & Technical Head",
    timeframe: "2024 – Present",
    type: "Appointment",
    lens: "Lead",
    description:
      "Directing technical infrastructure, web engineering and developer initiatives for one of BMSCE's premier computer science chapters.",
    highlights: [
      "Architected and deployed chapter web platform, reducing load times to ~875ms †",
      "Mentored junior developers, coordinated design cohorts, and ran hackathons",
    ],
    status: "unverified",
    link: "/leadership",
  },
];

export const LEADERSHIP_ITEMS: LeadershipItem[] = [
  {
    id: "100-days-of-code",
    title: "100 Days of Code Initiative",
    role: "Program Lead & Technical Coordinator",
    timeframe: "2025 †",
    lens: "Lead",
    description:
      "Expanded the chapter's flagship developer sprint from a 15-day format into a full 100-day rigorous technical journey. Coordinated curriculum, automated submission tracking, and student mentor check-ins.",
    highlights: [
      "Achieved 1,200+ student registrations within approximately three days †",
      "Built automated milestone verification bots and daily leaderboard tracks",
    ],
    metric: "1,200+ Registrations in ~3 Days †",
    status: "unverified",
  },
  {
    id: "utsav-2026",
    title: "UTSAV 2026 — SC Information & Web Development",
    role: "Team Lead",
    timeframe: "2026 †",
    lens: "Lead",
    description:
      "Led a 9-person engineering and design team † responsible for the central digital portal of BMSCE's annual national cultural festival.",
    highlights: [
      "Coordinated cross-functional schedule between UI designers and backend developers",
      "Handled high-concurrency event registration and ticket tracking systems",
    ],
    status: "unverified",
  },
  {
    id: "acm-regional",
    title: "ACM India Council",
    role: "Regional Lead for Karnataka †",
    timeframe: "2025 – 2026 †",
    lens: "Lead",
    description:
      "Represented Karnataka student chapters at regional and national leadership summits. Fostered collaboration between institutional ACM branches.",
    highlights: [
      "ACM India Annual Summit, IIT Hyderabad delegate †",
      "ACM India Chapter Summit Senior Coordinator †",
    ],
    status: "unverified",
  },
];
