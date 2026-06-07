"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "../theme/ThemeToggle";

type NavLink = { label: string; href: string; current?: boolean };

type NavBarProps = {
  brandLabel: string;
  brandHref?: string;
  brandMark?: string;
  brandImageSrc?: string;
  links?: NavLink[];
  actions?: ReactNode;
  showThemeToggle?: boolean;
};

export function NavBar({
  brandLabel,
  brandHref = "/",
  brandMark = "B",
  brandImageSrc,
  links = [],
  actions,
  showThemeToggle = true
}: NavBarProps) {
  return (
    <nav className="batho-navbar" aria-label="Primary">
      <a className="batho-navbar__brand" href={brandHref}>
        {brandImageSrc ? (
          <img className="batho-navbar__brand-image" src={brandImageSrc} alt="" aria-hidden="true" />
        ) : (
          <span className="batho-navbar__brand-mark" aria-hidden="true">{brandMark}</span>
        )}
        {brandLabel}
      </a>
      {links.length > 0 ? (
        <div className="batho-navbar__nav">
          {links.map((link) => (
            <a key={link.href} href={link.href} aria-current={link.current ? "page" : undefined}>
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
      <div className="batho-navbar__actions">
        {showThemeToggle ? <ThemeToggle /> : null}
        {actions}
      </div>
    </nav>
  );
}
