import { describe, expect, it } from "vitest";
import {
  applyKycReviewDecision,
  assertKycAllowsPayment,
  getKycStatusCopy,
  getKycTierRequirements,
  validateKycSubmission
} from "./kyc";

describe("KYC tier requirements", () => {
  it("requires identity and address documents for Standard verification", () => {
    expect(getKycTierRequirements("standard")).toEqual({
      tier: "standard",
      title: "Standard verification",
      requiredDocuments: ["identityDocument", "proofOfAddress"],
      allowsBookingCopy: "Supports Batho Travels plans up to R50,000."
    });
  });

  it("requires selfie verification for Enhanced verification", () => {
    expect(getKycTierRequirements("enhanced").requiredDocuments).toEqual([
      "identityDocument",
      "proofOfAddress",
      "selfie"
    ]);
  });
});

describe("validateKycSubmission", () => {
  it("accepts a complete Standard submission", () => {
    expect(
      validateKycSubmission({
        requestedTier: "standard",
        documentStorageIds: {
          identityDocument: "storage_identity",
          proofOfAddress: "storage_address"
        }
      })
    ).toEqual({ valid: true, missingDocuments: [] });
  });

  it("returns calm missing document copy", () => {
    expect(
      validateKycSubmission({
        requestedTier: "enhanced",
        documentStorageIds: {
          identityDocument: "storage_identity"
        }
      })
    ).toEqual({
      valid: false,
      missingDocuments: ["proofOfAddress", "selfie"],
      message: "Please add proof of address and selfie before submitting Enhanced verification."
    });
  });
});

describe("applyKycReviewDecision", () => {
  it("upgrades the user tier when an Enhanced submission is approved", () => {
    expect(
      applyKycReviewDecision({
        currentTier: "standard",
        requestedTier: "enhanced",
        decision: "approved"
      })
    ).toEqual({
      nextTier: "enhanced",
      submissionStatus: "approved",
      message: "Enhanced verification approved. This traveller can continue with higher-value plans."
    });
  });

  it("keeps the current tier when a submission is rejected", () => {
    expect(
      applyKycReviewDecision({
        currentTier: "basic",
        requestedTier: "standard",
        decision: "rejected"
      })
    ).toEqual({
      nextTier: "basic",
      submissionStatus: "rejected",
      message: "Verification was not approved. Ask for a clearer document without blocking existing access."
    });
  });
});

describe("getKycStatusCopy", () => {
  it("uses supportive copy for pending review", () => {
    expect(getKycStatusCopy("pending", "standard")).toBe(
      "Standard verification is being reviewed. You can keep planning while Batho Travels checks the documents."
    );
  });
});

describe("assertKycAllowsPayment", () => {
  it("blocks payments until the traveller has the required approved tier", () => {
    expect(() => assertKycAllowsPayment("basic", 2_500_000)).toThrow(
      "Standard verification is required before payment can start."
    );
  });

  it("allows payment once the approved tier covers the trip estimate", () => {
    expect(assertKycAllowsPayment("standard", 2_500_000)).toEqual({
      allowed: true,
      requiredTier: "standard",
      message: "Standard verification approved. Payment can start."
    });
  });
});
