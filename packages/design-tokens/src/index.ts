// Batho Travels design tokens — Airbnb-flavored, terracotta-anchored.
// Palette sampled from the Batho logo: terracotta + warm neutrals, no teal, no gold.
// Token names are stable (mobile depends on them); semantic aliases follow.

export const colors = {
  light: {
    canvas: "#FAF5F0",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    textPrimary: "#2A1F18",
    textSecondary: "#6B5A4D",
    textMuted: "#8A7967",
    borderSoft: "#E8DDD0",
    borderStrong: "#D4C2AE",
    primary: "#C0502B",
    primaryStrong: "#9A3F22",
    primarySoft: "#F7E1D6",
    accent: "#E27A55",
    accentStrong: "#C0502B",
    accentSoft: "#FBE8DC",
    gold: "#B85432",
    goldSoft: "#F7E1D6",
    success: "#2A7A4F",
    warning: "#B86E1A",
    error: "#B23B32",
    info: "#6B5A4D"
  },
  dark: {
    canvas: "#1A1410",
    surface: "#241C16",
    surfaceRaised: "#2D2319",
    textPrimary: "#F2E9DF",
    textSecondary: "#C8B8A6",
    textMuted: "#9C8B7A",
    borderSoft: "#3A2E25",
    borderStrong: "#574638",
    primary: "#E27A55",
    primaryStrong: "#F0916D",
    primarySoft: "#3A1E14",
    accent: "#F0916D",
    accentStrong: "#F5A689",
    accentSoft: "#3A1E14",
    gold: "#F0916D",
    goldSoft: "#3A1E14",
    success: "#6EC094",
    warning: "#E0A66E",
    error: "#E8786E",
    info: "#C8B8A6"
  }
} as const;

// Airbnb-flavor typography. Inter Tight as the Cereal-alike display, Inter for body,
// Instrument Serif reserved for editorial pull-quotes on the consumer site.
export const typography = {
  display: "Inter Tight",
  body: "Inter",
  serif: "Instrument Serif",
  data: "JetBrains Mono",
  scale: {
    displayXl: { fontSize: 64, lineHeight: 68, fontWeight: 700, letterSpacing: -1.5 },
    displayL: { fontSize: 48, lineHeight: 54, fontWeight: 700, letterSpacing: -1 },
    heading1: { fontSize: 32, lineHeight: 38, fontWeight: 600, letterSpacing: -0.5 },
    heading2: { fontSize: 24, lineHeight: 30, fontWeight: 600, letterSpacing: -0.3 },
    heading3: { fontSize: 20, lineHeight: 26, fontWeight: 600 },
    heading4: { fontSize: 18, lineHeight: 24, fontWeight: 600 },
    bodyL: { fontSize: 18, lineHeight: 28, fontWeight: 400 },
    bodyM: { fontSize: 16, lineHeight: 24, fontWeight: 400 },
    bodyS: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
    label: { fontSize: 13, lineHeight: 16, fontWeight: 600 },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: 500 },
    data: { fontSize: 14, lineHeight: 20, fontWeight: 500 }
  }
} as const;

export const spacing = {
  "2xs": 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999
} as const;

export const motion = {
  duration: {
    micro: 80,
    short: 160,
    medium: 260,
    long: 420,
    expressive: 640
  },
  easing: {
    enter: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.7, 0, 0.84, 0)",
    move: "cubic-bezier(0.65, 0, 0.35, 1)"
  }
} as const;

export const shadows = {
  light: {
    sm: "0 1px 2px rgba(42, 31, 24, 0.06)",
    md: "0 6px 18px rgba(42, 31, 24, 0.08)",
    lg: "0 24px 48px rgba(42, 31, 24, 0.12)",
    glow: "0 0 0 4px rgba(192, 80, 43, 0.18)"
  },
  dark: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
    md: "0 6px 18px rgba(0, 0, 0, 0.5)",
    lg: "0 24px 48px rgba(0, 0, 0, 0.6)",
    glow: "0 0 0 4px rgba(226, 122, 85, 0.28)"
  }
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  motion,
  shadows
} as const;

export type ThemeName = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;

export function getColors(theme: ThemeName) {
  return colors[theme];
}

export function getShadows(theme: ThemeName) {
  return shadows[theme];
}

export { tokensToCssVars, allTokensCss } from "./css";
