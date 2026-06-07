import { action, internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { assertKycAllowsPayment } from "../packages/core/src/index";
import {
  assertNoRawFinancialData,
  createOzowProvider,
  createPaystackProvider,
  createStripeProvider,
  type PaymentProvider,
  type PaymentProviderId
} from "../packages/payments/src/index";
import { requireAuthenticatedUser } from "./sessionAuth";

const paymentProvider = v.union(v.literal("paystack"), v.literal("stripe"), v.literal("ozow"));
const paymentMethod = v.union(v.literal("card"), v.literal("eft"));

export const createTripPaymentIntent = action({
  args: {
    sessionToken: v.string(),
    tripId: v.id("trips"),
    provider: paymentProvider,
    amountCents: v.number(),
    paymentMethod,
    returnUrl: v.string(),
    customerEmail: v.optional(v.string())
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    paymentId: unknown;
    provider: PaymentProviderId;
    reference: string;
    redirectUrl?: string;
    clientSecret?: string;
  }> => {
    assertNoRawFinancialData(args as unknown as Record<string, unknown>);

    const context = await ctx.runQuery(internal.payments.internalGetPaymentIntentContext, {
      sessionToken: args.sessionToken,
      tripId: args.tripId
    });
    if (!context) {
      throw new Error("Trip not found.");
    }
    if (context.trip.status === "planning") {
      throw new Error("Review and confirm this trip before payment can start.");
    }
    assertKycAllowsPayment(context.user.kycTier, context.trip.totalEstimateCents);

    const provider = createProviderFromEnv(args.provider);
    const intent = await provider.createIntent({
      amountCents: args.amountCents,
      currency: "ZAR",
      userId: context.user._id,
      tripId: args.tripId,
      paymentMethod: args.paymentMethod,
      returnUrl: args.returnUrl,
      customerEmail: args.customerEmail ?? context.user.email
    });

    const paymentId: unknown = await ctx.runMutation(internal.payments.internalCreatePendingPayment, {
      userId: context.user._id,
      tripId: args.tripId,
      provider: args.provider,
      providerReference: intent.reference,
      paymentMethod: args.paymentMethod,
      amountCents: args.amountCents
    });

    return {
      paymentId,
      ...intent
    };
  }
});

export const internalGetPaymentIntentContext = internalQuery({
  args: {
    sessionToken: v.string(),
    tripId: v.id("trips")
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthenticatedUser(ctx, args.sessionToken);
    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      return null;
    }

    return { user, trip };
  }
});

export const verifyTripPayment = action({
  args: {
    provider: paymentProvider,
    reference: v.string()
  },
  handler: async (ctx, args) => {
    const provider = createProviderFromEnv(args.provider);
    const verification = await provider.verifyPayment(args.reference);

    await ctx.runMutation(internal.payments.internalApplyPaymentVerification, verification);

    return verification;
  }
});

export const refundTripPayment = action({
  args: {
    provider: paymentProvider,
    reference: v.string(),
    amountCents: v.number(),
    reason: v.union(
      v.literal("cancellation"),
      v.literal("admin_adjustment"),
      v.literal("provider_error")
    )
  },
  handler: async (ctx, args) => {
    assertNoRawFinancialData(args as unknown as Record<string, unknown>);

    const provider = createProviderFromEnv(args.provider);
    const refund = await provider.refundPayment({
      reference: args.reference,
      amountCents: args.amountCents,
      reason: args.reason
    });

    await ctx.runMutation(internal.payments.internalApplyRefund, refund);

    return refund;
  }
});

