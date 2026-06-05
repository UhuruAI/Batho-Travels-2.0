import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = "https://bathotravels.co.za";
const title = "Batho Travels | Travel the World. Pay Over Time. Zero Debt.";
const description =
  "Batho Travels helps South Africans plan custom trips with AI and save monthly in ZAR with 0% interest, no credit checks, no loans, and no debt.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Batho Travels",
  authors: [{ name: "Batho Travels" }],
  category: "Travel",
  creator: "Batho Travels",
  publisher: "Batho Travels",
  keywords: [
    "Batho Travels",
    "AI trip planner South Africa",
    "travel savings South Africa",
    "zero debt travel",
    "0% interest travel savings",
    "group travel savings",
    "custom travel planning",
    "ZAR travel plans"
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Batho Travels",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Table%20Mountain%20from%20Blouberg%20beach.jpg?width=1200",
        width: 1200,
        height: 900,
        alt: "Cape Town and Table Mountain from Blouberg beach"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-ZA": "/"
    }
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}
