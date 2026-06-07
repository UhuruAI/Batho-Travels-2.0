import {
  buildPaymentReminderNotification,
  getTripSupportOptions,
  validateNotificationPreferences,
  type TripSupportAction
} from "@batho/core";
import type { NotificationChannel } from "@batho/config";
import { radius, spacing } from "@batho/design-tokens";
import { useNativeTheme } from "@batho/ui/native";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../auth/AuthContext";

const channelLabels: Record<NotificationChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  push: "Push",
  inApp: "In-app"
};

const allChannels: NotificationChannel[] = ["inApp", "push", "email", "whatsapp"];

export function NotificationsScreen() {
  const { colors: c } = useNativeTheme();
  const styles = useMemo(() => getStyles(c), [c]);
  const { sessionToken } = useAuth();
  const savedPreferences = useQuery(api.notifications.getNotificationPreferences, {
    sessionToken
  });
  const updatePreferences = useMutation(api.notifications.updateNotificationPreferences);
  const [channels, setChannels] = useState<NotificationChannel[]>(["inApp", "push", "email"]);
  const [selectedAction, setSelectedAction] = useState<TripSupportAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const preferences = useMemo(
    () => validateNotificationPreferences({ channels }),
    [channels]
  );
  const reminder = buildPaymentReminderNotification({
    destinationName: "Cape Town",
    amountCents: 208_334,
    dueAt: Date.UTC(2026, 6, 1),
    timing: "inGrace"
  });
  const supportOptions = getTripSupportOptions("inGrace");

  useEffect(() => {
    if (savedPreferences) {
      setChannels(savedPreferences.channels);
    }
  }, [savedPreferences]);

  function toggleChannel(channel: NotificationChannel) {
    setSaveMessage(null);
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel]
    );
  }

  async function savePreferences() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const result = await updatePreferences({ sessionToken, channels });
      setChannels(result.channels);
      setSaveMessage("Reminder preferences saved.");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Unable to save reminder preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Notifications</Text>
          <Text style={styles.title}>Helpful reminders, never pressure.</Text>
          <Text style={styles.copy}>
            Choose where Batho Travels reminds you. If a month changes, you can pause,
            adjust, or cancel without shame copy or late fees.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reminder channels</Text>
          <Text style={preferences.valid ? styles.readyCopy : styles.warningCopy}>
            {preferences.valid
              ? "Your reminder preferences are ready."
              : preferences.message}
          </Text>
          <View style={styles.channelGrid}>
            {allChannels.map((channel) => {
              const selected = channels.includes(channel);

              return (
                <Pressable
                  key={channel}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => toggleChannel(channel)}
                  style={[styles.channelTile, selected ? styles.channelTileSelected : null]}
                >
                  <Text style={[styles.channelText, selected ? styles.channelTextSelected : null]}>
                    {channelLabels[channel]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {saveMessage ? <Text style={styles.cardMeta}>{saveMessage}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={!preferences.valid || saving}
            onPress={savePreferences}
            style={[styles.saveButton, !preferences.valid || saving ? styles.saveButtonDisabled : null]}
          >
            <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save channels"}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{reminder.subject}</Text>
          <Text style={styles.cardMeta}>{reminder.body}</Text>
          <View style={styles.channelRow}>
            {reminder.recommendedChannels.map((channel) => (
              <Text key={channel} style={styles.recommendationPill}>
                {channelLabels[channel]}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support options</Text>
          <Text style={styles.cardMeta}>
            These options keep the plan human when timing changes. They do not add penalties.
          </Text>
          <View style={styles.actionList}>
            {supportOptions.map((option) => {
              const selected = selectedAction === option.action;

              return (
                <Pressable
                  key={option.action}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedAction(option.action)}
                  style={[styles.actionCard, selected ? styles.actionCardSelected : null]}
                >
                  <View style={styles.actionHeader}>
                    <Text style={styles.actionTitle}>{option.title}</Text>
                    <Text style={[styles.actionState, selected ? styles.actionStateSelected : null]}>
                      {selected ? "Selected" : "Available"}
                    </Text>
                  </View>
                  <Text style={styles.cardMeta}>{option.description}</Text>
                </Pressable>
              );
            })}
          </View>
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
    color: c.accent,
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
  readyCopy: {
    color: c.success,
    fontSize: 14,
    fontWeight: "700"
  },
  warningCopy: {
    color: c.warning,
    fontSize: 14,
    fontWeight: "700"
  },
  channelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  channelTile: {
    borderRadius: radius.md,
    borderColor: c.borderStrong,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  channelTileSelected: {
    borderColor: c.accent,
    backgroundColor: c.accent
  },
  channelText: {
    color: c.textSecondary,
    fontSize: 14,
    fontWeight: "700"
  },
  channelTextSelected: {
    color: c.surfaceRaised
  },
  channelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  recommendationPill: {
    overflow: "hidden",
    borderRadius: radius.full,
    backgroundColor: c.accentSoft,
    color: c.accentStrong,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  actionList: {
    gap: spacing.sm
  },
  actionCard: {
    gap: spacing.sm,
    borderRadius: radius.sm,
    borderColor: c.borderSoft,
    borderWidth: 1,
    padding: spacing.md
  },
  actionCardSelected: {
    borderColor: c.primary,
    backgroundColor: c.primarySoft
  },
  actionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  actionTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  actionState: {
    color: c.textMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  actionStateSelected: {
    color: c.primaryStrong
  },
  saveButton: {
    alignSelf: "flex-start",
    borderRadius: radius.md,
    backgroundColor: c.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: c.surfaceRaised,
    fontSize: 14,
    fontWeight: "700"
  }
});
}
