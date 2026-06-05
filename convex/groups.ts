import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  buildGroupFundingSummary,
  validateGroupParticipants
} from "../packages/core/src/index";

const participantStatus = v.union(v.literal("invited"), v.literal("active"), v.literal("removed"));

export const createGroupTrip = mutation({
  args: {
    coordinatorUserId: v.id("users"),
    tripId: v.id("trips"),
    name: v.string(),
    participants: v.array(
      v.object({
        userId: v.optional(v.id("users")),
        inviteEmail: v.optional(v.string()),
        displayName: v.optional(v.string()),
        shareCents: v.number(),
        status: participantStatus
      })
    )
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error("Trip not found.");
    }
    if (trip.userId !== args.coordinatorUserId) {
      throw new Error("Only the trip owner can coordinate this group plan.");
    }

    const validation = validateGroupParticipants({
      tripTotalCents: trip.totalEstimateCents,
      participants: args.participants.map((participant) => ({
        userId: participant.userId ?? participant.inviteEmail ?? participant.displayName ?? "invited",
        shareCents: participant.shareCents,
        status: participant.status
      }))
    });
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const now = Date.now();
    const groupTripId = await ctx.db.insert("groupTrips", {
      tripId: args.tripId,
      coordinatorUserId: args.coordinatorUserId,
      name: args.name,
      totalSharesCents: validation.totalSharesCents,
      createdAt: now
    });

    await Promise.all(
      args.participants.map((participant) =>
        ctx.db.insert("groupTripParticipants", {
          groupTripId,
          userId: participant.userId,
          inviteEmail: participant.inviteEmail,
          displayName: participant.displayName,
          shareCents: participant.shareCents,
          status: participant.status
        })
      )
    );
    await ctx.db.insert("auditLogs", {
      actorUserId: args.coordinatorUserId,
      action: "groupTrip.created",
      entityType: "groupTrip",
      entityId: groupTripId,
      metadata: {
        tripId: args.tripId,
        participantCount: args.participants.length
      },
      createdAt: now
    });

    return { groupTripId };
  }
});

export const listCoordinatorGroupTrips = query({
  args: {
    coordinatorUserId: v.id("users")
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("groupTrips")
      .withIndex("by_coordinator", (queryBuilder) =>
        queryBuilder.eq("coordinatorUserId", args.coordinatorUserId)
      )
      .collect();
  }
});

export const getGroupTripSummary = query({
  args: {
    groupTripId: v.id("groupTrips")
  },
  handler: async (ctx, args) => {
    const groupTrip = await ctx.db.get(args.groupTripId);
    if (!groupTrip) {
      return null;
    }
    const trip = await ctx.db.get(groupTrip.tripId);
    if (!trip) {
      return null;
    }
    const participants = await ctx.db
      .query("groupTripParticipants")
      .withIndex("by_group", (queryBuilder) => queryBuilder.eq("groupTripId", args.groupTripId))
      .collect();

    return {
      groupTrip,
      summary: buildGroupFundingSummary({
        tripTotalCents: trip.totalEstimateCents,
        participants: participants.map((participant) => ({
          userId: participant.userId ?? participant.inviteEmail ?? participant._id,
          name: participant.displayName ?? participant.inviteEmail ?? "Invited traveller",
          shareCents: participant.shareCents,
          savedCents: 0,
          status: participant.status
        }))
      })
    };
  }
});

export const updateParticipantStatus = mutation({
  args: {
    participantId: v.id("groupTripParticipants"),
    status: participantStatus,
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new Error("Group participant not found.");
    }

    await ctx.db.patch(args.participantId, {
      status: args.status,
      userId: args.userId ?? participant.userId
    });

    return { participantId: args.participantId };
  }
});
