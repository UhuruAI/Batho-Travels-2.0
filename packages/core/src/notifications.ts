import { GRACE_PERIOD_DAYS, NOTIFICATION_CHANNELS } from "@batho/config";
import type { NotificationChannel } from "@batho/config";
import type { TripStatus } from "./trips.js";

export type ContributionTiming = "paid" | "upcoming" | "dueSoon" | "inGrace" | "supportReview";
export type TripSupportAction = "pause" | "adjust" | "cancel";

export type ContributionTimingInput = {
  dueAt: number;
  asOf: number;
  isPaid: boolean;
};

export type PaymentReminderInput = {
  destinationName: string;
  amountCents: number;
  dueAt: number;
  timing: Exclude<ContributionTiming, "paid" | "upcoming">;
};

export type PaymentReminderNotification = {
  eventType: string;
  subject: string;
  body: string;
  recommendedChannels: NotificationChannel[];
};

export type TripSupportOption = {
  action: TripSupportAction;
  title: string;
  description: string;
};

export type TripSupportActionInput = {
  currentStatus: TripStatus;
  action: TripSupportAction;
};

export type TripSupportActionResult = {
  nextStatus: TripStatus;
  message: string;
};

export type NotificationPreferenceInput = {
  channels: NotificationChannel[];
};

export type NotificationPreferenceResult = {
  valid: boolean;
  channels: NotificationChannel[];
  message?: string;
};

const FORBIDDEN_NOTIFICATION_FRAGMENTS = [
  "late fee",
  "penalty",
  "defaulted",
  "failed to pay",
  "debt collection",
  "arrears"
];

export function assertSupportiveNotificationCopy(copy: string): void {
  const normalized = copy.toLowerCase();
  const matched = FORBIDDEN_NOTIFICATION_FRAGMENTS.find((fragment) =>
    normalized.includes(fragment)
  );

  if (matched) {
    throw new Error(`Notification copy violates Batho Travels tone guardrails: ${matched}`);
  }
}

export function classifyContributionTiming(input: ContributionTimingInput): ContributionTiming {
  if (input.isPaid) {
    return "paid";
  }

  const daysUntilDue = Math.floor((startOfDay(input.dueAt) - startOfDay(input.asOf)) / 86_400_000);

  if (daysUntilDue >= 0 && daysUntilDue <= 3) {
    return "dueSoon";
  }
  if (daysUntilDue > 3) {
    return "upcoming";
  }
  if (Math.abs(daysUntilDue) <= GRACE_PERIOD_DAYS) {
    return "inGrace";
  }

  return "supportReview";
}

export function buildPaymentReminderNotification(
  input: PaymentReminderInput
): PaymentReminderNotification {
  const amount = formatRand(input.amountCents);
  const dueDate = new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(input.dueAt));

  if (input.timing === "supportReview") {
    return guardNotification({
      eventType: "payment.reminder.supportReview",
      subject: `Let us adjust your ${input.destinationName} plan`,
      body: `Your ${input.destinationName} contribution is past the grace window. Batho Travels can help you pause, adjust, or cancel calmly before any booking decisions continue.`,
      recommendedChannels: ["inApp", "email", "whatsapp"]
    });
  }

  if (input.timing === "inGrace") {
    return guardNotification({
      eventType: "payment.reminder.grace",
      subject: `Your ${input.destinationName} plan is still protected`,
      body: `Your ${amount} contribution was due on ${dueDate}. You are inside the ${GRACE_PERIOD_DAYS}-day grace period, and you can pause, adjust, or continue when ready.`,
      recommendedChannels: ["inApp", "push", "email"]
    });
  }

  return guardNotification({
    eventType: "payment.reminder.dueSoon",
    subject: `Your ${input.destinationName} contribution is coming up`,
    body: `Your next Batho Travels contribution is ${amount}, due on ${dueDate}. You can keep your plan steady, or adjust it if your month has changed.`,
    recommendedChannels: ["inApp", "push", "email"]
  });
}

export function getTripSupportOptions(timing: ContributionTiming): TripSupportOption[] {
  const baseOptions: TripSupportOption[] = [
    {
      action: "pause",
      title: "Pause plan",
      description: "Stop new booking movement while the traveller catches up or decides what is next."
    },
    {
      action: "adjust",
      title: "Adjust monthly amount",
      description: "Rework the remaining schedule so the plan stays realistic."
    },
    {
      action: "cancel",
      title: "Cancel plan",
      description: "Close the plan and calculate the refund using the published policy."
    }
  ];

  if (timing === "upcoming" || timing === "paid") {
    return baseOptions.filter((option) => option.action !== "pause");
  }

  return baseOptions;
}

export function applyTripSupportAction(input: TripSupportActionInput): TripSupportActionResult {
  if (input.action === "pause") {
    return {
      nextStatus: "paused",
      message:
        "Plan paused. The traveller can resume or adjust the plan before booking continues."
    };
  }

  if (input.action === "cancel") {
    return {
      nextStatus: "cancelled",
      message: "Plan cancelled. Refund handling should follow the published Batho Travels policy."
    };
  }

  return {
    nextStatus: input.currentStatus,
    message: "Plan adjustment requested. Recalculate the remaining schedule before the next payment."
  };
}

export function validateNotificationPreferences(
  input: NotificationPreferenceInput
): NotificationPreferenceResult {
  const uniqueChannels = [...new Set(input.channels)];
  const invalidChannel = uniqueChannels.find(
    (channel) => !(NOTIFICATION_CHANNELS as readonly string[]).includes(channel)
  );

  if (invalidChannel) {
    return {
      valid: false,
      channels: uniqueChannels,
      message: "Choose supported Batho Travels notification channels."
    };
  }

  if (uniqueChannels.length === 0) {
    return {
      valid: false,
      channels: [],
      message: "Keep at least one reminder channel active for your travel plan."
    };
  }

  return {
    valid: true,
    channels: uniqueChannels
  };
}

function guardNotification(notification: PaymentReminderNotification): PaymentReminderNotification {
  assertSupportiveNotificationCopy(notification.subject);
  assertSupportiveNotificationCopy(notification.body);

  return notification;
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function formatRand(amountCents: number): string {
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(amountCents / 100);

  return `R${amount}`;
}
