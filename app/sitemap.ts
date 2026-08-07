import type { MetadataRoute } from "next";
import { allPages, SITE, siteUrl } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl() ?? "";
  const pages = allPages().map((p) => ({
    url: `${base}${p.slug === "/" ? "" : p.slug}`,
  }));
  const posts = SITE.site.blog_posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    ...(p.published_at ? { lastModified: p.published_at } : {}),
  }));
  return [...pages, ...posts];
}
