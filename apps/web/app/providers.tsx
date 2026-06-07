"use client";

import { useMemo, type ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "@batho/ui";

function getConvexUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  return url && url.length > 0 ? url : null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = getConvexUrl();
    return url ? new ConvexReactClient(url) : null;
  }, []);

  const themedChildren = <ThemeProvider>{children}</ThemeProvider>;

  if (!client) {
    // No Convex URL configured (e.g. first-run before .env is set).
    // Render normally so the UI still works against local data.
    return themedChildren;
  }

  return <ConvexProvider client={client}>{themedChildren}</ConvexProvider>;
}
