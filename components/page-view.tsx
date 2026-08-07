import type { Metadata } from "next";
import { Section } from "@/components/sections";
import { pageBySlug, SITE, siteUrl, type SitePage } from "@/lib/content";

/** Per-page metadata from the authored SEO fields (title + meta_description
 *  ride the page data from the Website Builder spec). */
export function pageMetadata(page: SitePage | null): Metadata {
  if (!page) return {};
  const raw = page as unknown as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title : undefined;
  return {
    ...(title ? { title } : {}),
    ...(page.meta_description ? { description: page.meta_description } : {}),
    ...(siteUrl() ? { alternates: { canonical: page.slug } } : {}),
  };
}

/** Machine layer (P7): JSON-LD per page — the site-level graph from
 *  ai_artifacts plus a WebPage node. Answer engines read this; humans never
 *  see it. */
function jsonLd(page: SitePage): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": page.page_kind === "about" ? "AboutPage" : page.page_kind === "contact" ? "ContactPage" : "WebPage",
    name: (page as unknown as Record<string, unknown>).title ?? page.title ?? SITE.site.title,
    ...(page.meta_description ? { description: page.meta_description } : {}),
    ...(base ? { url: `${base}${page.slug === "/" ? "" : page.slug}` } : {}),
    isPartOf: { "@type": "WebSite", name: SITE.site.title, ...(base ? { url: base } : {}) },
  };
}

export function PageView({ slug }: { slug: string }) {
  const page = pageBySlug(slug);
  if (!page) return null;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(page)) }}
      />
      {page.sections.map((s, i) => (
        <Section key={i} s={s} page={page} index={i} />
      ))}
    </>
  );
}
