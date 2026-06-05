import { describe, expect, it } from "vitest";
import {
  allocateStagedFunding,
  calculateCancellationRefund,
  calculateSavingsPlan,
  canBookAmount,
  validateTripPlanLength
} from "./index";

const capeTownPlan = {
  totalCostCents: 2_500_000,
  tripType: "domestic" as const,
  planMonths: 12,
  costBreakdown: {
    flightsCents: 1_200_000,
    stayCents: 850_000,
    experiencesCents: 450_000
  }
};

describe("validateTripPlanLength", () => {
  it("accepts a domestic plan at the 3 month minimum", () => {
    expect(validateTripPlanLength("domestic", 3)).toEqual({ valid: true });
  });

  it("rejects regional trips shorter than 6 months with warm copy", () => {
    expect(validateTripPlanLength("africaRegional", 5)).toEqual({
      valid: false,
      message:
        "Africa regional trips need at least 6 months so the monthly savings stay realistic and calm."
    });
  });

  it("rejects plans above the configurable 12 month maximum", () => {
    expect(validateTripPlanLength("domestic", 13)).toEqual({
      valid: false,
      message: "Batho Travels supports savings plans up to 12 months for now."
    });
  });
});

describe("calculateSavingsPlan", () => {
  it("creates a rounded monthly schedule that sums exactly to the trip total", () => {
    const result = calculateSavingsPlan(capeTownPlan);

    expect(result.isValid).toBe(true);
    expect(result.monthlyContributionCents).toBe(208_334);
    expect(result.roundingAdjustmentCents).toBe(8);
    expect(result.schedule).toHaveLength(12);
    expect(result.schedule.reduce((sum, month) => sum + month.contributionCents, 0)).toBe(
      capeTownPlan.totalCostCents
    );
    expect(result.schedule.at(-1)?.contributionCents).toBe(208_326);
  });

  it("allocates contributions sequentially into flights, then stay, then experiences", () => {
    const result = calculateSavingsPlan(capeTownPlan);

    expect(result.schedule[0]?.allocations).toEqual({
      flights: 208_334,
      stay: 0,
      experiences: 0
    });
    expect(result.schedule[5]?.allocations).toEqual({
      flights: 158_330,
      stay: 50_004,
      experiences: 0
    });
    expect(result.schedule[9]?.allocations).toEqual({
      flights: 0,
      stay: 174_994,
      experiences: 33_340
    });
    expect(result.fundingStages).toEqual([
      {
        key: "flights",
        targetCents: 1_200_000,
        fundedCents: 1_200_000,
        status: "funded",
        completedMonth: 6
      },
      {
        key: "stay",
        targetCents: 850_000,
        fundedCents: 850_000,
        status: "funded",
        completedMonth: 10
      },
      {
        key: "experiences",
        targetCents: 450_000,
        fundedCents: 450_000,
        status: "funded",
        completedMonth: 12
      }
    ]);
  });

  it("returns a friendly invalid result when the selected plan is too short", () => {
    const result = calculateSavingsPlan({
      ...capeTownPlan,
      tripType: "longHaulInternational",
      planMonths: 9
    });

    expect(result).toMatchObject({
      isValid: false,
      monthlyContributionCents: 0,
      totalCostCents: capeTownPlan.totalCostCents,
      schedule: [],
      fundingStages: [],
      message:
        "Long-haul international trips need at least 12 months so the monthly savings stay realistic and calm."
    });
  });
});

describe("allocateStagedFunding", () => {
  it("marks the first unfinished stage active for partial schedules", () => {
    expect(
      allocateStagedFunding(
        [
          {
            month: 1,
            contributionCents: 100,
            allocations: { flights: 100, stay: 0, experiences: 0 }
          },
          {
            month: 2,
            contributionCents: 100,
            allocations: { flights: 50, stay: 50, experiences: 0 }
          }
        ],
        {
          flightsCents: 150,
          stayCents: 100,
          experiencesCents: 100
        }
      )
    ).toEqual([
      {
        key: "flights",
        targetCents: 150,
        fundedCents: 150,
        status: "funded",
        completedMonth: 2
      },
      {
        key: "stay",
        targetCents: 100,
        fundedCents: 50,
        status: "active"
      },
      {
        key: "experiences",
        targetCents: 100,
        fundedCents: 0,
        status: "queued"
      }
    ]);
  });
});

describe("calculateCancellationRefund", () => {
  it("applies the 12 month refund tier and management fee", () => {
    expect(
      calculateCancellationRefund({ amountPaidCents: 1_000_000, monthsBeforeTravel: 13 })
    ).toEqual({
      refundPercentage: 100,
      grossRefundCents: 1_000_000,
      managementFeeCents: 50_000,
      netRefundCents: 950_000,
      userMessage:
        "You are eligible for a 100% refund of funds paid, less the R500 management fee."
    });
  });

  it("applies the less than 3 month refund tier without a negative refund", () => {
    expect(
      calculateCancellationRefund({ amountPaidCents: 20_000, monthsBeforeTravel: 2 })
    ).toEqual({
      refundPercentage: 0,
      grossRefundCents: 0,
      managementFeeCents: 0,
      netRefundCents: 0,
      userMessage:
        "This cancellation is inside 3 months of travel, so the refundable amount is R0."
    });
  });
});

describe("canBookAmount", () => {
  it("allows standard KYC bookings up to R50,000", () => {
    expect(canBookAmount("standard", 5_000_000)).toEqual({
      allowed: true,
      message: "Your Standard verification supports this booking amount."
    });
  });

  it("asks users to upgrade KYC when the booking amount is above their tier", () => {
    expect(canBookAmount("basic", 1_000_000)).toEqual({
      allowed: false,
      requiredTier: "standard",
      message:
        "Please complete Standard verification before creating a paid travel plan for this amount."
    });
  });

  it("allows enhanced KYC bookings without an upper value limit", () => {
    expect(canBookAmount("enhanced", 25_000_000)).toEqual({
      allowed: true,
      message: "Your Enhanced verification supports this booking amount."
    });
  });
});
