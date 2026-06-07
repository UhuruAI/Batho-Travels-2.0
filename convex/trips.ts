import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  buildTripDashboard,
  calculateSavingsPlan,
  createTripFromPlannerResult,
  assertKycAllowsPayment,
  type DestinationSeasonality,
  validatePlannerResult
} from "../packages/core/src/index";
import { requireAuthenticatedUser } from "./sessionAuth";

const costBreakdownValidator = v.object({
  flightsCents: v.number(),
  stayCents: v.number(),
  experiencesCents: v.number()
});

export const createTripFromPlannerSession = mutation({
  args: {
    sessionToken: v.string(),
    plannerSessionId: v.id("plannerSessions"),
    departureDate: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthenticatedUser(ctx, args.sessionToken);
    const plannerSession = await ctx.db.get(args.plannerSessionId);
    if (!plannerSession || plannerSession.userId !== user._id) {
      throw new Error("Planner session not found.");
    }

    const destinationProfile = plannerSession.briefSnapshot?.destination as
      | DestinationSeasonality
      | undefined;
    const validation = validatePlannerResult(plannerSession.structuredResult, {
      destinationProfile
    });
    if (!validation.valid) {
      throw new Error(`Planner result is not ready for trip creation: ${validation.errors.join(" ")}`);
    }

    const departureDate = validation.data.travelTiming?.selectedDepartureDate ?? args.departureDate;
    const now = new Date().toISOString();
    const tripId = await ctx.db.insert("trips", {
      userId: user._id,
      plannerSessionId: args.plannerSessionId,
      destinationName: validation.data.destination.name,
      destinationCountry: validation.data.destination.country,
      destinationRegion: validation.data.destination.region,
      tripType: validation.data.tripType,
      status: "planning",
      departureDate,
      totalEstimateCents: validation.data.estimatedCost.totalCents,
      activeFundingStage: "flights",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    const trip = createTripFromPlannerResult(validation.data, {
      tripId,
      userId: user._id,
      departureDate,
      createdAt: now
    });

    await Promise.all(
      trip.fundingStages.map((stage) =>
        ctx.db.insert("tripFundingStages", {
          tripId,
          stage: stage.key,
          targetCents: stage.targetCents,
          fundedCents: stage.fundedCents,
          status: stage.status,
          completedAt: undefined
        })
      )
    );

    await Promise.all(
      trip.savingsSchedule.map((month) =>
        ctx.db.insert("savingsSchedules", {
          tripId,
          month: month.month,
          dueAt: dueDateForScheduleMonth(departureDate, trip.planMonths, month.month),
          expectedContributionCents: month.contributionCents,
          allocationSnapshot: month.allocations,
          status: "upcoming"
        })
      )
    );

    await ctx.db.patch(args.plannerSessionId, {
      status: "converted",
      updatedAt: Date.now()
    });

    return { tripId };
  }
});

export const updateTripDraft = mutation({
  args: {
    sessionToken: v.string(),
    tripId: v.id("trips"),
    departureDate: v.optional(v.string()),
    costBreakdown: v.optional(costBreakdownValidator),
    planMonths: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthenticatedUser(ctx, args.sessionToken);
    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new Error("Trip not found.");
    }
    if (trip.status !== "planning") {
      throw new Error("Only planning drafts can be edited before payment starts.");
    }

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_trip", (queryBuilder) => queryBuilder.eq("tripId", args.tripId))
      .collect();
    if (payments.some((payment) => payment.status === "succeeded")) {
      throw new Error("This trip already has payment activity and can no longer be edited.");
    }

    const existingStages = await ctx.db
      .query("tripFundingStages")
      .withIndex("by_trip_stage", (queryBuilder) => queryBuilder.eq("tripId", args.tripId))
      .collect();
    const existingSchedule = await ctx.db
      .query("savingsSchedules")
      .withIndex("by_trip_month", (queryBuilder) => queryBuilder.eq("tripId", args.tripId))
      .collect();
    const costBreakdown = args.costBreakdown ?? {
      flightsCents: stageTarget(existingStages, "flights"),
      stayCents: stageTarget(existingStages, "stay"),
      experiencesCents: stageTarget(existingStages, "experiences")
    };
    const totalEstimateCents =
      costBreakdown.flightsCents + costBreakdown.stayCents + costBreakdown.experiencesCents;
    const planMonths = args.planMonths ?? Math.max(1, existingSchedule.length);
    const savingsPlan = calculateSavingsPlan({
      totalCostCents: totalEstimateCents,
      tripType: trip.tripType,
      planMonths,
      departureDate: args.departureDate ?? trip.departureDate,
      costBreakdown
    });

    if (!savingsPlan.isValid) {
      throw new Error(savingsPlan.message ?? "This draft cannot create a valid savings schedule.");
    }

    await Promise.all([
      ...existingStages.map((stage) => ctx.db.delete(stage._id)),
      ...existingSchedule.map((month) => ctx.db.delete(month._id))
    ]);

    await Promise.all(
      savingsPlan.fundingStages.map((stage, index) =>
        ctx.db.insert("tripFundingStages", {
          tripId: args.tripId,
          stage: stage.key,
          targetCents: stage.targetCents,
          fundedCents: 0,
          status: index === 0 ? "active" : "queued",
          completedAt: undefined
        })
      )
    );

    await Promise.all(
      savingsPlan.schedule.map((month) =>
        ctx.db.insert("savingsSchedules", {
          tripId: args.tripId,
          month: month.month,
          dueAt: dueDateForScheduleMonth(
            args.departureDate ?? trip.departureDate,
            planMonths,
            month.month
          ),
          expectedContributionCents: month.contributionCents,
          allocationSnapshot: month.allocations,
          status: "upcoming"
        })
      )
    );

    await ctx.db.patch(args.tripId, {
      departureDate: args.departureDate ?? trip.departureDate,
      totalEstimateCents,
      activeFundingStage: "flights",
      updatedAt: Date.now()
    });

    return {
      tripId: args.tripId,
      totalEstimateCents,
      monthlyContributionCents: savingsPlan.monthlyContributionCents,
      planMonths
    };
  }
});

export const confirmTripReadyForPayment = mutation({
  args: {
    sessionToken: v.string(),
    tripId: v.id("trips")
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthenticatedUser(ctx, args.sessionToken);
    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new Error("Trip not found.");
    }

    const gate = assertKycAllowsPayment(user.kycTier, trip.totalEstimateCents);
    if (trip.status === "planning") {
      await ctx.db.patch(args.tripId, {
        status: "active",
        updatedAt: Date.now()
      });
    }

    return gate;
  }
});

