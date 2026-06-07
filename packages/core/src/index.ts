import {
  CANCELLATION_MANAGEMENT_FEE_CENTS,
  FUNDING_STAGE_ORDER,
  KYC_BOOKING_LIMITS_CENTS,
  MAX_PLAN_MONTHS,
  MIN_PLAN_MONTHS,
  REFUND_TIERS,
  TRIP_TYPE_MINIMUM_MONTHS
} from "@batho/config";
import type { FundingStageKey, TripType } from "@batho/config";
export * from "./planner";
export * from "./trips";
export * from "./kyc";
export * from "./notifications";
export * from "./groups";
export * from "./admin";

export type ValidationResult = {
  valid: boolean;
  message?: string;
};

export type SavingsScheduleMonth = {
  month: number;
  contributionCents: number;
  allocations: Record<FundingStageKey, number>;
};

export type FundingStage = {
  key: FundingStageKey;
  targetCents: number;
  fundedCents: number;
  status: "funded" | "active" | "queued";
  completedMonth?: number;
};

export type SavingsPlanInput = {
  totalCostCents: number;
  tripType: TripType;
  planMonths: number;
  departureDate?: string;
  costBreakdown: {
    flightsCents: number;
    stayCents: number;
    experiencesCents: number;
  };
};

export type SavingsPlanResult = {
  isValid: boolean;
  monthlyContributionCents: number;
  totalCostCents: number;
  roundingAdjustmentCents: number;
  schedule: SavingsScheduleMonth[];
  fundingStages: FundingStage[];
  message?: string;
};

export type KycTier = "basic" | "standard" | "enhanced";

export type BookingGateResult = {
  allowed: boolean;
  requiredTier?: KycTier;
  message: string;
};

export type CancellationRefundInput = {
  amountPaidCents: number;
  monthsBeforeTravel: number;
};

export type RefundResult = {
  refundPercentage: number;
  grossRefundCents: number;
  managementFeeCents: number;
  netRefundCents: number;
  userMessage: string;
};

export type PlannerItineraryItem = {
  day: number;
  title: string;
  description: string;
  estimatedCostCents?: number;
};

export type PlannerSourceCitation = {
  title: string;
  url?: string;
  publisher?: string;
  retrievedAt: string;
};

export type PlannerCostRange = {
  lowCents: number;
  highCents: number;
  rationale: string;
  citations: PlannerSourceCitation[];
};

export type PlannerCostResearch = {
  flights: PlannerCostRange;
  stay: PlannerCostRange;
  experiences: PlannerCostRange;
  localTransport?: PlannerCostRange;
};

export type PlannerResearchSnapshot = {
  destinationName: string;
  travelMonth: string;
  currency: "ZAR";
  generatedAt: string;
  confidence: "high" | "medium" | "low";
  summary: string;
  costResearch: PlannerCostResearch;
  citations: PlannerSourceCitation[];
};

export type PlannerTravelTiming = {
  selectedDepartureDate: string;
  selectedDepartureMonth: string;
  computedSavingsMonths: number;
  planMonths: number;
  savingsStartsAt: string;
  timingWarning?: string;
  nearestValidDepartureDate?: string;
};

export type PlannerResult = {
  destination: {
    name: string;
    country: string;
    region: string;
  };
  tripType: TripType;
  recommendedMonths: string[];
  seasonalityReason: string;
  estimatedCost: {
    totalCents: number;
    flightsCents: number;
    stayCents: number;
    experiencesCents: number;
  };
  itinerary: PlannerItineraryItem[];
  assumptions: string[];
  briefReflection?: string[];
  travelTiming?: PlannerTravelTiming;
  costConfidence?: "high" | "medium" | "low";
  costResearch?: PlannerCostResearch;
  sourceCitations?: PlannerSourceCitation[];
  generatedAt?: string;
  draftVersion?: number;
  editableInputs?: {
    destinationIdea?: string;
    selectedDepartureDate?: string;
    selectedDepartureMonth?: string;
    roughBudgetCents?: number;
    travellerGroup?: "solo" | "couple" | "family" | "group";
    interests?: string[];
    dateFlexibility?: "fixed" | "someFlexibility" | "veryFlexible";
    preferredPlanMonths?: number;
  };
  savingsPlanInput: SavingsPlanInput;
};

const TRIP_TYPE_LABELS: Record<TripType, string> = {
  domestic: "Domestic",
  africaRegional: "Africa regional",
  longHaulInternational: "Long-haul international"
};

