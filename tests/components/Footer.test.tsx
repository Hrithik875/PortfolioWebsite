import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Footer } from "@/components/Footer";

describe("Footer Component", () => {
  it("renders personal branding", () => {
    render(<Footer />);
    const brands = screen.getAllByText(/HRITHIK\./i);
    expect(brands.length).toBeGreaterThan(0);
  });

  it("renders key external and navigation links", () => {
    render(<Footer />);
    expect(screen.getByText(/GitHub/i)).toBeInTheDocument();
    expect(screen.getByText(/LinkedIn/i)).toBeInTheDocument();
    expect(screen.getByText(/Resume \(PDF\)/i)).toBeInTheDocument();
  });

  it("renders category navigation sections", () => {
    render(<Footer />);
    expect(screen.getByText(/Navigation/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Lenses/i)).toBeInTheDocument();
  });
});
