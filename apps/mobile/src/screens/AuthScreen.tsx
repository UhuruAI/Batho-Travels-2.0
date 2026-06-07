import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { api } from "../../../../convex/_generated/api";
import { radius, spacing, useNativeTheme } from "@batho/ui/native";

type Mode = "signIn" | "signUp";
const bathoLogo = require("../../assets/batho-logo.png");

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string) => Promise<void> }) {
  const { colors: c } = useNativeTheme();
  const styles = useMemo(() => getStyles(c), [c]);
  const signIn = useMutation(api.auth.signInWithEmail);
  const signUp = useMutation(api.auth.signUpWithEmail);
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === "signUp";

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (isSignUp && name.trim().length < 2) {
      setError("Enter your name to create your account.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp({
          email: normalizedEmail,
          password,
          name: name.trim(),
          deviceLabel: Platform.OS
        });
        setMode("signIn");
        setEmail(normalizedEmail);
        setPassword("");
        setSuccess("Account created. Sign in to continue.");
        return;
      }

      const result = await signIn({
        email: normalizedEmail,
        password,
        deviceLabel: Platform.OS
      });
      await onAuthenticated(result.token);
    } catch (err) {
      if (isSignUp) {
        setError(err instanceof Error ? err.message : "Unable to create your account. Try again.");
      } else {
        setError("We couldn't sign you in. Check your email and password and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <Image accessibilityIgnoresInvertColors source={bathoLogo} style={styles.logo} />
            <Text style={styles.eyebrow}>Batho Travels</Text>
            <Text style={styles.title}>{isSignUp ? "Create your travel account" : "Welcome back"}</Text>
            <Text style={styles.copy}>
              {isSignUp
                ? "Save your plans, contributions, verification, and group trips under your own secure profile."
                : "Sign in to continue planning calmly, saving monthly, and tracking only your trips."}
            </Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.segmented}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: !isSignUp }}
                onPress={() => {
                  setMode("signIn");
                  setError(null);
                  setSuccess(null);
                }}
                style={[styles.segment, !isSignUp && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, !isSignUp && styles.segmentTextActive]}>Sign in</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSignUp }}
                onPress={() => {
                  setMode("signUp");
                  setError(null);
                  setSuccess(null);
                }}
                style={[styles.segment, isSignUp && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, isSignUp && styles.segmentTextActive]}>Sign up</Text>
              </Pressable>
            </View>

            {isSignUp ? (
              <Field
                label="Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                placeholder="Your name"
              />
            ) : null}

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete={isSignUp ? "new-password" : "password"}
              placeholder="At least 8 characters"
              secureTextEntry
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !submitting ? styles.primaryButtonPressed : null,
                submitting ? styles.primaryButtonDisabled : null
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={c.surfaceRaised} />
              ) : (
                <Text style={styles.primaryButtonText}>{isSignUp ? "Create account" : "Sign in"}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "email" | "name" | "password" | "new-password";
  keyboardType?: "default" | "email-address";
  secureTextEntry?: boolean;
}) {
  const { colors: c } = useNativeTheme();
  const styles = useMemo(() => getStyles(c), [c]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={c.textMuted}
        selectionColor={c.primary}
        style={styles.input}
      />
    </View>
  );
}

function getStyles(c: import("@batho/ui/native").Palette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.canvas
    },
    keyboard: {
      flex: 1
    },
    container: {
      flexGrow: 1,
      justifyContent: "center",
      gap: spacing.xl,
      padding: spacing.lg
    },
    brandBlock: {
      alignItems: "center",
      gap: spacing.md
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: radius.md
    },
    eyebrow: {
      color: c.primary,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0,
      textAlign: "center",
      textTransform: "uppercase"
    },
    title: {
      color: c.textPrimary,
      fontSize: 36,
      fontWeight: "700",
      lineHeight: 42,
      textAlign: "center"
    },
    copy: {
      color: c.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center"
    },
    panel: {
      gap: spacing.md,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceRaised,
      padding: spacing.lg
    },
    segmented: {
      flexDirection: "row",
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: radius.md,
      backgroundColor: c.canvas,
      padding: spacing.xs
    },
    segment: {
      flex: 1,
      alignItems: "center",
      borderRadius: radius.sm,
      paddingVertical: spacing.sm
    },
    segmentActive: {
      backgroundColor: c.surfaceRaised,
      borderWidth: 1,
      borderColor: c.borderSoft
    },
    segmentText: {
      color: c.textSecondary,
      fontSize: 14,
      fontWeight: "700"
    },
    segmentTextActive: {
      color: c.textPrimary
    },
    field: {
      gap: spacing.sm
    },
    label: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: "700"
    },
    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: radius.md,
      backgroundColor: c.canvas,
      color: c.textPrimary,
      fontSize: 16,
      paddingHorizontal: spacing.md
    },
    errorBox: {
      borderRadius: radius.sm,
      backgroundColor: c.goldSoft,
      padding: spacing.md
    },
    errorText: {
      color: c.warning,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20
    },
    successBox: {
      borderRadius: radius.sm,
      backgroundColor: c.primarySoft,
      padding: spacing.md
    },
    successText: {
      color: c.primaryStrong,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20
    },
    primaryButton: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      borderRadius: radius.md,
      backgroundColor: c.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md
    },
    primaryButtonPressed: {
      backgroundColor: c.primaryStrong
    },
    primaryButtonDisabled: {
      opacity: 0.72
    },
    primaryButtonText: {
      color: c.surfaceRaised,
      fontSize: 16,
      fontWeight: "700"
    }
  });
}
