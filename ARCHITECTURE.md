# Batho Travels Architecture

## Status

Status: sign-off required before product coding.

This document defines the production architecture for Batho Travels V1. It is the build contract for the monorepo, backend, app surfaces, domain logic, and release phases.

Batho Travels is a premium travel-planning and structured-savings platform for South Africa. It is not a bank, lender, BNPL product, credit provider, or wallet. Users plan their own trips, save their own money over time, and travel debt-free.

## Product Surfaces

### Mobile App

Primary user product for iOS and Android.

- Expo React Native with Expo Router.
- AI trip planner as the central journey.
- Live trip dashboard with staged funding.
- Payment setup, receipts, reminders, KYC, group participation, pause, adjust, and cancellation flows.
- Native push notifications, biometric unlock, secure session storage, document upload, and selfie capture.

### Web App and Landing

Premium acquisition, SEO, GEO, and lightweight authenticated surfaces.

- Next.js App Router.
- Marketing landing page, FAQ, legal pages, SEO/GEO pages, and app handoff.
- Lightweight user account surfaces where useful, such as planner resume links or payment receipt views.

### Admin Panel

Role-separated internal operations product.

- Next.js App Router, either as a separate app or route-isolated workspace.
- Operations, finance, and support roles see only permitted workspaces.
- Destination management, seasonality data, trip oversight, KYC review, refunds, pauses, cancellations, custom destination requests, and support context.

## Monorepo Structure

```text
batho-travels/
  apps/
    mobile/
    web/
    admin/
  packages/
    ui/
    design-tokens/
    core/
    payments/
    config/
  convex/
  ARCHITECTURE.md
  DESIGN.md
  DECISIONS.md
```

### apps/mobile

- Expo Router file-based navigation.
- Native screens for onboarding, planner, trip dashboard, payments, KYC, groups, settings, notifications, and support.
- Uses shared tokens and primitives from `packages/design-tokens` and `packages/ui`.
- Calls Convex queries and mutations for all user data.
- Does not call payment providers or Claude directly from the client.

### apps/web

- Next.js App Router marketing site and lightweight web app surfaces.
- Server-rendered and statically generated where possible for SEO and GEO.
- Includes sitemap, robots, structured data, FAQ schema, Open Graph metadata, Twitter metadata, canonical URLs, `hreflang="en-ZA"`, and `llms.txt`.
- Uses ZAR, South African spelling/context, and provider-agnostic payment copy.

### apps/admin

- Next.js App Router admin system.
- Role-based navigation and route protection.
- Work queues for KYC, custom destinations, refunds, trip interventions, support cases, and finance review.
- All sensitive actions write audit log entries.

### packages/design-tokens

Single source of truth for visual tokens.

- Light and dark theme color tokens.
- Typography scale and font families.
- Spacing, radius, elevation, opacity, z-index, and motion tokens.
- Platform adapters for web CSS variables and React Native constants.

### packages/ui

Shared UI primitives and patterns.

- Buttons, inputs, cards, sheets, tabs, progress bars, alerts, empty states, banners, list rows, navigation patterns, and data display.
- Cross-platform behavior aligned where practical.
- Accessibility baked into focus, labels, contrast, hit targets, reduced motion, and screen-reader affordances.

### packages/core

Pure domain logic. No UI, provider SDKs, network calls, or persistence.

- Savings plan validation.
- Staged funding allocation.
- Cancellation and refund policy.
- KYC booking gates.
- Group share calculations.
- Planner result validation helpers.
- Unit tests for every policy rule.

### packages/payments

Provider abstraction and adapters.

- Paystack, Stripe, and Ozow adapters behind one interface.
- Card and EFT support where the provider supports it.
- Stores transaction references, provider metadata, receipt links, and status only.
- Never stores raw card or bank details.

### packages/config

Shared constants and policy tables.

- App name, locale, currency, plan limits, refund tiers, grace period, KYC limits, supported notification channels, and copy guardrails.
- Configurable values are centralized so policy changes do not require domain rewrites.

### convex

Backend, database, real-time sync, and scheduled jobs.

- Schema, indexes, queries, mutations, actions, crons, and internal jobs.
- Server-only Claude API calls.
- Reminder scheduling, overdue checks, notification orchestration, payment verification, and audit logging.

## Recommended Stack

