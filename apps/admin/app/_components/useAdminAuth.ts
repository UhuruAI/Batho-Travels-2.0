"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";

const TOKEN_KEY = "batho-admin-token";

export function readAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

type AuthStatus = "loading" | "authed" | "unauthed";

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setToken(readAdminToken());
    setHydrated(true);
  }, []);

  const session = useQuery(
    api.adminAuth.getSession,
    hydrated && token ? { token } : "skip"
  );
  const signOutMutation = useMutation(api.adminAuth.signOut);

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await signOutMutation({ token });
      } catch {
        // ignore network failure; clear local state anyway
      }
    }
    writeAdminToken(null);
    setToken(null);
  }, [signOutMutation, token]);

  let status: AuthStatus;
  if (!hydrated) status = "loading";
  else if (!token) status = "unauthed";
  else if (session === undefined) status = "loading";
  else if (session === null) status = "unauthed";
  else status = "authed";

  return {
    status,
    email: session && status === "authed" ? session.email : null,
    signOut
  };
}
