import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  assertSupportiveNotificationCopy,
  validateNotificationPreferences
} from "../packages/core/src/index";
import { requireAuthenticatedUser } from "./sessionAuth";

const notificationChannel = v.union(
  v.literal("email"),
  v.literal("whatsapp"),
  v.literal("push"),
  v.literal("inApp")
);

export const queueSupportiveNotification = mutation({
  args: {
    userId: v.id("users"),
    tripId: v.optional(v.id("trips")),
    channel: notificationChannel,
    eventType: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    scheduledFor: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    if (args.subject) {
      assertSupportiveNotificationCopy(args.subject);
    }
    assertSupportiveNotificationCopy(args.body);

    return ctx.db.insert("notifications", {
      ...args,
      status: "queued",
      createdAt: Date.now()
    });
  }
});

export const updateNotificationPreferences = mutation({
  args: {
    sessionToken: v.string(),
    channels: v.array(notificationChannel)
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthenticatedUser(ctx, args.sessionToken);
    const preferences = validateNotificationPreferences({ channels: args.channels });

    if (!preferences.valid) {
      throw new Error(preferences.message ?? "Choose supported Batho Travels channels.");
    }

    await ctx.db.patch(user._id, {
      notificationChannels: preferences.channels,
      updatedAt: Date.now()
    });

    return preferences;
  }
});

export const getNotificationPreferences = query({
  args: {
    sessionToken: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthenticatedUser(ctx, args.sessionToken);
    return {
      channels: user.notificationChannels
    };
  }
});
