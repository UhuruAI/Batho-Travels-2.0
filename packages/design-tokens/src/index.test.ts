import { describe, expect, it } from "vitest";
import { allTokensCss, colors, getColors, radius, tokensToCssVars, typography } from "./index";

describe("design tokens", () => {
  it("uses the terracotta brand palette in both themes", () => {
    expect(colors.light.canvas).toBe("#FAF5F0");
    expect(colors.light.primary).toBe("#C0502B");
    expect(colors.dark.canvas).toBe("#1A1410");
    expect(colors.dark.primary).toBe("#E27A55");
  });

  it("pairs Inter Tight display with Inter body", () => {
    expect(typography.display).toBe("Inter Tight");
    expect(typography.body).toBe("Inter");
  });

  it("uses Airbnb-flavor card radius", () => {
    expect(radius.md).toBe(12);
    expect(radius.lg).toBe(16);
  });

  it("getColors returns the matching theme", () => {
    expect(getColors("light")).toBe(colors.light);
    expect(getColors("dark")).toBe(colors.dark);
  });

  it("tokensToCssVars emits kebab-cased color custom properties", () => {
    const css = tokensToCssVars("light");
    expect(css).toContain("--color-canvas: #FAF5F0;");
    expect(css).toContain("--color-text-primary: #2A1F18;");
    expect(css).toContain("--color-primary-soft: #F7E1D6;");
  });

  it("allTokensCss provides :root and [data-theme=dark] blocks", () => {
    const css = allTokensCss();
    expect(css).toContain(":root {");
    expect(css).toContain("[data-theme=\"dark\"]");
    expect(css).toContain("--font-display:");
    expect(css).toContain("--radius-lg: 16px;");
  });
});
