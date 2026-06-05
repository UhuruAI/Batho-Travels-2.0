import { internalMutation } from "./_generated/server";
import {
  buildPaymentReminderNotification,
  classifyContributionTiming
} from "../packages/core/src/index";

export const sendPaymentReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threeDaysFromNow = now + 3 * 86_400_000;
    const schedules = await ctx.db
      .query("savingsSchedules")
      .withIndex("by_status_due", (queryBuilder) => queryBuilder.eq("status", "upcoming"))
      .filter((queryBuilder) => queryBuilder.lte(queryBuilder.field("dueAt"), threeDaysFromNow))
      .collect();
    let queued = 0;

    for (const schedule of schedules) {
      const trip = await ctx.db.get(schedule.tripId);
      if (!trip || trip.status !== "active") {
        continue;
      }
      const user = await ctx.db.get(trip.userId);
      if (!user) {
        continue;
      }

      const timing = classifyContributionTiming({
        dueAt: schedule.dueAt,
        asOf: now,
        isPaid: schedule.status === "paid"
      });

      if (timing === "upcoming" || timing === "paid") {
        continue;
      }

      const notification = buildPaymentReminderNotification({
        destinationName: trip.destinationName,
        amountCents: schedule.expectedContributionCents,
        dueAt: schedule.dueAt,
        timing
      });
      const preferredChannels = user.notificationChannels.length
        ? user.notificationChannels
        : notification.recommendedChannels;
      const channels = notification.recommendedChannels.filter((channel) =>
        preferredChannels.includes(channel)
      );

      for (const channel of channels.length ? channels : ["inApp" as const]) {
        await ctx.db.insert("notifications", {
          userId: trip.userId,
          tripId: trip._id,
          channel,
          eventType: notification.eventType,
          status: "queued",
          subject: notification.subject,
          body: notification.body,
          scheduledFor: now,
          sentAt: undefined,
          createdAt: now
        });
        queued += 1;
      }
    }

    return { queued };
  }
});

export const runOverdueSupportScan = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const schedules = await ctx.db
      .query("savingsSchedules")
      .withIndex("by_status_due", (queryBuilder) => queryBuilder.eq("status", "upcoming"))
      .filter((queryBuilder) => queryBuilder.lt(queryBuilder.field("dueAt"), now))
      .collect();
    let reviewed = 0;

    for (const schedule of schedules) {
      const timing = classifyContributionTiming({
        dueAt: schedule.dueAt,
        asOf: now,
        isPaid: schedule.status === "paid"
      });

      if (timing !== "supportReview") {
        continue;
      }

      const trip = await ctx.db.get(schedule.tripId);
      if (!trip || trip.status !== "active") {
        continue;
      }

      await ctx.db.patch(schedule._id, {
        status: "missed"
      });
      await ctx.db.insert("tripSupportActions", {
        userId: trip.userId,
        tripId: trip._id,
        action: "adjust",
        status: "requested",
        note: "Contribution passed the grace window. Offer pause, adjust, or cancel support.",
        requestedAt: now,
        resolvedAt: undefined,
        resolvedByAdminId: undefined
      });
      reviewed += 1;
    }

    return { reviewed };
  }
});

export const retryFailedNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const failedNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_status_created", (queryBuilder) => queryBuilder.eq("status", "failed"))
      .collect();

    for (const notification of failedNotifications) {
      await ctx.db.patch(notification._id, {
        status: "queued",
        scheduledFor: Date.now()
      });
    }

    return { retried: failedNotifications.length };
  }
});
