import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Navbar } from "@/components/Navbar";
import React from "react";

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: query.includes("min-width: 768px"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntroContext
vi.mock("@/context/IntroContext", () => ({
  useIntro: () => ({
    introDone: true,
    setIntroDone: vi.fn(),
    shouldRunIntro: false,
  }),
}));

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    resolvedTheme: "dark",
    setTheme: mockSetTheme,
  }),
}));

describe("Navbar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders desktop and mobile nav items after initial expansion", async () => {
    render(<Navbar />);

    // Fast-forward initial expansion timer
    await act(async () => {
      await new Promise((r) => setTimeout(r, 800));
    });

    // Check menu links
    expect(screen.getAllByRole("link", { name: "Work" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Research" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Experience" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Leadership" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "About" }).length).toBeGreaterThan(0);
  });

  it("renders separate desktop theme toggle sphere and triggers theme change", async () => {
    render(<Navbar />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    const themeButtons = screen.getAllByRole("button", { name: /toggle theme/i });
    expect(themeButtons.length).toBeGreaterThanOrEqual(1);

    // Click theme toggle
    fireEvent.click(themeButtons[0]);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("renders liquid SVG canvas in DOM for desktop droplet animation", () => {
    const { container } = render(<Navbar />);
    const svgPath = container.querySelector("svg path");
    expect(svgPath).not.toBeNull();
  });
});
