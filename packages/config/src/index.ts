export const APP_NAME = "Batho Travels";
export const LOCALE = "en-ZA";
export const CURRENCY = "ZAR";

export const DEFAULT_PLAN_MONTHS = 12;
export const MAX_PLAN_MONTHS = 12;
export const MIN_PLAN_MONTHS = 3;
export const GRACE_PERIOD_DAYS = 7;
export const CANCELLATION_MANAGEMENT_FEE_CENTS = 50_000;

export const TRIP_TYPE_MINIMUM_MONTHS = {
  domestic: 3,
  africaRegional: 6,
  longHaulInternational: 12
} as const;

export const KYC_BOOKING_LIMITS_CENTS = {
  basic: 0,
  standard: 5_000_000,
  enhanced: Number.POSITIVE_INFINITY
} as const;

export const REFUND_TIERS = [
  { minimumMonthsBeforeTravel: 12, refundPercentage: 100 },
  { minimumMonthsBeforeTravel: 9, refundPercentage: 85 },
  { minimumMonthsBeforeTravel: 6, refundPercentage: 70 },
  { minimumMonthsBeforeTravel: 3, refundPercentage: 50 },
  { minimumMonthsBeforeTravel: 0, refundPercentage: 0 }
] as const;

export const FUNDING_STAGE_ORDER = ["flights", "stay", "experiences"] as const;

export const NOTIFICATION_CHANNELS = ["email", "whatsapp", "push", "inApp"] as const;

export const FORBIDDEN_USER_FACING_TERMS = [
  "buy now pay later",
  "BNPL",
  "loan",
  "credit",
  "late fee",
  "penalty",
  "inventory certainty phrasing",
  "default"
] as const;

export const SHORT_BRAND_NAME = "Batho";
export const REQUIRE_FULL_BRAND_NAME = true;

export const APPROVED_RESERVATION_TERMS = [
  "Reserve your spot",
  "Secure your travel plan early"
] as const;

export type TripType = keyof typeof TRIP_TYPE_MINIMUM_MONTHS;
export type FundingStageKey = (typeof FUNDING_STAGE_ORDER)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export * from "./launchSeed";
