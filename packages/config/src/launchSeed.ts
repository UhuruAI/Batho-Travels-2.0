import type { TripType } from "./index";

export type LaunchSeedTraveller = {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycTier: "basic" | "standard" | "enhanced";
};

export type LaunchSeedTripScenario = {
  id: string;
  travellerId: string;
  destinationName: string;
  country: string;
  region: string;
  tripType: TripType;
  departureDate: string;
  travellerGroup: "solo" | "couple" | "family" | "group";
  interests: string[];
  recommendedMonths: string[];
  planMonths: number;
  estimatedCostCents: {
    flights: number;
    stay: number;
    experiences: number;
  };
};

export type LaunchSeedAdminQueue = {
  id: string;
  workspace: "operations" | "finance" | "support";
  title: string;
  status: "ready" | "review" | "blocked";
  ownerRole: "operations" | "finance" | "support";
};

export type LaunchQaViewport = {
  name: string;
  width: number;
  height: number;
  surface: "mobile" | "tablet" | "desktop";
};

export const LAUNCH_SEED_TRAVELLERS: LaunchSeedTraveller[] = [
  {
    id: "traveller_nomsa_demo",
    name: "Nomsa Demo",
    email: "demo+nomsa@bathotravels.example",
    phone: "+27000000001",
    kycTier: "standard"
  },
  {
    id: "traveller_neo_demo",
    name: "Neo Demo",
    email: "demo+neo@bathotravels.example",
    phone: "+27000000002",
    kycTier: "basic"
  },
  {
    id: "traveller_amara_demo",
    name: "Amara Demo",
    email: "demo+amara@bathotravels.example",
    phone: "+27000000003",
    kycTier: "enhanced"
  }
];

export const LAUNCH_SEED_TRIP_SCENARIOS: LaunchSeedTripScenario[] = [
  {
    id: "cape_town_couple_domestic",
    travellerId: "traveller_nomsa_demo",
    destinationName: "Cape Town",
    country: "South Africa",
    region: "Western Cape",
    tripType: "domestic",
    departureDate: "2027-03-20",
    travellerGroup: "couple",
    interests: ["beach", "food", "culture"],
    recommendedMonths: ["March", "April", "May"],
    planMonths: 12,
    estimatedCostCents: {
      flights: 1_200_000,
      stay: 850_000,
      experiences: 450_000
    }
  },
  {
    id: "zanzibar_group_regional",
    travellerId: "traveller_neo_demo",
    destinationName: "Zanzibar",
    country: "Tanzania",
    region: "East Africa",
    tripType: "africaRegional",
    departureDate: "2027-09-18",
    travellerGroup: "group",
    interests: ["beach", "culture", "food"],
    recommendedMonths: ["September", "October", "November"],
    planMonths: 10,
    estimatedCostCents: {
      flights: 2_250_000,
      stay: 2_600_000,
      experiences: 930_000
    }
  },
  {
    id: "lisbon_solo_long_haul",
    travellerId: "traveller_amara_demo",
    destinationName: "Lisbon",
    country: "Portugal",
    region: "Western Europe",
    tripType: "longHaulInternational",
    departureDate: "2027-10-12",
    travellerGroup: "solo",
    interests: ["food", "culture", "walkable cities"],
    recommendedMonths: ["September", "October", "November"],
    planMonths: 12,
    estimatedCostCents: {
      flights: 4_800_000,
      stay: 4_100_000,
      experiences: 1_700_000
    }
  }
];

export const LAUNCH_SEED_ADMIN_QUEUES: LaunchSeedAdminQueue[] = [
  {
    id: "ops_custom_destination_essaouira",
    workspace: "operations",
    title: "Review custom destination request for Essaouira",
    status: "review",
    ownerRole: "operations"
  },
  {
    id: "finance_refund_tier_review",
    workspace: "finance",
    title: "Check refund quote and management fee disclosure",
    status: "ready",
    ownerRole: "finance"
  },
  {
    id: "support_grace_period_pause",
    workspace: "support",
    title: "Respond to grace-period pause request",
    status: "ready",
    ownerRole: "support"
  }
];

export const LAUNCH_QA_VIEWPORTS: LaunchQaViewport[] = [
  { name: "iPhone compact", width: 390, height: 844, surface: "mobile" },
  { name: "Android compact", width: 412, height: 915, surface: "mobile" },
  { name: "Tablet portrait", width: 768, height: 1024, surface: "tablet" },
  { name: "Desktop", width: 1440, height: 960, surface: "desktop" }
];

export function launchTripTotalCents(scenario: LaunchSeedTripScenario): number {
  return (
    scenario.estimatedCostCents.flights +
    scenario.estimatedCostCents.stay +
    scenario.estimatedCostCents.experiences
  );
}
