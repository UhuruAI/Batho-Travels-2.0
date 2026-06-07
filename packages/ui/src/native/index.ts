// React Native adapter — tokens, theme context, and DOM-free helpers.
// Safe for Metro: no CSS imports, no DOM references.

import { colors, radius, spacing, typography, type ThemeName } from "@batho/design-tokens";

export type { ThemeName };
export { colors, radius, spacing, typography };

export function getNativeColors(theme: ThemeName) {
  return colors[theme];
}

export { NativeThemeProvider, useNativeTheme } from "./ThemeContext";
export type { Palette } from "./ThemeContext";

// Legacy contract — re-exported from a JSX/DOM-free module so RN consumers
// (and Vitest tests) don't have to parse the React component files.
export type {
  ButtonTone,
  StageStatus,
  ButtonRecipe,
  FundingStageProgressItem
} from "../legacy";

export {
  createButtonRecipe,
  getFundingStageStatus,
  formatProgressPercent
} from "../legacy";
