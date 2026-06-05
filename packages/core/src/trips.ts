import { FUNDING_STAGE_ORDER } from "@batho/config";
import type { FundingStageKey } from "@batho/config";
import {
  allocateStagedFunding,
  calculateSavingsPlan,
  type FundingStage,
  type PlannerResult,
  type SavingsScheduleMonth
} from "./index.js";

export type TripStatus = "planning" | "active" | "paused" | "fullyFunded" | "booked" | "cancelled";
export type TripPaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type TripPayment = {
  id: string;
  providerReference: string;
  amountCents: number;
  paidAt: string;
  status: TripPaymentStatus;
  receiptUrl?: string;
};

export type TripReceipt = {
  paymentId: string;
  receiptUrl: string;
  issuedAt: string;
};

export type TripRecord = {
  id: string;
  userId: string;
  destinationName: string;
  destinationCountry: string;
  destinationRegion: string;
  tripType: PlannerResult["tripType"];
  status: TripStatus;
  departureDate: string;
  totalEstimateCents: number;
  monthlyContributionCents: number;
  planMonths: number;
  activeFundingStage: FundingStageKey;
  fundingStages: FundingStage[];
  savingsSchedule: SavingsScheduleMonth[];
  payments: TripPayment[];
  receipts: TripReceipt[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTripOptions = {
  tripId: string;
  userId: string;
  departureDate: string;
  createdAt: string;
};

export type TripDashboard = {
  tripId: string;
  destinationName: string;
  status: TripStatus;
  departureDate: string;
  daysUntilDeparture: number;
  activeFundingStage: FundingStageKey;
  amountSavedCents: number;
  amountRemainingCents: number;
  nextContribution?: {
    month: number;
    amountCents: number;
    status: "upcoming";
  };
  fundingStages: FundingStage[];
  paymentHistory: TripPayment[];
  receipts: TripReceipt[];
};

export function createTripFromPlannerResult(
  plannerResult: PlannerResult,
  options: CreateTripOptions
): TripRecord {
  const savingsPlan = calculateSavingsPlan(plannerResult.savingsPlanInput);

  if (!savingsPlan.isValid) {
    throw new Error(savingsPlan.message ?? "Planner result cannot create a valid trip.");
  }

  return {
    id: options.tripId,
    userId: options.userId,
    destinationName: plannerResult.destination.name,
    destinationCountry: plannerResult.destination.country,
    destinationRegion: plannerResult.destination.region,
    tripType: plannerResult.tripType,
    status: "active",
    departureDate: options.departureDate,
    totalEstimateCents: plannerResult.estimatedCost.totalCents,
    monthlyContributionCents: savingsPlan.monthlyContributionCents,
    planMonths: plannerResult.savingsPlanInput.planMonths,
    activeFundingStage: "flights",
    fundingStages: resetFundingStages(savingsPlan.fundingStages),
    savingsSchedule: savingsPlan.schedule,
    payments: [],
    receipts: [],
    createdAt: options.createdAt,
    updatedAt: options.createdAt
  };
}

export function buildTripDashboard(trip: TripRecord, asOf = new Date()): TripDashboard {
  const amountSavedCents = trip.payments
    .filter((payment) => payment.status === "succeeded")
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const amountRemainingCents = Math.max(0, trip.totalEstimateCents - amountSavedCents);
  const fundingStages = applySavedAmountToStages(trip, amountSavedCents);
  const activeFundingStage = getActiveFundingStage(fundingStages);

  return {
    tripId: trip.id,
    destinationName: trip.destinationName,
    status: amountRemainingCents === 0 && trip.status === "active" ? "fullyFunded" : trip.status,
    departureDate: trip.departureDate,
    daysUntilDeparture: calculateDaysUntil(trip.departureDate, asOf),
    activeFundingStage,
    amountSavedCents,
    amountRemainingCents,
    nextContribution: findNextContribution(trip, amountSavedCents),
    fundingStages,
    paymentHistory: [...trip.payments],
    receipts: [...trip.receipts]
  };
}

export function recordTripPayment(trip: TripRecord, payment: TripPayment): TripRecord {
  if (payment.amountCents < 0) {
    throw new Error("Payment amount cannot be negative.");
  }

  const receipts =
    payment.status === "succeeded" && payment.receiptUrl
      ? [
          ...trip.receipts,
          {
            paymentId: payment.id,
            receiptUrl: payment.receiptUrl,
            issuedAt: payment.paidAt
          }
        ]
      : trip.receipts;

  const updatedTrip = {
    ...trip,
    payments: [...trip.payments, payment],
    receipts,
    updatedAt: payment.paidAt
  };
  const dashboard = buildTripDashboard(updatedTrip, new Date(payment.paidAt));

  return {
    ...updatedTrip,
    activeFundingStage: dashboard.activeFundingStage,
    fundingStages: dashboard.fundingStages,
    status: dashboard.status
  };
}

function resetFundingStages(fundingStages: FundingStage[]): FundingStage[] {
  return fundingStages.map((stage, index) => ({
    key: stage.key,
    targetCents: stage.targetCents,
    fundedCents: 0,
    status: index === 0 ? "active" : "queued",
    completedMonth: undefined
  }));
}

function applySavedAmountToStages(trip: TripRecord, amountSavedCents: number): FundingStage[] {
  const schedule = buildPaidAllocationSchedule(trip.savingsSchedule, amountSavedCents);
  return allocateStagedFunding(schedule, {
    flightsCents: targetForStage(trip, "flights"),
    stayCents: targetForStage(trip, "stay"),
    experiencesCents: targetForStage(trip, "experiences")
  });
}

function buildPaidAllocationSchedule(
  savingsSchedule: SavingsScheduleMonth[],
  amountSavedCents: number
): SavingsScheduleMonth[] {
  let remainingPaidCents = amountSavedCents;

  return savingsSchedule.map((month) => {
    const paidThisMonth = Math.min(remainingPaidCents, month.contributionCents);
    remainingPaidCents -= paidThisMonth;

    let remainingAllocationCents = paidThisMonth;
    const allocations: Record<FundingStageKey, number> = {
      flights: 0,
      stay: 0,
      experiences: 0
    };

    for (const stage of FUNDING_STAGE_ORDER) {
      const scheduledAllocation = month.allocations[stage];
      const actualAllocation = Math.min(scheduledAllocation, remainingAllocationCents);
      allocations[stage] = actualAllocation;
      remainingAllocationCents -= actualAllocation;

      if (remainingAllocationCents <= 0) {
        break;
      }
    }

    return {
      month: month.month,
      contributionCents: paidThisMonth,
      allocations
    };
  });
}

function targetForStage(trip: TripRecord, key: FundingStageKey): number {
  return trip.fundingStages.find((stage) => stage.key === key)?.targetCents ?? 0;
}

function getActiveFundingStage(fundingStages: FundingStage[]): FundingStageKey {
  return fundingStages.find((stage) => stage.status === "active")?.key ?? "experiences";
}

function findNextContribution(
  trip: TripRecord,
  amountSavedCents: number
): TripDashboard["nextContribution"] {
  let coveredCents = amountSavedCents;

  for (const month of trip.savingsSchedule) {
    if (coveredCents >= month.contributionCents) {
      coveredCents -= month.contributionCents;
      continue;
    }

    return {
      month: month.month,
      amountCents: month.contributionCents - coveredCents,
      status: "upcoming"
    };
  }

  return undefined;
}

function calculateDaysUntil(departureDate: string, asOf: Date): number {
  const departureTime = startOfUtcDay(new Date(departureDate)).getTime();
  const asOfTime = startOfUtcDay(asOf).getTime();
  return Math.max(0, Math.ceil((departureTime - asOfTime) / 86_400_000));
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
