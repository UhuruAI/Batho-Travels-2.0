import {
  calculateSavingsPlan,
  type PlannerAssistantTurn,
  type PlannerGuidedOption,
  type PlannerResearchSnapshot,
  type PlannerResult
} from "@batho/core";
import { radius, spacing } from "@batho/design-tokens";
import { useNativeTheme } from "@batho/ui/native";
import { useAction, useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../auth/AuthContext";

type AssistantSource = "gemini" | "localFallback";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  rationale?: string;
};

export function PlannerScreen() {
  const { colors: c } = useNativeTheme();
  const styles = useMemo(() => getStyles(c), [c]);
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const routeSessionId = typeof params.sessionId === "string" ? params.sessionId : null;
  const { sessionToken } = useAuth();
  const startPlannerSession = useMutation(api.planner.startPlannerSession);
  const selectPlannerOption = useMutation(api.planner.selectPlannerOption);
  const submitPlannerCustomAnswer = useMutation(api.planner.submitPlannerCustomAnswer);
  const updatePlannerBrief = useMutation(api.planner.updatePlannerBrief);
  const createTrip = useMutation(api.trips.createTripFromPlannerSession);
  const generateNextPlannerTurn = useAction(api.planner.generateNextPlannerTurn);
  const generatePlannerResult = useAction(api.planner.generatePlannerResult);
  const regeneratePlannerDraft = useAction(api.planner.regeneratePlannerDraft);
  const scrollRef = useRef<ScrollView | null>(null);
  const existingDraft = useQuery(
    api.planner.getPlannerDraft,
    routeSessionId
      ? { sessionToken, sessionId: routeSessionId as Id<"plannerSessions"> }
      : "skip"
  );

  const [sessionId, setSessionId] = useState<Id<"plannerSessions"> | null>(null);
  const [currentTurn, setCurrentTurn] = useState<PlannerAssistantTurn | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [plannerResult, setPlannerResult] = useState<PlannerResult | null>(null);
  const [resultSource, setResultSource] = useState<AssistantSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [customAnswer, setCustomAnswer] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editMonth, setEditMonth] = useState("");
  const [editInterests, setEditInterests] = useState("");

  useEffect(() => {
    let mounted = true;

    async function bootPlanner() {
      if (routeSessionId) {
        return;
      }
      setBooting(true);
      setError(null);
      try {
        const started = await startPlannerSession({ sessionToken });
        if (!mounted) {
          return;
        }
        setSessionId(started.sessionId);
        setCurrentTurn(started.currentTurn as PlannerAssistantTurn);
        setMessages([
          {
            id: `${started.sessionId}:assistant:0`,
            role: "assistant",
            content: started.currentTurn.assistantMessage,
            rationale: started.currentTurn.rationale
          }
        ]);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to start the planner.");
        }
      } finally {
        if (mounted) {
          setBooting(false);
        }
      }
    }

    void bootPlanner();

    return () => {
      mounted = false;
    };
  }, [routeSessionId, sessionToken, startPlannerSession]);

  useEffect(() => {
    if (!routeSessionId || existingDraft === undefined) {
      return;
    }
    setBooting(false);
    if (!existingDraft) {
      setError("Draft not found.");
      return;
    }
    setSessionId(existingDraft._id as Id<"plannerSessions">);
    if (existingDraft.structuredResult) {
      const result = existingDraft.structuredResult as PlannerResult;
      setPlannerResult(result);
      setResultSource("gemini");
      setEditBudget(String(Math.round((result.editableInputs?.roughBudgetCents ?? result.estimatedCost.totalCents) / 100)));
      setEditMonth(result.travelTiming?.selectedDepartureMonth ?? "");
      setEditInterests((result.editableInputs?.interests ?? []).join(", "));
    }
  }, [existingDraft, routeSessionId]);

  async function chooseOption(option: PlannerGuidedOption) {
    if (!sessionId || !currentTurn) {
      return;
    }

    setError(null);
    setThinking(true);
    setMessages((current) => [
      ...current,
      {
        id: `${sessionId}:user:${Date.now()}`,
        role: "user",
        content: option.label
      }
    ]);

    try {
      await selectPlannerOption({
        sessionToken,
        sessionId,
        optionId: option.id
      });
      const next = await generateNextPlannerTurn({ sessionToken, sessionId });
      setCurrentTurn(next.turn);
      setResultSource(next.source);
      setMessages((current) => [
        ...current,
        {
          id: `${sessionId}:assistant:${Date.now()}`,
          role: "assistant",
          content: next.turn.assistantMessage,
          rationale: next.turn.rationale
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The planner could not continue. Try again.");
    } finally {
      setThinking(false);
    }
  }

  async function submitCustomAnswer() {
    if (!sessionId || !currentTurn) {
      return;
    }

    const answer = customAnswer.trim();
    if (!answer) {
      setError("Add your own trip preference before sending.");
      return;
    }

    setError(null);
    setThinking(true);
    setCustomAnswer("");
    setMessages((current) => [
      ...current,
      {
        id: `${sessionId}:user:${Date.now()}`,
        role: "user",
        content: answer
      }
    ]);

    try {
      await submitPlannerCustomAnswer({
        sessionToken,
        sessionId,
        answer
      });
      const next = await generateNextPlannerTurn({ sessionToken, sessionId });
      setCurrentTurn(next.turn);
      setResultSource(next.source);
      setMessages((current) => [
        ...current,
        {
          id: `${sessionId}:assistant:${Date.now()}`,
          role: "assistant",
          content: next.turn.assistantMessage,
          rationale: next.turn.rationale
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The planner could not use that answer.");
    } finally {
      setThinking(false);
    }
  }

  async function buildDraftPlan() {
    if (!sessionId) {
      return;
    }

    setError(null);
    setGenerating(true);
    try {
      const result = await generatePlannerResult({ sessionToken, sessionId });
      setResultSource(result.source);
      if (!result.valid) {
        setError(
          result.validationErrors.length > 0
            ? result.validationErrors.join(" ")
            : "The generated plan needs adjustment before it can become a trip draft."
        );
        return;
      }

      setPlannerResult(result.plannerResult as PlannerResult);
      seedEditFields(result.plannerResult as PlannerResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate a plan. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveTripDraft() {
    if (!sessionId || !plannerResult) {
      return;
    }

    setError(null);
    setCreatingTrip(true);
    try {
      await createTrip({
        sessionToken,
        plannerSessionId: sessionId,
        departureDate: departureDateForPlannerResult(plannerResult)
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the trip draft.");
    } finally {
      setCreatingTrip(false);
    }
  }

  async function applyEditsAndRegenerate() {
    if (!sessionId) {
      return;
    }

    setError(null);
    setGenerating(true);
    try {
      const budgetRand = Number(editBudget);
      await updatePlannerBrief({
        sessionToken,
        sessionId,
        patch: {
          roughBudgetCents:
            editBudget.trim() && Number.isFinite(budgetRand)
              ? Math.round(budgetRand * 100)
              : undefined,
          selectedDepartureMonth: editMonth.trim() || undefined,
          interests: editInterests
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        }
      });
      const regenerated = await regeneratePlannerDraft({ sessionToken, sessionId });
      setResultSource(regenerated.source);
      if (!regenerated.valid) {
        setError(
          regenerated.validationErrors.length > 0
            ? regenerated.validationErrors.join(" ")
            : "The regenerated plan needs adjustment before it can become a trip draft."
        );
        return;
      }
      const result = regenerated.plannerResult as PlannerResult;
      setPlannerResult(result);
      seedEditFields(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to regenerate the draft.");
    } finally {
      setGenerating(false);
    }
  }

  function seedEditFields(result: PlannerResult) {
    setEditBudget(String(Math.round((result.editableInputs?.roughBudgetCents ?? result.estimatedCost.totalCents) / 100)));
    setEditMonth(result.travelTiming?.selectedDepartureMonth ?? result.editableInputs?.selectedDepartureMonth ?? "");
    setEditInterests((result.editableInputs?.interests ?? []).join(", "));
  }

  if (plannerResult) {
    const savingsPlan = calculateSavingsPlan(plannerResult.savingsPlanInput);
    const researchSnapshot = existingDraft?.researchSnapshot as PlannerResearchSnapshot | undefined;
    const citations = plannerResult.sourceCitations ?? researchSnapshot?.citations ?? [];

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Advisor file</Text>
            <Text style={styles.title}>{plannerResult.destination.name}</Text>
            <Text style={styles.copy}>
              {plannerResult.destination.region}, {plannerResult.destination.country}. Draft version{" "}
              {plannerResult.draftVersion ?? 1}.
            </Text>
          </View>

          {resultSource === "localFallback" ? (
            <View style={styles.warningCard}>
              <Text style={styles.cardTitle}>Gemini unavailable</Text>
              <Text style={styles.cardMeta}>
                This is a local fallback draft. Add `GEMINI_API_KEY` in Convex to use live AI guidance.
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your brief</Text>
            {(plannerResult.briefReflection ?? []).map((item) => (
              <Text key={item} style={styles.cardMeta}>
                {item}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Travel timing</Text>
            <Text style={styles.monthlyAmount}>
              {plannerResult.travelTiming?.planMonths ?? plannerResult.savingsPlanInput.planMonths} months
            </Text>
            <Text style={styles.cardMeta}>
              Travel target: {plannerResult.travelTiming?.selectedDepartureDate ?? departureDateForPlannerResult(plannerResult)}
            </Text>
            <Text style={styles.cardMeta}>{plannerResult.seasonalityReason}</Text>
            {plannerResult.travelTiming?.timingWarning ? (
              <Text style={styles.errorText}>{plannerResult.travelTiming.timingWarning}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estimate</Text>
            <CostRow styles={styles} label="Flights" amountCents={plannerResult.estimatedCost.flightsCents} />
            <CostRow styles={styles} label="Stay" amountCents={plannerResult.estimatedCost.stayCents} />
            <CostRow
              styles={styles}
              label="Experiences"
              amountCents={plannerResult.estimatedCost.experiencesCents}
            />
            <View style={styles.divider} />
            <CostRow
              styles={styles}
              label="Total"
              amountCents={plannerResult.estimatedCost.totalCents}
              strong
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Savings draft</Text>
            <Text style={styles.monthlyAmount}>
              {formatRand(savingsPlan.monthlyContributionCents)} per month
            </Text>
            <Text style={styles.cardMeta}>
              Saved as an editable planning draft. You can adjust costs before payment, and
              verification must be approved before any payment can start.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Research evidence</Text>
            <Text style={styles.cardMeta}>
              Confidence: {plannerResult.costConfidence ?? researchSnapshot?.confidence ?? "medium"}
            </Text>
            {plannerResult.costResearch ? (
              <>
                <Text style={styles.stageLabel}>Flights</Text>
                <Text style={styles.cardMeta}>{plannerResult.costResearch.flights.rationale}</Text>
                <Text style={styles.stageLabel}>Stay</Text>
                <Text style={styles.cardMeta}>{plannerResult.costResearch.stay.rationale}</Text>
                <Text style={styles.stageLabel}>Experiences</Text>
                <Text style={styles.cardMeta}>{plannerResult.costResearch.experiences.rationale}</Text>
              </>
            ) : null}
            {citations.slice(0, 4).map((citation) => (
              <Text key={`${citation.title}-${citation.url ?? ""}`} style={styles.cardMeta}>
                Source: {citation.title}
                {citation.url ? ` - ${citation.url}` : ""}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Itinerary ideas</Text>
            {plannerResult.itinerary.map((item) => (
              <View key={`${item.day}-${item.title}`} style={styles.itineraryItem}>
                <Text style={styles.stageLabel}>
                  Day {item.day}: {item.title}
                </Text>
                <Text style={styles.cardMeta}>{item.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assumptions</Text>
            {plannerResult.assumptions.map((assumption) => (
              <Text key={assumption} style={styles.cardMeta}>
                {assumption}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit and regenerate</Text>
            <Text style={styles.cardMeta}>
              Adjust the planning brief before saving. Regeneration refreshes the advisor file and
              keeps payment blocked until verification allows it.
            </Text>
            <TextInput
              accessibilityLabel="Budget amount"
              keyboardType="numeric"
              onChangeText={setEditBudget}
              placeholder="Budget in rand"
              placeholderTextColor={c.textMuted}
              selectionColor={c.primary}
              style={styles.singleLineInput}
              value={editBudget}
            />
            <TextInput
              accessibilityLabel="Travel month"
              onChangeText={setEditMonth}
              placeholder="Travel month, e.g. January"
              placeholderTextColor={c.textMuted}
              selectionColor={c.primary}
              style={styles.singleLineInput}
              value={editMonth}
            />
            <TextInput
              accessibilityLabel="Trip interests"
              onChangeText={setEditInterests}
              placeholder="Interests, comma separated"
              placeholderTextColor={c.textMuted}
              selectionColor={c.primary}
              style={styles.singleLineInput}
              value={editInterests}
            />
            <Pressable
              accessibilityRole="button"
              disabled={generating}
              onPress={applyEditsAndRegenerate}
              style={[styles.secondaryButton, generating ? styles.disabledButton : null]}
            >
              {generating ? (
                <ActivityIndicator color={c.primary} />
              ) : (
                <Text style={styles.secondaryButtonText}>Regenerate advisor file</Text>
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={creatingTrip}
            onPress={saveTripDraft}
            style={[styles.primaryButton, creatingTrip ? styles.disabledButton : null]}
          >
            {creatingTrip ? (
              <ActivityIndicator color={c.surfaceRaised} />
            ) : (
              <Text style={styles.primaryButtonText}>Save editable trip draft</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPlannerResult(null)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Keep refining</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
        style={styles.keyboardAvoider}
      >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>AI Trip Planner</Text>
          <Text style={styles.title}>A guided travel consult.</Text>
          <Text style={styles.copy}>
            Choose one option at a time. Batho adapts the next cards from what you selected.
          </Text>
        </View>

        {resultSource === "localFallback" ? (
          <View style={styles.warningCard}>
            <Text style={styles.cardTitle}>Local fallback guidance</Text>
            <Text style={styles.cardMeta}>
              Gemini is unavailable in this environment, so these assistant turns are deterministic.
            </Text>
          </View>
        ) : null}

        <View style={styles.chatStack}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === "user" ? styles.userBubble : styles.assistantBubble
              ]}
            >
              <Text style={message.role === "user" ? styles.userText : styles.assistantText}>
                {message.content}
              </Text>
              {message.rationale ? <Text style={styles.rationale}>{message.rationale}</Text> : null}
            </View>
          ))}
          {thinking ? (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <ActivityIndicator color={c.primary} />
            </View>
          ) : null}
        </View>

        {booting ? (
          <View style={styles.card}>
            <ActivityIndicator color={c.primary} />
            <Text style={styles.cardMeta}>Opening your planning consult.</Text>
          </View>
        ) : currentTurn?.readyForFinalPlan ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your planning brief is ready</Text>
            <Text style={styles.cardMeta}>
              I have enough to generate a review draft. Nothing is charged, and the saved
              trip stays editable before payment.
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={generating}
              onPress={buildDraftPlan}
              style={[styles.primaryButton, generating ? styles.disabledButton : null]}
            >
              {generating ? (
                <ActivityIndicator color={c.surfaceRaised} />
              ) : (
                <Text style={styles.primaryButtonText}>Build my draft plan</Text>
              )}
            </Pressable>
          </View>
        ) : currentTurn ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{currentTurn.question}</Text>
            <View style={styles.optionStack}>
              {currentTurn.options.map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  disabled={thinking}
                  onPress={() => chooseOption(option)}
                  style={[styles.optionCard, thinking ? styles.disabledButton : null]}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.customAnswerBox}>
              <Text style={styles.customAnswerLabel}>Or write your own trip answer</Text>
              <TextInput
                accessibilityLabel="Custom trip answer"
                editable={!thinking}
                multiline
                onChangeText={setCustomAnswer}
                onFocus={() => {
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
                }}
                placeholder="Example: I want a quiet island feel, but the monthly amount must stay low."
                placeholderTextColor={c.textMuted}
                selectionColor={c.primary}
                style={styles.customAnswerInput}
                value={customAnswer}
              />
              <Pressable
                accessibilityRole="button"
                disabled={thinking || customAnswer.trim().length === 0}
                onPress={submitCustomAnswer}
                style={[
                  styles.customAnswerButton,
                  thinking || customAnswer.trim().length === 0 ? styles.disabledButton : null
                ]}
              >
                <Text style={styles.customAnswerButtonText}>Send answer</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CostRow({
  label,
  amountCents,
  strong = false,
  styles
}: {
  label: string;
  amountCents: number;
  strong?: boolean;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.costRow}>
      <Text style={[styles.costLabel, strong ? styles.strongText : null]}>{label}</Text>
      <Text style={[styles.costAmount, strong ? styles.strongText : null]}>{formatRand(amountCents)}</Text>
    </View>
  );
}

function departureDateForPlannerResult(result: PlannerResult): string {
  if (result.travelTiming?.selectedDepartureDate) {
    return result.travelTiming.selectedDepartureDate;
  }
  const now = new Date();
  const targetMonthName = result.recommendedMonths[0] ?? "December";
  const targetMonth = monthIndex(targetMonthName);
  const minimumDeparture = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + result.savingsPlanInput.planMonths, 15)
  );
  let candidate = new Date(Date.UTC(now.getUTCFullYear(), targetMonth, 15));

  while (candidate <= minimumDeparture) {
    candidate = new Date(Date.UTC(candidate.getUTCFullYear() + 1, targetMonth, 15));
  }

  return candidate.toISOString().slice(0, 10);
}

function monthIndex(monthName: string): number {
  const month = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ].indexOf(monthName.trim().toLowerCase());

  return month >= 0 ? month : 11;
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
    keyboardAvoider: {
      flex: 1
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
      color: c.accent,
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
    chatStack: {
      gap: spacing.md
    },
    messageBubble: {
      gap: spacing.sm,
      maxWidth: "92%",
      borderRadius: radius.md,
      padding: spacing.md
    },
    assistantBubble: {
      alignSelf: "flex-start",
      backgroundColor: c.surfaceRaised,
      borderColor: c.borderSoft,
      borderWidth: 1
    },
    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: c.primary
    },
    assistantText: {
      color: c.textPrimary,
      fontSize: 16,
      lineHeight: 23
    },
    userText: {
      color: c.surfaceRaised,
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 23
    },
    rationale: {
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 18
    },
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: c.surfaceRaised,
      borderColor: c.borderSoft,
      borderWidth: 1
    },
    warningCard: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: c.goldSoft
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
    optionStack: {
      gap: spacing.sm
    },
    optionCard: {
      gap: spacing.xs,
      borderRadius: radius.md,
      borderColor: c.borderStrong,
      borderWidth: 1,
      padding: spacing.md,
      backgroundColor: c.canvas
    },
    optionLabel: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "700"
    },
    optionDescription: {
      color: c.textSecondary,
      fontSize: 14,
      lineHeight: 20
    },
    customAnswerBox: {
      gap: spacing.sm,
      borderTopColor: c.borderSoft,
      borderTopWidth: 1,
      paddingTop: spacing.md
    },
    customAnswerLabel: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: "700"
    },
    customAnswerInput: {
      minHeight: 84,
      borderRadius: radius.md,
      borderColor: c.borderSoft,
      borderWidth: 1,
      backgroundColor: c.canvas,
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 21,
      padding: spacing.md,
      textAlignVertical: "top"
    },
    singleLineInput: {
      minHeight: 48,
      borderRadius: radius.md,
      borderColor: c.borderSoft,
      borderWidth: 1,
      backgroundColor: c.canvas,
      color: c.textPrimary,
      fontSize: 15,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    customAnswerButton: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 46,
      borderRadius: radius.md,
      backgroundColor: c.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    customAnswerButtonText: {
      color: c.surfaceRaised,
      fontSize: 15,
      fontWeight: "700"
    },
    primaryButton: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      borderRadius: radius.md,
      backgroundColor: c.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md
    },
    primaryButtonText: {
      color: c.surfaceRaised,
      fontSize: 16,
      fontWeight: "700"
    },
    secondaryButton: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      borderRadius: radius.md,
      borderColor: c.borderStrong,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md
    },
    secondaryButtonText: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "700"
    },
    disabledButton: {
      opacity: 0.6
    },
    errorText: {
      color: c.warning,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20
    },
    costRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md
    },
    costLabel: {
      color: c.textSecondary,
      fontSize: 15
    },
    costAmount: {
      color: c.textPrimary,
      fontSize: 15,
      fontVariant: ["tabular-nums"]
    },
    strongText: {
      color: c.textPrimary,
      fontWeight: "700"
    },
    divider: {
      height: 1,
      backgroundColor: c.borderSoft
    },
    itineraryItem: {
      gap: spacing.xs,
      borderBottomColor: c.borderSoft,
      borderBottomWidth: 1,
      paddingBottom: spacing.md
    },
    stageLabel: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: "700"
    },
    monthlyAmount: {
      color: c.primary,
      fontSize: 30,
      fontWeight: "700",
      fontVariant: ["tabular-nums"]
    }
  });
}
