# ArchGuide → Portfolio: Inventory and Mapping

**Date:** 2026-10-18  
**Status:** Awaiting approval before build begins

---

## 1. Routes

| # | ArchGuide Route | File(s) | Purpose | Portfolio Mapping |
|---|---|---|---|---|
| 1 | `/` | `src/app/page.tsx` | Landing page: hero, features (RAG/FT/CAG cards), process steps, CTA | **Home** — repurposed into 6 blocks (identity, start-here paths, proof strip + featured work, demo, experience & leadership, closing & contact) |
| 2 | `/projects` | `src/app/projects/page.tsx` | User project list (CRUD, search, filters) | **Work** — becomes the portfolio catalogue with lens filters (Build/Ship/Investigate/Lead), tiers (Featured/Supporting/Archive) |
| 3 | `/projects/[projectId]/analyze` | `src/app/projects/[projectId]/analyze/` | Analysis wizard (document upload, questionnaire, chat) | **Remove** — no portfolio equivalent |
| 4 | `/results/[analysisId]` | `src/app/results/[analysisId]/page.tsx` | Results dashboard (scores, decision trace, What-If, cost) | **Remove** — no portfolio equivalent (demo block on Home reuses the What-If visual if needed) |
| 5 | `/r/[id]` | `src/app/r/[id]/page.tsx` | Short URL redirect for shared analyses | **Remove** — no portfolio equivalent |
| 6 | `/privacy-policy` | `src/app/privacy-policy/page.tsx` | Legal page | **Keep** — update text for portfolio |
| 7 | `/terms-of-service` | `src/app/terms-of-service/page.tsx` | Legal page | **Keep** — update text for portfolio |

### New portfolio routes (not in ArchGuide)

| Route | Reuses | Content |
|---|---|---|
| `/work` | Projects page layout (grid, filters, AnimatedSection) | Project catalogue with Featured/Supporting/Archive tiers |
| `/research` | Projects page layout | Samsung PRISM methodology, technical investigations |
| `/experience` | Process-steps vertical list pattern | Timeline of engagements |
| `/leadership` | Process-steps vertical list + feature-cards grid | ACM role, initiatives, events |
| `/about` | Hero + feature-cards + process-steps patterns | Bio, principles, journey, skills, education |
| `/resume` | Simple centered layout | PDF download + on-page version |
| `/contact` | CTA section pattern | Contact form/links |

---

## 2. Layouts

| Layout | File | Description | Portfolio Mapping |
|---|---|---|---|
| Root layout | `src/app/layout.tsx` | `<html>` shell: ThemeProvider → AuthProvider → LenisProvider → GlobalBackground → Navbar → main → Footer | **Keep structure.** Remove `AuthProvider` (no auth needed). Keep ThemeProvider, LenisProvider, GlobalBackground, Navbar, Footer. |
| Template (transitions) | `src/app/template.tsx` | Framer Motion fade in/out on route change (opacity 0→1→0, 0.5s easeInOut) | **Keep byte-identical** — locked file |
| Projects layout | `src/app/projects/layout.tsx` | Minimal wrapper | Repurpose for `/work` if needed |
| Results layout | `src/app/results/[analysisId]/layout.tsx` | Minimal wrapper | **Remove** |

---

## 3. Section Types (Home Page)

| # | ArchGuide Section | Pattern | Portfolio Section | Content Change |
|---|---|---|---|---|
| 1 | **Hero** — sparkle pill badge, 2-line hero text (CSS `hero-rise` animation), subhead, CTA button with Magnetic wrap | Full-viewport centered, scroll-linked opacity/scale transforms on desktop | **Identity & positioning** — pill badge → "AI/ML ENGINEER", hero lines → "I Build AI Systems / You Can Inspect.", subhead → thesis sentence, CTA → "View My Work" + "Resume" | Text only; same structure |
| 2 | **Luxury scroll gap** | `<div className="h-[20vh]">` | **Keep** — same spacer between hero and next section |
| 3 | **Features** — section header (2-line reveal text), 3-col grid of glass cards with icon, title, description; hover inverts colors | Cards with `rounded-[3rem]`, staggered whileInView, inner glow | **Start-here paths** — 4 cards (Recruiter, Engineer, Researcher, Community) instead of 3; each card: icon + path name + one-liner + 3 stop links | Same card component, add a 4th. Fields change from {icon, title, desc} to {icon, pathName, line, stops[]} |
| 4 | **Process** — section header, vertical list of 3 numbered step cards with icon, title, desc; hover inverts | `rounded-[3.5rem]`, step number, flex row on desktop | **Proof strip + Featured work** — top: horizontal proof-strip of 4-5 metric badges. Below: 4-6 project cards using the process-card shape, but with project fields: title, hook, problem, contribution, result, lens badge, status badge | Proof strip is new inline element (composed from existing badge styles). Project cards reuse the step-card shape with different fields |
| 5 | **CTA** — inverted-color section with DottedSurface (Three.js particles), 2-line reveal heading, subhead, Magnetic CTA button | `rounded-[5rem]`, inverted theme colors | **Closing & contact** — "Let's Connect. / And Build." + contact links + availability line | Text only |

