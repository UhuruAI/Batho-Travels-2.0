import { describe, expect, it } from "vitest";
import {
  LAUNCH_QA_VIEWPORTS,
  LAUNCH_SEED_ADMIN_QUEUES,
  LAUNCH_SEED_TRAVELLERS,
  LAUNCH_SEED_TRIP_SCENARIOS,
  launchTripTotalCents
} from "./index";

describe("launch seed data", () => {
  it("uses generic demo traveller contacts only", () => {
    expect(LAUNCH_SEED_TRAVELLERS).toHaveLength(3);
    expect(LAUNCH_SEED_TRAVELLERS.every((traveller) => traveller.email.endsWith(".example"))).toBe(
      true
    );
    expect(LAUNCH_SEED_TRAVELLERS.every((traveller) => traveller.phone.startsWith("+2700000"))).toBe(
      true
    );
  });

  it("keeps launch trip scenarios internally balanced", () => {
    expect(LAUNCH_SEED_TRIP_SCENARIOS).toHaveLength(3);

    for (const scenario of LAUNCH_SEED_TRIP_SCENARIOS) {
      expect(launchTripTotalCents(scenario)).toBeGreaterThan(0);
      expect(scenario.planMonths).toBeLessThanOrEqual(12);
      expect(scenario.recommendedMonths.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("covers launch QA surfaces and admin workspaces", () => {
    expect(LAUNCH_QA_VIEWPORTS.map((viewport) => viewport.surface)).toEqual([
      "mobile",
      "mobile",
      "tablet",
      "desktop"
    ]);
    expect(LAUNCH_SEED_ADMIN_QUEUES.map((item) => item.workspace)).toEqual([
      "operations",
      "finance",
      "support"
    ]);
  });
});
