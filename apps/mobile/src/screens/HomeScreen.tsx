import { radius, spacing } from "@batho/design-tokens";
import {
  calculateSavingsPlan,
  validatePlannerResult,
  type DestinationSeasonality,
  type PlannerResult
} from "@batho/core";
import { useMutation, useQuery } from "convex/react";
import { Link } from "expo-router";
import { formatProgressPercent, useNativeTheme } from "@batho/ui/native";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../auth/AuthContext";

export function HomeScreen() {
  const { theme, colors: c, toggle } = useNativeTheme();
  const { user, sessionToken, signOut } = useAuth();
  const styles = useMemo(() => getStyles(c), [c]);
  const updateTripDraft = useMutation(api.trips.updateTripDraft);
  const confirmTripReadyForPayment = useMutation(api.trips.confirmTripReadyForPayment);
  const archivePlannerDraft = useMutation(api.planner.archivePlannerDraft);
  const deletePlannerDraft = useMutation(api.planner.deletePlannerDraft);
  const [tripActionMessage, setTripActionMessage] = useState<string | null>(null);
  const [tripActionLoading, setTripActionLoading] = useState(false);
  const [portfolioTab, setPortfolioTab] = useState<"drafts" | "confirmed" | "archived">("drafts");
  const trips = useQuery(api.trips.listUserTrips, { sessionToken });
  const drafts = useQuery(api.planner.listUserDrafts, {
    sessionToken,
    status: portfolioTab === "archived" ? "archived" : undefined
  });
  const latestTrip = useMemo(
    () =>
      [...(trips ?? [])]
        .filter((trip) => trip.status === "active" || trip.status === "planning")
        .sort((a, b) => b.createdAt - a.createdAt)[0] ??
      [...(trips ?? [])].sort((a, b) => b.createdAt - a.createdAt)[0],
    [trips]
  );
  const dashboard = useQuery(
    api.trips.getTripDashboard,
    latestTrip ? { sessionToken, tripId: latestTrip._id } : "skip"
  );
  const loadingTrips = trips === undefined || (latestTrip && dashboard === undefined);
  const isPlanningDraft = dashboard?.status === "planning";

  async function archiveDraft(sessionId: string) {
    setTripActionLoading(true);
    setTripActionMessage(null);
    try {
      await archivePlannerDraft({ sessionToken, sessionId: sessionId as Id<"plannerSessions"> });
      setTripActionMessage("Draft archived.");
    } catch (err) {
      setTripActionMessage(err instanceof Error ? err.message : "Unable to archive this draft.");
    } finally {
      setTripActionLoading(false);
    }
  }

  async function deleteDraft(sessionId: string) {
    setTripActionLoading(true);
    setTripActionMessage(null);
    try {
      await deletePlannerDraft({ sessionToken, sessionId: sessionId as Id<"plannerSessions"> });
      setTripActionMessage("Draft deleted.");
    } catch (err) {
      setTripActionMessage(err instanceof Error ? err.message : "Unable to delete this draft.");
    } finally {
      setTripActionLoading(false);
    }
  }

  async function increaseDraftComfort() {
    if (!latestTrip || !dashboard) {
      return;
    }

    setTripActionLoading(true);
    setTripActionMessage(null);
    try {
      const targets = stageTargetsFromDashboard(dashboard.fundingStages);
      await updateTripDraft({
        sessionToken,
        tripId: latestTrip._id,
        costBreakdown: {
          flightsCents: Math.round(targets.flightsCents * 1.1),
          stayCents: Math.round(targets.stayCents * 1.1),
          experiencesCents: Math.round(targets.experiencesCents * 1.1)
        }
      });
      setTripActionMessage("Draft updated. Review the new monthly contribution before payment.");
    } catch (err) {
      setTripActionMessage(err instanceof Error ? err.message : "Unable to update this draft.");
    } finally {
      setTripActionLoading(false);
    }
  }

  async function confirmDraft() {
    if (!latestTrip) {
      return;
    }

    setTripActionLoading(true);
    setTripActionMessage(null);
    try {
      const gate = await confirmTripReadyForPayment({ sessionToken, tripId: latestTrip._id });
      setTripActionMessage(gate.message);
    } catch (err) {
      setTripActionMessage(
        err instanceof Error
          ? `${err.message} Open verification before payment.`
          : "Verification is required before payment can start."
      );
    } finally {
      setTripActionLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onPress={toggle}
              style={styles.themeToggle}
            >
              <Text style={styles.themeToggleText}>{theme === "dark" ? "Light mode" : "Dark mode"}</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>Plan calmly. Save monthly. Travel debt-free.</Text>
          <Text style={styles.copy}>
            Start with the AI planner, choose a realistic season, then build a 0% interest
            savings plan in ZAR.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.dashboardHeader}>
            <View>
              <Text style={styles.cardTitle}>{user.name ? `Hi, ${user.name}` : "Your account"}</Text>
              <Text style={styles.cardMeta}>{user.email}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={signOut} style={styles.signOutButton}>
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.segmentedControl}>
          {([
            ["drafts", "Drafts"],
            ["confirmed", "Confirmed"],
            ["archived", "Archived"]
          ] as const).map(([key, label]) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              onPress={() => setPortfolioTab(key)}
              style={[styles.segmentButton, portfolioTab === key ? styles.segmentButtonActive : null]}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  portfolioTab === key ? styles.segmentButtonTextActive : null
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {portfolioTab === "drafts" ? (
          <DraftList
            drafts={(drafts ?? []).filter((draft) => draft.status !== "archived")}
            emptyCopy="Generated advisor files will appear here before they become confirmed trips."
            onArchive={archiveDraft}
            onDelete={deleteDraft}
            styles={styles}
          />
        ) : portfolioTab === "archived" ? (
          <DraftList
            drafts={drafts ?? []}
            emptyCopy="Archived draft plans will appear here."
            onArchive={archiveDraft}
            onDelete={deleteDraft}
            styles={styles}
          />
        ) : loadingTrips ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Loading your trips</Text>
            <Text style={styles.cardMeta}>Fetching your saved travel plans.</Text>
          </View>
        ) : dashboard ? (
          <>
            <View style={styles.card}>
              <View style={styles.dashboardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{dashboard.destinationName}</Text>
                  <Text style={styles.cardMeta}>
                    {isPlanningDraft
                      ? "Editable draft before payment"
                      : `${dashboard.daysUntilDeparture} days until departure`}
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
              {isPlanningDraft ? (
                <View style={styles.draftPanel}>
                  <Text style={styles.cardTitle}>Draft controls</Text>
                  <Text style={styles.cardMeta}>
                    You can edit the estimate before payment starts. Confirmation checks your
                    verification tier first.
                  </Text>
                  <View style={styles.draftActions}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={tripActionLoading}
                      onPress={increaseDraftComfort}
                      style={[styles.secondaryActionButton, tripActionLoading ? styles.disabledButton : null]}
                    >
                      <Text style={styles.secondaryActionText}>Add comfort buffer</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={tripActionLoading}
                      onPress={confirmDraft}
                      style={[styles.primaryActionButton, tripActionLoading ? styles.disabledButton : null]}
                    >
                      <Text style={styles.primaryActionText}>Confirm for payment</Text>
                    </Pressable>
                  </View>
                  {tripActionMessage ? (
                    <Text style={styles.actionMessage}>{tripActionMessage}</Text>
                  ) : null}
                  <Link href="/kyc" style={styles.inlineLink}>
                    Review verification
                  </Link>
                </View>
              ) : null}
              <View style={styles.stageList}>
                {dashboard.fundingStages.map((stage) => {
                  const progressPercent = formatProgressPercent(
                    stage.fundedCents,
                    stage.targetCents
                  ) as `${number}%`;
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
                              backgroundColor: isActive ? c.primary : c.borderStrong
                            }
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {dashboard.paymentHistory.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Payment history</Text>
                {dashboard.paymentHistory.map((payment) => (
                  <View key={payment.id} style={styles.historyRow}>
                    <View>
                      <Text style={styles.stageLabel}>Monthly contribution</Text>
                      <Text style={styles.cardMeta}>
                        {new Date(payment.paidAt).toLocaleDateString("en-ZA")}
                      </Text>
                    </View>
                    <Text style={styles.historyAmount}>{formatRand(payment.amountCents)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No travel plan yet</Text>
            <Text style={styles.cardMeta}>
              Start with a guided planner flow, review the estimate, then create a savings plan
              when it looks realistic.
            </Text>
            <Link href="/planner" style={styles.plannerLink}>
              Start planning
            </Link>
          </View>
        )}

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

function DraftList({
  drafts,
  emptyCopy,
  onArchive,
  onDelete,
  styles
}: {
  drafts: Array<{
    _id: string;
    status: string;
    structuredResult?: unknown;
    briefSnapshot?: unknown;
    researchSnapshot?: unknown;
    draftVersion?: number;
    updatedAt: number;
  }>;
  emptyCopy: string;
  onArchive: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  styles: ReturnType<typeof getStyles>;
}) {
  if (drafts.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>No drafts yet</Text>
        <Text style={styles.cardMeta}>{emptyCopy}</Text>
        <Link href="/planner" style={styles.plannerLink}>
          Start planning
        </Link>
      </View>
    );
  }

  return (
    <>
      {drafts.map((draft) => {
        const destinationProfile =
          typeof draft.briefSnapshot === "object" && draft.briefSnapshot !== null
            ? ((draft.briefSnapshot as { destination?: DestinationSeasonality }).destination)
            : undefined;
        const validation = validatePlannerResult(draft.structuredResult, {
          destinationProfile
        });
        const result = validation.valid ? (validation.data as PlannerResult) : undefined;
        const savingsPlan = result ? calculateSavingsPlan(result.savingsPlanInput) : null;
        if (!result) {
          return null;
        }
        return (
          <View key={draft._id} style={styles.card}>
            <View style={styles.dashboardHeader}>
              <View style={styles.flexContent}>
                <Text style={styles.cardTitle}>{result?.destination.name ?? "Travel draft"}</Text>
                <Text style={styles.cardMeta}>
                  {result?.travelTiming?.selectedDepartureDate ?? "Timing not set"} - version{" "}
                  {draft.draftVersion ?? result?.draftVersion ?? 1}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{draft.status}</Text>
              </View>
            </View>
            {result ? (
              <>
                <View style={styles.amountGrid}>
                  <View>
                    <Text style={styles.metricLabel}>Estimate</Text>
                    <Text style={styles.metricValue}>{formatRand(result.estimatedCost.totalCents)}</Text>
                  </View>
                  <View>
                    <Text style={styles.metricLabel}>Monthly</Text>
                    <Text style={styles.metricValue}>
                      {savingsPlan ? formatRand(savingsPlan.monthlyContributionCents) : "-"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  Confidence: {result.costConfidence ?? "medium"} -{" "}
                  {result.travelTiming?.planMonths ?? result.savingsPlanInput.planMonths} savings months
                </Text>
              </>
            ) : null}
            <View style={styles.draftActions}>
              <Link
                href={{ pathname: "/planner", params: { sessionId: draft._id } }}
                style={styles.plannerLink}
              >
                Open advisor file
              </Link>
              {draft.status !== "archived" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onArchive(draft._id)}
                  style={styles.secondaryActionButton}
                >
                  <Text style={styles.secondaryActionText}>Archive</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => onDelete(draft._id)}
                style={styles.deleteActionButton}
              >
                <Text style={styles.deleteActionText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </>
  );
}

function formatRand(amountCents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

function stageTargetsFromDashboard(stages: Array<{ key: string; targetCents: number }>) {
  return {
    flightsCents: stages.find((stage) => stage.key === "flights")?.targetCents ?? 0,
    stayCents: stages.find((stage) => stage.key === "stay")?.targetCents ?? 0,
    experiencesCents: stages.find((stage) => stage.key === "experiences")?.targetCents ?? 0
  };
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
  hero: {
    gap: spacing.md,
    paddingVertical: spacing.xl
  },
  heroControls: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  themeToggle: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderColor: c.borderStrong,
    borderWidth: 1
  },
  themeToggleText: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: "700"
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
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 42
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
  segmentedControl: {
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: radius.md,
    borderColor: c.borderSoft,
    borderWidth: 1,
    padding: spacing.xs,
    backgroundColor: c.surfaceRaised
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  segmentButtonActive: {
    backgroundColor: c.primary
  },
  segmentButtonText: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: "700"
  },
  segmentButtonTextActive: {
    color: c.surfaceRaised
  },
  flexContent: {
    flex: 1
  },
  dashboardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  statusPill: {
    borderRadius: radius.full,
    backgroundColor: c.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  statusText: {
    color: c.primaryStrong,
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
  stageList: {
    gap: spacing.md
  },
  draftPanel: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: c.accentSoft,
    padding: spacing.md
  },
  draftActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  primaryActionButton: {
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: c.primary,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  primaryActionText: {
    color: c.surfaceRaised,
    fontSize: 14,
    fontWeight: "700"
  },
  secondaryActionButton: {
    alignItems: "center",
    borderRadius: radius.md,
    borderColor: c.borderStrong,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  secondaryActionText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: "700"
  },
  deleteActionButton: {
    alignItems: "center",
    borderRadius: radius.md,
    borderColor: c.primary,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  deleteActionText: {
    color: c.primary,
    fontSize: 14,
    fontWeight: "700"
  },
  actionMessage: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  inlineLink: {
    alignSelf: "flex-start",
    color: c.primary,
    fontSize: 14,
    fontWeight: "700"
  },
  disabledButton: {
    opacity: 0.6
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
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: "700"
  },
  historyRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: c.borderSoft,
    borderBottomWidth: 1,
    paddingBottom: spacing.md
  },
  historyAmount: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  },
  signOutButton: {
    borderRadius: radius.md,
    borderColor: c.borderStrong,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  signOutButtonText: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: "700"
  },
  stagePercent: {
    color: c.textSecondary,
    fontSize: 14
  },
  track: {
    height: 8,
    overflow: "hidden",
    borderRadius: radius.full,
    backgroundColor: c.primarySoft
  },
  fill: {
    height: "100%",
    borderRadius: radius.full
  },
  plannerPrompt: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: c.accentSoft
  },
  plannerLink: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: c.accent,
    color: c.surfaceRaised,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  kycPrompt: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderColor: c.borderSoft,
    borderWidth: 1,
    backgroundColor: c.surfaceRaised
  },
  kycLink: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: c.primary,
    color: c.surfaceRaised,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  notificationsPrompt: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: c.goldSoft
  },
  notificationsLink: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: c.gold,
    color: c.surfaceRaised,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  groupsPrompt: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderColor: c.borderSoft,
    borderWidth: 1,
    backgroundColor: c.surfaceRaised
  },
  groupsLink: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: c.accentStrong,
    color: c.surfaceRaised,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  }
});
}
