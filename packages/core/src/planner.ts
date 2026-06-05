import {
  DEFAULT_PLAN_MONTHS,
  MAX_PLAN_MONTHS,
  MIN_PLAN_MONTHS,
  TRIP_TYPE_MINIMUM_MONTHS
} from "@batho/config";
import type { TripType } from "@batho/config";
import type { PlannerResult, SavingsPlanInput } from "./index";

export type SeasonalityLevel = "peak" | "shoulder" | "low";
export type RelativePrice = "high" | "medium" | "low";

export type DestinationSeasonalityMonth = {
  month: number;
  name: string;
  season: SeasonalityLevel;
  averageTemperatureC: number;
  rainfallMm: number;
  relativePrice: RelativePrice;
  note: string;
};

export type DestinationSeasonality = {
  name: string;
  country: string;
  region: string;
  tripType: TripType;
  baselineCostCents: {
    flightsCents: number;
    stayCents: number;
    experiencesCents: number;
  };
  months: DestinationSeasonalityMonth[];
};

export type PlannerGuidedInputs = {
  destinationIdea?: string;
  helpMeDecide?: boolean;
  roughBudgetCents: number;
  travellerGroup: "solo" | "couple" | "family" | "group";
  tripType: TripType;
  interests: string[];
  dateFlexibility: "fixed" | "someFlexibility" | "veryFlexible";
  preferredPlanMonths?: number;
};

export type PlannerValidationResult =
  | { valid: true; data: PlannerResult }
  | { valid: false; errors: string[] };

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

const PACKAGE_FUNNEL_TERMS = [
  "fixed package",
  "prebuilt package",
  "pre-built package",
  "template trip",
  "choose this package",
  "catalogue package"
] as const;

export const destinationSeasonalitySeed: DestinationSeasonality[] = [
  {
    name: "Cape Town",
    country: "South Africa",
    region: "Western Cape",
    tripType: "domestic",
    baselineCostCents: {
      flightsCents: 1_200_000,
      stayCents: 850_000,
      experiencesCents: 450_000
    },
    months: buildMonths([
      ["January", "peak", 26, 15, "high", "Summer peak with strong demand and higher stay prices."],
      ["February", "peak", 27, 17, "high", "Warm beach weather with premium pricing."],
      ["March", "shoulder", 25, 20, "medium", "Warm, calmer, and often better value than peak summer."],
      ["April", "shoulder", 23, 41, "medium", "Mild weather with balanced prices and fewer crowds."],
      ["May", "low", 20, 69, "low", "Cooler and quieter, with useful savings on stays."],
      ["June", "low", 18, 93, "low", "Winter value month with higher rain risk."],
      ["July", "low", 18, 82, "low", "Good value for travellers comfortable with winter weather."],
      ["August", "low", 18, 77, "low", "Quieter month before spring demand returns."],
      ["September", "shoulder", 20, 43, "medium", "Spring shoulder month with improving weather."],
      ["October", "shoulder", 22, 31, "medium", "Pleasant conditions before summer pricing rises."],
      ["November", "shoulder", 24, 20, "medium", "Warm and generally calmer than December."],
      ["December", "peak", 25, 17, "high", "Holiday peak with the highest demand."],
    ])
  },
  {
    name: "Zanzibar",
    country: "Tanzania",
    region: "Unguja",
    tripType: "africaRegional",
    baselineCostCents: {
      flightsCents: 850_000,
      stayCents: 1_250_000,
      experiencesCents: 550_000
    },
    months: buildMonths([
      ["January", "peak", 30, 76, "high", "Warm dry-season demand with premium beach pricing."],
      ["February", "peak", 30, 56, "high", "Strong beach conditions and higher prices."],
      ["March", "shoulder", 30, 150, "medium", "Changing weather with better value before long rains."],
      ["April", "low", 29, 320, "low", "Long rains bring lower prices and higher weather risk."],
      ["May", "low", 28, 290, "low", "Rainy value month for flexible travellers."],
      ["June", "shoulder", 28, 68, "medium", "Weather improves before high-season pricing peaks."],
      ["July", "peak", 27, 48, "high", "Dry season peak with strong international demand."],
      ["August", "peak", 27, 47, "high", "Popular dry-season month with high pricing."],
      ["September", "shoulder", 28, 50, "medium", "Reliable weather with better value than July/August."],
      ["October", "shoulder", 29, 97, "medium", "Warm shoulder month before short rains build."],
      ["November", "low", 30, 220, "low", "Short rains can lower prices for flexible plans."],
      ["December", "peak", 30, 140, "high", "Holiday demand raises pricing."],
    ])
  },
  {
    name: "Paris",
    country: "France",
    region: "Ile-de-France",
    tripType: "longHaulInternational",
    baselineCostCents: {
      flightsCents: 1_650_000,
      stayCents: 1_550_000,
      experiencesCents: 800_000
    },
    months: buildMonths([
      ["January", "low", 7, 54, "low", "Winter value month with colder weather and fewer crowds."],
      ["February", "low", 8, 46, "low", "Good value for flexible travellers comfortable with winter."],
      ["March", "shoulder", 12, 47, "medium", "Early spring with calmer demand."],
      ["April", "shoulder", 16, 51, "medium", "Spring shoulder month with balanced conditions."],
      ["May", "peak", 20, 64, "high", "Popular spring travel month with rising prices."],
      ["June", "peak", 23, 58, "high", "High demand and warmer weather."],
      ["July", "peak", 26, 58, "high", "Summer peak with premium pricing."],
      ["August", "peak", 26, 51, "high", "Busy summer travel period."],
      ["September", "shoulder", 22, 52, "medium", "Strong value month after summer peak."],
      ["October", "shoulder", 17, 61, "medium", "Autumn shoulder month with manageable demand."],
      ["November", "low", 11, 51, "low", "Lower demand and better stay value."],
      ["December", "peak", 8, 58, "high", "Festive demand lifts prices."],
    ])
  }
];

