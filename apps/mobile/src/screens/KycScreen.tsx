import {
  getKycStatusCopy,
  getKycTierRequirements,
  validateKycSubmission,
  type KycDocumentKind
} from "@batho/core";
import { radius, spacing } from "@batho/design-tokens";
import { useNativeTheme } from "@batho/ui/native";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../auth/AuthContext";

type RequestedTier = "standard" | "enhanced";

const documentLabels: Record<KycDocumentKind, string> = {
  identityDocument: "Identity document",
  proofOfAddress: "Proof of address",
  selfie: "Selfie check"
};

export function KycScreen() {
  const { colors: c } = useNativeTheme();
  const styles = useMemo(() => getStyles(c), [c]);
  const { sessionToken } = useAuth();
  const verification = useQuery(api.kyc.getCurrentUserVerification, { sessionToken });
  const createKycSubmission = useMutation(api.kyc.createKycSubmission);
  const [requestedTier, setRequestedTier] = useState<RequestedTier>("standard");
  const [uploadedDocuments, setUploadedDocuments] = useState<Partial<Record<KycDocumentKind, string>>>({
    identityDocument: "identity-document-upload",
    proofOfAddress: "proof-of-address-upload"
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const requirements = getKycTierRequirements(requestedTier);
  const latestSubmission = verification?.submissions[0];
  const validation = useMemo(
    () =>
      validateKycSubmission({
        requestedTier,
        documentStorageIds: uploadedDocuments
      }),
    [requestedTier, uploadedDocuments]
  );

  function toggleDocument(documentKind: KycDocumentKind) {
    setUploadedDocuments((current) => {
      const next = { ...current };
      if (next[documentKind]) {
        delete next[documentKind];
      } else {
        next[documentKind] = `${documentKind}-upload`;
      }

      return next;
    });
  }

  async function submitVerification() {
    if (!validation.valid) {
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await createKycSubmission({
        sessionToken,
        requestedTier,
        identityDocumentStorageId: uploadedDocuments.identityDocument,
        proofOfAddressStorageId: uploadedDocuments.proofOfAddress,
        selfieStorageId: uploadedDocuments.selfie
      });
      setMessage(`${requirements.title} submitted for review.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to submit verification.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Verification</Text>
          <Text style={styles.title}>Unlock payment only after review.</Text>
          <Text style={styles.copy}>
            Planning stays open while verification is pending. Payment can start only after the
            required tier is approved for the trip value.
          </Text>
        </View>

        <View style={styles.statusPanel}>
          <View>
            <Text style={styles.cardTitle}>Current tier</Text>
            <Text style={styles.tierValue}>{verification?.kycTier ?? "loading"}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {latestSubmission ? latestSubmission.status : "No submission"}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Choose verification level</Text>
          <View style={styles.tierOptions}>
            {(["standard", "enhanced"] as const).map((tier) => (
              <Pressable
                key={tier}
                accessibilityRole="button"
                accessibilityState={{ selected: requestedTier === tier }}
                onPress={() => setRequestedTier(tier)}
                style={[styles.tierButton, requestedTier === tier ? styles.tierButtonSelected : null]}
              >
                <Text
                  style={[
                    styles.tierButtonText,
                    requestedTier === tier ? styles.tierButtonTextSelected : null
                  ]}
                >
                  {tier}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.cardMeta}>{requirements.allowsBookingCopy}</Text>
          <Text style={styles.cardMeta}>
            {getKycStatusCopy(latestSubmission?.status ?? "draft", requestedTier)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{requirements.title}</Text>
          <View style={styles.documentList}>
            {requirements.requiredDocuments.map((documentKind) => {
              const uploaded = Boolean(uploadedDocuments[documentKind]);

              return (
                <Pressable
                  key={documentKind}
                  accessibilityRole="button"
                  accessibilityState={{ selected: uploaded }}
                  onPress={() => toggleDocument(documentKind)}
                  style={[styles.documentRow, uploaded ? styles.documentRowComplete : null]}
                >
                  <View style={styles.documentCopy}>
                    <Text style={styles.documentTitle}>{documentLabels[documentKind]}</Text>
                    <Text style={styles.documentMeta}>
                      {uploaded ? "Ready for review" : "Tap when the document is ready"}
                    </Text>
                  </View>
                  <Text style={[styles.documentState, uploaded ? styles.documentStateReady : null]}>
                    {uploaded ? "Added" : "Needed"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Review summary</Text>
          <Text style={validation.valid ? styles.readyCopy : styles.cardMeta}>
            {validation.valid ? `${requirements.title} is ready to submit.` : validation.message}
          </Text>
          {message ? <Text style={styles.actionMessage}>{message}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={!validation.valid || submitting}
            onPress={submitVerification}
            style={[
              styles.submitButton,
              validation.valid ? styles.submitButtonReady : null,
              submitting ? styles.disabledButton : null
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={c.surfaceRaised} />
            ) : (
              <Text style={[styles.submitText, validation.valid ? styles.submitTextReady : null]}>
                {validation.valid ? "Submit for review" : "Complete documents first"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(c: import("@batho/ui/native").Palette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.canvas
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
      color: c.primary,
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
    statusPanel: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
      borderRadius: radius.md,
      borderColor: c.borderSoft,
      borderWidth: 1,
      backgroundColor: c.surfaceRaised,
      padding: spacing.lg
    },
    statusPill: {
      borderRadius: radius.full,
      backgroundColor: c.accentSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    statusText: {
      color: c.accentStrong,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "capitalize"
    },
    tierValue: {
      color: c.primary,
      fontSize: 30,
      fontWeight: "700",
      textTransform: "capitalize"
    },
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: c.surfaceRaised,
      borderColor: c.borderSoft,
      borderWidth: 1
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
    tierOptions: {
      flexDirection: "row",
      gap: spacing.sm
    },
    tierButton: {
      borderRadius: radius.md,
      borderColor: c.borderStrong,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    tierButtonSelected: {
      borderColor: c.primary,
      backgroundColor: c.primary
    },
    tierButtonText: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: "700",
      textTransform: "capitalize"
    },
    tierButtonTextSelected: {
      color: c.surfaceRaised
    },
    documentList: {
      gap: spacing.sm
    },
    documentCopy: {
      flex: 1
    },
    documentRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
      borderRadius: radius.sm,
      borderColor: c.borderSoft,
      borderWidth: 1,
      padding: spacing.md
    },
    documentRowComplete: {
      borderColor: c.accent,
      backgroundColor: c.accentSoft
    },
    documentTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "700"
    },
    documentMeta: {
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 18
    },
    documentState: {
      color: c.warning,
      fontSize: 13,
      fontWeight: "700"
    },
    documentStateReady: {
      color: c.accentStrong
    },
    readyCopy: {
      color: c.success,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20
    },
    actionMessage: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20
    },
    submitButton: {
      alignItems: "center",
      borderRadius: radius.md,
      backgroundColor: c.borderSoft,
      minHeight: 50,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md
    },
    submitButtonReady: {
      backgroundColor: c.accent
    },
    submitText: {
      color: c.textSecondary,
      fontSize: 15,
      fontWeight: "700"
    },
    submitTextReady: {
      color: c.surfaceRaised
    },
    disabledButton: {
      opacity: 0.6
    }
  });
}