export const listUserTrips = query({
  args: {
    sessionToken: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthenticatedUser(ctx, args.sessionToken);
    return ctx.db
      .query("trips")
      .withIndex("by_user_status", (queryBuilder) => queryBuilder.eq("userId", user._id))
      .collect();
  }
});

export const getTripDashboard = query({
  args: {
    sessionToken: v.string(),
    tripId: v.id("trips")
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthenticatedUser(ctx, args.sessionToken);
    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      return null;
    }

    const [fundingStages, savingsSchedule, payments] = await Promise.all([
      ctx.db
        .query("tripFundingStages")
        .withIndex("by_trip_stage", (queryBuilder) => queryBuilder.eq("tripId", args.tripId))
        .collect(),
      ctx.db
        .query("savingsSchedules")
        .withIndex("by_trip_month", (queryBuilder) => queryBuilder.eq("tripId", args.tripId))
        .collect(),
      ctx.db
        .query("payments")
        .withIndex("by_trip", (queryBuilder) => queryBuilder.eq("tripId", args.tripId))
        .collect()
    ]);

    return buildTripDashboard({
      id: trip._id,
      userId: trip.userId,
      destinationName: trip.destinationName,
      destinationCountry: trip.destinationCountry,
      destinationRegion: trip.destinationRegion,
      tripType: trip.tripType,
      status: trip.status,
      departureDate: trip.departureDate,
      totalEstimateCents: trip.totalEstimateCents,
      monthlyContributionCents:
        savingsSchedule[0]?.expectedContributionCents ?? trip.totalEstimateCents,
      planMonths: savingsSchedule.length,
      activeFundingStage: trip.activeFundingStage,
      fundingStages: fundingStages.map((stage) => ({
        key: stage.stage,
        targetCents: stage.targetCents,
        fundedCents: stage.fundedCents,
        status: stage.status,
        completedMonth: undefined
      })),
      savingsSchedule: savingsSchedule.map((month) => ({
        month: month.month,
        contributionCents: month.expectedContributionCents,
        allocations: month.allocationSnapshot
      })),
      payments: payments.map((payment) => ({
        id: payment._id,
        providerReference: payment.providerReference,
        amountCents: payment.amountCents,
        paidAt: new Date(payment.createdAt).toISOString(),
        status: payment.status,
        receiptUrl: payment.receiptUrl
      })),
      receipts: payments
        .filter((payment) => payment.receiptUrl)
        .map((payment) => ({
          paymentId: payment._id,
          receiptUrl: payment.receiptUrl as string,
          issuedAt: new Date(payment.createdAt).toISOString()
        })),
      createdAt: new Date(trip.createdAt).toISOString(),
      updatedAt: new Date(trip.updatedAt).toISOString()
    });
  }
});

function dueDateForScheduleMonth(
  departureDate: string,
  planMonths: number,
  scheduleMonth: number
): number {
  const departure = new Date(departureDate);
  const dueDate = new Date(
    Date.UTC(
      departure.getUTCFullYear(),
      departure.getUTCMonth() - planMonths + scheduleMonth - 1,
      1
    )
  );

  return dueDate.getTime();
}

function stageTarget(
  stages: Array<{ stage: "flights" | "stay" | "experiences"; targetCents: number }>,
  key: "flights" | "stay" | "experiences"
): number {
  return stages.find((stage) => stage.stage === key)?.targetCents ?? 0;
}
