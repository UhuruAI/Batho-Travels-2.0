# Batho Travels Design System

## Status

Status: sign-off required before product coding.

This document is the visual and UX source of truth for Batho Travels. Every mobile, web, admin, email, and notification surface should follow it unless a change is recorded in `DECISIONS.md`.

## Product Context

Batho Travels helps South Africans plan personal trips with AI guidance, then save their own money over 3 to 12 months to travel debt-free. The product must feel premium, calm, human, financially realistic, and explicitly non-predatory.

The emotional job is reassurance. Users should feel, "I can plan this properly, I understand what I am paying for, and nobody is trapping me in debt."

## Design Direction

Direction: Warm Calm.

The interface should feel:

- Premium but not flashy.
- Human and grounded, not corporate-finance cold.
- African-rooted without using decorative cliches.
- Calm around money, with no urgency traps.
- Confident enough for travel, careful enough for savings.

Avoid:

- Aggressive fintech patterns.
- Dark blue corporate dashboards as the dominant mood.
- Purple gradient AI aesthetics.
- Generic travel stock-card grids.
- Shame, scarcity, countdown pressure, or "last chance" behavior.
- Over-rounded bubbly components.

## Brand Principles

### People First

"Batho" means people. User-facing flows should center the person, their group, their comfort, and their real budget.

### Debt-Free Confidence

The product must repeatedly clarify:

- 0% interest.
- No credit checks.
- No loans.
- No debt.
- Users save their own money.

### Calm Transparency

Every payment view should show what is saved, what remains, what stage is active, and what the next payment funds.

### Travel With Intention

The AI planner should help users choose the right destination, season, and budget before committing.

## Voice And Copy

Tone:

- Warm.
- Plain.
- Supportive.
- Specific.
- Financially realistic.

Use:

- "Reserve your spot."
- "Secure your travel plan early."
- "Save monthly."
- "Travel debt-free."
- "This estimate can change before booking."
- "Here is what looks comfortably affordable."

Do not use:

- "Lock in your spot."
- "Buy now, pay later."
- "Loan."
- "Credit."
- "Penalty."
- "Late fee."
- "Default."
- "You failed to pay."
- "Hurry."

Reminder tone example:

"Your next contribution is due soon. If this month is tight, you can pause or adjust your plan before the grace period ends."

## Typography

Recommended pairing:

- Display: Fraunces.
- Body and UI: Source Sans 3.
- Data and money: Geist Mono or Source Sans 3 with tabular numbers.

Rationale:

- Fraunces gives warmth, craft, and travel/editorial character without becoming decorative.
- Source Sans 3 is highly legible, practical, and calm across mobile and dense admin screens.
- Tabular numbers keep money, dates, and progress stable.

Type scale:

```text
Display XL: 56px / 60px, 700
Display L: 44px / 50px, 700
Heading 1: 34px / 40px, 700
Heading 2: 28px / 34px, 700
Heading 3: 22px / 28px, 650
Body L: 18px / 28px, 400
Body M: 16px / 24px, 400
Body S: 14px / 20px, 400
Label: 13px / 16px, 650
Caption: 12px / 16px, 400
Data: 14px / 20px, 500, tabular numbers
```

Mobile adjustments:

- Keep headings strong but not oversized.
- Avoid viewport-based font sizing.
- Maintain readable line length and enough space for ZAR amounts.

## Color

The palette should feel warm and trustworthy, with enough contrast for finance-like clarity and enough life for travel.

### Light Theme

```text
Canvas: #F8F4ED
Surface: #FFFDF8
Surface Raised: #FFFFFF
Text Primary: #1D1B18
Text Secondary: #5D574F
Text Muted: #82786D
Border Soft: #E6DDD1
Border Strong: #CDBFAA

Primary: #8B4E2F
Primary Strong: #673620
Primary Soft: #F1DED1

Accent: #0E7C73
Accent Strong: #075D56
Accent Soft: #D9EFEC

Gold: #C28A2E
Gold Soft: #F5E7C8

Success: #147A4A
Warning: #A86612
Error: #B23B32
Info: #256D85
```

### Dark Theme

```text
Canvas: #171411
Surface: #211D18
Surface Raised: #2A241E
Text Primary: #F7EFE5
Text Secondary: #CFC2B3
Text Muted: #A79786
Border Soft: #3B332B
Border Strong: #5A4A3D

Primary: #D69A72
Primary Strong: #F0B58E
Primary Soft: #3A261B

Accent: #65C5BA
Accent Strong: #89DDD4
Accent Soft: #173A36

Gold: #E0B764
Gold Soft: #3C3118

Success: #65C58E
Warning: #E0A64D
Error: #E8786E
Info: #72B8D2
```

Usage:

- Primary anchors brand, major actions, active stages, and high-trust states.
- Accent highlights AI planner affordances, recommendations, and selected season windows.
- Gold is used sparingly for travel milestones and celebratory progress.
- Semantic colors must stay restrained and readable.

## Spacing

Base unit: 4px.

Scale:

```text
2xs: 2px
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
4xl: 96px
```

Density:

