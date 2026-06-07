# Convex Backend

This folder contains the Batho Travels backend skeleton:

- `schema.ts` — single source of truth for tables, types, and indexes
- domain modules — `trips.ts`, `planner.ts`, `payments.ts`, `kyc.ts`, `groups.ts`, `notifications.ts`, `admin.ts`, `support.ts`, `auth.ts`, `customDestinations.ts`, `jobs.ts`, `crons.ts`
- `status.ts` — `ping` query used by web/admin/mobile to verify the round-trip

Guardrails enforced in every action:

- Gemini planner calls are server-side only.
- Payment providers are verified server-side only.
- KYC documents are referenced by encrypted storage IDs only.
- Admin actions that touch users, KYC, refunds, payments, cancellations, or roles must write audit logs.
- Reminder and overdue copy must be supportive and non-shaming.

## Connecting v2 to your existing v1 deployment

Your v1 app already has a Convex project. v2 reuses the same deployment so you keep one URL, one dashboard, one set of secrets.

### 1. Link this checkout to the existing deployment

From the repo root:

```bash
pnpm convex dev
```

The first time, the CLI is interactive:

- "Open browser to log in?" → yes (one-time).
- "What would you like to configure?" → **"Use existing deployment"**.
- Pick the project you used for v1 from the list, then pick the deployment (dev).

The CLI writes the deployment slug to `.env.local` at the repo root as `CONVEX_DEPLOYMENT=<slug>`. It also prints the public URL (`https://<deployment>.convex.cloud`).

### 2. Push the v2 schema (after wiping v1 test data)

Open the **[Convex Dashboard](https://dashboard.convex.dev/)** → your project → Data tab. For each table that exists from v1, hit the table menu → **Clear table**. Tables to clear if present (and any others v1 created):

```
users  sessions  plannerSessions  destinations  seasonalityMonths
trips  tripFundingStages  savingsSchedules  payments  paymentReceipts
notifications  tripSupportActions  kycSubmissions  groupTrips
groupTripParticipants  customDestinationRequests  adminUsers  auditLogs
```

Then back in your terminal, `pnpm convex dev` is still watching — it will auto-push the v2 schema. If a v1 table's columns differ from v2 and any rows remain, Convex refuses the push and prints the exact mismatch. Clear that table and the push resumes.

### 3. Expose the URL to each app

After `convex dev` succeeded, copy the public URL from the dashboard or from the CLI output. Then:

**Web** — create `apps/web/.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**Admin** — create `apps/admin/.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**Mobile** — create `apps/mobile/.env`:

```
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Restart the dev servers. Each app has a small "Convex live · 10:24:33" pill that goes green once the round-trip works (top-right of the web nav, admin topbar, and the mobile home hero).

### 4. Restart everything

```bash
# Terminal 1 — keeps the schema + functions in sync with the cloud
pnpm convex dev

# Terminal 2 — web
pnpm --filter @batho/web dev

# Terminal 3 — admin
pnpm --filter @batho/admin dev

# Terminal 4 — mobile (web preview)
pnpm --filter @batho/mobile dev
```

## What's wired

The apps now have:

- `convex/react` provider (`AppProviders` for web/admin, `<ConvexProvider>` in `apps/mobile/app/_layout.tsx`).
- A safe fallback: if `*_CONVEX_URL` is empty, the app renders normally without Convex so you can still develop UI offline.
- A live status pill (`ConvexStatus`) calling `api.status.ping` so you can see the connection state at a glance.

Domain queries and mutations for auth, trips, planner, and notification preferences are called from the mobile UI with the signed-in session token.
