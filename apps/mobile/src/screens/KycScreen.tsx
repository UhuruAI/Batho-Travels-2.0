import {
  getKycStatusCopy,
  getKycTierRequirements,
  validateKycSubmission,
  type KycDocumentKind
} from "@batho/core";
import { colors, radius, spacing } from "@batho/design-tokens";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const documentLabels: Record<KycDocumentKind, string> = {
  identityDocument: "Identity document",
  proofOfAddress: "Proof of address",
  selfie: "Selfie check"
};

export function KycScreen() {
  const [uploadedDocuments, setUploadedDocuments] = useState<Partial<Record<KycDocumentKind, string>>>({
    identityDocument: "demo-identity-document"
  });
  const requirements = getKycTierRequirements("enhanced");
  const validation = useMemo(
    () =>
      validateKycSubmission({
        requestedTier: "enhanced",
        documentStorageIds: uploadedDocuments
      }),
    [uploadedDocuments]
  );

  function toggleDocument(documentKind: KycDocumentKind) {
    setUploadedDocuments((current) => {
      const next = { ...current };
      if (next[documentKind]) {
        delete next[documentKind];
      } else {
        next[documentKind] = `demo-${documentKind}`;
      }

      return next;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Verification</Text>
          <Text style={styles.title}>Keep higher-value travel plans protected.</Text>
          <Text style={styles.copy}>
            Batho Travels uses verification to protect travellers and bookings. It is not a
            credit check and it does not create debt.
          </Text>
        </View>

        <View style={styles.statusPanel}>
          <View>
            <Text style={styles.cardTitle}>Current tier</Text>
            <Text style={styles.tierValue}>Basic</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>No credit checks</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{requirements.title}</Text>
          <Text style={styles.cardMeta}>{requirements.allowsBookingCopy}</Text>
          <Text style={styles.cardMeta}>{getKycStatusCopy("draft", "enhanced")}</Text>
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
                  <View>
                    <Text style={styles.documentTitle}>{documentLabels[documentKind]}</Text>
                    <Text style={styles.documentMeta}>
                      {uploaded ? "Ready for review" : "Tap to add a demo document"}
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
            {validation.valid
              ? "Enhanced verification is ready to submit."
              : validation.message}
          </Text>
          <View style={[styles.submitButton, validation.valid ? styles.submitButtonReady : null]}>
            <Text style={[styles.submitText, validation.valid ? styles.submitTextReady : null]}>
              {validation.valid ? "Submit for review" : "Complete documents first"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.canvas
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
    color: colors.light.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.light.textPrimary,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40
  },
  copy: {
    color: colors.light.textSecondary,
    fontSize: 16,
    lineHeight: 24
  },
  statusPanel: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: radius.md,
    borderColor: colors.light.borderSoft,
    borderWidth: 1,
    backgroundColor: colors.light.surfaceRaised,
    padding: spacing.lg
  },
  statusPill: {
    borderRadius: radius.full,
    backgroundColor: colors.light.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  statusText: {
    color: colors.light.accentStrong,
    fontSize: 13,
    fontWeight: "700"
  },
  tierValue: {
    color: colors.light.primary,
    fontSize: 30,
    fontWeight: "700"
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.light.surfaceRaised,
    borderColor: colors.light.borderSoft,
    borderWidth: 1
  },
  cardTitle: {
    color: colors.light.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  cardMeta: {
    color: colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  documentList: {
    gap: spacing.sm
  },
  documentRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: radius.sm,
    borderColor: colors.light.borderSoft,
    borderWidth: 1,
    padding: spacing.md
  },
  documentRowComplete: {
    borderColor: colors.light.accent,
    backgroundColor: colors.light.accentSoft
  },
  documentTitle: {
    color: colors.light.textPrimary,
    fontSize: 15,
    fontWeight: "700"
  },
  documentMeta: {
    color: colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 18
  },
  documentState: {
    color: colors.light.warning,
    fontSize: 13,
    fontWeight: "700"
  },
  documentStateReady: {
    color: colors.light.accentStrong
  },
  readyCopy: {
    color: colors.light.success,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  submitButton: {
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.light.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  submitButtonReady: {
    backgroundColor: colors.light.accent
  },
  submitText: {
    color: colors.light.textSecondary,
    fontSize: 15,
    fontWeight: "700"
  },
  submitTextReady: {
    color: colors.light.surfaceRaised
  }
});