---

## 4. Components Inventory

### A. Shell & Infrastructure (KEEP — locked or near-locked)

| Component | File | Role | Changes for Portfolio |
|---|---|---|---|
| `ThemeProvider` | `src/components/ThemeProvider.tsx` | next-themes wrapper, dark default | **Byte-identical** |
| `LenisProvider` | `src/components/LenisProvider.tsx` | Smooth scroll + LazyMotion | **Byte-identical** |
| `GlobalBackground` | `src/components/GlobalBackground.tsx` | Vanta.js globe, lazy-loaded | **Byte-identical** |
| `GlobalBackgroundLoader` | `src/components/GlobalBackgroundLoader.tsx` | Dynamic import wrapper | **Byte-identical** |
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | Class component error UI | **Byte-identical** |
| `AnimatedScroll` (`AnimatedSection`, `AnimatedText`) | `src/components/AnimatedScroll.tsx` | Scroll-triggered fade/reveal | **Byte-identical** |
| `Magnetic` | `src/components/Magnetic.tsx` | Cursor-follow hover effect | **Byte-identical** |
| `Typewriter` | `src/components/Typewriter.tsx` | Character-by-character reveal | **Byte-identical** |
| `template.tsx` | `src/app/template.tsx` | Page transition | **Byte-identical** |
| `globals.css` | `src/app/globals.css` | Design tokens, glass-panel, hero-rise, scrollbar, mobile perf | **Byte-identical** (except: remove `.archguide-chat-input` and `.archguide-messages` scrollbar rules — ArchGuide-specific) |

### B. Navbar

| Component | File | Key Features | Changes |
|---|---|---|---|
| `Navbar` | `src/components/Navbar.tsx` | Morphing sphere→pill→bar, desktop/mobile split, theme toggle, scroll-based phase, active tab pill, mobile full-screen menu | **Content change:** links → `[Home, Work, Research, Experience, Leadership, About]`, right-side actions → Resume button + Contact button (instead of Sign In / user avatar). Remove: auth state, user menu, project count badge, AuthModal, WelcomeBanner imports and usage. Logo: Hexagon icon → keep Hexagon or swap icon, brand text → "Hrithik." |

### C. Footer

| Component | File | Key Features | Changes |
|---|---|---|---|
| `Footer` | `src/components/Footer.tsx` | Two-column link grid, giant brand text with letter-by-letter animation, bottom bar with legal links | **Content change:** heading → "Let's build / something.", link columns → Navigation (Home, Work, Research, Experience, Leadership, About) + Connect (Resume, Contact, GitHub, LinkedIn). Brand text → "HRITHIK." Bottom bar: keep Privacy Policy/Terms, add © line. Remove: Hexagon icon reference to ArchGuide |

### D. CTA Section

| Component | File | Key Features | Changes |
|---|---|---|---|
| `ReadyToArchitect` / `DottedSurface` | `src/components/CTA.tsx` | Inverted-color box with Three.js particle wave, 2-line heading, subhead, CTA button | **Content change:** heading → "Let's Connect. / And Build." Subhead → availability line. Button → "Get in Touch" linking to `/contact`. DottedSurface stays identical. |

### E. ArchGuide-Specific (REMOVE)

These components have no portfolio equivalent and will be deleted:

