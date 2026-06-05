import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  applyTripSupportAction,
  assertSupportiveNotificationCopy
} from "../packages/core/src/index";

const supportAction = v.union(v.literal("pause"), v.literal("adjust"), v.literal("cancel"));

export const requestTripSupportAction = mutation({
  args: {
    userId: v.id("users"),
    tripId: v.id("trips"),
    action: supportAction,
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.note) {
      assertSupportiveNotificationCopy(args.note);
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error("Trip not found.");
    }
    if (trip.userId !== args.userId) {
      throw new Error("Trip does not belong to this user.");
    }

    const now = Date.now();
    const actionId = await ctx.db.insert("tripSupportActions", {
      userId: args.userId,
      tripId: args.tripId,
      action: args.action,
      status: "requested",
      note: args.note,
      requestedAt: now,
      resolvedAt: undefined,
      resolvedByAdminId: undefined
    });

    await ctx.db.insert("auditLogs", {
      actorUserId: args.userId,
      action: `trip.support.${args.action}.requested`,
      entityType: "trip",
      entityId: args.tripId,
      metadata: {
        supportActionId: actionId,
        note: args.note
      },
      createdAt: now
    });

    return { actionId };
  }
});

export const listPendingSupportActions = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("tripSupportActions")
      .withIndex("by_status_requested", (queryBuilder) =>
        queryBuilder.eq("status", "requested")
      )
      .collect();
  }
});

export const resolveTripSupportAction = mutation({
  args: {
    adminUserId: v.id("adminUsers"),
    actionId: v.id("tripSupportActions"),
    resolutionNote: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.resolutionNote) {
      assertSupportiveNotificationCopy(args.resolutionNote);
    }

    const supportAction = await ctx.db.get(args.actionId);
    if (!supportAction) {
      throw new Error("Support action not found.");
    }
    const trip = await ctx.db.get(supportAction.tripId);
    if (!trip) {
      throw new Error("Trip not found.");
    }

    const result = applyTripSupportAction({
      currentStatus: trip.status,
      action: supportAction.action
    });
    const now = Date.now();

    await ctx.db.patch(supportAction.tripId, {
      status: result.nextStatus,
      updatedAt: now
    });
    await ctx.db.patch(args.actionId, {
      status: "completed",
      note: args.resolutionNote ?? supportAction.note,
      resolvedAt: now,
      resolvedByAdminId: args.adminUserId
    });
    await ctx.db.insert("auditLogs", {
      actorAdminId: args.adminUserId,
      action: `trip.support.${supportAction.action}.completed`,
      entityType: "tripSupportAction",
      entityId: args.actionId,
      metadata: {
        tripId: supportAction.tripId,
        nextStatus: result.nextStatus,
        message: result.message
      },
      createdAt: now
    });

    return result;
  }
});
