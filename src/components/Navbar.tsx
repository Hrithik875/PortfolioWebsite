"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hexagon, Moon, Sun, Menu, X, ArrowUpRight } from "lucide-react";
import { m, useScroll, useMotionValueEvent, AnimatePresence, useVelocity, Variants } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { useIntro } from "@/context/IntroContext";

export function Navbar() {
  const { introDone } = useIntro();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isScrollingProgrammatically = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const [phase, setPhase] = useState<"top" | "pill" | "sphere">("top");
  const [isForcedPill, setIsForcedPill] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const { setTheme, resolvedTheme } = useTheme();
  const currentTheme = mounted ? resolvedTheme : "dark";

  useEffect(() => {
    if (!introDone) return;
    setMounted(true);
    const updateIsMobile = () => setIsMobile(window.innerWidth < 768);
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    const currentScroll = window.scrollY;
    if (currentScroll < 50) setPhase("top");
    else setPhase("pill");
    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, [introDone]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (phase === "sphere") {
      setIsExpanded(false);
    }
  }, [phase]);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const navLinks = [
    { name: "Work", href: "/work" },
    { name: "Research", href: "/research" },
    { name: "Experience", href: "/experience" },
    { name: "Leadership", href: "/leadership" },
    { name: "About", href: "/about" },
  ];

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!mounted || !introDone) return;
    if (isScrollingProgrammatically.current) {
      if (latest < 50) setPhase("top");
      else setPhase("pill");
      return;
    }
    const velocity = scrollVelocity.get();
    if (Math.abs(velocity) > 100) setIsForcedPill(false);
    if (latest < 50) { setPhase("top"); }
    else if (latest >= 50 && latest < 250) { setPhase("pill"); }
    else if (latest >= 250) {
      if (isForcedPill) { setPhase("pill"); }
      else if (velocity > 10) { setPhase("sphere"); }
      else if (velocity < -10) { setPhase("pill"); }
    }
  });

  if (!introDone) return null;

  const blur = isMobile ? "none" : "blur(20px)";
  const variants = {
    top: {
      width: "100%",
      maxWidth: "1040px",
      height: "64px",
      borderRadius: "999px",
      y: 20,
      backgroundColor: currentTheme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
      border: "1px solid rgba(150,150,150,0.05)",
      padding: "0 24px",
      backdropFilter: blur,
      WebkitBackdropFilter: blur,
    },
    pill: {
      width: "100%",
      maxWidth: "840px",
      height: "60px",
      borderRadius: "999px",
      y: 20,
      backgroundColor: currentTheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
      border: currentTheme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
      padding: "0 24px",
      backdropFilter: blur,
      WebkitBackdropFilter: blur,
      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    },
    sphere: {
      width: "60px",
      maxWidth: "60px",
      height: "60px",
      borderRadius: "999px",
      y: 20,
      backgroundColor: currentTheme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
      border: currentTheme === "dark" ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(0,0,0,0.3)",
      padding: "0 10px",
      backdropFilter: blur,
      WebkitBackdropFilter: blur,
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    },
  };

  const leftVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, x: 0, transition: { delay: 0, type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2, ease: "easeOut" } },
  };

  const centerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.15, type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2, ease: "easeOut" } },
  };

  const rightVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, x: 0, transition: { delay: 0.3, type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: -20, scale: 0.9, transition: { duration: 0.2, ease: "easeOut" } },
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsMobileMenuOpen(false);
    isScrollingProgrammatically.current = true;
    setPhase("pill");
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 1000);

    if (pathname === "/" && href.startsWith("/#")) {
      e.preventDefault();
      const id = href.split("#")[1];
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Mobile: simple, robust fixed bar */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50 px-3 pt-3 pointer-events-none">
        <div className="pointer-events-auto mx-auto flex items-center justify-between gap-2 h-14 pl-4 pr-2.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/85 backdrop-blur-md shadow-lg shadow-black/10">
          <Link href="/" className="flex items-center gap-2 min-w-0 active:scale-95 transition-transform">
            <Hexagon className="w-6 h-6 shrink-0 text-[color:var(--text-primary)]" />
            <span className="font-bold text-lg tracking-tighter truncate text-[color:var(--text-primary)]">
              Hrithik.
            </span>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              suppressHydrationWarning
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[color:var(--text-primary)]/5 border border-[color:var(--border)] text-[color:var(--text-primary)] active:scale-90 transition-transform"
            >
              {mounted ? (resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />) : <Sun size={16} />}
            </button>
            <button
              type="button"
              suppressHydrationWarning
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[color:var(--text-primary)] active:scale-90 transition-transform"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: morphing sphere / pill / bar */}
      <div className="hidden md:flex fixed top-0 left-0 w-full justify-center z-50 pointer-events-none px-4">
        <m.nav
          variants={variants}
          initial={false}
          animate={phase}
          transition={{ type: "spring", stiffness: 220, damping: 28, mass: 1 }}
          onAnimationComplete={(variant) => {
            if (variant === "top" || variant === "pill") setIsExpanded(true);
          }}
          onClick={() => {
            if (phase === "sphere") {
              if (window.innerWidth < 768) {
                setIsMobileMenuOpen(true);
              } else {
                setIsForcedPill(true);
                setPhase("pill");
              }
            }
          }}
          className={`pointer-events-auto flex items-center justify-center mx-auto relative ${
            phase === "sphere" ? "cursor-pointer hover:scale-110 transition-transform active:scale-95 shadow-white/5" : ""
          } overflow-hidden`}
        >
          {/* DECOUPLED STABLE LAYOUT */}
          <div className="absolute inset-0 w-full h-full flex justify-center items-center pointer-events-none">
            <div className="w-full h-full max-w-[1040px] flex items-center justify-between px-6 pointer-events-none relative">
              {/* Left Block (Logo & Brand) */}
              <div className="pointer-events-auto shrink-0 flex items-center z-10">
                <AnimatePresence>
                  {isExpanded && (
                    <m.div
                      key="left-logo"
                      variants={leftVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex items-center shrink-0"
                    >
                      <Link href="/" className="flex items-center gap-2.5 group transition-transform active:scale-95">
                        <div className="w-9 h-9 flex items-center justify-center">
                          <Hexagon className="text-[color:var(--text-primary)] w-7 h-7" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter whitespace-nowrap overflow-hidden pr-2 text-[color:var(--text-primary)]">
                          Hrithik.
                        </span>
                      </Link>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Center Block (Desktop Nav Links) */}
              <div className="pointer-events-auto shrink-0 flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-0">
                <AnimatePresence>
                  {isExpanded && (
                    <m.div
                      key="nav-links"
                      variants={centerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="hidden md:flex items-center gap-1 justify-center p-1"
                    >
                      {navLinks.map((link) => {
                        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                        return (
                          <Link
                            key={link.name}
                            href={link.href}
                            onClick={(e) => handleNavClick(e, link.href)}
                            className={`relative px-4 py-2 font-medium text-sm tracking-tight transition-all rounded-full z-10 flex items-center gap-2 whitespace-nowrap ${
                              isActive
                                ? "text-[color:var(--background)] font-bold"
                                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                            }`}
                          >
                            {link.name}
                            {isActive && (
                              <m.div
                                layoutId="navbar-active-pill"
                                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                className="absolute inset-0 bg-[color:var(--text-primary)] rounded-full -z-10 shadow-sm"
                              />
                            )}
                          </Link>
                        );
                      })}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Block Container */}
              <div className="pointer-events-auto shrink-0 flex items-center z-10 gap-2.5">
                <AnimatePresence>
                  {isExpanded && (
                    <m.div
                      key="nav-actions"
                      variants={rightVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="hidden md:flex items-center gap-2.5"
                    >
                      {/* Theme Toggle */}
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTheme();
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[color:var(--text-primary)]/5 border border-[color:var(--border)] text-[color:var(--text-primary)] hover:bg-[color:var(--text-primary)] hover:text-[color:var(--background)] transition-all active:scale-90"
                      >
                        {mounted ? (resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />) : <div className="w-4 h-4" />}
                      </button>

                      {/* Persistent Action: Resume */}
                      <Link
                        href="/resume"
                        className={`flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--text-primary)] text-[color:var(--background)] hover:opacity-90 transition-all duration-300 ease-in-out active:scale-95 ${
                          phase === "top" ? "px-4 py-2 text-sm font-bold" : "px-3.5 py-1.5 text-xs font-bold"
                        }`}
                      >
                        <span>Resume</span>
                        <ArrowUpRight size={14} />
                      </Link>

                      {/* Persistent Action: Contact */}
                      <Link
                        href="/contact"
                        className={`flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] hover:border-[color:var(--text-primary)] transition-all duration-300 ease-in-out active:scale-95 ${
                          phase === "top" ? "px-4 py-2 text-sm font-bold" : "px-3.5 py-1.5 text-xs font-bold"
                        }`}
                      >
                        <span>Contact</span>
                      </Link>
                    </m.div>
                  )}
                </AnimatePresence>

                {/* Mobile Toggles */}
                <AnimatePresence>
                  {isExpanded && (
                    <m.div
                      key="mobile-toggle"
                      variants={rightVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex md:hidden items-center gap-2"
                    >
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTheme();
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[color:var(--text-primary)]/5 border border-[color:var(--border)] text-[color:var(--text-primary)] hover:bg-[color:var(--text-primary)] hover:text-[color:var(--background)] transition-all"
                      >
                        {mounted ? (resolvedTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />) : <div className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMobileMenuOpen(!isMobileMenuOpen);
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-[color:var(--text-primary)] active:scale-90 transition-transform"
                      >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                      </button>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Center Block (Sphere Logo - only visible when not expanded) */}
          <AnimatePresence>
            {!isExpanded && (
              <m.div
                key="sphere-center-logo"
                initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Hexagon size={26} className="text-[color:var(--text-primary)]" />
              </m.div>
            )}
          </AnimatePresence>
        </m.nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden bg-[color:var(--background)] pt-20 px-6 flex flex-col justify-between pb-8"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <m.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className={`flex items-center justify-between w-full px-6 py-4 rounded-full text-lg font-bold transition-all border ${
                        isActive
                          ? "bg-[color:var(--text-primary)] text-[color:var(--background)] border-transparent"
                          : "bg-[color:var(--text-primary)]/5 text-[color:var(--text-secondary)] border-[color:var(--border)]"
                      }`}
                    >
                      <span>{link.name}</span>
                    </Link>
                  </m.div>
                );
              })}
            </div>

            {/* Mobile Actions: Resume & Contact */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col gap-3"
            >
              <Link
                href="/resume"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[color:var(--text-primary)] text-[color:var(--background)] font-bold text-base"
              >
                <span>View Resume</span>
                <ArrowUpRight size={16} />
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-full border border-[color:var(--border)] text-[color:var(--text-primary)] font-bold text-base"
              >
                <span>Get in Touch</span>
              </Link>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}