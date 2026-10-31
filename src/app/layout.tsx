import type { Metadata, Viewport } from "next";
import "./globals.css";
import "lenis/dist/lenis.css";
import { Instrument_Serif, Inter_Tight, Public_Sans, Spectral } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { IntroProvider } from "@/context/IntroContext";
import { LenisProvider } from "@/components/LenisProvider";
import { Navbar } from "@/components/Navbar";
import { GlobalBackgroundLoader } from "@/components/GlobalBackgroundLoader";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PreventZoom } from "@/components/PreventZoom";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
  display: "swap",
});

// Inter Tight — tight neo-grotesk used by the About headline and paragraph.
const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans-tight",
  display: "swap",
});

// Public Sans is a variable font on Google Fonts: omit `weight` so font-weight 480 works.
const aboutSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-about-sans",
  display: "swap",
});

const aboutSerif = Spectral({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: "italic",
  variable: "--font-about-serif",
  display: "swap",
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
    <html lang="en" suppressHydrationWarning className={`intro-loading ${sans.variable} ${aboutSans.variable} ${aboutSerif.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
      </body>
    </html>
  );
}