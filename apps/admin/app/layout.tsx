import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Batho Travels Admin",
  description: "Role-separated operations, finance, and support workspace for Batho Travels."
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}

