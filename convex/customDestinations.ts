import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateCustomDestinationRequest } from "../packages/core/src/index";

const reviewStatus = v.union(v.literal("approved"), v.literal("rejected"));

export const createCustomDestinationRequest = mutation({
  args: {
    userId: v.id("users"),
    destinationName: v.string(),
    country: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const validation = validateCustomDestinationRequest(args);
    if (!validation.valid) {
      throw new Error(validation.message ?? "Add more destination detail.");
    }

    const now = Date.now();
    const requestId = await ctx.db.insert("customDestinationRequests", {
      userId: args.userId,
      destinationName: args.destinationName.trim(),
      country: args.country?.trim(),
      notes: args.notes?.trim(),
      status: "pending",
      reviewedByAdminId: undefined,
      reviewNote: undefined,
      createdAt: now,
      reviewedAt: undefined
    });

    await ctx.db.insert("auditLogs", {
      actorUserId: args.userId,
      action: "customDestination.requested",
      entityType: "customDestinationRequest",
      entityId: requestId,
      metadata: {
        destinationName: args.destinationName,
        country: args.country
      },
      createdAt: now
    });

    return { requestId };
  }
});

export const listUserCustomDestinationRequests = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("customDestinationRequests")
      .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", args.userId))
      .collect();
  }
});

export const listPendingCustomDestinationRequests = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("customDestinationRequests")
      .withIndex("by_status", (queryBuilder) => queryBuilder.eq("status", "pending"))
      .collect();
  }
});

export const reviewCustomDestinationRequest = mutation({
  args: {
    adminUserId: v.id("adminUsers"),
    requestId: v.id("customDestinationRequests"),
    status: reviewStatus,
    reviewNote: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Custom destination request not found.");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: args.status,
      reviewedByAdminId: args.adminUserId,
      reviewNote: args.reviewNote,
      reviewedAt: now
    });
    await ctx.db.insert("auditLogs", {
      actorAdminId: args.adminUserId,
      action:
        args.status === "approved"
          ? "customDestination.approved"
          : "customDestination.rejected",
      entityType: "customDestinationRequest",
      entityId: args.requestId,
      metadata: {
        destinationName: request.destinationName,
        country: request.country,
        reviewNote: args.reviewNote
      },
      createdAt: now
    });

    return { requestId: args.requestId };
  }
});
