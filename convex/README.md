# Convex Backend

This folder contains the Batho Travels backend skeleton.

The schema captures the V1 entities from `ARCHITECTURE.md`. Server actions and jobs must keep these guardrails:

- Claude calls are server-side only.
- Payment providers are verified server-side only.
- KYC documents are referenced by encrypted storage IDs only.
- Admin actions that touch users, KYC, refunds, payments, cancellations, or roles must write audit logs.
- Reminder and overdue copy must be supportive and non-shaming.

Run Convex codegen after dependencies are installed:

```bash
pnpm convex dev
```

