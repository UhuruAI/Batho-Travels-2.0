import { describe, expect, it } from "vitest";
import {
  buildGroupFundingSummary,
  validateCustomDestinationRequest,
  validateGroupParticipants
} from "./groups";

describe("validateGroupParticipants", () => {
  it("accepts independent participant shares that add up to the group target", () => {
    expect(
      validateGroupParticipants({
        tripTotalCents: 1_200_000,
        participants: [
          { userId: "user_1", shareCents: 600_000, status: "active" },
          { userId: "user_2", shareCents: 600_000, status: "invited" }
        ]
      })
    ).toEqual({ valid: true, totalSharesCents: 1_200_000, message: "Group shares are ready." });
  });

  it("rejects empty groups and negative shares", () => {
    expect(
      validateGroupParticipants({
        tripTotalCents: 1_200_000,
        participants: []
      })
    ).toEqual({
      valid: false,
      totalSharesCents: 0,
      message: "Add at least one traveller before creating a Batho Travels group plan."
    });

    expect(
      validateGroupParticipants({
        tripTotalCents: 1_200_000,
        participants: [{ userId: "user_1", shareCents: -1, status: "active" }]
      }).message
    ).toBe("Participant shares cannot be negative.");
  });

  it("asks the coordinator to balance shares without debt language", () => {
    expect(
      validateGroupParticipants({
        tripTotalCents: 1_200_000,
        participants: [
          { userId: "user_1", shareCents: 500_000, status: "active" },
          { userId: "user_2", shareCents: 500_000, status: "invited" }
        ]
      })
    ).toEqual({
      valid: false,
      totalSharesCents: 1_000_000,
      message: "Adjust participant shares so they add up to the group trip estimate."
    });
  });
});

describe("buildGroupFundingSummary", () => {
  it("summarizes independent participant progress", () => {
    expect(
      buildGroupFundingSummary({
        tripTotalCents: 1_200_000,
        participants: [
          { userId: "user_1", name: "Amina", shareCents: 600_000, savedCents: 400_000, status: "active" },
          { userId: "user_2", name: "Neo", shareCents: 600_000, savedCents: 0, status: "invited" }
        ]
      })
    ).toEqual({
      tripTotalCents: 1_200_000,
      totalSharedCents: 1_200_000,
      totalSavedCents: 400_000,
      remainingCents: 800_000,
      participants: [
        {
          userId: "user_1",
          name: "Amina",
          shareCents: 600_000,
          savedCents: 400_000,
          remainingCents: 200_000,
          progressPercent: 67,
          status: "active"
        },
        {
          userId: "user_2",
          name: "Neo",
          shareCents: 600_000,
          savedCents: 0,
          remainingCents: 600_000,
          progressPercent: 0,
          status: "invited"
        }
      ]
    });
  });
});

describe("validateCustomDestinationRequest", () => {
  it("accepts a thoughtful destination request", () => {
    expect(
      validateCustomDestinationRequest({
        destinationName: "Essaouira",
        country: "Morocco",
        notes: "Beach, food, and a quieter shoulder-season trip."
      })
    ).toEqual({ valid: true });
  });

  it("requires a destination name and enough context", () => {
    expect(
      validateCustomDestinationRequest({
        destinationName: " ",
        notes: "Beach"
      })
    ).toEqual({
      valid: false,
      message: "Add the destination name you want Batho Travels to review."
    });

    expect(
      validateCustomDestinationRequest({
        destinationName: "Kyoto",
        notes: "Go"
      })
    ).toEqual({
      valid: false,
      message: "Add a little more context so operations can price the destination properly."
    });
  });
});
