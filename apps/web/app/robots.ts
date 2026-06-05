import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/app-store-copy.md", "/geo-facts.json"]
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/llms.txt", "/app-store-copy.md", "/geo-facts.json"]
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/llms.txt"]
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/llms.txt"]
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/llms.txt"]
      }
    ],
    sitemap: "https://bathotravels.co.za/sitemap.xml"
  };
}
