# Batho Travels — Design System

Terracotta-anchored, Airbnb-flavored. One coherent language across the consumer website (`apps/web`), the admin dashboard (`apps/admin`), and the mobile app (`apps/mobile`).

## Brand story

Batho is a Southern African travel brand that pairs an AI Trip Planner with structured monthly savings. The visual identity should feel **warm and grounded** (because the brand is about real people travelling without debt), **premium and calm** (because it handles money), and **specifically Southern African** (the Ndebele triangle motif in the logo is not decoration — it is the brand).

Reference brief: [Airbnb Open Design](https://getdesign.md/airbnb/design-md) — warm coral accent, photography-driven, rounded UI, generous whitespace, Cereal-style display typography.

## Palette

Sampled from `batho.png`. **One brand color.** No teal, no gold, no cool grays.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| canvas | `#FAF5F0` cream | `#1A1410` warm charcoal | App background |
| surface | `#FFFFFF` bone | `#241C16` espresso | Cards, panels |
| surfaceRaised | `#FFFFFF` | `#2D2319` | Modals, popovers |
| textPrimary | `#2A1F18` | `#F2E9DF` | Body, headings |
| textSecondary | `#6B5A4D` | `#C8B8A6` | Captions, meta |
| textMuted | `#8A7967` | `#9C8B7A` | Hints |
| borderSoft | `#E8DDD0` | `#3A2E25` | Default borders |
| borderStrong | `#D4C2AE` | `#574638` | Inputs, dividers |
| primary | `#C0502B` | `#E27A55` | Brand CTA, links, indicators |
| primaryStrong | `#9A3F22` | `#F0916D` | Hover, active |
| primarySoft | `#F7E1D6` | `#3A1E14` | Soft brand backgrounds |

`success`, `warning`, `error`, `info` are warm-tinted so they sit inside the terracotta family.

### Hard rules

- No pure `#000` or pure cool gray. Dark mode is **warm**.
- Brand color appears on no more than ~10% of any screen — Airbnb discipline.
- Never reach for the teal/gold from the previous palette. They have been removed from the tokens.
- The Ndebele triangle pattern (`BorderPattern`) is an accent only — hero footer divider, footer top band, one decorative edge per landing section. Not a wallpaper.

## Typography

- **Display**: Inter Tight (Cereal-alike). Weights 500, 600, 700, 800. Tracks tight (`-0.02em`).
- **Body**: Inter. Weights 400, 500, 600, 700.
- **Editorial pull-quote** (web only): Instrument Serif italic. Used once on the hero ("Pay over time."), once in testimonial quotes. Never inside body copy.
- **Data**: JetBrains Mono. Used for IDs, audit event names, tabular numbers where you need monospace.

Scale (px / line-height):

| Token | Size / LH | Use |
| --- | --- | --- |
| displayXl | 64 / 68 | Hero |
| displayL | 48 / 54 | Section title |
| heading1 | 32 / 38 | Page title (admin) |
| heading2 | 24 / 30 | Card title |
| heading3 | 20 / 26 | Subsection |
| bodyL | 18 / 28 | Marketing copy |
| bodyM | 16 / 24 | Default |
| bodyS | 14 / 20 | Compact UI |
| label | 13 / 16 | Form labels, eyebrows |
| caption | 12 / 16 | Metadata |

## Spacing

`2xs:2 · xs:4 · sm:8 · md:16 · lg:24 · xl:32 · 2xl:48 · 3xl:64 · 4xl:96`

Use the same scale everywhere. Don't introduce 10, 14, 18.

## Radius

`xs:4 · sm:8 · md:12 · lg:16 · xl:24 · full:999`

- Buttons: 12 (default) or 999 (pill on nav/hero).
- Cards: 16 default, 24 for feature cards.
- Inputs: 12.
- Avatars and ndebele-bordered surfaces: 999 / 24.

## Motion

| Duration | ms | When |
| --- | --- | --- |
| micro | 80 | Press feedback |
| short | 160 | Hover, focus ring |
| medium | 260 | Cards lift, modal open |
| long | 420 | Page transitions |
| expressive | 640 | Hero reveals |

Easing: `enter` for incoming, `exit` for leaving, `move` for in-place.

## Light + dark mode

- Toggle, persisted in `localStorage` (web/admin) and `expo-secure-store` (mobile). Storage key: `batho-theme`.
- **No system option.** Two states only: `light` (default) and `dark`. The user's choice is explicit.
- Web/admin: an inline `<script>` in `<head>` reads storage and sets `data-theme` on `<html>` before React hydrates, preventing FOUC.
- All colors live in CSS variables. Switching themes is a single attribute change on `<html>`.

## Architecture

```
packages/
  design-tokens/        # source of truth — colors, type, spacing, radius, motion
    src/index.ts        # token values
    src/css.ts          # tokensToCssVars(), allTokensCss() — emits :root + [data-theme=dark]
  ui/
    src/components/     # shared web React components + components.css
    src/theme/          # ThemeProvider, ThemeToggle, init-script (web)
    src/native/         # RN-safe entry: NativeThemeProvider, useNativeTheme, tokens
apps/
  web/                  # marketing landing — imports @batho/ui
  admin/                # ops dashboard — imports @batho/ui
  mobile/               # Expo Router — imports @batho/ui/native
```

Web and admin inject `allTokensCss()` server-side in `<head>` via a `<style>` tag. The bundled `components.css` is shipped automatically via `transpilePackages`.

Mobile cannot import CSS, so it imports only from `@batho/ui/native`, which has no DOM dependencies. Each screen reads colors from `useNativeTheme()` and constructs its `StyleSheet` via a `getStyles(c)` factory + `useMemo`.

## Components

| Component | Purpose |
| --- | --- |
| `Button` | Primary terracotta, secondary outline, ghost, inverse, sizes sm/md/lg, optional pill |
| `Card` | Default, `feature` (24-radius, more padding), `muted` (canvas tinted) |
| `Badge` | `neutral`, `brand`, `success`, `warning`, `danger`, `outline` |
| `Field` + `Input` / `Select` / `Textarea` | Form primitives — 12-radius, 48-min-height, terracotta focus ring |
| `NavBar` | Sticky blur backdrop, brand mark, nav links, theme toggle |
| `Section` | `<section>` wrapper with optional eyebrow / title / description |
| `Stat` | Admin dashboard tile — label, value, delta. Optional `highlight` border |
| `Table` | Sticky-header, terracotta hover row, 16-radius outer border |
| `BorderPattern` | Repeating Ndebele triangle SVG, follows `currentColor` |
| `ThemeToggle` | Pill button, sun/moon icons, accessible (`aria-pressed`) |

Mobile-only:

| Component | Purpose |
| --- | --- |
| `NativeThemeProvider` | Wraps the Expo root, owns theme state + persistence |
| `useNativeTheme()` | Returns `{ theme, colors, toggle, setTheme }` |

## Hard "do not" list

1. **No teal, no gold, no cool gray.** Only terracotta and warm neutrals.
2. **No pure black, no pure white in dark mode.** Dark canvas is `#1A1410`.
3. **No emoji in marketing copy.** Use real iconography or none at all.
4. **No drop shadows on flat cards.** Hover lift uses the `--shadow-md` token only.
5. **No serif font in body copy.** Instrument Serif is reserved for pull-quotes and the single italic phrase in the hero.
6. **No new color literals in app code.** If you reach for a hex value, add it to `packages/design-tokens` instead.
7. **No CSS imports from React Native.** Mobile imports from `@batho/ui/native` exclusively.

## Adding new patterns

1. Open `packages/design-tokens/src/index.ts`. If you need a new color or scale value, add it there.
2. Build the primitive in `packages/ui/src/components/` and add CSS to `components.css`. The CSS must reference tokens via `var(--color-…)` — never a hex literal.
3. Add a one-line entry to this file in the relevant table.
4. Use the component from at least one app and visually confirm light + dark before merging.