export function findDestinationSeasonality(
  destinationName: string
): DestinationSeasonality | undefined {
  const normalizedName = normalize(destinationName);
  return destinationSeasonalitySeed.find((destination) => normalize(destination.name) === normalizedName);
}

export function recommendValueMonths(
  destinationName: string,
  limit = 3
): DestinationSeasonalityMonth[] {
  const destination = findDestinationSeasonality(destinationName);
  if (!destination) {
    return [];
  }

  return destination.months.filter((month) => month.season !== "peak").slice(0, limit);
}

export function buildPlannerSystemPrompt(): string {
  return [
    "You are the Batho Travels AI Trip Planner.",
    "Help South African travellers create their own realistic trips using budget, interests, trip type, and seasonality data.",
    "Batho Travels is not a bank, lender, BNPL product, loan, or credit provider.",
    "You must never sell fixed packages, prebuilt packages, catalogue trips, or template trips.",
    "Costs are estimates until the trip is fully funded and bookings are confirmed with real suppliers.",
    "Prefer low and shoulder seasons when they fit the traveller's interests and comfort.",
    "Return validated JSON that matches the PlannerResult shape exactly, while conversational text can be streamed separately.",
    "The savings plan must respect 3 to 12 month limits and trip-type minimum planning windows."
  ].join("\n");
}

export function buildPlannerPromptContext(inputs: PlannerGuidedInputs): string {
  const destination = inputs.destinationIdea
    ? findDestinationSeasonality(inputs.destinationIdea)
    : undefined;
  const valueMonths = destination ? recommendValueMonths(destination.name) : [];

  return JSON.stringify(
    {
      appName: "Batho Travels",
      userInputs: inputs,
      matchedDestination: destination,
      recommendedValueMonths: valueMonths,
      outputContract: "PlannerResult",
      guardrails: {
        userDrivenPlanningOnly: true,
        noFixedPackages: true,
        markCostsAsEstimates: true,
        currency: "ZAR"
      }
    },
    null,
    2
  );
}

