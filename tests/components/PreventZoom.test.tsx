import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PreventZoom } from "@/components/PreventZoom";
import React from "react";

describe("PreventZoom Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prevents Ctrl + Wheel zoom while allowing normal wheel scrolling", () => {
    render(<PreventZoom />);

    // 1. Normal scroll without Ctrl
    const normalWheelEvent = new WheelEvent("wheel", { bubbles: true, cancelable: true });
    const normalPreventSpy = vi.spyOn(normalWheelEvent, "preventDefault");
    window.dispatchEvent(normalWheelEvent);
    expect(normalPreventSpy).not.toHaveBeenCalled();

    // 2. Wheel zoom with Ctrl key
    const ctrlWheelEvent = new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true });
    const ctrlPreventSpy = vi.spyOn(ctrlWheelEvent, "preventDefault");
    window.dispatchEvent(ctrlWheelEvent);
    expect(ctrlPreventSpy).toHaveBeenCalled();
  });

  it("prevents keyboard zoom shortcuts (Ctrl/Cmd +, -, =, 0)", () => {
    render(<PreventZoom />);

    const zoomKeys = ["+", "-", "=", "_", "0"];
    for (const key of zoomKeys) {
      const zoomEvent = new KeyboardEvent("keydown", {
        key,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventSpy = vi.spyOn(zoomEvent, "preventDefault");
      window.dispatchEvent(zoomEvent);
      expect(preventSpy).toHaveBeenCalled();
    }

    // Normal typing without Ctrl should NOT be prevented
    const normalTypingEvent = new KeyboardEvent("keydown", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    const normalSpy = vi.spyOn(normalTypingEvent, "preventDefault");
    window.dispatchEvent(normalTypingEvent);
    expect(normalSpy).not.toHaveBeenCalled();
  });

  it("prevents multi-touch pinch zoom on touch devices", () => {
    render(<PreventZoom />);

    // Simulate multi-touch touchmove event
    const multiTouchEvent = new CustomEvent("touchmove", {
      bubbles: true,
      cancelable: true,
    }) as unknown as TouchEvent;

    // Define touches
    Object.defineProperty(multiTouchEvent, "touches", {
      value: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }],
    });

    const preventSpy = vi.spyOn(multiTouchEvent, "preventDefault");
    document.dispatchEvent(multiTouchEvent);
    expect(preventSpy).toHaveBeenCalled();
  });

  it("prevents Safari gesturestart zoom events", () => {
    render(<PreventZoom />);

    const gestureEvent = new Event("gesturestart", { bubbles: true, cancelable: true });
    const preventSpy = vi.spyOn(gestureEvent, "preventDefault");
    document.dispatchEvent(gestureEvent);
    expect(preventSpy).toHaveBeenCalled();
  });
});
