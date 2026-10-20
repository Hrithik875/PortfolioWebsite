# Home Page Content

Oct 18, 2026 · @unknown

Draft copy for the six Home blocks in the blueprint, written in first person. Anything in \[brackets\] is a gap for you to fill, and † marks facts that still need your confirmation. The ledger at the end lists every claim the page makes.

## Page title and description

- **Title:** Hrithik | AI/ML engineer
- **Description:** AI/ML engineering student at BMSCE building retrieval, streaming ML and evaluation systems with measured results. Projects, research methodology and leadership.

## 1. Identity and positioning

**Name:** Hrithik \[evidence needed: full name as you want it displayed\]

**Headline (pick one)**

- A: I build AI systems you can inspect.
- B: AI/ML engineer. I show how my systems work and how I measured them.
- C: I build AI systems, and I can show you the evidence.

My recommendation is A. It is short, it is a claim the rest of the site has to back up, and it fits how you work.

**Subhead**

I build intelligent systems you can inspect, ship them as complete products, investigate the hard problems behind them, and help technical communities grow.

**Identity line**

Final-year B.E. student in Artificial Intelligence and Machine Learning at BMSCE, Bengaluru. I work on retrieval, streaming ML and the evaluation behind them, and I lead the technical side of our ACM student chapter.

**Actions:** View my work · Resume (PDF)

**Availability line:** \[evidence needed: graduation month and year, and the roles you want. Example shape: "Graduating in \[month year\]. Open to AI/ML engineering roles."\]

## 2. Start-here paths

**Lead-in:** Four ways in, depending on what you want to know.

| Path | Line | Three stops |
| --- | --- | --- |
| Recruiter | The short version. | Resume · Fraud Detection case study · Experience |
| Engineer | How I make decisions. | ArchGuide decision records · Fraud Detection architecture · JustiBot retrieval evaluation |
| Researcher | The method. | Research page (Samsung PRISM methodology) · JustiBot retrieval experiments · Fraud model comparison † |
| Community | How I lead. | ACM Digital Platform · Leadership page · 100 Days of Code † |

Each stop links to the canonical page, so nothing is written twice.

## 3. Strongest evidence and featured work

### Proof strip

Each number links to its receipt. If a † number cannot be verified before launch, drop it and run the strip with three.

| Number | Label | Receipt needs |
| --- | --- | --- |
| 0.964 AUC at 3,200+ messages/sec | Real-time fraud detection pipeline | \[evidence needed: dataset, hardware, how throughput and AUC were measured\] |
| 6,800+ | Official legal text chunks behind JustiBot † | Source list and ingestion count |
| 15-20 s to about 875 ms | Median page load, ACM chapter site † | Before and after measurements with method |
| 1,200+ in about three days | Registrations for 100 Days of Code † | Registration export or organizer record |
| 9.83 | CGPA, B.E. AI and ML, BMSCE | Official record, with an as-of date |

### Featured work

**JustiBot**

*Hook:* Legal question answering with retrieval you can measure.

An Indian legal assistant built over official legal texts. Dense and BM25 retrieval are merged with reciprocal rank fusion, a cross-encoder reranks the results, and a confidence gate decides when the system should fall back instead of answering.

- Five-metric evaluation suite
- Query classification and hallucination detection
- Containerized, with observability dashboards

Status: \[evidence needed: shipped, prototype or in progress\] · Lens: Build

**Real-Time Fraud Detection**

*Hook:* Scoring transactions at 3,200+ messages per second.

A streaming pipeline: Kafka ingestion, Spark Structured Streaming and a five-layer detection engine †, with PostgreSQL storage, a Flask API and a monitoring dashboard.

- AUC 0.964, with class imbalance handled using SMOTE
- Containerized, with observability dashboards
- &#91;evidence needed: one line on the evaluation setup\]

Status: \[evidence needed\] · Lens: Build

**ArchGuide**

*Hook:* Choosing between RAG, fine-tuning, CAG and hybrid, with the reasoning shown.

Turns a requirements description into 12 structured signals †, scores the architecture options deterministically, and ranks them with cost analysis and What-If editing. Built as a team project in the HPE Career Preview Program; I worked on the RAG portion †.

- A deterministic scoring layer around the LLM
- Decision traces for every recommendation †
- A relevance gate added during hardening

Status: \[evidence needed\] · Lens: Build

**BMSCE ACM Digital Platform**

*Hook:* A chapter website built and run as a product.

As Webmaster and Technical Head of the BMSCE ACM Student Chapter, I built the chapter site and coordinated the design team †.