| Component | File | Reason |
|---|---|---|
| `ArchGuideChat` | `src/components/ArchGuideChat.tsx` | Backend-dependent chat widget |
| `AuthModal` | `src/components/AuthModal.tsx` | Firebase auth modal |
| `CostAnalysis` | `src/components/CostAnalysis.tsx` | Architecture cost comparison |
| `CreateProjectModal` | `src/components/CreateProjectModal.tsx` | Project CRUD modal |
| `DecisionPipeline` | `src/components/DecisionPipeline.tsx` | Architecture decision visualization |
| `DecisionTrace` | `src/components/DecisionTrace.tsx` | Decision trace display |
| `DocumentUpload` | `src/components/DocumentUpload.tsx` | File upload for analysis |
| `AnalysisHistory` | `src/components/AnalysisHistory.tsx` | Analysis run history |
| `ProjectCard` | `src/components/ProjectCard.tsx` | ArchGuide project CRUD card |
| `QuestionnaireForm` | `src/components/QuestionnaireForm.tsx` | Analysis questionnaire |
| `ResultsDashboard` | `src/components/ResultsDashboard.tsx` | Analysis results view |
| `ShareButton` | `src/components/ShareButton.tsx` | Share analysis link |
| `WelcomeBanner` | `src/components/WelcomeBanner.tsx` | Post-auth welcome |
| `WhatIfEditor` | `src/components/WhatIfEditor.tsx` | What-If parameter editor |

### F. Lib/Backend (REMOVE)

| File | Reason |
|---|---|
| `src/lib/api.ts` | Backend API calls |
| `src/lib/api-base.ts` | API base URL config |
| `src/lib/auth-context.tsx` | Firebase auth context |
| `src/lib/auth-token.ts` | Auth token management |
| `src/lib/firebase.ts` | Firebase init, Google Sign-In |
| `src/lib/projects-store.ts` | IndexedDB/backend project storage |
| `src/types/vanta.d.ts` | Keep (still used by GlobalBackground) |

### G. New Portfolio Components (composed from existing primitives)

| New Component | Based On | Purpose |
|---|---|---|
| `PortfolioCard` | Process step card styling (`rounded-[2rem]`, border, surface bg, hover invert, staggered whileInView) | Displays a project with: title, hook, problem, contribution, result, lens tag, status badge |
| `ProofStrip` | Feature card badge/pill styles | Horizontal row of 4-5 metric badges with values |
| `PathCard` | Feature card (3-col grid, `rounded-[3rem]`, icon, hover invert) | Start-here audience path with 3 stop links |
| `TimelineEntry` | Process step card | Experience/leadership timeline item |
| `StatusBadge` | ProjectCard `statusConfig` pill style | Shipped / Deployed / Prototype / In progress / Research in progress |
| `LensBadge` | ProjectCard `archConfigs` tag style | Build / Ship / Investigate / Lead |

---

## 5. Animation & Transition Mechanisms

| Mechanism | Where | Locked? |
|---|---|---|
| CSS `hero-rise` / `hero-rise-delay` keyframes | `globals.css` L173-190 | ✅ Yes |
| Framer Motion `m.section` scroll-linked opacity/scale transforms | `page.tsx` (useScroll, useTransform) | Pattern reused, values unchanged |
| `AnimatedSection` — whileInView fade+slide up | `AnimatedScroll.tsx` | ✅ Yes |
| `AnimatedText` — line-by-line clip reveal | `AnimatedScroll.tsx` | ✅ Yes |
| Navbar morphing (sphere ↔ pill ↔ top bar) with spring physics | `Navbar.tsx` | ✅ Keep mechanism, change content |
| Footer letter-by-letter rise animation | `Footer.tsx` | ✅ Keep mechanism, change text |
| `Magnetic` cursor effect | `Magnetic.tsx` | ✅ Yes |
| `Typewriter` character animation | `Typewriter.tsx` | ✅ Yes |
| Page transition fade (template.tsx) | `template.tsx` | ✅ Yes |
| Lenis smooth scroll | `LenisProvider.tsx` | ✅ Yes |
| GlobalBackground Vanta globe | `GlobalBackground.tsx` | ✅ Yes |
| DottedSurface Three.js particles | `CTA.tsx` | ✅ Yes |
| `glass-panel` / `glass-panel-hover` CSS | `globals.css` L104-117 | ✅ Yes |
| `gradient-text` CSS | `globals.css` L120-132 | ✅ Yes |
| `prefers-reduced-motion` — handled via `isMobile` checks in AnimatedScroll, LenisProvider, GlobalBackground | Various | ✅ Keep as-is |

---

## 6. ArchGuide-Specific Copy/Data Locations

Every place that contains ArchGuide branding, HPE references, or product-specific copy:

