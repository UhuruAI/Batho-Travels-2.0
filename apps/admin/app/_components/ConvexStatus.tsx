"use client";

import { useQuery } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "../../../../convex/_generated/api";

export function ConvexStatus() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <Chip color="warn">Convex not configured</Chip>;
  }
  return <ConvexStatusLive />;
}

function ConvexStatusLive() {
  const result = useQuery(api.status.ping);
  if (result === undefined) {
    return <Chip color="muted">Connecting to Convex…</Chip>;
  }
  return (
    <Chip color="ok">
      Convex live · {new Date(result.serverTime).toLocaleTimeString()}
    </Chip>
  );
}

function Chip({ color, children }: { color: "ok" | "warn" | "muted"; children: ReactNode }) {
  const style: Record<"ok" | "warn" | "muted", { bg: string; fg: string }> = {
    ok: { bg: "rgba(42, 122, 79, 0.12)", fg: "var(--color-success)" },
    warn: { bg: "rgba(184, 110, 26, 0.14)", fg: "var(--color-warning)" },
    muted: { bg: "var(--color-canvas)", fg: "var(--color-text-secondary)" }
  };
  const c = style[color];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 600
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.fg }} aria-hidden="true" />
      {children}
    </span>
  );
}
