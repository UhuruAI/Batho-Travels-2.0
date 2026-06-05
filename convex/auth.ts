import { mutation } from "./_generated/server";
import { v } from "convex/values";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const createEmailSession = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    sessionTokenHash: v.string(),
    deviceLabel: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (query) => query.eq("email", args.email))
      .first();

    const userId =
      existingUser?._id ??
      (await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        kycTier: "basic",
        notificationChannels: ["email", "inApp"],
        createdAt: now,
        updatedAt: now
      }));

    await ctx.db.insert("sessions", {
      userId,
      sessionTokenHash: args.sessionTokenHash,
      expiresAt: now + THIRTY_DAYS_MS,
      deviceLabel: args.deviceLabel,
      createdAt: now
    });

    return { userId };
  }
});

