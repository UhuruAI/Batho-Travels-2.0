import { describe, expect, it } from "vitest";
import {
  buildTripDashboard,
  createDraftPlannerResult,
  createTripFromPlannerResult,
  recordTripPayment
} from "./index";

const plannerResult = createDraftPlannerResult({
  destinationIdea: "Cape Town",
  roughBudgetCents: 2_800_000,
  travellerGroup: "couple",
  tripType: "domestic",
  interests: ["beach", "food"],
  dateFlexibility: "veryFlexible",
  preferredPlanMonths: 12
});

describe("createTripFromPlannerResult", () => {
  it("creates an active trip with staged funding and an empty payment history", () => {
    const trip = createTripFromPlannerResult(plannerResult, {
      tripId: "trip_123",
      userId: "user_123",
      departureDate: "2027-03-20",
      createdAt: "2026-06-04T08:00:00.000Z"
    });

    expect(trip).toMatchObject({
      id: "trip_123",
      userId: "user_123",
      destinationName: "Cape Town",
      status: "active",
      activeFundingStage: "flights",
      totalEstimateCents: 2_500_000,
      monthlyContributionCents: 208_334,
      payments: [],
      receipts: []
    });
    expect(trip.fundingStages.map((stage) => stage.key)).toEqual([
      "flights",
      "stay",
      "experiences"
    ]);
    expect(trip.savingsSchedule).toHaveLength(12);
  });
});

describe("buildTripDashboard", () => {
  it("summarizes days, next contribution, stage progress, and payment placeholders", () => {
    const trip = createTripFromPlannerResult(plannerResult, {
      tripId: "trip_123",
      userId: "user_123",
      departureDate: "2027-03-20",
      createdAt: "2026-06-04T08:00:00.000Z"
    });

    expect(buildTripDashboard(trip, new Date("2027-03-01T00:00:00.000Z"))).toEqual({
      tripId: "trip_123",
      destinationName: "Cape Town",
      status: "active",
      departureDate: "2027-03-20",
      daysUntilDeparture: 19,
      activeFundingStage: "flights",
      amountSavedCents: 0,
      amountRemainingCents: 2_500_000,
      nextContribution: {
        month: 1,
        amountCents: 208_334,
        status: "upcoming"
      },
      fundingStages: [
        {
          key: "flights",
          targetCents: 1_200_000,
          fundedCents: 0,
          status: "active",
          completedMonth: undefined
        },
        {
          key: "stay",
          targetCents: 850_000,
          fundedCents: 0,
          status: "queued",
          completedMonth: undefined
        },
        {
          key: "experiences",
          targetCents: 450_000,
          fundedCents: 0,
          status: "queued",
          completedMonth: undefined
        }
      ],
      paymentHistory: [],
      receipts: []
    });
  });
});

describe("recordTripPayment", () => {
  it("adds payment history and updates staged funding sequentially", () => {
    const trip = createTripFromPlannerResult(plannerResult, {
      tripId: "trip_123",
      userId: "user_123",
      departureDate: "2027-03-20",
      createdAt: "2026-06-04T08:00:00.000Z"
    });
    const paidTrip = recordTripPayment(trip, {
      id: "pay_123",
      providerReference: "sandbox_ref",
      amountCents: 300_000,
      paidAt: "2026-07-01T08:00:00.000Z",
      status: "succeeded",
      receiptUrl: "https://example.com/receipt"
    });
    const dashboard = buildTripDashboard(paidTrip, new Date("2026-07-02T00:00:00.000Z"));

    expect(dashboard.amountSavedCents).toBe(300_000);
    expect(dashboard.amountRemainingCents).toBe(2_200_000);
    expect(dashboard.fundingStages).toEqual([
      {
        key: "flights",
        targetCents: 1_200_000,
        fundedCents: 300_000,
        status: "active",
        completedMonth: undefined
      },
      {
        key: "stay",
        targetCents: 850_000,
        fundedCents: 0,
        status: "queued",
        completedMonth: undefined
      },
      {
        key: "experiences",
        targetCents: 450_000,
        fundedCents: 0,
        status: "queued",
        completedMonth: undefined
      }
    ]);
    expect(dashboard.paymentHistory).toHaveLength(1);
    expect(dashboard.receipts).toEqual([
      {
        paymentId: "pay_123",
        receiptUrl: "https://example.com/receipt",
        issuedAt: "2026-07-01T08:00:00.000Z"
      }
    ]);
  });
});