export function createDraftPlannerResult(inputs: PlannerGuidedInputs): PlannerResult {
  const destination =
    inputs.destinationIdea && findDestinationSeasonality(inputs.destinationIdea)
      ? findDestinationSeasonality(inputs.destinationIdea)
      : firstDestinationForTripType(inputs.tripType);
  if (!destination) {
    throw new Error("No destination seasonality data available for this planner request.");
  }
  const recommendedMonths = recommendValueMonths(destination.name, 2).map((month) => month.name);
  const totalCents =
    destination.baselineCostCents.flightsCents +
    destination.baselineCostCents.stayCents +
    destination.baselineCostCents.experiencesCents;
  const planMonths = inputs.preferredPlanMonths ?? DEFAULT_PLAN_MONTHS;

  return {
    destination: {
      name: destination.name,
      country: destination.country,
      region: destination.region
    },
    tripType: destination.tripType,
    recommendedMonths,
    seasonalityReason: `${recommendedMonths.join(" and ")} are value-focused months based on the Batho Travels seasonality dataset.`,
    estimatedCost: {
      totalCents,
      ...destination.baselineCostCents
    },
    itinerary: [
      {
        day: 1,
        title: "Arrive and settle in",
        description: "Keep the first day calm so the trip starts comfortably.",
        estimatedCostCents: 25_000
      },
      {
        day: 2,
        title: "Choose one anchor experience",
        description: `Pick an experience connected to ${inputs.interests[0] ?? "your interests"}.`,
        estimatedCostCents: 55_000
      }
    ],
    assumptions: [
      "Costs are estimates until bookings are fully funded and confirmed.",
      "The plan is user-driven and can be adjusted before creating a savings plan."
    ],
    savingsPlanInput: {
      totalCostCents: totalCents,
      tripType: destination.tripType,
      planMonths,
      costBreakdown: {
        flightsCents: destination.baselineCostCents.flightsCents,
        stayCents: destination.baselineCostCents.stayCents,
        experiencesCents: destination.baselineCostCents.experiencesCents
      }
    }
  };
}

export function validatePlannerResult(value: unknown): PlannerValidationResult {
  const errors: string[] = [];

  if (!isPlannerResultLike(value)) {
    return { valid: false, errors: ["Planner output must match the PlannerResult shape."] };
  }

  const result = value;
  const destination = findDestinationSeasonality(result.destination.name);

  if (!destination) {
    errors.push("Destination must exist in the seasonality dataset.");
  }

  if (destination && result.destination.country !== destination.country) {
    errors.push("Destination country must match the seasonality dataset.");
  }

  if (destination && result.tripType !== destination.tripType) {
    errors.push("Trip type must match the destination seasonality dataset.");
  }

  if (destination && !recommendedMonthsExist(result.recommendedMonths, destination)) {
    errors.push("Recommended months must exist in the destination seasonality dataset.");
  }

  const breakdownTotal =
    result.estimatedCost.flightsCents +
    result.estimatedCost.stayCents +
    result.estimatedCost.experiencesCents;

  if (breakdownTotal !== result.estimatedCost.totalCents) {
    errors.push("Estimated flights, stay, and experiences must add up to the total estimate.");
  }

  if (result.savingsPlanInput.totalCostCents !== result.estimatedCost.totalCents) {
    errors.push("Savings plan total must match the planner estimate.");
  }

  if (
    result.savingsPlanInput.costBreakdown.flightsCents !== result.estimatedCost.flightsCents ||
    result.savingsPlanInput.costBreakdown.stayCents !== result.estimatedCost.stayCents ||
    result.savingsPlanInput.costBreakdown.experiencesCents !==
      result.estimatedCost.experiencesCents
  ) {
    errors.push("Savings plan breakdown must match the planner estimate.");
  }

  const savingsPlanError = validateSavingsPlanHandoff(result.savingsPlanInput);
  if (savingsPlanError) {
    errors.push(savingsPlanError);
  }

  if (containsPackageFunnelLanguage(result)) {
    errors.push("Planner output must not describe fixed packages or templates.");
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true, data: result };
}

function buildMonths(
  rows: Array<[string, SeasonalityLevel, number, number, RelativePrice, string]>
): DestinationSeasonalityMonth[] {
  return rows.map(([name, season, averageTemperatureC, rainfallMm, relativePrice, note], index) => ({
    month: index + 1,
    name,
    season,
    averageTemperatureC,
    rainfallMm,
    relativePrice,
    note
  }));
}

