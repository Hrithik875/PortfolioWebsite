# Hrithik M — AI/ML Engineer Portfolio

[![Next.js](https://img.shields.io/badge/Next.js-16.2.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat&logo=three.js)](https://threejs.org/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?style=flat&logo=vitest)](https://vitest.dev/)

> **"I build intelligent systems you can inspect, ship them as complete products, investigate the hard problems behind them, and help technical communities grow."**

An engineering portfolio website built with modern web technologies, WebGL shaders, interactive decision simulators, and backed by verifiable benchmark receipts.

---

## 🌟 Key Features

### 1. 🌌 Interactive 3D WebGL Spacetime Canvas
- Custom Three.js particle wave grid with smooth mouse-reactive gravity distortion.
- Dynamically loaded on the client side with graceful fallback support for low-power devices.
- Seamless theme awareness supporting both dark space aesthetics and crisp light modes.

### 2. 🔬 ArchGuide: What-If Architectural Simulation
- An interactive, deterministic decision playground comparing **RAG**, **Fine-Tuning**, **CAG**, and **Hybrid** architectures.
- Dynamic sensitivity radar, live confidence scoring, and estimated monthly inference/storage cost calculator reacting in real-time to requirement sliders.

### 3. 🧾 The Proof Strip & Verifiable Receipts
- Every metric cited across the portfolio is accompanied by its measurement method, benchmark testbed, workload conditions, and caveats.
- Interactive audit modal allows inspecting raw experimental parameters (e.g., *0.964 AUC at 3,200+ msg/sec in Kafka/Spark streaming*, *875ms page loads via Cloudflare edge caching*).

### 4. 🎯 Multi-Lens Project Catalog (`/work`)
- Categorized exploration across four engineering lenses:
  - **Build**: AI/ML pipelines, hybrid search vector indices, streaming architectures.
  - **Ship**: High-performance web platforms, e-commerce storefronts, edge caching.
  - **Investigate**: Samsung PRISM 3D Gaussian Splatting, NeRF research methodology.
  - **Lead**: 100 Days of Code initiative (1,200+ registrations), ACM student chapter governance.

### 5. 📑 Dedicated Deep Dives
- **`/research`**: Held-out testbeds, ablation studies, and 3D scene reconstruction logs.
- **`/experience`**: Engineering trajectory across HPE, Samsung PRISM, Kshipani Ventures, and BMSCE ACM.
- **`/leadership`**: Community architecture, hackathon direction, and regional chapter coordination.
- **`/resume`**: Canonical public record with verified academic transcripts (9.83 CGPA).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server & Client Components) |
| **Core** | [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/), CSS Custom Properties (Theme tokens) |
| **Animations & Physics** | [Framer Motion](https://www.framer.com/motion/), [Lenis](https://lenis.darkroom.engineering/) (Smooth Inertial Scrolling) |
| **3D Graphics** | [Three.js](https://threejs.org/) (WebGL Particle Waves, Custom Shaders, TweenMax) |
| **Data Visualization** | [Recharts](https://recharts.org/) (Multi-axis radar and architectural fit curves) |
| **Testing** | [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 📁 Project Structure

```text
Portfolio/
├── public/                 # Static assets & WebGL scripts
│   ├── spacetime/          # Three.js spacetime scripts & textures
│   └── img/                # WebGL particle textures
├── src/
│   ├── app/                # Next.js App Router routes & layouts
│   │   ├── about/          # Engineering philosophy & background
│   │   ├── contact/        # Contact form & direct communication channels
│   │   ├── experience/     # Industry & research engagements
│   │   ├── leadership/     # Community architecture & ACM leadership
│   │   ├── privacy-policy/ # Privacy disclosures
│   │   ├── research/       # Experimental testbeds & methodologies
│   │   ├── resume/         # Academic transcripts & resume viewer
│   │   ├── terms-of-service/ # Terms and conditions
│   │   ├── work/           # Filterable multi-lens project catalog
│   │   ├── globals.css     # Design tokens, variables & typography
│   │   ├── layout.tsx      # Root layout, theme provider, navbar & footer
│   │   └── page.tsx        # Homepage (Hero, Proof Strip, Featured, Demo)
│   ├── components/         # Reusable modular UI components
│   │   ├── Navbar.tsx      # Adaptive morphing navigation with scroll phases
│   │   ├── Footer.tsx      # Responsive footer with live status & links
│   │   ├── WhatIfEditor.tsx# Architectural trade-off simulation widget
│   │   ├── SpacetimeBackground.tsx # 3D WebGL particle wave canvas
│   │   ├── Magnetic.tsx    # Magnetic cursor pull effect
│   │   └── ThemeProvider.tsx # Next-themes provider
│   ├── data/
│   │   └── portfolio-data.ts # Single source of truth for portfolio records & receipts
│   └── types/
│       └── portfolio.ts    # TypeScript interfaces for projects, receipts & lenses
├── tests/                  # Automated test suite
│   ├── components/         # React component tests
│   ├── unit/               # Data integrity and schema tests
│   └── setup.ts            # Global test environment configuration
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Hrithik875/PortfolioWebsite.git
   cd PortfolioWebsite
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing & Validation

The codebase includes automated unit and component tests ensuring data integrity, component rendering, and link health:

```bash
# Run test suite
npm test

# Run tests with coverage report
npm run test:coverage

# Perform TypeScript type checking
npx tsc --noEmit
```

---

## 👤 Author

**Hrithik M**
- **Website / Portfolio**: [https://github.com/Hrithik875/PortfolioWebsite](https://github.com/Hrithik875/PortfolioWebsite)
- **LinkedIn**: [linkedin.com/in/hrithik-m](https://linkedin.com)
- **GitHub**: [@Hrithik875](https://github.com/Hrithik875)
- **Email**: `hrithik.ml.eng@gmail.com`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
