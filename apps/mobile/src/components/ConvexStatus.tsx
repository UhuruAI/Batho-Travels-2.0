import { Component, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { StyleSheet, Text, View } from "react-native";
import { api } from "../../../../convex/_generated/api";
import { useNativeTheme } from "@batho/ui/native";

export function ConvexStatus() {
  const { colors: c } = useNativeTheme();

  if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
    return <Chip background={c.goldSoft} color={c.warning} label="Convex not configured" />;
  }

  return (
    <ConvexStatusErrorBoundary
      fallback={<Chip background={c.goldSoft} color={c.warning} label="Convex unavailable" />}
    >
      <ConvexStatusLive />
    </ConvexStatusErrorBoundary>
  );
}

function ConvexStatusLive() {
  const { colors: c } = useNativeTheme();
  const result = useQuery(api.status.ping);
  if (result === undefined) {
    return <Chip background={c.canvas} color={c.textSecondary} label="Connecting to Convex..." />;
  }
  const time = new Date(result.serverTime).toLocaleTimeString();
  return <Chip background={c.primarySoft} color={c.primaryStrong} label={`Convex live - ${time}`} />;
}

class ConvexStatusErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function Chip({ background, color, label }: { background: string; color: string; label: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  dot: { width: 6, height: 6, borderRadius: 999 },
  label: { fontSize: 12, fontWeight: "700" }
});
