import type { HTMLAttributes } from "react";

type Variant = "default" | "feature" | "muted";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  hoverable?: boolean;
};

export function Card({ variant = "default", hoverable = false, className, children, ...rest }: CardProps) {
  const classes = [
    "batho-card",
    variant !== "default" ? `batho-card--${variant}` : undefined,
    hoverable ? "batho-card--hoverable" : undefined,
    className
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div {...rest} className={classes}>
      {children}
    </div>
  );
}