| File | Line(s) | Content | Action |
|---|---|---|---|
| `src/app/layout.tsx` | L20-24 | Title "ArchGuide", description about RAG/FT/CAG | Replace with portfolio metadata |
| `src/app/layout.tsx` | L36-38 | Firebase preconnect links | Remove |
| `src/app/layout.tsx` | L8, L42, L56 | AuthProvider import and wrapper | Remove |
| `src/app/page.tsx` | L59 | "Architecture Intelligence" badge | Replace |
| `src/app/page.tsx` | L70-76 | "Design Your / Architecture." hero text | Replace |
| `src/app/page.tsx` | L83-85 | "Stop guessing between RAG…" subhead | Replace |
| `src/app/page.tsx` | L92 | "Begin Analysis" CTA | Replace |
| `src/app/page.tsx` | L122-134 | "Unparalleled / Precision." + features subhead | Replace |
| `src/app/page.tsx` | L148-150 | RAG/Fine-Tuning/CAG feature cards data | Replace |
| `src/app/page.tsx` | L221 | "The Process." heading | Replace |
| `src/app/page.tsx` | L228-230 | Process step data (Requirements, Signals, Architecture) | Replace |
| `src/components/Navbar.tsx` | L266, L344 | "ArchGuide." brand text | Replace with "Hrithik." |
| `src/components/Navbar.tsx` | L102-107 | navLinks array (Home, Features, How It Works, Projects) | Replace with portfolio links |
| `src/components/Navbar.tsx` | L9, L37 | Auth imports and usage | Remove |
| `src/components/Footer.tsx` | L23-38 | footerLinks (Navigation + Product columns) | Replace |
| `src/components/Footer.tsx` | L41, L133 | "ARCHGUIDE." brand text | Replace |
| `src/components/Footer.tsx` | L73-74 | "Experience / liftoff." heading | Replace |
| `src/components/CTA.tsx` | L202, L213 | "Stop Guessing. / Start Building." | Replace |
| `src/components/CTA.tsx` | L219 | "Transform your business needs…" | Replace |
| `src/components/CTA.tsx` | L231 | "Begin Analysis" button | Replace |
| `src/app/privacy-policy/page.tsx` | All | ArchGuide privacy policy | Replace with portfolio policy |
| `src/app/terms-of-service/page.tsx` | All | ArchGuide terms | Replace with portfolio terms |
| `public/logo.svg` | All | ArchGuide logo SVG | Remove or replace |
| `src/app/logo.png` | All | ArchGuide logo PNG | Remove or replace |
| `globals.css` | L146-163 | `.archguide-chat-input`, `.archguide-messages` rules | Remove (ArchGuide-specific, but file is "locked" — see note) |

---

## 7. Proposed Mapping: ArchGuide Section → Portfolio Section

### Home Page (6 blocks from blueprint)

```
┌──────────────────────────────────────────────────────────────┐
│ BLOCK 1: Identity & Positioning                              │
│ Reuses: Hero section (hero-rise, AnimatedSection, Magnetic)  │
│ Badge: "AI/ML ENGINEER"                                      │
│ H1: "I Build AI Systems" / "You Can Inspect."               │
│ Subhead: thesis sentence                                     │
│ Identity line: education + focus                             │
│ Actions: "View My Work" → /work, "Resume" → /resume         │
│ Availability: [evidence needed]                              │
├──────────────────────────────────────────────────────────────┤
│ BLOCK 2: Start-Here Paths                                    │
│ Reuses: Features 3-col grid → 4-col grid (same card style)  │
│ Lead-in: "Four ways in…"                                     │
│ 4× PathCard: Recruiter, Engineer, Researcher, Community      │
│ Each: icon + name + one line + 3 stop links                  │
├──────────────────────────────────────────────────────────────┤
│ BLOCK 3: Proof Strip + Featured Work                         │
│ Proof strip (new composition): 4-5 metric pills inline      │
│ Reuses: badge/pill styles from existing components           │
│ Featured work grid:                                          │
│ Reuses: Process step card shape for PortfolioCards           │
│ 4 cards: JustiBot, Fraud Detection, ArchGuide, ACM Platform │
│ + Research slot (Samsung PRISM) + Currently-building slot    │
│ Each card: title, hook, problem, contribution, result,       │
│            lens badge, status badge                           │
├──────────────────────────────────────────────────────────────┤
│ BLOCK 4: Demo                                                │
│ Reuses: CTA section shape (inverted box, DottedSurface)      │
│ Content: embedded ArchGuide What-If or JustiBot demo         │
│ Caption: "Illustrative fixture, not real output"             │
│ (or a 60-90s video walkthrough if live demo not ready)       │
├──────────────────────────────────────────────────────────────┤
│ BLOCK 5: Experience & Leadership                             │
│ Reuses: Process step cards (numbered, vertical list)         │
│ Experience rail: 3 entries (HPE, Kshipani, Samsung PRISM)    │
│ Leadership: ACM role + 2-3 initiatives                       │
│ Education line: compact, one row                             │
├──────────────────────────────────────────────────────────────┤
│ BLOCK 6: Closing & Contact                                   │
│ Reuses: CTA section (ReadyToArchitect pattern)               │
│ Heading: "Let's Connect. / And Build."                       │
│ What I'm working on now + contact links                      │
└──────────────────────────────────────────────────────────────┘
```

