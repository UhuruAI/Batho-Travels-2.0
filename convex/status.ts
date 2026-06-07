import { query } from "./_generated/server";

// Tiny health check used by web/admin/mobile after wiring ConvexProvider.
// Confirms the round-trip without needing any data in the database.
export const ping = query({
  args: {},
  handler: async () => {
    return {
      ok: true,
      service: "batho-convex",
      serverTime: Date.now()
    };
  }
});
