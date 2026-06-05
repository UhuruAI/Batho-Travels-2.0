import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  buildTripDashboard,
  createTripFromPlannerResult,
  validatePlannerResult
} from "../packages/core/src/index";

export const createTripFromPlannerSession = mutation({
  args: {
    userId: v.id("users"),
    plannerSessionId: v.id("plannerSessions"),
    departureDate: v.string()
  },
  handler: async (ctx, args) => {
    const plannerSession = await ctx.db.get(args.plannerSessionId);
    if (!plannerSession) {
      throw new Error("Planner session not found.");
    }

    const validation = validatePlannerResult(plannerSession.structuredResult);
    if (!validation.valid) {
      throw new Error(`Planner result is not ready for trip creation: ${validation.errors.join(" ")}`);
    }

    const now = new Date().toISOString();
    const tripId = await ctx.db.insert("trips", {
      userId: args.userId,
      plannerSessionId: args.plannerSessionId,
      destinationName: validation.data.destination.name,
      destinationCountry: validation.data.destination.country,
      destinationRegion: validation.data.destination.region,
      tripType: validation.data.tripType,
      status: "active",
      departureDate: args.departureDate,
      totalEstimateCents: validation.data.estimatedCost.totalCents,
      activeFundingStage: "flights",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    const trip = createTripFromPlannerResult(validation.data, {
      tripId,
      userId: args.userId,
      departureDate: args.departureDate,
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
          dueAt: dueDateForScheduleMonth(args.departureDate, trip.planMonths, month.month),
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

export const listUserTrips = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("trips")
      .withIndex("by_user_status", (queryBuilder) => queryBuilder.eq("userId", args.userId))
      .collect();
  }
});

export const getTripDashboard = query({
  args: {
    tripId: v.id("trips")
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
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
