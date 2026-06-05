# Batho Travels V1 Launch Checklist

Use this checklist for final go or no-go sign-off.

## Product Positioning

- [ ] App name is Batho Travels everywhere.
- [ ] AI Trip Planner is the hero product.
- [ ] No prebuilt trip catalogue or package funnel appears in V1.
- [ ] Savings copy says 0% interest, no credit checks, no loans, and no debt.
- [ ] Reservation copy uses Reserve your spot or Secure your travel plan early.
- [ ] Payment copy says trusted providers, including card and EFT options.

## Engineering

- [ ] `npm run phase12:check` passes.
- [ ] `npx convex dev --once` passes in the connected local environment.
- [ ] Convex production deployment is configured.
- [ ] Production environment variables are set outside git.
- [ ] Build artifacts are clean and reproducible.
- [ ] Source safety scan passes before release.

## Mobile

- [ ] Expo export passes.
- [ ] iOS simulator smoke test passes.
- [ ] Android emulator smoke test passes.
- [ ] Physical iOS device smoke test passes.
- [ ] Physical Android device smoke test passes.
- [ ] Safe areas, scrolling, tap targets, and text scaling are checked.

## Web

- [ ] Web production build passes.
- [ ] Landing page loads at `/`.
- [ ] `robots.txt`, `sitemap.xml`, `llms.txt`, and `geo-facts.json` render.
- [ ] Core Web Vitals are measured after deployment.
- [ ] Open Graph and Twitter preview cards are verified.
- [ ] FAQ structured data validates.

## Admin

- [ ] Admin production build passes.
- [ ] Operations workspace queues scan correctly.
- [ ] Finance workspace shows payments, refunds, and receipts clearly.
- [ ] Support workspace shows pause, adjust, cancel, and grace-period flows.
- [ ] KYC review workspace protects document review details.
- [ ] Audit log views show actor, entity, action, and timestamp.

## Convex

- [ ] Development deployment is healthy.
- [ ] Production deployment is created and connected.
- [ ] Schema indexes are present.
- [ ] Scheduled jobs are reviewed.
- [ ] Planner actions work with and without Claude credentials.
- [ ] Payment actions remain provider-tokenized only.
- [ ] Audit logs are written for sensitive admin actions.

## Payments

- [ ] Paystack sandbox credentials are configured.
- [ ] Stripe sandbox credentials are configured if used.
- [ ] Ozow sandbox credentials are configured if used.
- [ ] Provider webhooks are configured.
- [ ] Refund flow is tested in sandbox.
- [ ] No raw card or bank data is stored.

## KYC And Compliance

- [ ] POPIA review is complete.
- [ ] Refund policy review is complete.
- [ ] Non-lender positioning is legally reviewed.
- [ ] KYC document storage provider is approved.
- [ ] Document access is limited to approved admin roles.
- [ ] Retention and deletion policy is documented.

## Notifications

- [ ] Email provider is configured.
- [ ] WhatsApp provider is configured if used at launch.
- [ ] Push notification setup is complete.
- [ ] Grace-period reminders use supportive copy.
- [ ] Failed notification retry behavior is tested.
- [ ] User preference changes are respected.

## App Stores

- [ ] iOS app name, subtitle, description, screenshots, privacy labels, and review notes are ready.
- [ ] Android app name, short description, full description, screenshots, and data safety details are ready.
- [ ] `app-store-copy.md` is reviewed and approved.
- [ ] Store screenshots match the current Warm Calm UI.

## Go Or No-Go

- [ ] No blocker bugs remain.
- [ ] Legal and compliance sign-off is complete.
- [ ] Payment sandbox is green.
- [ ] Production environment is configured.
- [ ] Rollback plan is written.
- [ ] Support contact path is ready.
