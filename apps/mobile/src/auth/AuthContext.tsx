import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { api } from "../../../../convex/_generated/api";
import { useNativeTheme } from "@batho/ui/native";
import { AuthScreen } from "../screens/AuthScreen";
import { deleteStoredItem, setStoredItem } from "../lib/secureStorage";

export const SESSION_TOKEN_KEY = "batho-session-token";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextValue = {
  user: AuthUser;
  sessionToken: string;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthGate({
  children,
  sessionToken,
  setSessionToken
}: {
  children: ReactNode;
  sessionToken: string | null;
  setSessionToken: (token: string | null) => void;
}) {
  const { colors: c } = useNativeTheme();
  const signOutMutation = useMutation(api.auth.signOutEmailSession);
  const session = useQuery(
    api.auth.getEmailSession,
    sessionToken ? { sessionToken } : "skip"
  );

  useEffect(() => {
    if (sessionToken && session === null) {
      deleteStoredItem(SESSION_TOKEN_KEY).catch(() => undefined);
      setSessionToken(null);
    }
  }, [session, sessionToken, setSessionToken]);

  async function handleAuthenticated(nextToken: string) {
    await setStoredItem(SESSION_TOKEN_KEY, nextToken);
    setSessionToken(nextToken);
  }

  async function signOut() {
    const token = sessionToken;
    setSessionToken(null);
    await deleteStoredItem(SESSION_TOKEN_KEY).catch(() => undefined);
    if (token) {
      await signOutMutation({ sessionToken: token }).catch(() => undefined);
    }
  }

  if (!sessionToken) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  if (session === undefined || session === null) {
    return (
      <View style={[styles.loading, { backgroundColor: c.canvas }]}>
        <ActivityIndicator color={c.primary} />
        <Text style={[styles.loadingText, { color: c.textSecondary }]}>Securing your account...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        sessionToken,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthGate.");
  }
  return value;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "700"
  }
});
