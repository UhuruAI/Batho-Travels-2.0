import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  children: ReactNode;
};

export function Badge({ tone = "neutral", className, children, ...rest }: BadgeProps) {
  const classes = [
    "batho-badge",
    tone !== "neutral" ? `batho-badge--${tone}` : undefined,
    className
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span {...rest} className={classes}>
      {children}
    </span>
  );
}
