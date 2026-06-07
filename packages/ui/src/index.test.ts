import { describe, expect, it } from "vitest";
// Import from the JSX/DOM-free legacy module so Vitest can run without
// having to parse JSX or the web-only CSS side-effect import.
import { formatProgressPercent, getFundingStageStatus } from "./legacy";

describe("ui recipes", () => {
  it("formats staged funding progress without exceeding 100%", () => {
    expect(formatProgressPercent(120, 100)).toBe("100%");
    expect(formatProgressPercent(45, 100)).toBe("45%");
  });

  it("marks funding status from active and funded state", () => {
    expect(getFundingStageStatus(100, 100, false)).toBe("funded");
    expect(getFundingStageStatus(20, 100, true)).toBe("active");
    expect(getFundingStageStatus(0, 100, false)).toBe("queued");
  });
});

