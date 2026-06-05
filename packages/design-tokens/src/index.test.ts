import { describe, expect, it } from "vitest";
import { colors, radius, typography } from "./index";

describe("design tokens", () => {
  it("defines intentional light and dark themes", () => {
    expect(colors.light.canvas).toBe("#F8F4ED");
    expect(colors.dark.canvas).toBe("#171411");
  });

  it("keeps the premium type pairing", () => {
    expect(typography.display).toBe("Fraunces");
    expect(typography.body).toBe("Source Sans 3");
  });

  it("keeps cards restrained by default", () => {
    expect(radius.md).toBe(8);
  });
});

