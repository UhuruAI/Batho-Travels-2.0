# Batho Travels

Batho Travels is a premium South African travel-planning and structured-savings platform. Users plan their own trips with AI guidance, save monthly with 0% interest, and travel debt-free.

## Current Phase

Phase 12 launch hardening.

The repository now contains the V1 application foundation, domain logic, Convex functions, mobile screens, web landing surface, admin panel, launch seed data, QA runbook, and launch checklist. Production credentials, legal review, and store submission assets still need final external sign-off.

## Workspaces

- `apps/mobile`: Expo React Native app.
- `apps/web`: Next.js landing and web app.
- `apps/admin`: Next.js admin panel.
- `packages/config`: shared policy constants and product guardrails.
- `packages/design-tokens`: light and dark theme tokens.
- `packages/ui`: shared UI primitives.
- `packages/core`: domain interfaces and future core logic.
- `packages/payments`: payment provider abstraction.
- `convex`: backend schema, auth helpers, and scheduled job placeholders.

## Commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm dev
npm run phase12:check
npm run phase12:check:mobile-export
npm run phase12:check:vitest
npx convex dev --once
```

`phase12:check` runs the local launch gate. `phase12:check:mobile-export` and `phase12:check:vitest` cover network-sensitive and sandbox-sensitive release checks. Run Convex directly so the CLI can use your authenticated environment.

## Guardrails

- Always use "Batho Travels" in user-facing copy.
- No loans, no credit checks, no BNPL framing, no late fees.
- Funding is staged: flights, then stay, then experiences.
- Payment providers stay behind an abstraction.
- Claude and payment keys are server-side only.