const KYC_TIER_LABELS: Record<KycTier, string> = {
  basic: "Basic",
  standard: "Standard",
  enhanced: "Enhanced"
};

export function validateTripPlanLength(tripType: TripType, months: number): ValidationResult {
  if (!Number.isInteger(months)) {
    return {
      valid: false,
      message: "Choose a whole number of months for your Batho Travels savings plan."
    };
  }

  if (months < MIN_PLAN_MONTHS) {
    return {
      valid: false,
      message: `Batho Travels savings plans start at ${MIN_PLAN_MONTHS} months.`
    };
  }

  if (months > MAX_PLAN_MONTHS) {
    return {
      valid: false,
      message: `Batho Travels supports savings plans up to ${MAX_PLAN_MONTHS} months for now.`
    };
  }

  const minimumMonths = TRIP_TYPE_MINIMUM_MONTHS[tripType];
  if (months < minimumMonths) {
    return {
      valid: false,
      message: `${TRIP_TYPE_LABELS[tripType]} trips need at least ${minimumMonths} months so the monthly savings stay realistic and calm.`
    };
  }

  return { valid: true };
}

export function calculateSavingsPlan(input: SavingsPlanInput): SavingsPlanResult {
  const validation = validateTripPlanLength(input.tripType, input.planMonths);

  if (!validation.valid) {
    return {
      isValid: false,
      monthlyContributionCents: 0,
      totalCostCents: input.totalCostCents,
      roundingAdjustmentCents: 0,
      schedule: [],
      fundingStages: [],
      message: validation.message
    };
  }

  validateSavingsInput(input);

  const monthlyContributionCents = Math.ceil(input.totalCostCents / input.planMonths);
  const roundingAdjustmentCents = monthlyContributionCents * input.planMonths - input.totalCostCents;
  const schedule = buildSavingsSchedule(input, monthlyContributionCents);

  return {
    isValid: true,
    monthlyContributionCents,
    totalCostCents: input.totalCostCents,
    roundingAdjustmentCents,
    schedule,
    fundingStages: allocateStagedFunding(schedule, input.costBreakdown)
  };
}

export function allocateStagedFunding(
  schedule: SavingsScheduleMonth[],
  costBreakdown?: SavingsPlanInput["costBreakdown"]
): FundingStage[] {
  if (!costBreakdown) {
    return FUNDING_STAGE_ORDER.map((key) => {
      const fundedCents = schedule.reduce((sum, month) => sum + month.allocations[key], 0);
      return {
        key,
        targetCents: fundedCents,
        fundedCents,
        status: "funded" as const,
        completedMonth: fundedCents > 0 ? lastFundedMonth(schedule, key) : undefined
      };
    });
  }

  const fundedByStage = FUNDING_STAGE_ORDER.reduce(
    (funded, key) => ({
      ...funded,
      [key]: schedule.reduce((sum, month) => sum + month.allocations[key], 0)
    }),
    {} as Record<FundingStageKey, number>
  );
  const activeStage = FUNDING_STAGE_ORDER.find(
    (key) => fundedByStage[key] < costBreakdown[`${key}Cents`]
  );

  return FUNDING_STAGE_ORDER.map((key) => {
    const targetCents = costBreakdown[`${key}Cents`];
    const fundedCents = Math.min(targetCents, fundedByStage[key]);
    const completedMonth = completionMonth(schedule, key, targetCents);

    return {
      key,
      targetCents,
      fundedCents,
      status: getStageStatus(fundedCents, targetCents, key, activeStage),
      ...(completedMonth === undefined ? {} : { completedMonth })
    };
  });
}

export function calculateCancellationRefund(input: CancellationRefundInput): RefundResult {
  if (input.amountPaidCents < 0) {
    throw new Error("Amount paid cannot be negative.");
  }

  const tier = REFUND_TIERS.find(
    (refundTier) => input.monthsBeforeTravel >= refundTier.minimumMonthsBeforeTravel
  );
  const refundPercentage = tier?.refundPercentage ?? 0;
  const grossRefundCents = Math.floor((input.amountPaidCents * refundPercentage) / 100);
  const managementFeeCents =
    grossRefundCents > 0 ? Math.min(CANCELLATION_MANAGEMENT_FEE_CENTS, grossRefundCents) : 0;
  const netRefundCents = Math.max(0, grossRefundCents - managementFeeCents);

  return {
    refundPercentage,
    grossRefundCents,
    managementFeeCents,
    netRefundCents,
    userMessage: buildRefundMessage(refundPercentage, netRefundCents)
  };
}

