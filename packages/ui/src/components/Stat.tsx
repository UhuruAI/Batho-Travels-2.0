import type { ReactNode } from "react";

export function Stat({
  label,
  value,
  delta,
  highlight = false
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className="batho-stat"
      style={highlight ? { borderColor: "var(--color-primary)", boxShadow: "inset 0 0 0 1px var(--color-primary)" } : undefined}
    >
      <p className="batho-stat__label">{label}</p>
      <p className="batho-stat__value">{value}</p>
      {delta ? <p className="batho-stat__delta">{delta}</p> : null}
    </div>
  );
}
