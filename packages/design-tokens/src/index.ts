export const colors = {
  light: {
    canvas: "#F8F4ED",
    surface: "#FFFDF8",
    surfaceRaised: "#FFFFFF",
    textPrimary: "#1D1B18",
    textSecondary: "#5D574F",
    textMuted: "#82786D",
    borderSoft: "#E6DDD1",
    borderStrong: "#CDBFAA",
    primary: "#8B4E2F",
    primaryStrong: "#673620",
    primarySoft: "#F1DED1",
    accent: "#0E7C73",
    accentStrong: "#075D56",
    accentSoft: "#D9EFEC",
    gold: "#C28A2E",
    goldSoft: "#F5E7C8",
    success: "#147A4A",
    warning: "#A86612",
    error: "#B23B32",
    info: "#256D85"
  },
  dark: {
    canvas: "#171411",
    surface: "#211D18",
    surfaceRaised: "#2A241E",
    textPrimary: "#F7EFE5",
    textSecondary: "#CFC2B3",
    textMuted: "#A79786",
    borderSoft: "#3B332B",
    borderStrong: "#5A4A3D",
    primary: "#D69A72",
    primaryStrong: "#F0B58E",
    primarySoft: "#3A261B",
    accent: "#65C5BA",
    accentStrong: "#89DDD4",
    accentSoft: "#173A36",
    gold: "#E0B764",
    goldSoft: "#3C3118",
    success: "#65C58E",
    warning: "#E0A64D",
    error: "#E8786E",
    info: "#72B8D2"
  }
} as const;

export const typography = {
  display: "Fraunces",
  body: "Source Sans 3",
  data: "Geist Mono",
  scale: {
    displayXl: { fontSize: 56, lineHeight: 60, fontWeight: 700 },
    displayL: { fontSize: 44, lineHeight: 50, fontWeight: 700 },
    heading1: { fontSize: 34, lineHeight: 40, fontWeight: 700 },
    heading2: { fontSize: 28, lineHeight: 34, fontWeight: 700 },
    heading3: { fontSize: 22, lineHeight: 28, fontWeight: 650 },
    bodyL: { fontSize: 18, lineHeight: 28, fontWeight: 400 },
    bodyM: { fontSize: 16, lineHeight: 24, fontWeight: 400 },
    bodyS: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
    label: { fontSize: 13, lineHeight: 16, fontWeight: 650 },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: 400 },
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
  sm: 6,
  md: 8,
  lg: 12,
  full: 999
} as const;

export const motion = {
  duration: {
    micro: 80,
    short: 160,
    medium: 260,
    long: 420
  },
  easing: {
    enter: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.7, 0, 0.84, 0)",
    move: "cubic-bezier(0.65, 0, 0.35, 1)"
  }
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  motion
} as const;

export type ThemeName = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;

