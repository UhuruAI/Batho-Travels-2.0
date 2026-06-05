import { query } from "./_generated/server";
import { buildAdminQueueSummary } from "../packages/core/src/index";

export const getAdminDashboardSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const [
      pendingKyc,
      pendingSupportActions,
      pendingCustomDestinations,
      pendingPayments,
      activeTrips,
      pausedTrips,
      users
    ] = await Promise.all([
      ctx.db
        .query("kycSubmissions")
        .withIndex("by_status", (queryBuilder) => queryBuilder.eq("status", "pending"))
        .collect(),
      ctx.db
        .query("tripSupportActions")
        .withIndex("by_status_requested", (queryBuilder) =>
          queryBuilder.eq("status", "requested")
        )
        .collect(),
      ctx.db
        .query("customDestinationRequests")
        .withIndex("by_status", (queryBuilder) => queryBuilder.eq("status", "pending"))
        .collect(),
      ctx.db
        .query("payments")
        .withIndex("by_status", (queryBuilder) => queryBuilder.eq("status", "pending"))
        .collect(),
      ctx.db
        .query("trips")
        .withIndex("by_status", (queryBuilder) => queryBuilder.eq("status", "active"))
        .collect(),
      ctx.db
        .query("trips")
        .withIndex("by_status", (queryBuilder) => queryBuilder.eq("status", "paused"))
        .collect(),
      ctx.db.query("users").collect()
    ]);

    return {
      queueSummary: buildAdminQueueSummary([
        ...pendingKyc.map(() => ({ role: "support" as const, severity: "urgent" as const })),
        ...pendingSupportActions.map(() => ({
          role: "support" as const,
          severity: "attention" as const
        })),
        ...pendingCustomDestinations.map(() => ({
          role: "operations" as const,
          severity: "attention" as const
        })),
        ...pendingPayments.map(() => ({ role: "finance" as const, severity: "attention" as const }))
      ]),
      counts: {
        pendingKyc: pendingKyc.length,
        pendingSupportActions: pendingSupportActions.length,
        pendingCustomDestinations: pendingCustomDestinations.length,
        pendingPayments: pendingPayments.length,
        activeTrips: activeTrips.length,
        pausedTrips: pausedTrips.length,
        users: users.length
      }
    };
  }
});

export const listRecentAuditLogs = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("auditLogs").withIndex("by_created").order("desc").take(25);
  }
});