- Median load time cut from 15-20 s to about 875 ms after a Cloudflare migration †
- &#91;evidence needed: one line on what the site is used for and what you maintain\]

Status: \[evidence needed\] · Lens: Ship

### Two further slots

**Research slot: Samsung PRISM (methodology only)**

3D scene reconstruction and semantic understanding from images and video †. A write-up of the methods: Gaussian splatting, 3D reconstruction and semantic segmentation †, and what has and has not been validated so far. Status: research in progress.

**Currently building: AI ERP Assistant** (show once its status is settled)

An academic ERP assistant with RAG, voice and text, and tool calls into ERP data. It runs in two modes: fully on AWS, or fully local with no cloud dependency. Status: in progress. \[evidence needed: what works end to end today\]

## 4. One demonstration

Pick one. Both captions describe only what the demo does.

- **ArchGuide What-If:** Change one requirement and watch the ranking and its cost estimate change.
- **JustiBot:** Ask a legal question and see the answer, or the fallback when confidence is low. \[evidence needed: confirm the demo shows sources and confidence\]

If a live demo is not ready, use a 60 to 90 second recorded walkthrough with the same caption.

## 5. Experience and leadership

**Experience rail**

- **HPE Career Preview Program** (Feb-Jul 2026 †): team project on ArchGuide; I worked on the RAG portion.
- **Kshipani Tech Ventures, technical intern** (Oct 2025-Jan 2026 †): Shopify work for Velvory †.
- **Samsung PRISM** (from Oct 2025 †): research engagement in a team of six †, on 3D scene reconstruction and semantic understanding.

**Leadership**

Webmaster and Technical Head, BMSCE ACM Student Chapter †. I build and run the chapter's web presence and coordinate its design team.

- 100 Days of Code, expanded from the earlier 15-day format; 1,200+ registrations in about three days †
- UTSAV 2026, SC Information and Web Development, leading a team of nine †
- ACM India Council, Regional Lead for Karnataka †

**Education line**

B.E. in Artificial Intelligence and Machine Learning, BMSCE · CGPA 9.83 · \[pre-university 97.33% †\] · HPE Certificate of Appreciation †

## 6. Closing and contact

Right now I am working on getting the AI ERP Assistant running end to end without any cloud dependency. \[evidence needed: update if this has changed\]

If you are hiring for AI/ML engineering, or working on retrieval, evaluation or streaming systems, I would like to hear from you.

**Email:** \[your address\] · **LinkedIn:** \[link\] · **GitHub:** \[link\] · **Resume:** \[PDF link\]

## Editorial notes

### Evidence ledger

| Claim | Evidence | Ownership | Confidence |
| --- | --- | --- | --- |
| AUC 0.964 at 3,200+ messages/sec | Your project results; run output still needed | Own build \[confirm solo\] | User-reported |
| JustiBot design: hybrid retrieval, reranker, confidence gate, five-metric suite | Your project notes | Own build \[confirm solo\] | User-reported |
| 6,800+ legal chunks | Second draft | Own build | Unverified † |
| ArchGuide: 12 signals, deterministic scoring, What-If | Your notes plus second draft | Team; your RAG portion | Partly user-reported |
| ACM roles and initiatives | Second draft | Your role | Unverified † |
| Load time 15-20 s to about 875 ms | Second draft; method needed | Your work | Unverified † |
| 1,200+ registrations | Second draft | Team initiative | Unverified † |
| Samsung PRISM methods | Your profile plus second draft | Team of six † | Confirm method names are public |
| HPE program dates and certificate | Second draft | Program | Unverified † |
| CGPA 9.83 | Your profile | Yours | User-reported; add an as-of date |

### To confirm before this goes live

1. Whether JustiBot, Fraud Detection and the AI ERP Assistant were solo builds, since the cards say "I" in places.
2. The status of each featured project: shipped, prototype or in progress.
3. Every † item, or drop it from the page.
4. Which Samsung PRISM method names you are comfortable listing publicly.
5. Your availability line, full name and contact links.

### Reader review

**Strongest element:** the proof strip paired with project hooks that name a mechanism (reciprocal rank fusion, a confidence gate, a deterministic scoring layer) rather than an adjective. A skeptical engineer sees decisions, not buzzwords.

**Highest-priority improvement:** the headline promises "inspect", so the 0.964 AUC and 3,200+ messages/sec receipt must be genuinely inspectable (dataset, hardware, method, run output). Everything else on the page borrows its credibility from that one receipt.
