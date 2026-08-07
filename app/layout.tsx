import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE, navPages, siteUrl } from "@/lib/content";
import "@/styles/skin.css";

// Utility pairing: ONE neo-grotesque sans + the skin's mono accents. When the
// client brand carries its own Google fonts, the build agent swaps this
// import for them (the one architecture edit the fill step is allowed).
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: SITE.site.title,
    template: `%s — ${SITE.site.title}`,
  },
  description: SITE.site.description ?? undefined,
  ...(siteUrl() ? { metadataBase: new URL(siteUrl()!) } : {}),
  ...(SITE.brand.faviconUrl ? { icons: { icon: SITE.brand.faviconUrl } } : {}),
};

function brandVars(): React.CSSProperties {
  const c = SITE.brand.colors;
  const vars: Record<string, string> = {};
  if (c.primary) vars["--brand-primary"] = c.primary;
  if (c.secondary) vars["--brand-secondary"] = c.secondary;
  if (c.accent) vars["--brand-accent"] = c.accent;
  if (c.text) vars["--brand-text"] = c.text;
  if (c.neutralLight) vars["--t2d3-muted"] = c.neutralLight;
  return vars as React.CSSProperties;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const logo = SITE.brand.logos.white ?? SITE.brand.logos.color;
  const nav = navPages();
  const disclosure = SITE.ai_artifacts?.visible_ai_label ?? null;
  const siteJsonLd = SITE.ai_artifacts?.json_ld ?? null;
  const primaryCta = nav.find((p) => p.page_kind === "pricing") ?? nav[nav.length - 1] ?? null;
  return (
    <html lang="en" className={sans.variable}>
      <body style={brandVars()}>
        {siteJsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
          />
        ) : null}
        <header className="site-header">
          <div className="site-header__inner">
            <a href="/" aria-label={SITE.site.title}>
              {logo ? (
                <img className="site-header__logo" src={logo} alt={SITE.site.title} />
              ) : (
                <span className="site-header__word">{SITE.site.title}</span>
              )}
            </a>
            <nav className="site-nav" aria-label="Main">
              {nav.map((p) => (
                <a key={p.slug} href={p.slug}>
                  {p.title ?? p.slug.replace(/^\//, "")}
                </a>
              ))}
              {SITE.site.blog_posts.length > 0 ? <a href="/blog">Blog</a> : null}
              {primaryCta ? (
                <a className="t2d3-btn t2d3-btn--primary" href={primaryCta.slug}>
                  Get started
                </a>
              ) : null}
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="site-footer__inner">
            <div>
              <div>© {new Date().getFullYear()} {SITE.site.title}</div>
              {disclosure ? <div className="site-footer__ai">{disclosure}</div> : null}
            </div>
            <nav aria-label="Footer">
              {nav.map((p) => (
                <a key={p.slug} href={p.slug}>
                  {p.title ?? p.slug.replace(/^\//, "")}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
