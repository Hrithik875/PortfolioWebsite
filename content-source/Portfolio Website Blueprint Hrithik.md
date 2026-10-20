# Portfolio Website Blueprint: Final

Hrithik · Content and information architecture only · Final merged draft · 18 October 2026

This is the merged blueprint: one site, eight routes, one case-study template, and five signature mechanics that make the site read as a body of evidence rather than a template. It stays on content and structure. Visual design is the next stage and will inherit this structure. Items marked † come from the second draft and need verification before publishing (section 15).

## 1. What was merged

Both drafts agreed on the core: multi-page, case studies over project cards, honest status labels, content before visuals. They differed in emphasis. This is what each contributed and how conflicts were settled.

| Element | Source | Decision |
| --- | --- | --- |
| Positioning thesis (inspectable AI systems) | Draft 1 | Kept as the spine of the site |
| Four identities (AI, software, research, leadership) | Draft 2 | Kept as four "lenses" under that thesis |
| Eight routes incl. Experience, Research, Leadership | Draft 2 | Adopted |
| Lab and Notes | Draft 1 | Lab becomes the Archive tier of Work; Notes arrives in Phase 3 |
| Case-study template | Both | Merged into one 14-part template (section 7) |
| Evidence links, decision log, status badges | Draft 1 | Promoted to site-wide mechanics (section 3) |
| Featured / Supporting / Reference tiers | Draft 2 | Adopted as the organizing hierarchy |
| Full inventory: Kshipani, ACM initiatives, credentials | Draft 2 | Adopted, marked † |
| Confidentiality and claims checklist | Draft 1 | Kept; it overrides homepage choices where they conflict |
| Homepage with six featured projects | Draft 2 | Changed: four proven flagships plus two conditional slots |
| Things to avoid | Draft 2 | Adopted (section 16) |

## 2. Positioning: one thesis, four lenses

The site says one sentence, then shows it from four angles.

> **I build intelligent systems you can inspect, ship them as complete products, investigate the hard problems behind them, and help technical communities grow.**

| Lens | Covers | Primary proof |
| --- | --- | --- |
| Build | AI/ML systems: RAG, LLM applications, streaming ML | JustiBot, Fraud Detection, ArchGuide |
| Ship | Full-stack products, web platforms, dashboards, performance | ACM platform, ROCS 2025 site, Velvory †, AI ERP Assistant |
| Investigate | Research engineering and experiments | Research page, evaluation sections |
| Lead | Technical leadership and community | ACM roles †, 100 Days of Code †, summits †, UTSAV 2026 † |

Every project and experience entry carries one primary lens tag, and Work can be filtered by lens. Web development becomes the "Ship" lens: one of four, never the headline.

## 3. Five signature mechanics

These are what stop the site from reading as a template. They are structural, so they survive any later visual direction.

