import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { NativeThemeProvider, useNativeTheme } from "@batho/ui/native";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthGate, SESSION_TOKEN_KEY } from "../src/auth/AuthContext";
import { getStoredItem } from "../src/lib/secureStorage";

const STORAGE_KEY = "batho-theme";
const bathoLogo = require("../assets/batho-logo.png");

function useConvexClient(): ConvexReactClient | null {
  return useMemo(() => {
    const url = process.env.EXPO_PUBLIC_CONVEX_URL;
    return url && url.length > 0
      ? new ConvexReactClient(url, { unsavedChangesWarning: false })
      : null;
  }, []);
}

function ThemedStack() {
  const { theme, colors: c } = useNativeTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.canvas },
        headerTintColor: c.textPrimary,
        headerTitleStyle: { fontWeight: "700", color: c.textPrimary },
        headerTitle: () => (
          <View style={styles.headerBrand}>
            <Image accessibilityIgnoresInvertColors source={bathoLogo} style={styles.headerLogo} />
            <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Batho Travels</Text>
          </View>
        ),
        contentStyle: { backgroundColor: c.canvas }
      }}
      // re-mount when theme changes to ensure header re-themes correctly on iOS
      key={theme}
    />
  );
}

function AuthUnavailable() {
  const { colors: c } = useNativeTheme();
  return (
    <View style={[styles.unavailable, { backgroundColor: c.canvas }]}>
      <Text style={[styles.unavailableTitle, { color: c.textPrimary }]}>Sign in unavailable</Text>
      <Text style={[styles.unavailableCopy, { color: c.textSecondary }]}>
        Convex is not configured for this build.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [initial, setInitial] = useState<"light" | "dark">("light");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const convex = useConvexClient();

  useEffect(() => {
    (async () => {
      try {
        const [storedTheme, storedSessionToken] = await Promise.all([
          getStoredItem(STORAGE_KEY),
          getStoredItem(SESSION_TOKEN_KEY)
        ]);
        if (storedTheme === "dark") setInitial("dark");
        if (storedSessionToken) setSessionToken(storedSessionToken);
      } catch {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return null;

  if (!convex) {
    return (
      <NativeThemeProvider initial={initial}>
        <AuthUnavailable />
      </NativeThemeProvider>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <NativeThemeProvider initial={initial}>
        <AuthGate sessionToken={sessionToken} setSessionToken={setSessionToken}>
          <ThemedStack />
        </AuthGate>
      </NativeThemeProvider>
    </ConvexProvider>
  );
}

const styles = StyleSheet.create({
  headerBrand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: 4
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700"
  },
  unavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24
  },
  unavailableTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  unavailableCopy: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  }
});
