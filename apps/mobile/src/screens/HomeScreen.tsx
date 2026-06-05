import { APP_NAME } from "@batho/config";
import {
  buildTripDashboard,
  createDraftPlannerResult,
  createTripFromPlannerResult,
  recordTripPayment
} from "@batho/core";
import { colors, radius, spacing } from "@batho/design-tokens";
import { Link } from "expo-router";
import { formatProgressPercent } from "@batho/ui";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const plannerResult = createDraftPlannerResult({
  destinationIdea: "Cape Town",
  roughBudgetCents: 2_800_000,
  travellerGroup: "couple",
  tripType: "domestic",
  interests: ["beach", "food"],
  dateFlexibility: "veryFlexible",
  preferredPlanMonths: 12
});
const demoTrip = recordTripPayment(
  createTripFromPlannerResult(plannerResult, {
    tripId: "demo-trip",
    userId: "demo-user",
    departureDate: "2027-03-20",
    createdAt: "2026-06-04T08:00:00.000Z"
  }),
  {
    id: "demo-payment-1",
    providerReference: "demo-reference",
    amountCents: 208_334,
    paidAt: "2026-07-01T08:00:00.000Z",
    status: "succeeded"
  }
);
const dashboard = buildTripDashboard(demoTrip, new Date("2027-03-01T00:00:00.000Z"));

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{APP_NAME}</Text>
          <Text style={styles.title}>Plan calmly. Save monthly. Travel debt-free.</Text>
          <Text style={styles.copy}>
            Start with the AI planner, choose a realistic season, then build a 0% interest
            savings plan in ZAR.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.dashboardHeader}>
            <View>
              <Text style={styles.cardTitle}>{dashboard.destinationName}</Text>
              <Text style={styles.cardMeta}>
                {dashboard.daysUntilDeparture} days until departure
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{dashboard.status}</Text>
            </View>
          </View>
          <View style={styles.amountGrid}>
            <View>
              <Text style={styles.metricLabel}>Saved</Text>
              <Text style={styles.metricValue}>{formatRand(dashboard.amountSavedCents)}</Text>
            </View>
            <View>
              <Text style={styles.metricLabel}>Remaining</Text>
              <Text style={styles.metricValue}>{formatRand(dashboard.amountRemainingCents)}</Text>
            </View>
          </View>
          <Text style={styles.cardMeta}>
            Next contribution:{" "}
            {dashboard.nextContribution
              ? `${formatRand(dashboard.nextContribution.amountCents)} for month ${dashboard.nextContribution.month}`
              : "Trip fully funded"}
          </Text>
          <View style={styles.stageList}>
            {dashboard.fundingStages.map((stage) => {
              const progressPercent = formatProgressPercent(stage.fundedCents, stage.targetCents) as `${number}%`;
              const isActive = stage.status === "active";

              return (
                <View key={stage.key} style={styles.stageRow}>
                  <View style={styles.stageHeader}>
                    <Text style={styles.stageLabel}>{stage.key}</Text>
                    <Text style={styles.stagePercent}>{progressPercent}</Text>
                  </View>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: progressPercent,
                          backgroundColor: isActive ? colors.light.primary : colors.light.borderStrong
                        }
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment history</Text>
          {dashboard.paymentHistory.map((payment) => (
            <View key={payment.id} style={styles.historyRow}>
              <View>
                <Text style={styles.stageLabel}>Monthly contribution</Text>
                <Text style={styles.cardMeta}>{new Date(payment.paidAt).toLocaleDateString("en-ZA")}</Text>
              </View>
              <Text style={styles.historyAmount}>{formatRand(payment.amountCents)}</Text>
            </View>
          ))}
          <Text style={styles.cardMeta}>
            Receipts will appear here automatically once a trusted payment provider confirms them.
          </Text>
        </View>

        <View style={styles.plannerPrompt}>
          <Text style={styles.cardTitle}>AI Trip Planner</Text>
          <Text style={styles.copy}>
            Tell Batho Travels your budget, travel style, and dates. The planner will suggest
            affordable months and hand the estimate into your savings plan.
          </Text>
          <Link href="/planner" style={styles.plannerLink}>
            Start planning
          </Link>
        </View>

        <View style={styles.kycPrompt}>
          <Text style={styles.cardTitle}>Verification</Text>
          <Text style={styles.copy}>
            Complete Standard or Enhanced verification when your travel plan needs a higher
            booking limit. This is not a credit check.
          </Text>
          <Link href="/kyc" style={styles.kycLink}>
            Review verification
          </Link>
        </View>

        <View style={styles.notificationsPrompt}>
          <Text style={styles.cardTitle}>Reminders and support</Text>
          <Text style={styles.copy}>
            Choose reminder channels and see calm options to pause, adjust, or cancel if
            your month changes.
          </Text>
          <Link href="/notifications" style={styles.notificationsLink}>
            Manage reminders
          </Link>
        </View>

        <View style={styles.groupsPrompt}>
          <Text style={styles.cardTitle}>Groups and custom destinations</Text>
          <Text style={styles.copy}>
            Invite travellers with independent shares, or ask operations to review a
            destination that is not in the current planner data.
          </Text>
          <Link href="/groups" style={styles.groupsLink}>
            Open groups
          </Link>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.canvas
  },
  container: {
    gap: spacing.lg,
    padding: spacing.lg
  },
  hero: {
    gap: spacing.md,
    paddingVertical: spacing.xl
  },
  eyebrow: {
    color: colors.light.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.light.textPrimary,
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 42
  },
  copy: {
    color: colors.light.textSecondary,
    fontSize: 16,
    lineHeight: 24
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.light.surfaceRaised,
    borderColor: colors.light.borderSoft,
    borderWidth: 1
  },
  dashboardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  statusPill: {
    borderRadius: radius.full,
    backgroundColor: colors.light.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  statusText: {
    color: colors.light.primaryStrong,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  amountGrid: {
    display: "flex",
    flexDirection: "row",
    gap: spacing.xl
  },
  metricLabel: {
    color: colors.light.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  metricValue: {
    color: colors.light.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  },
  cardTitle: {
    color: colors.light.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  cardMeta: {
    color: colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  stageList: {
    gap: spacing.md
  },
  stageRow: {
    gap: spacing.sm
  },
  stageHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  stageLabel: {
    color: colors.light.textPrimary,
    fontSize: 14,
    fontWeight: "700"
  },
  historyRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: colors.light.borderSoft,
    borderBottomWidth: 1,
    paddingBottom: spacing.md
  },
  historyAmount: {
    color: colors.light.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  },
  stagePercent: {
    color: colors.light.textSecondary,
    fontSize: 14
  },
  track: {
    height: 8,
    overflow: "hidden",
    borderRadius: radius.full,
    backgroundColor: colors.light.primarySoft
  },
  fill: {
    height: "100%",
    borderRadius: radius.full
  },
  plannerPrompt: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.light.accentSoft
  },
  plannerLink: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: colors.light.accent,
    color: colors.light.surfaceRaised,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  kycPrompt: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderColor: colors.light.borderSoft,
    borderWidth: 1,
    backgroundColor: colors.light.surfaceRaised
  },
  kycLink: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: colors.light.primary,
    color: colors.light.surfaceRaised,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  notificationsPrompt: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.light.goldSoft
  },
  notificationsLink: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: colors.light.gold,
    color: colors.light.surfaceRaised,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  groupsPrompt: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderColor: colors.light.borderSoft,
    borderWidth: 1,
    backgroundColor: colors.light.surfaceRaised
  },
  groupsLink: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: colors.light.accentStrong,
    color: colors.light.surfaceRaised,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  }
});
