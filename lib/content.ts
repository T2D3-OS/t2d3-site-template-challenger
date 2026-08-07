// ── Content contract ────────────────────────────────────────────────────────
// content/site.json is the fill seam: the build agent replaces it with the
// real build spec from GET /api/website-builder/build-spec/:requestId (brand,
// theme, pages, blog posts). Everything else in this repo is ARCHITECTURE and
// stays as-is — the agent fills content, it does not scaffold.
//
// The shapes below mirror the Website Builder's own types
// (src/components/modules/types/website-builder/website-builder-types.ts in
// t2d3-playbook-app) — the (kind, variant) contract is shared, and the
// monorepo's starter-parity test asserts this template's section-manifest
// covers every registry pair.

import site from "@/content/site.json";

export interface PageSection {
  kind: string;
  variant?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  fields?: Record<string, unknown>;
  image_ref?: string | null;
}

export interface ImageBrief {
  id: string;
  public_url?: string | null;
}

export interface SitePage {
  title?: string | null;
  sort_order?: number | null;
  slug: string;
  page_kind: string;
  intent?: string;
  title_tag?: string;
  /** SEO <title> (the spec calls it `title` on the page data). */
  seo_title?: string;
  meta_description?: string;
  sections: PageSection[];
  image_briefs?: ImageBrief[];
}

export interface BlogPost {
  slug: string;
  title: string;
  meta_description?: string | null;
  published_at?: string | null;
  reading_time_minutes?: number | null;
  content_type?: string | null;
  hero_image_url?: string | null;
  body_html: string;
}

export interface Brand {
  colors: {
    primary: string | null;
    secondary: string | null;
    accent: string | null;
    text: string | null;
    neutralDark: string | null;
    neutralLight: string | null;
  };
  fonts: { heading: string | null; body: string | null };
  logos: { color: string | null; white: string | null; black: string | null; icon: string | null };
  faviconUrl: string | null;
  pack: {
    heroByPage: Record<string, string>;
    ogByPage: Record<string, string>;
    ogDefault: string | null;
    backgrounds: string[];
    featureIcons: string[];
    illustrations: string[];
  };
}

export interface SiteSpec {
  brand: Brand;
  theme?: { mode: "light" | "dark"; density: string; motion: string };
  template?: { key: string; version: number } | null;
  ai_artifacts?: {
    llms_txt?: string | null;
    llms_full_txt?: string | null;
    json_ld?: Record<string, unknown> | null;
    site_url?: string | null;
    ai_provenance_json?: Record<string, unknown> | null;
    visible_ai_label?: string | null;
  } | null;
  site: {
    title: string;
    description?: string | null;
    config?: Record<string, unknown>;
    pages: SitePage[];
    blog_posts: BlogPost[];
  };
}

export const SITE: SiteSpec = site as unknown as SiteSpec;

const norm = (slug: string) => {
  const bare = (slug ?? "/").trim().replace(/\/+$/, "");
  return bare === "" ? "/" : bare;
};

export function allPages(): SitePage[] {
  return [...(SITE.site.pages ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export function pageBySlug(slug: string): SitePage | null {
  const want = norm(slug);
  return allPages().find((p) => norm(p.slug) === want) ?? null;
}

/** Nav = every page except home, in sort order. */
export function navPages(): SitePage[] {
  return allPages().filter((p) => norm(p.slug) !== "/");
}

export function imageUrlFor(page: SitePage, ref: string | null | undefined): string | null {
  if (!ref) return null;
  return page.image_briefs?.find((b) => b.id === ref)?.public_url ?? null;
}

export function siteUrl(): string | null {
  const fromArtifacts = SITE.ai_artifacts?.site_url;
  if (fromArtifacts) return fromArtifacts.replace(/\/$/, "");
  const domain = SITE.site.config?.domain;
  return typeof domain === "string" && domain ? `https://${domain.replace(/^https?:\/\//, "")}` : null;
}