export const internalCreatePendingPayment = internalMutation({
  args: {
    userId: v.id("users"),
    tripId: v.id("trips"),
    provider: paymentProvider,
    providerReference: v.string(),
    paymentMethod,
    amountCents: v.number()
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error("Trip not found.");
    }
    if (trip.userId !== args.userId) {
      throw new Error("Trip does not belong to this user.");
    }

    const now = Date.now();

    return ctx.db.insert("payments", {
      userId: args.userId,
      tripId: args.tripId,
      provider: args.provider,
      providerReference: args.providerReference,
      paymentMethod: args.paymentMethod,
      amountCents: args.amountCents,
      status: "pending",
      receiptUrl: undefined,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const internalApplyPaymentVerification = internalMutation({
  args: {
    provider: paymentProvider,
    reference: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    amountCents: v.number(),
    receiptUrl: v.optional(v.string()),
    providerPayload: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    assertNoRawFinancialData((args.providerPayload ?? {}) as Record<string, unknown>);

    const payment = await ctx.db
      .query("payments")
      .withIndex("by_provider_reference", (queryBuilder) =>
        queryBuilder.eq("provider", args.provider).eq("providerReference", args.reference)
      )
      .unique();

    if (!payment) {
      throw new Error("Payment reference not found.");
    }

    await ctx.db.patch(payment._id, {
      status: args.status,
      amountCents: args.amountCents || payment.amountCents,
      receiptUrl: args.receiptUrl,
      updatedAt: Date.now()
    });

    if (args.receiptUrl) {
      await ctx.db.insert("paymentReceipts", {
        paymentId: payment._id,
        issuedAt: Date.now(),
        receiptUrl: args.receiptUrl,
        providerPayload: args.providerPayload
      });
    }

    if (args.status === "succeeded") {
      await refreshTripFunding(ctx, payment.tripId);
    }

    return { paymentId: payment._id };
  }
});

export const internalApplyRefund = internalMutation({
  args: {
    provider: paymentProvider,
    reference: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    refundReference: v.string()
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_provider_reference", (queryBuilder) =>
        queryBuilder.eq("provider", args.provider).eq("providerReference", args.reference)
      )
      .unique();

    if (!payment) {
      throw new Error("Payment reference not found.");
    }

    await ctx.db.patch(payment._id, {
      status: args.status,
      updatedAt: Date.now()
    });

    await ctx.db.insert("auditLogs", {
      actorUserId: payment.userId,
      action: "payment.refund.recorded",
      entityType: "payment",
      entityId: payment._id,
      metadata: {
        provider: args.provider,
        refundReference: args.refundReference
      },
      createdAt: Date.now()
    });
    await refreshTripFunding(ctx, payment.tripId);

    return { paymentId: payment._id };
  }
});

function createProviderFromEnv(providerId: PaymentProviderId): PaymentProvider {
  if (providerId === "paystack") {
    return createPaystackProvider({
      secretKey: requiredEnv("PAYSTACK_SECRET_KEY")
    });
  }
  if (providerId === "stripe") {
    return createStripeProvider({
      secretKey: requiredEnv("STRIPE_SECRET_KEY")
    });
  }

  return createOzowProvider({
    secretKey: requiredEnv("OZOW_SECRET_KEY")
  });
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required before this payment provider can be used.`);
  }

  return value;
}

async function refreshTripFunding(
  ctx: MutationCtx,
  tripId: Id<"trips">
) {
  const trip = await ctx.db.get(tripId);
  if (!trip) {
    return;
  }

  const [payments, stages] = await Promise.all([
    ctx.db
      .query("payments")
      .withIndex("by_trip", (queryBuilder) => queryBuilder.eq("tripId", tripId))
      .collect(),
    ctx.db
      .query("tripFundingStages")
      .withIndex("by_trip_stage", (queryBuilder) => queryBuilder.eq("tripId", tripId))
      .collect()
  ]);
  const confirmedCents = payments
    .filter((payment) => payment.status === "succeeded")
    .reduce((sum, payment) => sum + numberValue(payment.amountCents), 0);
  let remainingCents = confirmedCents;
  let activeStage: "flights" | "stay" | "experiences" = "flights";

  const orderedStages = [...stages].sort(
    (a, b) => stageOrder(String(a.stage)) - stageOrder(String(b.stage))
  );
  let foundActiveStage = false;

  for (const stage of orderedStages) {
    const targetCents = numberValue(stage.targetCents);
    const fundedCents = Math.min(remainingCents, targetCents);
    const status =
      fundedCents >= targetCents ? "funded" : foundActiveStage ? "queued" : "active";

    if (status === "active") {
      activeStage = stage.stage;
      foundActiveStage = true;
    }
    remainingCents = Math.max(0, remainingCents - targetCents);

    await ctx.db.patch(stage._id, {
      fundedCents,
      status,
      completedAt: status === "funded" ? Date.now() : undefined
    });
  }

  await ctx.db.patch(tripId, {
    activeFundingStage: confirmedCents >= trip.totalEstimateCents ? "experiences" : activeStage,
    status: confirmedCents >= trip.totalEstimateCents ? "fullyFunded" : "active",
    updatedAt: Date.now()
  });
}

function stageOrder(stage: string): number {
  if (stage === "flights") {
    return 0;
  }
  if (stage === "stay") {
    return 1;
  }

  return 2;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
