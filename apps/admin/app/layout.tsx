import type { Metadata } from "next";
import { allTokensCss } from "@batho/design-tokens";
import { themeInitScript } from "@batho/ui";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Batho Travels Admin",
  description: "Role-separated operations, finance, and support workspace for Batho Travels."
};

const tokensCss = allTokensCss();

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: tokensCss }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
