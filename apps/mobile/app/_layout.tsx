import { Stack } from "expo-router";
import { colors } from "@batho/design-tokens";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.light.canvas },
        headerTintColor: colors.light.textPrimary,
        headerTitle: "Batho Travels",
        contentStyle: { backgroundColor: colors.light.canvas }
      }}
    />
  );
}

