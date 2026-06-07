import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflow: "auto", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-soft)", background: "var(--color-surface-raised)" }}>
      <table className="batho-table">{children}</table>
    </div>
  );
}
