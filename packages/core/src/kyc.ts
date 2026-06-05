export type KycReviewTier = "basic" | "standard" | "enhanced";
export type KycDocumentKind = "identityDocument" | "proofOfAddress" | "selfie";
export type KycSubmissionStatus = "notStarted" | "draft" | "pending" | "approved" | "rejected";
export type KycReviewDecision = "approved" | "rejected";

export type KycTierRequirements = {
  tier: Exclude<KycReviewTier, "basic">;
  title: string;
  requiredDocuments: KycDocumentKind[];
  allowsBookingCopy: string;
};

export type KycSubmissionInput = {
  requestedTier: Exclude<KycReviewTier, "basic">;
  documentStorageIds: Partial<Record<KycDocumentKind, string>>;
};

export type KycSubmissionValidation = {
  valid: boolean;
  missingDocuments: KycDocumentKind[];
  message?: string;
};

export type KycReviewInput = {
  currentTier: KycReviewTier;
  requestedTier: Exclude<KycReviewTier, "basic">;
  decision: KycReviewDecision;
};

export type KycReviewResult = {
  nextTier: KycReviewTier;
  submissionStatus: "approved" | "rejected";
  message: string;
};

const REQUIREMENTS: Record<Exclude<KycReviewTier, "basic">, KycTierRequirements> = {
  standard: {
    tier: "standard",
    title: "Standard verification",
    requiredDocuments: ["identityDocument", "proofOfAddress"],
    allowsBookingCopy: "Supports Batho Travels plans up to R50,000."
  },
  enhanced: {
    tier: "enhanced",
    title: "Enhanced verification",
    requiredDocuments: ["identityDocument", "proofOfAddress", "selfie"],
    allowsBookingCopy: "Supports higher-value Batho Travels plans after review."
  }
};

const DOCUMENT_LABELS: Record<KycDocumentKind, string> = {
  identityDocument: "identity document",
  proofOfAddress: "proof of address",
  selfie: "selfie"
};

const TIER_LABELS: Record<KycReviewTier, string> = {
  basic: "Basic",
  standard: "Standard",
  enhanced: "Enhanced"
};

export function getKycTierRequirements(
  tier: Exclude<KycReviewTier, "basic">
): KycTierRequirements {
  return REQUIREMENTS[tier];
}

export function validateKycSubmission(input: KycSubmissionInput): KycSubmissionValidation {
  const requirements = getKycTierRequirements(input.requestedTier);
  const missingDocuments = requirements.requiredDocuments.filter(
    (documentKind) => !input.documentStorageIds[documentKind]
  );

  if (missingDocuments.length === 0) {
    return {
      valid: true,
      missingDocuments: []
    };
  }

  return {
    valid: false,
    missingDocuments,
    message: `Please add ${formatDocumentList(missingDocuments)} before submitting ${requirements.title}.`
  };
}

export function applyKycReviewDecision(input: KycReviewInput): KycReviewResult {
  if (input.decision === "approved") {
    return {
      nextTier: highestTier(input.currentTier, input.requestedTier),
      submissionStatus: "approved",
      message: `${TIER_LABELS[input.requestedTier]} verification approved. This traveller can continue with higher-value plans.`
    };
  }

  return {
    nextTier: input.currentTier,
    submissionStatus: "rejected",
    message:
      "Verification was not approved. Ask for a clearer document without blocking existing access."
  };
}

export function getKycStatusCopy(
  status: KycSubmissionStatus,
  requestedTier: Exclude<KycReviewTier, "basic">
): string {
  const label = TIER_LABELS[requestedTier];

  if (status === "approved") {
    return `${label} verification is complete.`;
  }
  if (status === "pending") {
    return `${label} verification is being reviewed. You can keep planning while Batho Travels checks the documents.`;
  }
  if (status === "rejected") {
    return `${label} verification needs a clearer document. No plan is cancelled because of this.`;
  }
  if (status === "draft") {
    return `Add the required documents when you are ready to submit ${label} verification.`;
  }

  return `Start ${label} verification when your travel plan amount needs it.`;
}

function highestTier(currentTier: KycReviewTier, requestedTier: KycReviewTier): KycReviewTier {
  return tierRank(requestedTier) > tierRank(currentTier) ? requestedTier : currentTier;
}

function tierRank(tier: KycReviewTier): number {
  if (tier === "enhanced") {
    return 2;
  }
  if (tier === "standard") {
    return 1;
  }

  return 0;
}

function formatDocumentList(documents: KycDocumentKind[]): string {
  const labels = documents.map((documentKind) => DOCUMENT_LABELS[documentKind]);

  if (labels.length === 1) {
    return labels[0] as string;
  }

  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}
