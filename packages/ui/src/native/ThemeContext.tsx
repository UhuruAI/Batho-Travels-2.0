import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { colors, type ThemeName } from "@batho/design-tokens";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "batho-theme";

type ColorKey = keyof typeof colors.light;
export type Palette = Readonly<Record<ColorKey, string>>;

type Ctx = {
  theme: ThemeName;
  colors: Palette;
  toggle: () => void;
  setTheme: (theme: ThemeName) => void;
};

const NativeThemeContext = createContext<Ctx | null>(null);

export function NativeThemeProvider({ children, initial = "light" }: { children: ReactNode; initial?: ThemeName }) {
  const [theme, setThemeState] = useState<ThemeName>(initial);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => undefined);
      return next;
    });
  }, []);

  // Keep the state in sync if `initial` changes (e.g. after async restore).
  useEffect(() => {
    setThemeState(initial);
  }, [initial]);

  const value = useMemo<Ctx>(() => ({ theme, colors: colors[theme], toggle, setTheme }), [theme, toggle, setTheme]);
  return <NativeThemeContext.Provider value={value}>{children}</NativeThemeContext.Provider>;
}

export function useNativeTheme(): Ctx {
  const ctx = useContext(NativeThemeContext);
  if (!ctx) {
    return { theme: "light", colors: colors.light, toggle: () => undefined, setTheme: () => undefined };
  }
  return ctx;
}