1. **Receipts on every claim.** Every number carries a small evidence link that opens a receipt: what was measured, the dataset or setup, the date, and a link to the repo, log or dashboard capture. A footer-level **Evidence index** lists every public metric with its receipt. This turns your habit of demanding raw artifacts into the site's signature. Receipts come in three levels so they stay maintainable: headline metrics get a full receipt (method, date, artifacts, limitations); technical claims link to the relevant evaluation, decision record or repository; credentials and dates link to the certificate or official record. Where evidence cannot be public (confidential work), the receipt states the method and its limits and the claim is explicitly qualified, never implied to be publicly verifiable.
2. **Three reading depths per project.** Each case study opens as a 30-second dossier, continues as a 5-minute case study, and ends in a deep dive (decision records, evaluation tables, notebooks). The reader chooses how far to go.
3. **Decision records.** Each flagship carries three to five short records: options considered, what was chosen, why, and what it cost. A **Decisions index** lets visitors browse trade-offs across projects (for example hybrid versus dense retrieval, or deterministic scoring versus LLM-only).
4. **Start-here paths.** The homepage offers four pre-curated three-stop routes: Recruiter, Engineer, Researcher, Community. Each audience reaches its evidence in one click, without the site pretending to be one thing for everyone. Paths are curated selections of three links into the same canonical pages, not separate mini-sites, so updating a project once updates every path that points to it.
5. **Proof you can touch.** One real system runs on the site or plays as a recorded walkthrough on the homepage and on its case study (ArchGuide's What-If analysis or a JustiBot answer with its confidence score are the strongest candidates). The site itself also appears in Work as a case study in the same template.

## 4. Site map

Eight routes and two persistent actions. Two utility pages arrive in Phase 2 and one route in Phase 3.

| Route | Job |
| --- | --- |
| Home | Pass the 30-second test and route each audience |
| Work | The complete catalogue and every case study, in three tiers |
| Research | Investigation-led work, in a format built for research |
| Experience | Programs and engagements as a timeline |
| Leadership | Technical leadership and community impact |
| About | The person, how they work, skills with evidence |
| Resume | PDF plus an on-page version |
| Contact | One clear way in |
| Evidence index (Phase 2) | Every public metric with its receipt |
| Decisions index (Phase 2) | Design trade-offs across all projects |
| Notes (Phase 3) | Technical writing, added only when real articles exist |

Header navigation: Work, Research, Experience, Leadership, About, with Resume and Contact as persistent actions. Each project has one canonical case study. Every other page links to it and never duplicates it.

Content sits in three tiers. **Featured** is signature work with full case studies. **Supporting** is experience and contributions that show breadth, ownership and collaboration. **Reference** is the complete record (credentials, smaller projects, experiments, events), discoverable but never competing with the first two.

## 5. Home

Goal: a recruiter, engineer, researcher or student leader understands the profile and finds their evidence within 30 seconds. The homepage is an editorial overview, not a copy of the resume.

1. **Identity and positioning.** Name, the thesis sentence, one line on education and focus, two actions (View work, Resume), and an availability line (graduation timing and the roles you want).
2. **Start-here paths.** Four routes: Recruiter, Engineer, Researcher, Community. Each is three curated stops into the same canonical pages. The four lenses (Build, Ship, Investigate, Lead) appear here and in Work as ways in, not as a separate block.
3. **Strongest evidence and featured work.** A proof strip of four to five receipts: AUC 0.964 at 3,200+ messages/sec (Fraud Detection); 6,800+ legal chunks † (JustiBot); median load time from 15-20 seconds to about 875 ms † (ACM site); 1,200+ registrations in about three days † (100 Days of Code); CGPA 9.83. Below it, four flagship previews: JustiBot, Fraud Detection, ArchGuide, BMSCE ACM Digital Platform. Each shows the problem, what was built, your contribution, one headline result and a status badge. Two further slots: a research slot for Samsung PRISM (methodology only) and a "Currently building" slot for the AI ERP Assistant once its status is settled.
4. **One demonstration.** A live or recorded demo of a flagship system.
5. **Experience and leadership.** An experience rail (HPE Career Preview Program, Kshipani Tech Ventures †, Samsung PRISM) and the ACM role with two or three headline initiatives, plus one compact line for education and credentials. Leadership is a differentiator, so it stays on the homepage.
6. **Closing and contact.** What you are exploring now, plus email, LinkedIn and GitHub.

## 6. Work

Goal: the whole portfolio, organized so a major system never looks like a practice exercise.

1. **Introduction.** Two sentences on the kinds of problems you work on and how you document them.
2. **Filters.** By lens (Build, Ship, Investigate, Lead) and by status.
3. **Featured tier.** Large entries with full case studies: JustiBot, Fraud Detection, ArchGuide, BMSCE ACM Digital Platform, plus the AI ERP Assistant once its status is settled and Samsung PRISM (methodology only).
4. **Supporting tier.** Mid-size entries with a short page: ROCS 2025 website †, Shopify Velvory work †, ConversationOS (until its open viewer bug is fixed), and this site's own case study.
5. **Archive tier.** A compact list of everything else: smaller web apps, prototypes, automation, DSA and systems experiments, hackathons. One or two lines each, with year, status, tags and links.

Every entry shows the same fields: name, lens, one-sentence problem, your contribution, one piece of evidence, status badge, and a link. Status badges are Shipped, Deployed, Prototype, In progress, Research in progress and Archived, each with a last-verified date. A project is never presented as production-ready just because a demo or repository exists. Internally each entry records two attributes: development status (In progress, Prototype, Completed, Archived) and delivery status (Not deployed, Deployed, Demo-only). The public badge shows one concise combination of the two.

## 7. The case-study template

Every Featured project uses this skeleton, adapted to the project. Not every project needs every part: include a section only when it adds evidence or understanding. A research project swaps in research question, experimental setup, findings and limitations; a website project swaps in user needs, design decisions, performance and delivery. Parts 1 and 2 are the 30-second depth, parts 3 to 12 the 5-minute depth, and the decision records and evaluation material (7 to 9) are the deep dive.

1. **Header.** Title, one-line summary, status, lens, timeframe, solo or team, links (repo, demo, video).
2. **Dossier.** Problem, approach and result in three lines, plus two or three receipts.
3. **Problem and context.** Who it serves and what was hard, missing or inefficient.
4. **My role.** Your responsibilities, with a clear line between your work and the team's. Every case study answers one question here: what did I personally own, and how do we know? Back it with specific artifacts or decisions. For research, the equivalent is what I implemented, what I investigated and what has actually been validated.
5. **Constraints.** Latency, data, compute, privacy, time.
6. **System.** Architecture diagram, components, data flow.
7. **Decision records.** Three to five: options, choice, reason, cost.
8. **Hard problems.** Two or three real obstacles and how you diagnosed them.
9. **Evaluation.** Method, metrics, raw artifacts, stated limitations.
10. **Operations.** Dashboards, monitoring, containerization, deployment path.
11. **Results.** Final numbers, each with a receipt.
12. **Touchable proof.** Demo video, live link, screenshots.
13. **What I learned and would change.** Limitations and the next question.
14. **Links.** Repository, related decisions, next and previous project.

Project-specific angles:

- **JustiBot.** Indian legal assistant over 6,800+ official legal text chunks †. Lead with "how do you know a RAG answer is right?" Cover hybrid dense and BM25 retrieval, reciprocal rank fusion, cross-encoder reranking, query classification, confidence-gated fallback, hallucination detection, caching and the five-metric evaluation suite. A retrieval ablation (BM25 only, dense only, hybrid, hybrid plus reranking) is the centerpiece if you have or can run the data.
- **Fraud Detection.** Kafka ingestion, Spark Structured Streaming, a five-layer detection engine †, PostgreSQL, Flask API and dashboard. Include SMOTE handling, the Logistic Regression versus Random Forest comparison †, AUC 0.964 at 3,200+ messages/sec with dataset and measurement conditions, and an evaluation-integrity section on testbed versus system-under-test separation and score leakage, if the final design settled them.
- **ArchGuide.** Requirement extraction into 12 structured signals †, deterministic scoring, ranked recommendations across RAG, fine-tuning, CAG and hybrid, cost analysis, decision traces and What-If analysis. Explain why a deterministic layer matters even though an LLM is involved, and tell the relevance-gate and hardening story. Built in the HPE Career Preview Program as a team project; state your RAG contribution precisely and describe the methodology only, never HPE's use case or plans.
- **BMSCE ACM Digital Platform.** Your ownership, coordination of the design team †, delivery and maintenance, and the performance work (Cloudflare migration, median load time 15-20 s to about 875 ms †) only with the measurement method beside it.
- **AI ERP Assistant.** Dual-mode design (full AWS stack or local and AWS-independent), RAG, voice and text, ERP tool-calling. Include a short table of what works in each mode.

## 8. Research

Goal: give investigation-led work its own format. It needs a research question, constraints, evidence and honest status, not a product description.

1. **Featured research: Samsung PRISM (methodology only).** 3D scene reconstruction and semantic understanding from images and video †. Blocks: the technical research question; the methodology (Gaussian splatting, 3D reconstruction, semantic segmentation, semantic object queries †) with the reason each was chosen; experimental setup and constraints (reconstruction quality, compute, processing time); a dated progress log separating completed milestones from work in progress; findings, listing only what has been validated. No paper or finished result is implied before it exists.
2. **Technical investigations.** A smaller section for experiments that do not need their own case study: JustiBot retrieval experiments, the fraud model comparison, ArchGuide's scoring and trade-off analysis, and reading notes on the public Semantic Gaussians paper and repository.
3. **Publications and talks.** Added as a section here only when real papers, posters or reports exist.

The page shows what was investigated and learned, not just which technologies were used. **Boundary:** it covers methodology only, never the use case or how Samsung intends to use the work. The same rule applies to HPE-related work everywhere on the site.

## 9. Experience

Goal: a career timeline, not another project list. Each entry answers four questions: what was the engagement, what were you responsible for, what did you build or improve, and what evidence supports it.

| Engagement | When | Type | Content |
| --- | --- | --- | --- |
| HPE Career Preview Program | Feb-Jul 2026 † | Program, team project | ArchGuide and your RAG contribution, collaboration with teammates and mentors, Certificate of Appreciation †, link to the case study; methodology only |
| Kshipani Tech Ventures | Oct 2025-Jan 2026 † | Technical intern | Shopify Velvory work, what you personally delivered, how it supported the business |
| Samsung PRISM | From Oct 2025 † | Research engagement, team of six † | Cross-link to Research; methodology only; never labelled as employment |
| BMSCE ACM Student Chapter | Ongoing | Leadership appointment | Cross-link to Leadership |

Label each engagement by its true type (program, internship, research engagement, appointment). The accurate label makes the whole page more credible.

## 10. Leadership

Goal: show impact beyond individual coding tasks. Two parts.

1. **BMSCE ACM Student Chapter.** Lead with the Webmaster and Technical Head role and the chapter website as a real product: ownership, design-team coordination, delivery, maintenance, recruitment work. Performance results appear here with their method.
2. **Initiatives and events.** Major initiatives get a short entry (objective, your role, who or what you coordinated, outcome). Smaller roles go in one chronological timeline.

| Initiative | Treatment |
| --- | --- |
| 100 Days of Code † | Own entry: expansion from the 15-day format, your role, 1,200+ registrations in about three days † |
| ROCS 2025 website † | Own entry, linked to its Work case study |
| UTSAV 2026, SC Information and Web Development † | Own entry: leading a nine-person team † |
| ACM India Annual Summit, IIT Hyderabad † | Timeline entry with exact role |
| ACM India Chapter Summit, Senior Coordinator † | Timeline entry with scope of coordination |
| ACM India Council, Regional Lead Karnataka † | Timeline entry with regional responsibilities |

The page should make one point: you contribute to technical communities through both engineering and organization.

## 11. About

Goal: make the site feel like it belongs to a person. It tells the story and does not repeat the resume.

1. **Introduction.** 150 to 250 words, first person: what you enjoy building and how AI/ML, software and product work meet.
2. **How I work.** Four or five principles in your voice: evidence over assertion, raw artifacts as the standard of proof, mechanical and auditable methods over subjective scoring, complete validated work over patches, and building only what you can defend under questioning. Each carries a one-line example from a real project.
3. **Journey.** From studying AI and ML at BMSCE to building AI applications, research-oriented engineering, professional projects and student leadership.
4. **Skills with evidence.** Grouped by lens, each skill linking to the project that demonstrates it. No bare keyword lists.
5. **Education.** Degree, institution, CGPA, pre-university result †.
6. **Now.** What you are building, learning and reading, with a date.
7. **Beyond projects.** A short, genuinely personal section (interests of your choosing).

## 12. Resume and Contact

**Resume.** A PDF download, an on-page readable version consistent with it, and a last-updated date. One canonical public version; role-specific variants stay private.

**Contact.** A short invitation, what to reach out about (roles, collaboration, research, project questions), email, LinkedIn, GitHub, resume, and an optional simple form. Contact details also appear on Home and in the footer, so nobody has to visit a separate page to find them.

## 13. Rules that apply on every page

- **Receipts everywhere.** No number without its evidence link.
- **Honest status.** Every project and engagement carries a status badge and a last-verified date.
- **One canonical page per project.** Cross-links replace duplicates.
- **One entry format.** Year, name, role, lens, outcome, used on every list so entries scan quickly.
- **Lens tags.** Every entry carries its primary lens.
- **Contact always reachable.** Resume and Contact are available from every page.
- **Small-screen order.** The 30-second story (opening, paths, proof, flagship work) keeps the same order on a phone.
- **Page metadata.** Every page and case study has a clear title, description and social preview.

## 14. Content inventory

| Item | Tier | On hand | Still to produce |
| --- | --- | --- | --- |
| JustiBot | Featured | Architecture and evaluation design | Diagram, retrieval ablation, demo video, dashboard captures |
| Fraud Detection | Featured | Pipeline, metrics | Dataset and measurement notes, diagram, dashboard captures, integrity write-up |
| ArchGuide | Featured | Design, hardening history | Diagram, What-If walkthrough, methodology-only framing |
| BMSCE ACM Digital Platform | Featured | Role and claims † | Before-and-after measurements with method, screenshots, team scope |
| AI ERP Assistant | Featured when ready | Public repo, local-mode work | Working end-to-end demo, per-mode status table |
| Samsung PRISM | Featured research | Details † | Methodology write-up, milestone log, method diagrams |
| ROCS 2025 site, Shopify Velvory | Supporting | Claims † | Screenshots, exact contribution |
| ConversationOS | Supporting | Four build phases | Fix the open viewer bug, then a demo |
| Archive projects | Reference | Not yet listed | Full list: one line, year, status, link each |
| Credentials | Reference | Claims † | Verified CGPA, certificate links |
| Headshot and bios | Global | None | Headshot; 1-line, 50-word and 150-word bios |
| Resume | Global | LaTeX resume | One canonical public version |

## 15. Verify before publishing

The † items came from the second draft or from earlier notes. I have not confirmed them, and nothing should go live until you have.

- **Dates and roles †:** Kshipani internship (Oct 2025-Jan 2026), Velvory scope, HPE program (Feb-Jul 2026), all ACM titles and the summit roles, UTSAV 2026 and the team of nine, Samsung PRISM start date and team of six.
- **Numbers †:** 6,800+ legal chunks, 12 ArchGuide signals, the five-layer detection engine, 1,200+ registrations, the 15-20 s to about 875 ms load-time change, the pre-university result. Each needs a receipt you can produce.
- **Confidentiality:** Decided: for Samsung PRISM and the HPE program the site covers methodology only. It never describes the use case or how Samsung or HPE plan to use the work. Check every page about them against that rule, and list only method names you are comfortable making public.
- **Status honesty:** ConversationOS has an open bug, and the AI ERP Assistant needs a settled status. Do not feature either as shipped until it is.
- **Stays private:** the interview handbooks, the HR story bank and company-specific preparation. Only generic technical explainers could ever become Notes.
- **Nothing invented:** no testimonials, awards, publications or adoption figures to fill space.

## 16. What to avoid

- A homepage that repeats the resume line by line.
- One large grid in which a major AI system looks like a practice project.
- A page for every event attended.
- A separate showcase for each technology used.
- Presenting research in progress as completed work.
- Big performance figures without their measurement context.
- Blog, publications, testimonials or awards pages created only to fill the navigation.

## 17. Build order

1. **Phase 1, the core story.** Home, Work with the four flagship case studies (JustiBot, Fraud Detection, ArchGuide, ACM platform), Experience, Leadership, About, Resume, Contact. Research ships with the methodology-only Samsung PRISM write-up.
2. **Phase 2, completeness.** Remaining case studies (AI ERP Assistant, ROCS 2025, Velvory, this site), the Archive tier, the Evidence index and the Decisions index.
3. **Phase 3, depth.** Notes and publications, only when real material exists.

Phase 1 alone already differs from most portfolios, because every claim has a receipt and every flagship shows its decisions.

## 18. Decisions I need from you

1. **Archive scope.** Literally every project and activity, or every meaningful achievement plus a complete archive of substantial projects? I recommend the second: comprehensive about the journey, selective about the spotlight.
2. **Samsung PRISM.** Resolved: methodology only, never the use case or how Samsung or HPE plan to use the work. Still to confirm: which specific methods you are comfortable naming.
3. **The † list.** Which items are confirmed, and which need correcting?
4. **Availability line.** Graduation timing and the roles you want it to name.
5. **Live demo.** Which system should be touchable on Home: ArchGuide What-If or a JustiBot answer?
6. **Archive list.** The full list of smaller web and AI projects, with one line and a link each.

Settle question 3 first, and the method names in question 2. They decide what the homepage can responsibly show, so they come before wireframing.