- Package manager: pnpm workspaces.
- Build orchestration: Turborepo.
- Language: TypeScript.
- Mobile: Expo, React Native, Expo Router.
- Web and admin: Next.js App Router.
- Backend and database: Convex.
- Auth: email/password plus Google OAuth, 30-day sessions.
- Password hashing: bcrypt on the server.
- AI: Anthropic Claude API, server-side only.
- Email: Resend.
- WhatsApp: WhatsApp Business API behind a notification abstraction.
- Push: Expo push notifications.
- Payments: Paystack, Stripe, Ozow behind `PaymentProvider`.
- Testing: Vitest for packages, React Native Testing Library for mobile components, Playwright for web/admin end-to-end checks.

Any substitution must be recorded in `DECISIONS.md`.

## Domain Constants

```ts
APP_NAME = "Batho Travels";
LOCALE = "en-ZA";
CURRENCY = "ZAR";
DEFAULT_PLAN_MONTHS = 12;
MAX_PLAN_MONTHS = 12;
GRACE_PERIOD_DAYS = 7;
CANCELLATION_MANAGEMENT_FEE_CENTS = 50000;
```

Trip minimums:

```ts
domestic: 3;
africaRegional: 6;
longHaulInternational: 12;
```

Refund tiers:

```ts
12+ months before travel: 100% refund, less R500 management fee
9 to 12 months before travel: 85% refund, less R500 management fee
6 to 9 months before travel: 70% refund, less R500 management fee
3 to 6 months before travel: 50% refund, less R500 management fee
Less than 3 months before travel: 0% refund, R500 management fee applies only where recoverable
```

## Core Interfaces

### Savings Plan

```ts
type TripType = "domestic" | "africaRegional" | "longHaulInternational";

type SavingsPlanInput = {
  totalCostCents: number;
  tripType: TripType;
  planMonths: number;
  departureDate?: string;
  costBreakdown: {
    flightsCents: number;
    stayCents: number;
    experiencesCents: number;
  };
};

type SavingsPlanResult = {
  isValid: boolean;
  monthlyContributionCents: number;
  totalCostCents: number;
  roundingAdjustmentCents: number;
  schedule: SavingsScheduleMonth[];
  fundingStages: FundingStage[];
  message?: string;
};

function calculateSavingsPlan(input: SavingsPlanInput): SavingsPlanResult;
function validateTripPlanLength(tripType: TripType, months: number): ValidationResult;
function allocateStagedFunding(schedule: SavingsScheduleMonth[]): FundingStage[];
```

Rules:

- Monthly contribution is total cost divided across months with sensible cent rounding.
- Any rounding adjustment is surfaced clearly.
- No interest, loan fees, or hidden fees are included.
- Contributions fund flights to 100%, then stay to 100%, then experiences to 100%.

### Cancellation

```ts
type CancellationRefundInput = {
  amountPaidCents: number;
  monthsBeforeTravel: number;
};

type RefundResult = {
  refundPercentage: number;
  grossRefundCents: number;
  managementFeeCents: number;
  netRefundCents: number;
  userMessage: string;
};

function calculateCancellationRefund(input: CancellationRefundInput): RefundResult;
```

Rules:

- The R500 fee is framed as management/admin/ops, not a penalty.
- Pause Plan and schedule adjustment must be presented before cancellation when appropriate.

### KYC Gates

```ts
type KycTier = "basic" | "standard" | "enhanced";

type BookingGateResult = {
  allowed: boolean;
  requiredTier?: KycTier;
  message: string;
};

function canBookAmount(kycTier: KycTier, amountCents: number): BookingGateResult;
```

Tier behavior:

- Basic: email and phone verification, platform access.
- Standard: ID/passport plus selfie, bookings up to R50,000.
- Enhanced: proof of address, unlimited booking value.

### Payments

```ts
interface PaymentProvider {
  id: "paystack" | "stripe" | "ozow";
  createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  verifyPayment(reference: string): Promise<PaymentVerificationResult>;
  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult>;
  getReceipt(reference: string): Promise<PaymentReceiptResult>;
}
```

Rules:

- No raw card or bank details are stored.
- Store provider references, status, receipt URLs, amounts, timestamps, and reconciliation metadata.
- Marketing surfaces must not name individual providers.

### AI Planner

