import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio", "/drafts", "/projects", "/yarn", "/looms", "/releases", "/team", "/login"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}