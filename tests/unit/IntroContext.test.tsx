import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { IntroProvider, useIntro } from "@/context/IntroContext";

let currentPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

function Consumer() {
  const { introDone, shouldRunIntro, setIntroDone } = useIntro();
  return (
    <div>
      <span data-testid="introDone">{String(introDone)}</span>
      <span data-testid="shouldRunIntro">{String(shouldRunIntro)}</span>
      <button data-testid="finishBtn" onClick={() => setIntroDone(true)}>
        Finish
      </button>
    </div>
  );
}

describe("IntroContext Navigation and State", () => {
  beforeEach(() => {
    currentPathname = "/";
    document.documentElement.className = "";
  });

  it("does not re-trigger intro or add intro-loading when navigating back from /work to /", async () => {
    // 1. Initial mount on home
    currentPathname = "/";
    const { rerender } = render(
      <IntroProvider>
        <Consumer />
      </IntroProvider>
    );

    // Initial load runs intro
    expect(screen.getByTestId("shouldRunIntro").textContent).toBe("true");

    // Complete the intro
    act(() => {
      screen.getByTestId("finishBtn").click();
    });
    expect(screen.getByTestId("introDone").textContent).toBe("true");
    expect(screen.getByTestId("shouldRunIntro").textContent).toBe("false");
    expect(document.documentElement.classList.contains("intro-loading")).toBe(false);

    // 2. Navigate to /work
    currentPathname = "/work";
    rerender(
      <IntroProvider>
        <Consumer />
      </IntroProvider>
    );
    expect(screen.getByTestId("introDone").textContent).toBe("true");
    expect(screen.getByTestId("shouldRunIntro").textContent).toBe("false");
    expect(document.documentElement.classList.contains("intro-loading")).toBe(false);

    // 3. Shift back to / by clicking logo
    currentPathname = "/";
    rerender(
      <IntroProvider>
        <Consumer />
      </IntroProvider>
    );

    // MUST stay finished and never re-lock scroll / hide navbar
    expect(screen.getByTestId("introDone").textContent).toBe("true");
    expect(screen.getByTestId("shouldRunIntro").textContent).toBe("false");
    expect(document.documentElement.classList.contains("intro-loading")).toBe(false);
  });
});
