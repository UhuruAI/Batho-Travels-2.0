export type GroupParticipantStatus = "invited" | "active" | "removed";

export type GroupParticipantInput = {
  userId: string;
  shareCents: number;
  status: GroupParticipantStatus;
};

export type GroupParticipantFundingInput = GroupParticipantInput & {
  name: string;
  savedCents: number;
};

export type GroupParticipantFundingSummary = {
  userId: string;
  name: string;
  shareCents: number;
  savedCents: number;
  remainingCents: number;
  progressPercent: number;
  status: GroupParticipantStatus;
};

export type GroupValidationInput = {
  tripTotalCents: number;
  participants: GroupParticipantInput[];
};

export type GroupValidationResult = {
  valid: boolean;
  totalSharesCents: number;
  message: string;
};

export type GroupFundingSummaryInput = {
  tripTotalCents: number;
  participants: GroupParticipantFundingInput[];
};

export type GroupFundingSummary = {
  tripTotalCents: number;
  totalSharedCents: number;
  totalSavedCents: number;
  remainingCents: number;
  participants: GroupParticipantFundingSummary[];
};

export type CustomDestinationRequestInput = {
  destinationName: string;
  country?: string;
  notes?: string;
};

export type CustomDestinationRequestValidation = {
  valid: boolean;
  message?: string;
};

export function validateGroupParticipants(input: GroupValidationInput): GroupValidationResult {
  const activeParticipants = input.participants.filter(
    (participant) => participant.status !== "removed"
  );
  const totalSharesCents = activeParticipants.reduce(
    (sum, participant) => sum + participant.shareCents,
    0
  );

  if (input.tripTotalCents <= 0) {
    return {
      valid: false,
      totalSharesCents,
      message: "Group trip estimate must be greater than R0."
    };
  }
  if (activeParticipants.length === 0) {
    return {
      valid: false,
      totalSharesCents: 0,
      message: "Add at least one traveller before creating a Batho Travels group plan."
    };
  }
  if (activeParticipants.some((participant) => participant.shareCents < 0)) {
    return {
      valid: false,
      totalSharesCents,
      message: "Participant shares cannot be negative."
    };
  }
  if (totalSharesCents !== input.tripTotalCents) {
    return {
      valid: false,
      totalSharesCents,
      message: "Adjust participant shares so they add up to the group trip estimate."
    };
  }

  return {
    valid: true,
    totalSharesCents,
    message: "Group shares are ready."
  };
}

export function buildGroupFundingSummary(input: GroupFundingSummaryInput): GroupFundingSummary {
  const participants = input.participants
    .filter((participant) => participant.status !== "removed")
    .map((participant) => {
      const savedCents = Math.min(participant.savedCents, participant.shareCents);

      return {
        userId: participant.userId,
        name: participant.name,
        shareCents: participant.shareCents,
        savedCents,
        remainingCents: Math.max(0, participant.shareCents - savedCents),
        progressPercent:
          participant.shareCents === 0 ? 0 : Math.round((savedCents / participant.shareCents) * 100),
        status: participant.status
      };
    });
  const totalSharedCents = participants.reduce((sum, participant) => sum + participant.shareCents, 0);
  const totalSavedCents = participants.reduce((sum, participant) => sum + participant.savedCents, 0);

  return {
    tripTotalCents: input.tripTotalCents,
    totalSharedCents,
    totalSavedCents,
    remainingCents: Math.max(0, input.tripTotalCents - totalSavedCents),
    participants
  };
}

export function validateCustomDestinationRequest(
  input: CustomDestinationRequestInput
): CustomDestinationRequestValidation {
  if (!input.destinationName.trim()) {
    return {
      valid: false,
      message: "Add the destination name you want Batho Travels to review."
    };
  }
  if (!input.notes || input.notes.trim().length < 12) {
    return {
      valid: false,
      message: "Add a little more context so operations can price the destination properly."
    };
  }

  return { valid: true };
}