### Other Pages

| Page | Reuses | Sections |
|---|---|---|
| `/work` | Projects page grid + filters + AnimatedSection | Intro, lens/status filters, Featured tier (large cards), Supporting tier (mid cards), Archive tier (compact list) |
| `/research` | Process-step cards + AnimatedSection | Featured research (Samsung PRISM), Technical investigations, Publications (placeholder) |
| `/experience` | Process-step vertical list | Timeline entries for HPE, Kshipani, Samsung PRISM, ACM |
| `/leadership` | Feature cards + process-step list | ACM role section, initiative entries, chronological timeline |
| `/about` | Hero + feature cards + process-step list | Intro, "How I work" principles, journey, skills-with-evidence, education, now, beyond projects |
| `/resume` | Simple centered layout (from legal pages) | PDF download button, on-page version, last-updated date |
| `/contact` | CTA section | Short invitation, contact links, optional form |

---

## 8. Card Field Mapping

### ArchGuide ProjectCard fields → Portfolio PortfolioCard fields

| ArchGuide Field | Portfolio Field | Notes |
|---|---|---|
| `project.name` | `project.title` | Direct mapping |
| `project.description` | `project.hook` | One-line hook |
| `project.status` (empty/in_progress/completed) | `project.status` (Shipped/Deployed/Prototype/In progress/Research in progress/Archived) | Extended status enum |
| `project.recommended_architecture` (RAG/FT/CAG/Hybrid) | `project.lens` (Build/Ship/Investigate/Lead) | Reuses the same colored-badge pattern with new labels/colors |
| — | `project.problem` | New: one-line problem statement |
| — | `project.contribution` | New: what Hrithik did |
| — | `project.result` | New: one headline result |
| `project.updated_at` | `project.lastVerified` | Renamed to "last verified" |
| Edit/Delete/Duplicate/Share actions | — | Removed (portfolio is read-only) |

### Badge/Tag Color Mapping

| ArchGuide Arch | CSS Vars | → Portfolio Lens | New CSS Vars |
|---|---|---|---|
| RAG (emerald) | `--rag-*` | Build | Reuse `--rag-*` (green = build) |
| Fine-Tuning (blue) | `--finetuning-*` | Ship | Reuse `--finetuning-*` (blue = ship) |
| CAG (amber) | `--cag-*` | Investigate | Reuse `--cag-*` (amber = investigate) |
| Hybrid (red) | `--hybrid-*` | Lead | Reuse `--hybrid-*` (red = lead) |

> These color variables are in `globals.css` and remain byte-identical. The only change is the label text.

---

## 9. Data Architecture

Portfolio content goes in typed data files under `src/data/`:

```
src/data/
├── home.ts          # All 6 home blocks
├── projects.ts      # All project entries (Featured + Supporting + Archive)
├── experience.ts    # Timeline entries
├── leadership.ts    # ACM role + initiatives
├── research.ts      # Samsung PRISM + investigations
├── about.ts         # Bio, principles, journey, skills
├── proof-strip.ts   # Metrics with evidence status
├── paths.ts         # Start-here 4 paths
├── contact.ts       # Contact info
└── types.ts         # Shared TypeScript types with EvidenceStatus
```

Every fact carries:

```typescript
type EvidenceStatus = 'confirmed' | 'unverified' | 'needed';

interface VerifiedFact {
  value: string;
  status: EvidenceStatus; // 'unverified' → renders with †, 'needed' → renders with [evidence needed]
  receipt?: string;       // URL to evidence
}
```

---

## 10. Files to Remove (HPE/Backend Cleanup — Step 0)

