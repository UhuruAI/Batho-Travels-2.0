import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  block?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  pill = false,
  block = false,
  className,
  leadingIcon,
  trailingIcon,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    "batho-button",
    variant !== "primary" ? `batho-button--${variant}` : undefined,
    size !== "md" ? `batho-button--${size}` : undefined,
    pill ? "batho-button--pill" : undefined,
    block ? "batho-button--block" : undefined,
    className
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button {...rest} className={classes}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