```ts
type PlannerResult = {
  destination: {
    name: string;
    country: string;
    region: string;
  };
  tripType: TripType;
  recommendedMonths: string[];
  seasonalityReason: string;
  estimatedCost: {
    totalCents: number;
    flightsCents: number;
    stayCents: number;
    experiencesCents: number;
  };
  itinerary: PlannerItineraryItem[];
  assumptions: string[];
  savingsPlanInput: SavingsPlanInput;
};
```

Rules:

- Claude is called only from server-side Convex actions.
- Conversational text may stream to the UI.
- Structured planner output must be validated before persistence.
- Costs are estimates.
- The planner must never funnel users into fixed packages.

## Data Model

Initial Convex entities:

- `users`: identity, contact details, preferences, KYC tier, notification settings.
- `sessions`: auth sessions, expiry, device metadata.
- `plannerSessions`: chat state, guided inputs, draft structured outputs, resume state.
- `destinations`: destination metadata, trip type, region, cost assumptions.
- `seasonalityMonths`: 12-month destination seasonality records with peak/shoulder/low season, weather, rainfall, and relative price indicators.
- `trips`: finalized user travel plans, status, departure date, total estimate, active funding stage.
- `tripFundingStages`: flights, stay, experiences, targets, funded amounts, status.
- `savingsSchedules`: month-by-month contribution expectations and allocation snapshots.
- `payments`: provider references, amounts, statuses, receipt links, reconciliation fields.
- `paymentReceipts`: immutable receipt records and provider payload metadata.
- `notifications`: queued, sent, failed, read, and preference-aware notification records.
- `kycSubmissions`: tier requests, document references, selfie references, review status.
- `auditLogs`: sensitive admin and system actions.
- `groupTrips`: coordinator, participants, independent share records.
- `customDestinationRequests`: user-submitted destination ideas and admin review state.
- `adminUsers`: role assignments and access status.

Sensitive KYC documents must live in encrypted object storage, referenced by ID only in Convex.

## Security And Compliance

- POPIA-conscious consent, minimization, data export, and deletion paths.
- Claude API key, provider keys, and notification credentials are server-side only.
- Rate-limit auth, planner, payment verification, notification requests, and admin actions.
- Audit every admin action involving KYC, refunds, cancellations, payments, user access, or role changes.
- Use least-privilege admin roles.
- No debt-like mechanics, late fees, compounding penalties, or credit language in code or copy.

## Notification Architecture

Channels:

- Email.
- WhatsApp.
- Push.
- In-app.

Events:

- Payment reminder 3 days before due date.
- Payment confirmation.
- Booking confirmation.
- Trip milestone and countdown.
- Overdue support notice.
- KYC status update.
- Pause, adjustment, cancellation, and refund updates.

Scheduled jobs:

- Daily reminder scan.
- Daily overdue scan.
- Grace-period transition scan.
- Notification retry scan.

All notification copy must be supportive and non-shaming.

## Build Phases

1. Sign-off foundation: create this document, `DESIGN.md`, and `DECISIONS.md`.
2. Project foundation: scaffold monorepo, workspaces, build tooling, shared config, tokens, primitives, Convex skeleton, auth skeleton.
3. Core domain: implement calculator, staged funding, refunds, KYC gates, and tests.
4. AI planner: Claude integration, validated JSON, seasonality dataset, planner persistence, mobile planner flow.
5. Trips and dashboard: trip creation, staged funding dashboard, receipts, payment history, live updates.
6. Payments: provider abstraction, Paystack, Stripe, Ozow sandbox adapters.
7. KYC and compliance: uploads, selfie capture, admin review, booking gates, audit logs.
8. Notifications and scheduling: Resend, WhatsApp, Expo push, in-app, Convex crons, grace/pause/cancel flows.
9. Groups and custom destinations: coordinator flow, independent shares, destination review queue.
10. Admin panel: operations, finance, support, KYC, payments, destinations, users, trips.
11. Landing, SEO, GEO, ASO: premium web launch, structured data, `llms.txt`, store copy.
12. QA and launch prep: accessibility, Core Web Vitals, mobile QA, seed data, production checklist.

## Acceptance Criteria For The Architecture Phase

- `ARCHITECTURE.md`, `DESIGN.md`, and `DECISIONS.md` exist.
- The documents encode the locked product rules from the brief.
- No product code has been scaffolded before sign-off.
- The next phase can create the monorepo without making major architecture or design decisions.

