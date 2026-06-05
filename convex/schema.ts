import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const role = v.union(v.literal("operations"), v.literal("finance"), v.literal("support"));
const tripType = v.union(
  v.literal("domestic"),
  v.literal("africaRegional"),
  v.literal("longHaulInternational")
);
const fundingStage = v.union(v.literal("flights"), v.literal("stay"), v.literal("experiences"));
const paymentProvider = v.union(v.literal("paystack"), v.literal("stripe"), v.literal("ozow"));
const paymentMethod = v.union(v.literal("card"), v.literal("eft"));
const paymentStatus = v.union(
  v.literal("pending"),
  v.literal("succeeded"),
  v.literal("failed"),
  v.literal("refunded")
);
const notificationChannel = v.union(
  v.literal("email"),
  v.literal("whatsapp"),
  v.literal("push"),
  v.literal("inApp")
);
const supportAction = v.union(v.literal("pause"), v.literal("adjust"), v.literal("cancel"));

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    googleSubject: v.optional(v.string()),
    kycTier: v.union(v.literal("basic"), v.literal("standard"), v.literal("enhanced")),
    notificationChannels: v.array(notificationChannel),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_email", ["email"])
    .index("by_google_subject", ["googleSubject"]),

  sessions: defineTable({
    userId: v.id("users"),
    sessionTokenHash: v.string(),
    expiresAt: v.number(),
    deviceLabel: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_expiry", ["expiresAt"]),

  plannerSessions: defineTable({
    userId: v.id("users"),
    status: v.union(v.literal("draft"), v.literal("readyForSavings"), v.literal("converted")),
    guidedInputs: v.any(),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
        createdAt: v.number()
      })
    ),
    structuredResult: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_user_status", ["userId", "status"]),

  destinations: defineTable({
    name: v.string(),
    country: v.string(),
    region: v.string(),
    tripType,
    isActive: v.boolean(),
    baselineCostCents: v.object({
      flights: v.number(),
      stay: v.number(),
      experiences: v.number()
    }),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_name", ["name"])
    .index("by_trip_type", ["tripType"]),

  seasonalityMonths: defineTable({
    destinationId: v.id("destinations"),
    month: v.number(),
    season: v.union(v.literal("peak"), v.literal("shoulder"), v.literal("low")),
    averageTemperatureC: v.optional(v.number()),
    rainfallMm: v.optional(v.number()),
    relativePrice: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    notes: v.optional(v.string())
  }).index("by_destination_month", ["destinationId", "month"]),

  trips: defineTable({
    userId: v.id("users"),
    plannerSessionId: v.optional(v.id("plannerSessions")),
    destinationName: v.string(),
    tripType,
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("fullyFunded"),
      v.literal("booked"),
      v.literal("cancelled")
    ),
    departureDate: v.string(),
    destinationCountry: v.string(),
    destinationRegion: v.string(),
    totalEstimateCents: v.number(),
    activeFundingStage: fundingStage,
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"])
    .index("by_departure", ["departureDate"]),

  tripFundingStages: defineTable({
    tripId: v.id("trips"),
    stage: fundingStage,
    targetCents: v.number(),
    fundedCents: v.number(),
    status: v.union(v.literal("funded"), v.literal("active"), v.literal("queued")),
    completedAt: v.optional(v.number())
  }).index("by_trip_stage", ["tripId", "stage"]),

  savingsSchedules: defineTable({
    tripId: v.id("trips"),
    month: v.number(),
    dueAt: v.number(),
    expectedContributionCents: v.number(),
    allocationSnapshot: v.any(),
    status: v.union(v.literal("upcoming"), v.literal("paid"), v.literal("missed"), v.literal("adjusted"))
  })
    .index("by_trip_month", ["tripId", "month"])
    .index("by_status_due", ["status", "dueAt"]),

  payments: defineTable({
    userId: v.id("users"),
    tripId: v.id("trips"),
    provider: paymentProvider,
    providerReference: v.string(),
    paymentMethod,
    amountCents: v.number(),
    status: paymentStatus,
    receiptUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_trip", ["tripId"])
    .index("by_status", ["status"])
    .index("by_provider_reference", ["provider", "providerReference"]),

  paymentReceipts: defineTable({
    paymentId: v.id("payments"),
    issuedAt: v.number(),
    receiptUrl: v.optional(v.string()),
    providerPayload: v.optional(v.any())
  }).index("by_payment", ["paymentId"]),

  notifications: defineTable({
    userId: v.id("users"),
    tripId: v.optional(v.id("trips")),
    channel: notificationChannel,
    eventType: v.string(),
    status: v.union(v.literal("queued"), v.literal("sent"), v.literal("failed"), v.literal("read")),
    subject: v.optional(v.string()),
    body: v.string(),
    scheduledFor: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    createdAt: v.number()
  })
    .index("by_user_status", ["userId", "status"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_status_created", ["status", "createdAt"]),

  tripSupportActions: defineTable({
    userId: v.id("users"),
    tripId: v.id("trips"),
    action: supportAction,
    status: v.union(v.literal("requested"), v.literal("completed"), v.literal("cancelled")),
    note: v.optional(v.string()),
    requestedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedByAdminId: v.optional(v.id("adminUsers"))
  })
    .index("by_trip_status", ["tripId", "status"])
    .index("by_status_requested", ["status", "requestedAt"]),

  kycSubmissions: defineTable({
    userId: v.id("users"),
    requestedTier: v.union(v.literal("standard"), v.literal("enhanced")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    identityDocumentStorageId: v.optional(v.string()),
    proofOfAddressStorageId: v.optional(v.string()),
    selfieStorageId: v.optional(v.string()),
    reviewedByAdminId: v.optional(v.id("adminUsers")),
    reviewNote: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),

  groupTrips: defineTable({
    tripId: v.id("trips"),
    coordinatorUserId: v.id("users"),
    name: v.string(),
    totalSharesCents: v.number(),
    createdAt: v.number()
  }).index("by_coordinator", ["coordinatorUserId"]),

  groupTripParticipants: defineTable({
    groupTripId: v.id("groupTrips"),
    userId: v.optional(v.id("users")),
    inviteEmail: v.optional(v.string()),
    displayName: v.optional(v.string()),
    shareCents: v.number(),
    status: v.union(v.literal("invited"), v.literal("active"), v.literal("removed"))
  })
    .index("by_group", ["groupTripId"])
    .index("by_user", ["userId"]),

  customDestinationRequests: defineTable({
    userId: v.id("users"),
    destinationName: v.string(),
    country: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reviewedByAdminId: v.optional(v.id("adminUsers")),
    reviewNote: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),

  adminUsers: defineTable({
    userId: v.id("users"),
    roles: v.array(role),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_user", ["userId"]),

  auditLogs: defineTable({
    actorUserId: v.optional(v.id("users")),
    actorAdminId: v.optional(v.id("adminUsers")),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number()
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_actor_user", ["actorUserId"])
    .index("by_created", ["createdAt"])
});
