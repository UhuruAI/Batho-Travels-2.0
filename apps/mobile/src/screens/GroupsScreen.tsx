import {
  buildGroupFundingSummary,
  validateCustomDestinationRequest,
  validateGroupParticipants
} from "@batho/core";
import { radius, spacing } from "@batho/design-tokens";
import { useNativeTheme } from "@batho/ui/native";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const initialParticipants = [
  { userId: "user_1", name: "Amina", shareCents: 600_000, savedCents: 420_000, status: "active" as const },
  { userId: "user_2", name: "Neo", shareCents: 600_000, savedCents: 80_000, status: "invited" as const }
];

export function GroupsScreen() {
  const { colors: c } = useNativeTheme();
  const styles = useMemo(() => getStyles(c), [c]);
  const [includeThirdTraveller, setIncludeThirdTraveller] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const participants = useMemo(
    () =>
      includeThirdTraveller
        ? [
            { userId: "user_1", name: "Amina", shareCents: 450_000, savedCents: 420_000, status: "active" as const },
            { userId: "user_2", name: "Neo", shareCents: 450_000, savedCents: 80_000, status: "invited" as const },
            { userId: "user_3", name: "Lebo", shareCents: 300_000, savedCents: 0, status: "invited" as const }
          ]
        : initialParticipants,
    [includeThirdTraveller]
  );
  const groupSummary = buildGroupFundingSummary({
    tripTotalCents: 1_200_000,
    participants
  });
  const groupValidation = validateGroupParticipants({
    tripTotalCents: 1_200_000,
    participants: participants.map((participant) => ({
      userId: participant.userId,
      shareCents: participant.shareCents,
      status: participant.status
    }))
  });
  const destinationValidation = validateCustomDestinationRequest({
    destinationName: "Essaouira",
    country: "Morocco",
    notes: notesExpanded
      ? "Beach, food, a calmer shoulder-season pace, and a realistic long-haul savings plan."
      : "Beach"
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Groups</Text>
          <Text style={styles.title}>Plan together. Save separately.</Text>
          <Text style={styles.copy}>
            Coordinators can invite travellers, but each person keeps their own share and
            payment progress. No one carries another traveller&apos;s plan.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Cape Town birthday trip</Text>
              <Text style={styles.cardMeta}>
                {groupValidation.message}
              </Text>
            </View>
            <Text style={groupValidation.valid ? styles.readyPill : styles.warningPill}>
              {groupValidation.valid ? "Ready" : "Adjust"}
            </Text>
          </View>
          <View style={styles.amountGrid}>
            <View>
              <Text style={styles.metricLabel}>Group saved</Text>
              <Text style={styles.metricValue}>{formatRand(groupSummary.totalSavedCents)}</Text>
            </View>
            <View>
              <Text style={styles.metricLabel}>Remaining</Text>
              <Text style={styles.metricValue}>{formatRand(groupSummary.remainingCents)}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: includeThirdTraveller }}
            onPress={() => setIncludeThirdTraveller((current) => !current)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {includeThirdTraveller ? "Remove traveller" : "Add traveller"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Participant shares</Text>
          <View style={styles.participantList}>
            {groupSummary.participants.map((participant) => (
              <View key={participant.userId} style={styles.participantRow}>
                <View style={styles.participantHeader}>
                  <View>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.cardMeta}>
                      {participant.status === "active" ? "Saving now" : "Invite sent"}
                    </Text>
                  </View>
                  <Text style={styles.participantAmount}>{formatRand(participant.shareCents)}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${participant.progressPercent}%` }]} />
                </View>
                <Text style={styles.cardMeta}>
                  {formatRand(participant.savedCents)} saved, {formatRand(participant.remainingCents)} remaining
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Custom destination</Text>
          <Text style={styles.cardMeta}>
            Ask Batho Travels operations to review a destination that is not in the current
            planning data.
          </Text>
          <View style={destinationValidation.valid ? styles.destinationReady : styles.destinationDraft}>
            <Text style={destinationValidation.valid ? styles.readyCopy : styles.warningCopy}>
              {destinationValidation.valid
                ? "Essaouira request is ready for operations review."
                : destinationValidation.message}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: notesExpanded }}
            onPress={() => setNotesExpanded((current) => !current)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {notesExpanded ? "Use shorter note" : "Add richer note"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatRand(amountCents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

function getStyles(c: import("@batho/ui/native").Palette) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.canvas
  },
  container: {
    gap: spacing.lg,
    padding: spacing.lg
  },
  header: {
    gap: spacing.md,
    paddingVertical: spacing.lg
  },
  eyebrow: {
    color: c.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: c.textPrimary,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40
  },
  copy: {
    color: c.textSecondary,
    fontSize: 16,
    lineHeight: 24
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: c.surfaceRaised,
    borderColor: c.borderSoft,
    borderWidth: 1
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  cardTitle: {
    color: c.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  cardMeta: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  readyPill: {
    overflow: "hidden",
    borderRadius: radius.full,
    backgroundColor: c.accentSoft,
    color: c.accentStrong,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  warningPill: {
    overflow: "hidden",
    borderRadius: radius.full,
    backgroundColor: c.goldSoft,
    color: c.warning,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  amountGrid: {
    flexDirection: "row",
    gap: spacing.xl
  },
  metricLabel: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  metricValue: {
    color: c.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  },
  participantList: {
    gap: spacing.md
  },
  participantRow: {
    gap: spacing.sm,
    borderBottomColor: c.borderSoft,
    borderBottomWidth: 1,
    paddingBottom: spacing.md
  },
  participantHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  participantName: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  participantAmount: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  },
  track: {
    height: 8,
    overflow: "hidden",
    borderRadius: radius.full,
    backgroundColor: c.primarySoft
  },
  fill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: c.primary
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: c.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  primaryButtonText: {
    color: c.surfaceRaised,
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    borderColor: c.borderStrong,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  secondaryButtonText: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: "700"
  },
  destinationReady: {
    borderRadius: radius.sm,
    backgroundColor: c.accentSoft,
    padding: spacing.md
  },
  destinationDraft: {
    borderRadius: radius.sm,
    backgroundColor: c.goldSoft,
    padding: spacing.md
  },
  readyCopy: {
    color: c.accentStrong,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  warningCopy: {
    color: c.warning,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  }
});
}