export function canBookAmount(kycTier: KycTier, amountCents: number): BookingGateResult {
  if (amountCents < 0) {
    throw new Error("Booking amount cannot be negative.");
  }

  const limit = KYC_BOOKING_LIMITS_CENTS[kycTier];

  if (amountCents <= limit || kycTier === "enhanced") {
    return {
      allowed: true,
      message: `Your ${KYC_TIER_LABELS[kycTier]} verification supports this booking amount.`
    };
  }

  return {
    allowed: false,
    requiredTier: amountCents <= KYC_BOOKING_LIMITS_CENTS.standard ? "standard" : "enhanced",
    message:
      amountCents <= KYC_BOOKING_LIMITS_CENTS.standard
        ? "Please complete Standard verification before creating a paid travel plan for this amount."
        : "Please complete Enhanced verification before creating a paid travel plan for this amount."
  };
}

function validateSavingsInput(input: SavingsPlanInput): void {
  const { flightsCents, stayCents, experiencesCents } = input.costBreakdown;
  const breakdownTotal = flightsCents + stayCents + experiencesCents;

  if (input.totalCostCents <= 0) {
    throw new Error("Trip total must be greater than zero.");
  }

  if ([flightsCents, stayCents, experiencesCents].some((amount) => amount < 0)) {
    throw new Error("Cost breakdown amounts cannot be negative.");
  }

  if (breakdownTotal !== input.totalCostCents) {
    throw new Error("Cost breakdown must add up to the total trip cost.");
  }
}

function buildSavingsSchedule(
  input: SavingsPlanInput,
  monthlyContributionCents: number
): SavingsScheduleMonth[] {
  const remainingTargets: Record<FundingStageKey, number> = {
    flights: input.costBreakdown.flightsCents,
    stay: input.costBreakdown.stayCents,
    experiences: input.costBreakdown.experiencesCents
  };

  let remainingTripBalance = input.totalCostCents;

  return Array.from({ length: input.planMonths }, (_, index) => {
    const contributionCents =
      index === input.planMonths - 1
        ? remainingTripBalance
        : Math.min(monthlyContributionCents, remainingTripBalance);
    remainingTripBalance -= contributionCents;

    let unallocatedCents = contributionCents;
    const allocations: Record<FundingStageKey, number> = {
      flights: 0,
      stay: 0,
      experiences: 0
    };

    for (const stage of FUNDING_STAGE_ORDER) {
      if (unallocatedCents <= 0) {
        break;
      }

      const allocation = Math.min(unallocatedCents, remainingTargets[stage]);
      allocations[stage] = allocation;
      remainingTargets[stage] -= allocation;
      unallocatedCents -= allocation;
    }

    return {
      month: index + 1,
      contributionCents,
      allocations
    };
  });
}

function completionMonth(
  schedule: SavingsScheduleMonth[],
  key: FundingStageKey,
  targetCents: number
): number | undefined {
  if (targetCents <= 0) {
    return undefined;
  }

  let fundedCents = 0;
  for (const month of schedule) {
    fundedCents += month.allocations[key];
    if (fundedCents >= targetCents) {
      return month.month;
    }
  }

  return undefined;
}

function lastFundedMonth(
  schedule: SavingsScheduleMonth[],
  key: FundingStageKey
): number | undefined {
  for (let index = schedule.length - 1; index >= 0; index -= 1) {
    const month = schedule[index];
    if (month && month.allocations[key] > 0) {
      return month.month;
    }
  }

  return undefined;
}

function getStageStatus(
  fundedCents: number,
  targetCents: number,
  key: FundingStageKey,
  activeStage: FundingStageKey | undefined
): FundingStage["status"] {
  if (targetCents > 0 && fundedCents >= targetCents) {
    return "funded";
  }

  return activeStage === key ? "active" : "queued";
}

function buildRefundMessage(refundPercentage: number, netRefundCents: number): string {
  if (refundPercentage === 0 || netRefundCents === 0) {
    return "This cancellation is inside 3 months of travel, so the refundable amount is R0.";
  }

  return `You are eligible for a ${refundPercentage}% refund of funds paid, less the R500 management fee.`;
}
