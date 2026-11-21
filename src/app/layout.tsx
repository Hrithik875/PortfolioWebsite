import type { Metadata, Viewport } from "next";
import "./globals.css";
import "lenis/dist/lenis.css";
import {
  Space_Grotesk,
  DM_Sans,
  Public_Sans,
  Spectral,
  Instrument_Serif,
  Inter_Tight,
} from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { IntroProvider } from "@/context/IntroContext";
import { LenisProvider } from "@/components/LenisProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PreventZoom } from "@/components/PreventZoom";
import { Analytics } from '@vercel/analytics/next';

// Space Grotesk — primary site font for body, headings, and UI chrome
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "block",
});

// DM Sans — used by the IntroReveal and Halftone card titles
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "block",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "block",
});

// Inter Tight — tight neo-grotesk
const sans = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans-tight",
  display: "block",
});

// Public Sans is a variable font on Google Fonts: omit `weight` so font-weight 480 works.
const aboutSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-about-sans",
  display: "block",
});

const aboutSerif = Spectral({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: "italic",
  variable: "--font-about-serif",
  display: "block",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "Hrithik | AI/ML engineer",
    template: "%s | Hrithik",
  },
  description:
    "AI/ML engineering student at BMSCE building retrieval, streaming ML and evaluation systems with measured results. Projects, research methodology and leadership.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`intro-loading ${spaceGrotesk.variable} ${dmSans.variable} ${aboutSans.variable} ${aboutSerif.variable} ${serif.variable} ${sans.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300..700&display=block"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress known Next.js 16.2.0 internal OuterLayoutRouter unkeyed array warning in dev
              try {
                var _origErr = console.error;
                console.error = function() {
                  var args = Array.prototype.slice.call(arguments);
                  var full = args.map(function(a) { return typeof a === 'string' ? a : ''; }).join(' ');
                  if (full.indexOf('unique') !== -1 && full.indexOf('key') !== -1 && (full.indexOf('OuterLayoutRouter') !== -1 || full.indexOf('SegmentStateProvider') !== -1)) {
                    return;
                  }
                  return _origErr.apply(console, args);
                };
              } catch(e) {}

              // Disable automatic scroll restoration so refreshed pages boot at the top without snapping
              try {
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = 'manual';
                }
                window.scrollTo(0, 0);
              } catch(e) {}

              try {
                window.addEventListener('beforeunload', function() {
                  try {
                    if ('scrollRestoration' in history) {
                      history.scrollRestoration = 'manual';
                    }
                    window.scrollTo(0, 0);
                  } catch(e) {}
                });
              } catch(e) {}

              try {
                if (
                  window.location.pathname !== '/' ||
                  (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                ) {
                  document.documentElement.classList.remove('intro-loading');
                }
              } catch(e) {}

              // Early zoom prevention before hydration
              try {
                window.addEventListener('wheel', function(e) {
                  if (e.ctrlKey || e.metaKey) e.preventDefault();
                }, { passive: false, capture: true });
                window.addEventListener('keydown', function(e) {
                  if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')) {
                    e.preventDefault();
                  }
                }, { capture: true });
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${serif.variable} relative antialiased min-h-screen flex flex-col bg-transparent text-[color:var(--text-primary)] overflow-x-hidden`}>
        <PreventZoom />
        <ThemeProvider>
          <IntroProvider>
            <LenisProvider>
              {/* <GlobalBackgroundLoader /> */}

              <Navbar />

              <div id="page-shell" className="flex-1 w-full flex flex-col relative">
                <main className="flex-1 w-full relative z-[1]">
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </main>

                <Footer />
              </div>
            </LenisProvider>
          </IntroProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}