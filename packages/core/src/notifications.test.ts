import { describe, expect, it } from "vitest";
import {
  applyTripSupportAction,
  assertSupportiveNotificationCopy,
  buildPaymentReminderNotification,
  classifyContributionTiming,
  getTripSupportOptions
} from "./notifications";

describe("assertSupportiveNotificationCopy", () => {
  it("rejects punitive reminder language", () => {
    expect(() => assertSupportiveNotificationCopy("You owe a late fee.")).toThrow(
      "Notification copy violates Batho Travels tone guardrails"
    );
  });

  it("allows supportive reminder language", () => {
    expect(() =>
      assertSupportiveNotificationCopy("Your Batho Travels contribution is due soon.")
    ).not.toThrow();
  });
});

describe("classifyContributionTiming", () => {
  it("marks a contribution due within three days as due soon", () => {
    expect(
      classifyContributionTiming({
        dueAt: Date.UTC(2026, 5, 10),
        asOf: Date.UTC(2026, 5, 8),
        isPaid: false
      })
    ).toBe("dueSoon");
  });

  it("uses the seven-day grace window before support review", () => {
    expect(
      classifyContributionTiming({
        dueAt: Date.UTC(2026, 5, 1),
        asOf: Date.UTC(2026, 5, 6),
        isPaid: false
      })
    ).toBe("inGrace");
    expect(
      classifyContributionTiming({
        dueAt: Date.UTC(2026, 5, 1),
        asOf: Date.UTC(2026, 5, 9),
        isPaid: false
      })
    ).toBe("supportReview");
  });
});

describe("buildPaymentReminderNotification", () => {
  it("creates warm reminder copy without debt framing", () => {
    expect(
      buildPaymentReminderNotification({
        destinationName: "Cape Town",
        amountCents: 208_334,
        dueAt: Date.UTC(2026, 5, 10),
        timing: "dueSoon"
      })
    ).toEqual({
      eventType: "payment.reminder.dueSoon",
      subject: "Your Cape Town contribution is coming up",
      body:
        "Your next Batho Travels contribution is R2,083, due on 10 June 2026. You can keep your plan steady, or adjust it if your month has changed.",
      recommendedChannels: ["inApp", "push", "email"]
    });
  });
});

describe("trip support actions", () => {
  it("offers pause, adjust, and cancel without penalties during grace", () => {
    expect(getTripSupportOptions("inGrace").map((option) => option.action)).toEqual([
      "pause",
      "adjust",
      "cancel"
    ]);
  });

  it("turns support actions into non-punitive trip status changes", () => {
    expect(applyTripSupportAction({ currentStatus: "active", action: "pause" })).toEqual({
      nextStatus: "paused",
      message: "Plan paused. The traveller can resume or adjust the plan before booking continues."
    });
  });
});
