import {
  calculateSavingsPlan,
  createDraftPlannerResult,
  recommendValueMonths,
  type PlannerGuidedInputs
} from "@batho/core";
import { colors, radius, spacing } from "@batho/design-tokens";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const interests = ["beach", "food", "culture", "wildlife", "adventure"];

const baseInputs: PlannerGuidedInputs = {
  destinationIdea: "Cape Town",
  roughBudgetCents: 2_800_000,
  travellerGroup: "couple",
  tripType: "domestic",
  interests: ["beach", "food"],
  dateFlexibility: "veryFlexible",
  preferredPlanMonths: 12
};

export function PlannerScreen() {
  const [selectedInterests, setSelectedInterests] = useState(baseInputs.interests);
  const plannerInputs = useMemo(
    () => ({ ...baseInputs, interests: selectedInterests }),
    [selectedInterests]
  );
  const draftPlan = useMemo(() => createDraftPlannerResult(plannerInputs), [plannerInputs]);
  const savingsPlan = useMemo(
    () => calculateSavingsPlan(draftPlan.savingsPlanInput),
    [draftPlan.savingsPlanInput]
  );
  const valueMonths = recommendValueMonths(draftPlan.destination.name, 3);

  function toggleInterest(interest: string) {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>AI Trip Planner</Text>
          <Text style={styles.title}>Shape the trip before the savings plan.</Text>
          <Text style={styles.copy}>
            This guided draft uses Batho Travels seasonality data. Costs are estimates until
            the trip is fully funded and confirmed.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Guided preferences</Text>
          <Text style={styles.cardMeta}>Destination idea: Cape Town, South Africa</Text>
          <View style={styles.chips}>
            {interests.map((interest) => {
              const selected = selectedInterests.includes(interest);

              return (
                <Pressable
                  key={interest}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => toggleInterest(interest)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                    {interest}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{draftPlan.destination.name}</Text>
          <Text style={styles.cardMeta}>{draftPlan.seasonalityReason}</Text>
          <View style={styles.monthGrid}>
            {valueMonths.map((month) => (
              <View key={month.name} style={styles.monthCard}>
                <Text style={styles.monthName}>{month.name}</Text>
                <Text style={styles.monthMeta}>
                  {month.season} season, {month.relativePrice} relative price
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estimated trip cost</Text>
          <CostRow label="Flights" amountCents={draftPlan.estimatedCost.flightsCents} />
          <CostRow label="Stay" amountCents={draftPlan.estimatedCost.stayCents} />
          <CostRow label="Experiences" amountCents={draftPlan.estimatedCost.experiencesCents} />
          <View style={styles.divider} />
          <CostRow label="Total estimate" amountCents={draftPlan.estimatedCost.totalCents} strong />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Savings handoff</Text>
          <Text style={styles.monthlyAmount}>
            {formatRand(savingsPlan.monthlyContributionCents)} per month
          </Text>
          <Text style={styles.cardMeta}>
            0% interest over {draftPlan.savingsPlanInput.planMonths} months. Flights fund first,
            then stay, then experiences.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CostRow({
  label,
  amountCents,
  strong = false
}: {
  label: string;
  amountCents: number;
  strong?: boolean;
}) {
  return (
    <View style={styles.costRow}>
      <Text style={[styles.costLabel, strong ? styles.strongText : null]}>{label}</Text>
      <Text style={[styles.costAmount, strong ? styles.strongText : null]}>
        {formatRand(amountCents)}
      </Text>
    </View>
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
  header: {
    gap: spacing.md,
    paddingVertical: spacing.lg
  },
  eyebrow: {
    color: colors.light.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.light.textPrimary,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    borderRadius: radius.full,
    borderColor: colors.light.borderStrong,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipSelected: {
    borderColor: colors.light.accent,
    backgroundColor: colors.light.accent
  },
  chipText: {
    color: colors.light.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  chipTextSelected: {
    color: colors.light.surfaceRaised
  },
  monthGrid: {
    gap: spacing.sm
  },
  monthCard: {
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.light.accentSoft
  },
  monthName: {
    color: colors.light.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  monthMeta: {
    color: colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textTransform: "capitalize"
  },
  costRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  costLabel: {
    color: colors.light.textSecondary,
    fontSize: 15
  },
  costAmount: {
    color: colors.light.textPrimary,
    fontSize: 15,
    fontVariant: ["tabular-nums"]
  },
  strongText: {
    color: colors.light.textPrimary,
    fontWeight: "700"
  },
  divider: {
    height: 1,
    backgroundColor: colors.light.borderSoft
  },
  monthlyAmount: {
    color: colors.light.primary,
    fontSize: 30,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  }
});