| Category | Files |
|---|---|
| **Backend API** | `src/lib/api.ts`, `src/lib/api-base.ts`, `src/lib/auth-token.ts` |
| **Firebase Auth** | `src/lib/firebase.ts`, `src/lib/auth-context.tsx` |
| **Project Store** | `src/lib/projects-store.ts` |
| **ArchGuide Components** | `ArchGuideChat.tsx`, `AuthModal.tsx`, `CostAnalysis.tsx`, `CreateProjectModal.tsx`, `DecisionPipeline.tsx`, `DecisionTrace.tsx`, `DocumentUpload.tsx`, `AnalysisHistory.tsx`, `ProjectCard.tsx`, `QuestionnaireForm.tsx`, `ResultsDashboard.tsx`, `ShareButton.tsx`, `WelcomeBanner.tsx`, `WhatIfEditor.tsx` |
| **ArchGuide Routes** | `src/app/projects/` (entire directory), `src/app/results/` (entire directory), `src/app/r/` (entire directory) |
| **Tests (ArchGuide-specific)** | `tests/` directory (all tests reference ArchGuide components) |
| **ArchGuide Assets** | `public/logo.svg`, `src/app/logo.png` |
| **Misc** | `test_final.txt`, `playwright.config.ts` (E2E for ArchGuide) |

Dependencies to remove from `package.json`:
- `firebase` — no auth
- `react-dropzone` — no file upload
- `recharts` — no charts
- `uuid` — no project IDs

---

## 11. Locked Files — Expected Status

| File | Expected Change |
|---|---|
| `src/app/globals.css` | **Byte-identical** except: lines 146-163 (`.archguide-chat-input::placeholder` and `.archguide-messages::-webkit-scrollbar-*` rules) — these reference removed components and must be stripped |
| `src/app/template.tsx` | **Byte-identical** |
| `src/components/ThemeProvider.tsx` | **Byte-identical** |
| `src/components/LenisProvider.tsx` | **Byte-identical** |
| `src/components/GlobalBackground.tsx` | **Byte-identical** |
| `src/components/GlobalBackgroundLoader.tsx` | **Byte-identical** |
| `src/components/AnimatedScroll.tsx` | **Byte-identical** |
| `src/components/Magnetic.tsx` | **Byte-identical** |
| `src/components/Typewriter.tsx` | **Byte-identical** |
| `src/components/ErrorBoundary.tsx` | **Byte-identical** |
| `postcss.config.mjs` | **Byte-identical** |
| `tsconfig.json` | **Byte-identical** |

---

## 12. Milestone Build Order

| # | Milestone | What's verified |
|---|---|---|
| M1 | **Shell** — navbar + footer with portfolio links, page transition between stub routes | Navbar morphing works, all links resolve, footer renders, route transitions fade |
| M2 | **Home block 1** — identity & positioning (hero) | Hero text, badge, actions, availability line render correctly |
| M3 | **Home blocks 2-3** — start-here paths + proof strip | 4 path cards in grid, proof strip with metrics |
| M4 | **Home block 3 continued** — featured work cards | 4 project cards + research slot + currently-building slot |
| M5 | **Home blocks 4-6** — demo, experience & leadership, closing & contact | All remaining home sections |
| M6 | **Stub pages** — Work, Research, Experience, Leadership, About, Resume, Contact | Every link resolves, pages use ArchGuide layout patterns |

---

## 13. Questions for Your Approval

1. **globals.css**: Lines 146-163 contain `.archguide-chat-input` and `.archguide-messages` scrollbar rules. These reference deleted components. **May I remove just those 18 lines?** The rest of the file stays byte-identical.

2. **Navbar icon**: ArchGuide uses `<Hexagon>` from lucide-react. For the portfolio, should I **keep Hexagon** (it's geometric and neutral) or switch to a different lucide icon?

3. **Path cards**: ArchGuide has 3 feature cards in a row. The portfolio needs 4 start-here paths. **Use a 4-col grid on desktop (narrower cards) or 2×2 grid?** The 2×2 grid is safer for the ArchGuide spacing.

4. **Demo block**: The blueprint offers two options — ArchGuide What-If or JustiBot. Since this is the ArchGuide codebase and the What-If component already exists, **should I reuse the WhatIfEditor component with fixture data** and label it "Illustrative fixture, not real output"?

5. **Confirming the lens→color mapping**: Build=green (RAG vars), Ship=blue (FT vars), Investigate=amber (CAG vars), Lead=red (Hybrid vars). **Acceptable?**

Please approve this mapping (or request changes) before I proceed to building.
