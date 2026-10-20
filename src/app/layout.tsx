import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { IntroProvider } from "@/context/IntroContext";
import { LenisProvider } from "@/components/LenisProvider";
import { Navbar } from "@/components/Navbar";
import { GlobalBackgroundLoader } from "@/components/GlobalBackgroundLoader";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: "Hrithik | AI/ML engineer",
    template: "%s | Hrithik",
  },
  description:
    "AI/ML engineering student at BMSCE building retrieval, streaming ML and evaluation systems with measured results. Projects, research methodology and leadership.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="intro-loading">
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
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="relative antialiased min-h-screen flex flex-col bg-transparent text-[color:var(--text-primary)] overflow-x-hidden">
        <ThemeProvider>
          <IntroProvider>
            <LenisProvider>
              <GlobalBackgroundLoader />

              <Navbar />

              <main className="flex-1 w-full relative z-[1]">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>

              <Footer />
            </LenisProvider>
          </IntroProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}