- Mobile app: comfortable, with clear touch targets and scannable trip data.
- Landing page: spacious, with enough next-section visibility in the first viewport.
- Admin panel: compact but calm, optimized for repeated work and scanning.

## Layout

Approach: hybrid.

- Mobile app: card-light, clear hierarchy, bottom navigation, sheets for focused tasks.
- Landing page: image-led first viewport, strong typography, full-width sections, no nested cards.
- Admin: dense operational layout with sidebar, filters, tables, queues, and detail panels.

Grid:

```text
Mobile: 4 columns, 16px margins
Tablet: 8 columns, 24px margins
Desktop: 12 columns, max content width 1180px
Admin: fixed sidebar plus flexible content grid
```

Radius:

```text
xs: 4px
sm: 6px
md: 8px
lg: 12px
full: 999px, only for avatars, toggles, and pills
```

Use cards only for repeated items, dashboard modules, modals, and framed tools. Do not put cards inside cards.

## Motion

Approach: intentional and subtle.

Durations:

```text
micro: 80ms
short: 160ms
medium: 260ms
long: 420ms
```

Easing:

```text
enter: cubic-bezier(0.16, 1, 0.3, 1)
exit: cubic-bezier(0.7, 0, 0.84, 0)
move: cubic-bezier(0.65, 0, 0.35, 1)
```

Motion should support comprehension:

- Stage progress fills smoothly.
- Planner responses stream calmly.
- Bottom sheets slide in without bounce excess.
- Payment success confirms with restrained feedback.
- Reduced-motion users receive instant state changes.

## Core Components

### Buttons

- Primary: major next steps, such as Start planning, Create savings plan, Continue to payment.
- Secondary: lower-commitment actions, such as Adjust plan or View details.
- Ghost: navigation and low-priority actions.
- Destructive: cancellation only, always paired with explanation and alternatives.

Buttons must include clear loading, disabled, focused, pressed, and error-adjacent states.

### Inputs

- Large enough for mobile touch.
- Labels always visible.
- Helper copy must explain financial constraints warmly.
- Error copy must explain the fix without blame.

### Staged Funding Progress

The signature component.

Visual behavior:

- Three stacked progress bars: Flights, Stay, Experiences.
- Active stage highlighted.
- Funded stages marked complete.
- Queued stages muted but visible.
- Each stage shows target, saved, remaining, and expected completion month.

No UI may imply simultaneous 50/25/25 funding.

### AI Planner

The planner combines:

- Conversational chat.
- Guided chips and controls.
- Budget comfort checks.
- Seasonality recommendations.
- Editable itinerary blocks.
- Clear cost breakdown.
- Savings-plan handoff.

The planner must feel like a patient travel guide and budget coach, not a chatbot novelty.

### Trip Dashboard

Primary modules:

- Upcoming trip summary.
- Days until departure.
- Active funding stage.
- Next contribution.
- Three-stage funding progress.
- Payment history.
- Notifications.
- Pause or adjust plan.

### Admin Queues

Admin UI must optimize for:

- Queue state.
- Urgency.
- Ownership.
- Audit trail.
- Clear next action.
- Safe handling of sensitive data.

## Landing Page UX

First viewport:

- Brand signal: Batho Travels.
- Headline: "Travel the World. Pay Over Time. Zero Debt."
- Supporting copy: AI-guided planning, structured monthly saving, no interest, no credit checks.
- Primary action: Start planning.
- Secondary action: See how it works.
- Real or generated premium travel imagery with South African relevance.
- Hint of the next section visible on mobile and desktop.

Required sections:

- How it works: plan with AI, choose your savings plan, save monthly, travel debt-free.
- AI planner as the hero feature.
- Staged funding explanation.
- Seasonality intelligence.
- Debt-free comparison against credit-funded travel.
- Group trips with independent shares.
- Custom destination requests.
- Trust and security.
- FAQ for SEO and GEO.
- Footer with legal, contact, South Africa context.

## Accessibility

Target: WCAG 2.1 AA.

Requirements:

- Contrast verified in light and dark themes.
- Visible focus states.
- Semantic headings and landmarks.
- Screen-reader labels for icons and progress.
- Touch targets at least 44px.
- Reduced-motion support.
- Forms with labels, helper text, and accessible errors.
- No text overlap at mobile widths.
- Money and status information must not rely on color alone.

## App Store And SEO Visual Requirements

App store assets should communicate:

- AI trip planning.
- Save monthly.
- 0% interest.
- No credit checks.
- Travel debt-free.
- ZAR and South African relevance.

SEO/GEO pages should use clear, citable statements and structured headings. Do not bury key facts in client-only rendering.

## Design QA Checklist

- Does the screen say Batho Travels, not Batho alone?
- Does the screen avoid lender, loan, BNPL, and credit language?
- Is the active funding stage clear?
- Are flights funded before stay, and stay before experiences?
- Are cost figures marked as estimates where needed?
- Is pause or adjustment available before cancellation where relevant?
- Does dark mode feel intentionally designed, not inverted?
- Is the AI planner the premium centerpiece?
- Is the experience calm under financial stress?

