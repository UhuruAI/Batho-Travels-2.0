import type { HTMLAttributes, ReactNode } from "react";

type SectionProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  tight?: boolean;
};

export function Section({ eyebrow, title, description, tight = false, className, children, ...rest }: SectionProps) {
  const classes = ["batho-section", tight ? "batho-section--tight" : undefined, className].filter(Boolean).join(" ");
  return (
    <section {...rest} className={classes}>
      {eyebrow || title || description ? (
        <header className="batho-section__header" style={{ maxWidth: 760, marginBottom: 40 }}>
          {eyebrow ? <p className="batho-eyebrow">{eyebrow}</p> : null}
          {title ? (
            <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontSize: 40, lineHeight: 1.1, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
              {title}
            </h2>
          ) : null}
          {description ? (
            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 18, lineHeight: 1.6 }}>{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
