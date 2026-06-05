import { describe, expect, it } from "vitest";
import {
  buildPlannerSystemPrompt,
  destinationSeasonalitySeed,
  findDestinationSeasonality,
  recommendValueMonths,
  validatePlannerResult
} from "./planner";

const validPlannerResult = {
  destination: {
    name: "Cape Town",
    country: "South Africa",
    region: "Western Cape"
  },
  tripType: "domestic" as const,
  recommendedMonths: ["March", "April"],
  seasonalityReason:
    "March and April are shoulder-season months with lower relative prices and mild weather.",
  estimatedCost: {
    totalCents: 2_500_000,
    flightsCents: 1_200_000,
    stayCents: 850_000,
    experiencesCents: 450_000
  },
  itinerary: [
    {
      day: 1,
      title: "Arrive and settle in",
      description: "A calm arrival day with a waterfront walk.",
      estimatedCostCents: 30_000
    }
  ],
  assumptions: ["Costs are estimates until bookings are fully funded and confirmed."],
  savingsPlanInput: {
    totalCostCents: 2_500_000,
    tripType: "domestic" as const,
    planMonths: 12,
    costBreakdown: {
      flightsCents: 1_200_000,
      stayCents: 850_000,
      experiencesCents: 450_000
    }
  }
};

describe("seasonality seed", () => {
  it("contains 12 months for each destination", () => {
    expect(destinationSeasonalitySeed.every((destination) => destination.months.length === 12)).toBe(
      true
    );
  });

  it("finds destination data case-insensitively", () => {
    expect(findDestinationSeasonality("cape town")?.country).toBe("South Africa");
  });

  it("recommends low and shoulder months before peak months", () => {
    expect(recommendValueMonths("Cape Town").map((month) => month.name)).toEqual([
      "March",
      "April",
      "May"
    ]);
  });
});

describe("planner validation", () => {
  it("accepts a planner result grounded in seasonality and savings policy", () => {
    expect(validatePlannerResult(validPlannerResult)).toEqual({
      valid: true,
      data: validPlannerResult
    });
  });

  it("rejects estimated costs that do not add up", () => {
    expect(
      validatePlannerResult({
        ...validPlannerResult,
        estimatedCost: {
          ...validPlannerResult.estimatedCost,
          totalCents: 2_400_000
        }
      })
    ).toEqual({
      valid: false,
      errors: ["Estimated flights, stay, and experiences must add up to the total estimate."]
    });
  });

  it("rejects recommended months missing from seasonality data", () => {
    expect(
      validatePlannerResult({
        ...validPlannerResult,
        recommendedMonths: ["Notamonth"]
      })
    ).toEqual({
      valid: false,
      errors: ["Recommended months must exist in the destination seasonality dataset."]
    });
  });

  it("rejects package or template funnel language", () => {
    expect(
      validatePlannerResult({
        ...validPlannerResult,
        itinerary: [
          {
            day: 1,
            title: "Prebuilt package",
            description: "Choose this fixed package and continue.",
            estimatedCostCents: 0
          }
        ]
      })
    ).toEqual({
      valid: false,
      errors: ["Planner output must not describe fixed packages or templates."]
    });
  });
});

describe("planner prompt", () => {
  it("locks the AI planner to user-driven planning and validated JSON", () => {
    const prompt = buildPlannerSystemPrompt();

    expect(prompt).toContain("Batho Travels");
    expect(prompt).toContain("never sell fixed packages");
    expect(prompt).toContain("validated JSON");
    expect(prompt).toContain("Costs are estimates");
  });
});