function firstDestinationForTripType(tripType: TripType): DestinationSeasonality {
  const destination = destinationSeasonalitySeed.find((item) => item.tripType === tripType);
  if (!destination) {
    throw new Error(`No destination seed data available for trip type ${tripType}.`);
  }

  return destination;
}

function recommendedMonthsExist(
  recommendedMonths: string[],
  destination: DestinationSeasonality
): boolean {
  const knownMonths = new Set(destination.months.map((month) => normalize(month.name)));
  return recommendedMonths.every((month) => knownMonths.has(normalize(month)));
}

function containsPackageFunnelLanguage(result: PlannerResult): boolean {
  const text = [
    result.seasonalityReason,
    ...result.assumptions,
    ...result.itinerary.flatMap((item) => [item.title, item.description])
  ]
    .join(" ")
    .toLowerCase();

  return PACKAGE_FUNNEL_TERMS.some((term) => text.includes(term));
}

function validateSavingsPlanHandoff(input: SavingsPlanInput): string | undefined {
  const breakdownTotal =
    input.costBreakdown.flightsCents +
    input.costBreakdown.stayCents +
    input.costBreakdown.experiencesCents;

  if (breakdownTotal !== input.totalCostCents) {
    return "Savings plan cost breakdown must add up to the total trip cost.";
  }

  if (input.planMonths < MIN_PLAN_MONTHS) {
    return `Savings plan must be at least ${MIN_PLAN_MONTHS} months.`;
  }

  if (input.planMonths > MAX_PLAN_MONTHS) {
    return `Savings plan must be no more than ${MAX_PLAN_MONTHS} months.`;
  }

  const minimumMonths = TRIP_TYPE_MINIMUM_MONTHS[input.tripType];
  if (input.planMonths < minimumMonths) {
    return `Savings plan must be at least ${minimumMonths} months for this trip type.`;
  }

  return undefined;
}

function isPlannerResultLike(value: unknown): value is PlannerResult {
  if (!isRecord(value)) {
    return false;
  }

  const destination = value.destination;
  const estimatedCost = value.estimatedCost;
  const savingsPlanInput = value.savingsPlanInput;

  return (
    isRecord(destination) &&
    typeof destination.name === "string" &&
    typeof destination.country === "string" &&
    typeof destination.region === "string" &&
    isTripType(value.tripType) &&
    Array.isArray(value.recommendedMonths) &&
    value.recommendedMonths.every((month) => typeof month === "string") &&
    typeof value.seasonalityReason === "string" &&
    isRecord(estimatedCost) &&
    isMoneyNumber(estimatedCost.totalCents) &&
    isMoneyNumber(estimatedCost.flightsCents) &&
    isMoneyNumber(estimatedCost.stayCents) &&
    isMoneyNumber(estimatedCost.experiencesCents) &&
    Array.isArray(value.itinerary) &&
    value.itinerary.every(isItineraryItem) &&
    Array.isArray(value.assumptions) &&
    value.assumptions.every((assumption) => typeof assumption === "string") &&
    isRecord(savingsPlanInput) &&
    isMoneyNumber(savingsPlanInput.totalCostCents) &&
    isTripType(savingsPlanInput.tripType) &&
    Number.isInteger(savingsPlanInput.planMonths) &&
    isRecord(savingsPlanInput.costBreakdown) &&
    isMoneyNumber(savingsPlanInput.costBreakdown.flightsCents) &&
    isMoneyNumber(savingsPlanInput.costBreakdown.stayCents) &&
    isMoneyNumber(savingsPlanInput.costBreakdown.experiencesCents)
  );
}

function isItineraryItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    Number.isInteger(value.day) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    (value.estimatedCostCents === undefined || isMoneyNumber(value.estimatedCostCents))
  );
}

function isTripType(value: unknown): value is TripType {
  return value === "domestic" || value === "africaRegional" || value === "longHaulInternational";
}

function isMoneyNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
