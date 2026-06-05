import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  applyKycReviewDecision,
  validateKycSubmission,
  type KycDocumentKind
} from "../packages/core/src/index";

const requestedTier = v.union(v.literal("standard"), v.literal("enhanced"));
const reviewDecision = v.union(v.literal("approved"), v.literal("rejected"));

export const createKycSubmission = mutation({
  args: {
    userId: v.id("users"),
    requestedTier,
    identityDocumentStorageId: v.optional(v.string()),
    proofOfAddressStorageId: v.optional(v.string()),
    selfieStorageId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const validation = validateKycSubmission({
      requestedTier: args.requestedTier,
      documentStorageIds: documentMapFromStorageIds(args)
    });

    if (!validation.valid) {
      throw new Error(validation.message ?? "Please add the required verification documents.");
    }

    const now = Date.now();
    const submissionId = await ctx.db.insert("kycSubmissions", {
      userId: args.userId,
      requestedTier: args.requestedTier,
      status: "pending",
      identityDocumentStorageId: args.identityDocumentStorageId,
      proofOfAddressStorageId: args.proofOfAddressStorageId,
      selfieStorageId: args.selfieStorageId,
      reviewedByAdminId: undefined,
      reviewNote: undefined,
      createdAt: now,
      reviewedAt: undefined
    });

    await ctx.db.insert("auditLogs", {
      actorUserId: args.userId,
      action: "kyc.submission.created",
      entityType: "kycSubmission",
      entityId: submissionId,
      metadata: {
        requestedTier: args.requestedTier
      },
      createdAt: now
    });

    return { submissionId };
  }
});

export const listUserKycSubmissions = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("kycSubmissions")
      .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", args.userId))
      .collect();
  }
});

export const listPendingKycReviews = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("kycSubmissions")
      .withIndex("by_status", (queryBuilder) => queryBuilder.eq("status", "pending"))
      .collect();
  }
});

export const reviewKycSubmission = mutation({
  args: {
    adminUserId: v.id("adminUsers"),
    submissionId: v.id("kycSubmissions"),
    decision: reviewDecision,
    reviewNote: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("KYC submission not found.");
    }

    const user = await ctx.db.get(submission.userId);
    if (!user) {
      throw new Error("Traveller not found.");
    }

    const review = applyKycReviewDecision({
      currentTier: user.kycTier,
      requestedTier: submission.requestedTier,
      decision: args.decision
    });
    const now = Date.now();

    await ctx.db.patch(args.submissionId, {
      status: review.submissionStatus,
      reviewedByAdminId: args.adminUserId,
      reviewNote: args.reviewNote ?? review.message,
      reviewedAt: now
    });

    if (args.decision === "approved" && review.nextTier !== user.kycTier) {
      await ctx.db.patch(submission.userId, {
        kycTier: review.nextTier,
        updatedAt: now
      });
    }

    await ctx.db.insert("auditLogs", {
      actorAdminId: args.adminUserId,
      action: args.decision === "approved" ? "kyc.submission.approved" : "kyc.submission.rejected",
      entityType: "kycSubmission",
      entityId: args.submissionId,
      metadata: {
        userId: submission.userId,
        requestedTier: submission.requestedTier,
        nextTier: review.nextTier,
        reviewNote: args.reviewNote
      },
      createdAt: now
    });

    return review;
  }
});

function documentMapFromStorageIds(input: {
  identityDocumentStorageId?: string;
  proofOfAddressStorageId?: string;
  selfieStorageId?: string;
}): Partial<Record<KycDocumentKind, string>> {
  return {
    identityDocument: input.identityDocumentStorageId,
    proofOfAddress: input.proofOfAddressStorageId,
    selfie: input.selfieStorageId
  };
}
