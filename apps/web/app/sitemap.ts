import type { MetadataRoute } from "next";

const lastModified = new Date("2026-06-05T00:00:00+02:00");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://bathotravels.co.za",
      lastModified,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: "https://bathotravels.co.za/llms.txt",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7
    },
    {
      url: "https://bathotravels.co.za/app-store-copy.md",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: "https://bathotravels.co.za/geo-facts.json",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];
}
