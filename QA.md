# Batho Travels Phase 12 QA Runbook

This runbook defines the launch-hardening gate for Batho Travels V1.

## Automated Gate

Fast local gate:

```bash
npm run phase12:check
```

Connected backend check:

```bash
npx convex dev --once
```

Mobile export gate:

```bash
npm run phase12:check:mobile-export
```

The fast gate checks:

- policy smoke checks
- package typechecks
- mobile typecheck
- web typecheck
- admin typecheck
- web production build
- admin production build
- source safety scan for secrets, local paths, local data-store references, fixed split copy, and forbidden reservation copy

The connected backend check validates Convex functions against the active development deployment.

The mobile export gate validates:

- Expo mobile export

Vitest package tests are still available through package scripts, but this Windows sandbox can block the Vitest config loader from reading the repo path. Run them in an unrestricted local terminal before final production release.

Expo export can fetch Expo's native module version manifest before bundling. If the local environment blocks outbound network calls, run `npm run phase12:check:mobile-export` again from an unrestricted terminal.

## Manual Device Matrix

Use the launch QA viewports in `@batho/config` as the baseline:

| Surface | Size | Required checks |
| --- | --- | --- |
| iPhone compact | 390 x 844 | Home, planner, KYC, reminders, groups, scalable text, tap targets |
| Android compact | 412 x 915 | Same mobile flows, Android safe areas, long text wrapping |
| Tablet portrait | 768 x 1024 | Landing, admin scan density, mobile web spacing |
| Desktop | 1440 x 960 | Landing, admin workspaces, SEO routes, keyboard navigation |

## Accessibility Checks

- All interactive controls have clear labels, roles, and selected or expanded state where relevant.
- Focus states are visible on web navigation and calls to action.
- Text remains readable at larger OS text settings.
- Status colors are supported by text, not color alone.
- Reduced motion should leave the experience fully understandable.
- Money, dates, and progress use tabular numbers where they are compared.

## Web Performance Checks

Targets before production launch:

- Landing Largest Contentful Paint below 2.5 seconds on a mid-range mobile connection.
- Cumulative Layout Shift below 0.1.
- Interaction to Next Paint below 200 ms for navigation and primary calls to action.
- First Load JS remains near the current build baseline unless a new interactive feature justifies the cost.
- Hero image remains a real destination visual and keeps readable text contrast.

## SEO And GEO Checks

- `robots.txt` renders.
- `sitemap.xml` renders.
- `llms.txt` renders.
- `geo-facts.json` renders valid JSON.
- Landing page includes JSON-LD for Organization, WebSite, SoftwareApplication, and FAQPage.
- Public copy keeps `Batho Travels` as the app name.
- Public copy states 0% interest, no credit checks, no loans, and no debt.
- Public copy keeps payment wording provider-agnostic.

## Seed Data

Launch seed data lives in `@batho/config`:

- `LAUNCH_SEED_TRAVELLERS`
- `LAUNCH_SEED_TRIP_SCENARIOS`
- `LAUNCH_SEED_ADMIN_QUEUES`
- `LAUNCH_QA_VIEWPORTS`

All seed contacts use `.example` emails and generic demo phone numbers.

## Remaining External Sign-Off

These cannot be completed locally:

- production payment provider approval and credentials
- POPIA and legal review
- production KYC storage vendor approval
- App Store and Play Store account review
- real-device visual QA on physical iOS and Android devices
- production Core Web Vitals measurement after deployment
