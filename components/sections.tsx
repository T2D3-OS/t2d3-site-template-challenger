// ── The section registry — (kind, variant) → React component ───────────────
// Mirrors the Website Builder's render-html.ts contract one-for-one: same
// kinds, same variants, same tolerant field reading, same degrade-to-prose
// rule (a section whose fields can't be read renders heading + body, never
// nothing). The monorepo's starter-parity test pins section-manifest.json
// against SECTION_VARIANTS so the two can't drift silently.

import type { PageSection, SitePage } from "@/lib/content";
import { imageUrlFor } from "@/lib/content";

type Fields = Record<string, unknown> | undefined;
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
function pick(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = str(o[k]);
    if (v) return v;
  }
  return "";
}
function pickArray(f: Fields, ...keys: string[]): unknown[] {
  if (!f) return [];
  for (const k of keys) {
    const v = f[k];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  return [];
}
function asRecord(v: unknown): Record<string, unknown> {
  if (typeof v === "string") return { title: v };
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

const readBullets = (f: Fields) =>
  pickArray(f, "bullets", "items", "features", "props", "cards")
    .map(asRecord)
    .map((o) => ({ title: pick(o, "title", "heading", "name", "label"), body: pick(o, "body", "description", "text", "detail", "copy") }))
    .filter((b) => b.title || b.body);
const readFaq = (f: Fields) =>
  pickArray(f, "items", "faqs", "questions", "qa", "pairs")
    .map(asRecord)
    .map((o) => ({ q: pick(o, "q", "question", "title", "heading"), a: pick(o, "a", "answer", "body", "text", "response") }))
    .filter((i) => i.q && i.a);
const readQuotes = (f: Fields) => {
  const one = (o: Record<string, unknown>) => ({
    quote: pick(o, "quote", "body", "text", "testimonial"),
    author: pick(o, "author", "name", "person"),
    role: pick(o, "role", "title", "position"),
    company: pick(o, "company", "organization", "org"),
  });
  const items = pickArray(f, "items", "quotes", "testimonials").map(asRecord).map(one).filter((q) => q.quote);
  if (items.length > 0) return items;
  const inline = f ? one(f as Record<string, unknown>) : null;
  return inline?.quote ? [inline] : [];
};
const readTiers = (f: Fields) =>
  pickArray(f, "tiers", "plans", "items", "packages")
    .map(asRecord)
    .map((o) => ({
      name: pick(o, "name", "title", "plan", "tier"),
      price: pick(o, "price", "amount", "cost"),
      period: pick(o, "period", "interval", "per", "billing"),
      description: pick(o, "description", "body", "summary", "text"),
      features: (Array.isArray(o.features) ? o.features : Array.isArray(o.includes) ? (o.includes as unknown[]) : [])
        .map((x) => (typeof x === "string" ? x : pick(asRecord(x), "title", "label", "name")))
        .filter(Boolean) as string[],
      cta: pick(o, "cta", "cta_label", "button", "action") || "Get started",
      href: pick(o, "href", "url", "link") || "#",
      highlighted: o.highlighted === true || o.featured === true || o.popular === true || o.recommended === true,
    }))
    .filter((t) => t.name || t.price);
const readLogos = (f: Fields) =>
  pickArray(f, "logos", "items", "companies", "customers")
    .map(asRecord)
    .map((o) => ({ name: pick(o, "name", "title", "alt", "company"), url: pick(o, "url", "src", "image", "logo") }))
    .filter((l) => l.name || l.url);
const readStats = (f: Fields) =>
  pickArray(f, "stats", "metrics", "items", "numbers")
    .map(asRecord)
    .map((o) => ({ value: pick(o, "value", "number", "stat", "metric"), label: pick(o, "label", "title", "name", "description") }))
    .filter((s) => s.value);
const readCtas = (f: Fields) => {
  if (!f) return { primary: null, secondary: null } as const;
  const fromObj = (v: unknown) => {
    const o = asRecord(v);
    const label = pick(o, "label", "title", "text", "cta");
    return label ? { label, href: pick(o, "href", "url", "link") || "#" } : null;
  };
  const flatLabel = pick(f, "label", "cta_label", "button", "cta");
  const primary = fromObj(f.primary) ?? fromObj(f.cta) ?? (flatLabel ? { label: flatLabel, href: pick(f, "href", "url", "link") || "#" } : null);
  return { primary, secondary: fromObj(f.secondary) ?? fromObj(f.secondary_cta) } as const;
};
const readComparison = (f: Fields) => ({
  competitor: f ? pick(f, "competitor", "alternative", "incumbent", "vs") : "",
  rows: pickArray(f, "rows", "comparisons", "capabilities")
    .map(asRecord)
    .map((o) => ({ capability: pick(o, "capability", "feature", "title", "name", "label"), us: pick(o, "us", "ours", "this", "yes"), them: pick(o, "them", "theirs", "other", "incumbent") }))
    .filter((r) => r.capability),
  points: pickArray(f, "points", "reasons", "bullets", "items")
    .map(asRecord)
    .map((o) => ({ title: pick(o, "title", "heading", "name", "label"), body: pick(o, "body", "description", "text", "detail") }))
    .filter((b) => b.title || b.body),
});
const readRoleCards = (f: Fields) =>
  pickArray(f, "cards", "roles", "items", "segments")
    .map(asRecord)
    .map((o) => ({ role: pick(o, "role", "title", "name", "label", "segment"), blurb: pick(o, "blurb", "body", "description", "text"), href: pick(o, "href", "url", "link") }))
    .filter((c) => c.role);
const readCode = (f: Fields) => ({
  tabs: pickArray(f, "tabs", "snippets", "examples", "blocks")
    .map(asRecord)
    .map((o) => ({ lang: pick(o, "lang", "language", "label", "title"), code: pick(o, "code", "snippet", "content", "body") }))
    .filter((t) => t.code),
  command: f ? pick(f, "command", "cmd", "one_liner", "install") : "",
});
const readBadges = (f: Fields) =>
  pickArray(f, "badges", "items", "certifications", "controls")
    .map(asRecord)
    .map((o) => ({ name: pick(o, "name", "title", "badge", "label"), detail: pick(o, "detail", "body", "description", "text") }))
    .filter((b) => b.name);
const readAudioClip = (f: Fields) => {
  if (!f) return null;
  const audioUrl = pick(f, "audio_url", "audioUrl", "mp3_url");
  const videoUrl = pick(f, "video_url", "videoUrl", "mp4_url");
  const quote = pick(f, "quote", "quote_text", "text", "body");
  if (!audioUrl && !videoUrl && !quote) return null;
  return {
    quote,
    speaker: pick(f, "speaker", "author", "name"),
    audioUrl,
    videoUrl,
    pillars: Array.isArray(f.pillars)
      ? (f.pillars as unknown[]).map((p) => (typeof p === "string" ? p : pick(asRecord(p), "name", "label"))).filter(Boolean)
      : [],
  };
};

// ── shared bits ─────────────────────────────────────────────────────────────

interface Ctx {
  page: SitePage;
  index: number;
  isFirst: boolean;
}

function Header({ s, isFirst }: { s: PageSection; isFirst: boolean }) {
  const H = isFirst ? "h1" : "h2";
  return (
    <>
      {s.heading ? <H className="t2d3-sec__heading">{s.heading}</H> : null}
      {s.subheading ? <p className="t2d3-sec__sub">{s.subheading}</p> : null}
    </>
  );
}

function Prose({ s, isFirst }: { s: PageSection; isFirst: boolean }) {
  return (
    <>
      <Header s={s} isFirst={isFirst} />
      {s.body
        ? s.body.split(/\n{2,}/).map((p, i) => (
            <p className="t2d3-prose" key={i}>
              {p}
            </p>
          ))
        : null}
    </>
  );
}

function Buttons({ s }: { s: PageSection }) {
  const { primary, secondary } = readCtas(s.fields);
  if (!primary && !secondary) return null;
  return (
    <div className="t2d3-btns">
      {primary ? (
        <a className="t2d3-btn t2d3-btn--primary" href={primary.href}>
          {primary.label}
        </a>
      ) : null}
      {secondary ? (
        <a className="t2d3-btn t2d3-btn--secondary" href={secondary.href}>
          {secondary.label}
        </a>
      ) : null}
    </div>
  );
}

const Wrap = ({ kind, variant, children }: { kind: string; variant: string; children: React.ReactNode }) => (
  <section className={`t2d3-sec t2d3-${kind} t2d3-${kind}--${variant}`} data-section={kind} data-variant={variant}>
    <div className="t2d3-container">{children}</div>
  </section>
);

// ── per-kind components ─────────────────────────────────────────────────────

function Hero({ s, ctx, variant }: SectionProps) {
  const src = imageUrlFor(ctx.page, s.image_ref);
  const copy = (
    <div className="t2d3-hero__copy">
      <Header s={s} isFirst={ctx.isFirst} />
      {s.body ? <p className="t2d3-prose">{s.body}</p> : null}
      <Buttons s={s} />
    </div>
  );
  const media = src ? (
    <div className={`t2d3-hero__media${variant === "image_below" ? " t2d3-hero__media--wide" : ""}`}>
      <img className="t2d3-hero__img" src={src} alt={s.heading ?? ""} />
    </div>
  ) : null;
  const v = media ? variant : "centered";
  const inner =
    v === "split_image_left" ? (
      <div className="t2d3-split">{media}{copy}</div>
    ) : v === "split_image_right" ? (
      <div className="t2d3-split">{copy}{media}</div>
    ) : (
      <>{copy}{media}</>
    );
  return <Wrap kind="hero" variant={v}>{inner}</Wrap>;
}

function LogoCloud({ s, ctx, variant }: SectionProps) {
  const logos = readLogos(s.fields);
  if (logos.length === 0) return <Wrap kind="logo_cloud" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  return (
    <Wrap kind="logo_cloud" variant={variant}>
      {variant === "with_heading" ? <Header s={s} isFirst={ctx.isFirst} /> : null}
      <ul className="t2d3-logos">
        {logos.map((l, i) => (
          <li className="t2d3-logo" key={i}>
            {l.url ? <img className="t2d3-logo__img" src={l.url} alt={l.name} /> : <span>{l.name}</span>}
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

function Bullets({ s, ctx, variant, kind }: SectionProps & { kind: string }) {
  const bullets = readBullets(s.fields);
  if (bullets.length === 0) return <Wrap kind={kind} variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  if (variant === "checklist") {
    return (
      <Wrap kind={kind} variant={variant}>
        <Header s={s} isFirst={ctx.isFirst} />
        <ul className="t2d3-checklist">
          {bullets.map((b, i) => (
            <li className="t2d3-check" key={i}>
              <span className="t2d3-check__mark" aria-hidden>✓</span>
              <div>
                <h3 className="t2d3-card__title">{b.title}</h3>
                {b.body ? <p>{b.body}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </Wrap>
    );
  }
  if (variant === "list_alternating" || variant === "stacked_alternating") {
    const src = imageUrlFor(ctx.page, s.image_ref);
    return (
      <Wrap kind={kind} variant={variant}>
        <Header s={s} isFirst={ctx.isFirst} />
        {bullets.map((b, i) => {
          const media = src && i === 0 ? <div className="t2d3-alt__media"><img className="t2d3-alt__img" src={src} alt={b.title} /></div> : null;
          return (
            <div className={`t2d3-alt t2d3-alt--${i % 2 === 0 ? "left" : "right"}${media ? "" : " t2d3-alt--solo"}`} key={i}>
              <div className="t2d3-alt__copy">
                <h3 className="t2d3-card__title">{b.title}</h3>
                {b.body ? <p>{b.body}</p> : null}
              </div>
              {media}
            </div>
          );
        })}
      </Wrap>
    );
  }
  return (
    <Wrap kind={kind} variant={variant}>
      <Header s={s} isFirst={ctx.isFirst} />
      <ul className="t2d3-grid">
        {bullets.map((b, i) => (
          <li className="t2d3-card" key={i}>
            <h3 className="t2d3-card__title">{b.title}</h3>
            {b.body ? <p className="t2d3-card__body">{b.body}</p> : null}
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

function Stats({ items, inline }: { items: Array<{ value: string; label: string }>; inline?: boolean }) {
  return (
    <ul className={inline ? "t2d3-mband__inline" : "t2d3-stats"}>
      {items.map((st, i) => (
        <li className="t2d3-stat" key={i}>
          <span className="t2d3-stat__value">{st.value}</span>
          <span className="t2d3-stat__label">{st.label}</span>
        </li>
      ))}
    </ul>
  );
}

function SocialProof({ s, ctx, variant }: SectionProps) {
  if (variant === "quote_band") {
    const q = readQuotes(s.fields)[0];
    if (!q) return <Wrap kind="social_proof" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
    return (
      <Wrap kind="social_proof" variant={variant}>
        <blockquote className="t2d3-band">
          <p>{q.quote}</p>
          <footer>{[q.author, q.role, q.company].filter(Boolean).join(", ")}</footer>
        </blockquote>
      </Wrap>
    );
  }
  const stats = readStats(s.fields);
  if (stats.length === 0) return <Wrap kind="social_proof" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  const logos = variant === "logo_stats" ? readLogos(s.fields) : [];
  return (
    <Wrap kind="social_proof" variant={variant}>
      <Header s={s} isFirst={ctx.isFirst} />
      <Stats items={stats} />
      {logos.length > 0 ? (
        <ul className="t2d3-logos">
          {logos.map((l, i) => (
            <li className="t2d3-logo" key={i}>{l.url ? <img className="t2d3-logo__img" src={l.url} alt={l.name} /> : <span>{l.name}</span>}</li>
          ))}
        </ul>
      ) : null}
    </Wrap>
  );
}

function Testimonial({ s, ctx, variant }: SectionProps) {
  const quotes = readQuotes(s.fields);
  if (quotes.length === 0) return <Wrap kind="testimonial" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  const by = (q: (typeof quotes)[number]) => (
    <footer className="t2d3-quote__by">
      {q.author}
      {q.role || q.company ? <span className="t2d3-quote__role">{[q.role, q.company].filter(Boolean).join(", ")}</span> : null}
    </footer>
  );
  if (variant === "cards_3") {
    return (
      <Wrap kind="testimonial" variant={variant}>
        <Header s={s} isFirst={ctx.isFirst} />
        <ul className="t2d3-grid">
          {quotes.map((q, i) => (
            <li className="t2d3-card" key={i}>
              <blockquote className="t2d3-quote"><p>{q.quote}</p>{by(q)}</blockquote>
            </li>
          ))}
        </ul>
      </Wrap>
    );
  }
  const q = quotes[0];
  const portrait = variant === "quote_with_portrait" ? imageUrlFor(ctx.page, s.image_ref) : null;
  if (portrait) {
    return (
      <Wrap kind="testimonial" variant={variant}>
        <div className="t2d3-split">
          <div className="t2d3-portrait"><img className="t2d3-portrait__img" src={portrait} alt={q.author} /></div>
          <blockquote className="t2d3-quote"><p>{q.quote}</p>{by(q)}</blockquote>
        </div>
      </Wrap>
    );
  }
  return (
    <Wrap kind="testimonial" variant="single_centered">
      <blockquote className="t2d3-quote t2d3-quote--lg"><p>{q.quote}</p>{by(q)}</blockquote>
    </Wrap>
  );
}

function Pricing({ s, ctx, variant }: SectionProps) {
  const tiers = readTiers(s.fields);
  if (tiers.length === 0) return <Wrap kind="pricing" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  if (variant === "comparison_table") {
    const rows: string[] = [];
    for (const t of tiers) for (const f of t.features) if (!rows.includes(f)) rows.push(f);
    return (
      <Wrap kind="pricing" variant={variant}>
        <Header s={s} isFirst={ctx.isFirst} />
        <div className="t2d3-table-wrap">
          <table className="t2d3-table">
            <thead>
              <tr><th scope="col">Plan</th>{tiers.map((t, i) => <th scope="col" key={i}>{t.name}</th>)}</tr>
            </thead>
            <tbody>
              <tr><th scope="row">Price</th>{tiers.map((t, i) => <td key={i}>{t.price}{t.period ? <span className="t2d3-tier__period">/{t.period}</span> : null}</td>)}</tr>
              {rows.map((f) => (
                <tr key={f}><th scope="row">{f}</th>{tiers.map((t, i) => <td key={i}>{t.features.includes(f) ? "✓" : "—"}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Wrap>
    );
  }
  return (
    <Wrap kind="pricing" variant={variant}>
      <Header s={s} isFirst={ctx.isFirst} />
      <ul className="t2d3-tiers">
        {tiers.map((t, i) => (
          <li className={`t2d3-tier${t.highlighted ? " t2d3-tier--featured" : ""}`} key={i}>
            <h3 className="t2d3-tier__name">{t.name}</h3>
            {t.price ? <p className="t2d3-tier__price">{t.price}{t.period ? <span className="t2d3-tier__period">/{t.period}</span> : null}</p> : null}
            {t.description ? <p className="t2d3-tier__desc">{t.description}</p> : null}
            {t.features.length > 0 ? <ul className="t2d3-tier__features">{t.features.map((f) => <li key={f}>{f}</li>)}</ul> : null}
            <a className="t2d3-btn t2d3-btn--primary" href={t.href}>{t.cta}</a>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

function Faq({ s, ctx, variant }: SectionProps) {
  const items = readFaq(s.fields);
  if (items.length === 0) return <Wrap kind="faq" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  if (variant === "accordion") {
    return (
      <Wrap kind="faq" variant={variant}>
        <Header s={s} isFirst={ctx.isFirst} />
        <div className="t2d3-faq">
          {items.map((i, k) => (
            <details className="t2d3-faq__item" key={k}>
              <summary className="t2d3-faq__q">{i.q}</summary>
              <div className="t2d3-faq__a"><p>{i.a}</p></div>
            </details>
          ))}
        </div>
      </Wrap>
    );
  }
  return (
    <Wrap kind="faq" variant={variant}>
      <Header s={s} isFirst={ctx.isFirst} />
      <dl className={`t2d3-faq t2d3-faq--${variant}`}>
        {items.map((i, k) => (
          <div key={k}>
            <dt className="t2d3-faq__q">{i.q}</dt>
            <dd className="t2d3-faq__a">{i.a}</dd>
          </div>
        ))}
      </dl>
    </Wrap>
  );
}

function Cta({ s, ctx, variant }: SectionProps) {
  const btns = <Buttons s={s} />;
  if (variant === "split") {
    return (
      <Wrap kind="cta" variant={variant}>
        <div className="t2d3-split t2d3-cta__split">
          <div><Header s={s} isFirst={ctx.isFirst} />{s.body ? <p className="t2d3-cta__body">{s.body}</p> : null}</div>
          {btns}
        </div>
      </Wrap>
    );
  }
  return (
    <Wrap kind="cta" variant={variant}>
      <Header s={s} isFirst={ctx.isFirst} />
      {s.body ? <p className="t2d3-cta__body">{s.body}</p> : null}
      {btns}
    </Wrap>
  );
}

function RichText({ s, ctx, variant }: SectionProps) {
  return <Wrap kind="rich_text" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
}

function AudioClip({ s, ctx, variant }: SectionProps) {
  const clip = readAudioClip(s.fields);
  if (!clip) return <Wrap kind="audio_clip" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  const useVideo = variant === "audiogram" && clip.videoUrl;
  const src = useVideo ? clip.videoUrl : clip.audioUrl || clip.videoUrl;
  const attribution = [clip.speaker, ...clip.pillars].filter(Boolean).join(" · ");
  return (
    <Wrap kind="audio_clip" variant={variant}>
      {s.heading ? <Header s={s} isFirst={ctx.isFirst} /> : null}
      <figure className="t2d3-clip">
        {variant !== "player_only" && clip.quote ? <blockquote className="t2d3-clip__quote"><p>{clip.quote}</p></blockquote> : null}
        {src ? (useVideo ? <video className="t2d3-clip__video" src={src} controls preload="metadata" playsInline /> : <audio className="t2d3-clip__audio" src={src} controls preload="none" />) : null}
        {attribution ? <figcaption className="t2d3-clip__cite">{attribution}</figcaption> : null}
      </figure>
    </Wrap>
  );
}

function MetricsBand({ s, ctx, variant }: SectionProps) {
  const stats = readStats(s.fields);
  if (stats.length === 0) return <Wrap kind="metrics_band" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  return (
    <Wrap kind="metrics_band" variant={variant}>
      {s.heading ? <Header s={s} isFirst={ctx.isFirst} /> : null}
      <Stats items={stats} inline={variant === "inline_counters"} />
    </Wrap>
  );
}

function Comparison({ s, ctx, variant }: SectionProps) {
  const cmp = readComparison(s.fields);
  if (variant === "vs_table" && cmp.rows.length > 0) {
    return (
      <Wrap kind="comparison" variant={variant}>
        <Header s={s} isFirst={ctx.isFirst} />
        <div className="t2d3-table-wrap">
          <table className="t2d3-table t2d3-vs">
            <thead><tr><th scope="col">Capability</th><th scope="col">Us</th><th scope="col">{cmp.competitor || "Alternatives"}</th></tr></thead>
            <tbody>
              {cmp.rows.map((r, i) => (
                <tr key={i}><th scope="row">{r.capability}</th><td>{r.us || "✓"}</td><td>{r.them || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Wrap>
    );
  }
  if (cmp.points.length > 0) {
    return (
      <Wrap kind="comparison" variant="migration_pitch">
        <Header s={s} isFirst={ctx.isFirst} />
        <ul className="t2d3-grid">
          {cmp.points.map((p, i) => (
            <li className="t2d3-card" key={i}><h3 className="t2d3-card__title">{p.title}</h3>{p.body ? <p className="t2d3-card__body">{p.body}</p> : null}</li>
          ))}
        </ul>
        <Buttons s={s} />
      </Wrap>
    );
  }
  return <Wrap kind="comparison" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
}

function RoleRouter({ s, ctx, variant }: SectionProps) {
  const cards = readRoleCards(s.fields);
  if (cards.length === 0) return <Wrap kind="role_router" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  return (
    <Wrap kind="role_router" variant={variant}>
      <Header s={s} isFirst={ctx.isFirst} />
      <ul className="t2d3-grid">
        {cards.map((c, i) => (
          <li className="t2d3-card t2d3-role" key={i}>
            {c.href ? (
              <a className="t2d3-role__link" href={c.href}>
                <h3 className="t2d3-card__title">{c.role}</h3>
                {c.blurb ? <p className="t2d3-card__body">{c.blurb}</p> : null}
                <span className="t2d3-role__go" aria-hidden>→</span>
              </a>
            ) : (
              <>
                <h3 className="t2d3-card__title">{c.role}</h3>
                {c.blurb ? <p className="t2d3-card__body">{c.blurb}</p> : null}
              </>
            )}
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

function CodeBlock({ s, ctx, variant }: SectionProps) {
  const { tabs, command } = readCode(s.fields);
  if (variant === "terminal_one_liner" && command) {
    return (
      <Wrap kind="code_block" variant={variant}>
        {s.heading ? <Header s={s} isFirst={ctx.isFirst} /> : null}
        <pre className="t2d3-term"><code>{command}</code></pre>
      </Wrap>
    );
  }
  if (tabs.length > 0) {
    return (
      <Wrap kind="code_block" variant="tabs_multi_lang">
        <Header s={s} isFirst={ctx.isFirst} />
        {tabs.map((t, i) => (
          <figure className="t2d3-code" key={i}>
            {t.lang ? <figcaption className="t2d3-code__lang">{t.lang}</figcaption> : null}
            <pre><code>{t.code}</code></pre>
          </figure>
        ))}
      </Wrap>
    );
  }
  if (command) {
    return (
      <Wrap kind="code_block" variant="terminal_one_liner">
        {s.heading ? <Header s={s} isFirst={ctx.isFirst} /> : null}
        <pre className="t2d3-term"><code>{command}</code></pre>
      </Wrap>
    );
  }
  return <Wrap kind="code_block" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
}

function TrustSecurity({ s, ctx, variant }: SectionProps) {
  const badges = readBadges(s.fields);
  if (badges.length === 0) return <Wrap kind="trust_security" variant={variant}><Prose s={s} isFirst={ctx.isFirst} /></Wrap>;
  if (variant === "compliance_grid") {
    return (
      <Wrap kind="trust_security" variant={variant}>
        <Header s={s} isFirst={ctx.isFirst} />
        <ul className="t2d3-grid">
          {badges.map((b, i) => (
            <li className="t2d3-card" key={i}><h3 className="t2d3-card__title">{b.name}</h3>{b.detail ? <p className="t2d3-card__body">{b.detail}</p> : null}</li>
          ))}
        </ul>
      </Wrap>
    );
  }
  return (
    <Wrap kind="trust_security" variant="badge_row">
      {s.heading ? <Header s={s} isFirst={ctx.isFirst} /> : null}
      <ul className="t2d3-badges">
        {badges.map((b, i) => (
          <li className="t2d3-badge" key={i}><span className="t2d3-badge__mark" aria-hidden>✓</span>{b.name}</li>
        ))}
      </ul>
    </Wrap>
  );
}

// ── registry ────────────────────────────────────────────────────────────────

interface SectionProps {
  s: PageSection;
  ctx: Ctx;
  variant: string;
}

const VARIANTS: Record<string, string[]> = {
  hero: ["split_image_right", "split_image_left", "centered", "image_below"],
  logo_cloud: ["row", "grid", "with_heading"],
  feature_grid: ["cards_3", "cards_2", "icon_row_4", "list_alternating"],
  value_props: ["columns_3", "checklist", "stacked_alternating"],
  social_proof: ["stat_row", "quote_band", "logo_stats"],
  testimonial: ["single_centered", "cards_3", "quote_with_portrait"],
  pricing: ["tiers_3", "tiers_2", "comparison_table"],
  faq: ["accordion", "two_column", "list"],
  cta: ["centered", "split", "banner"],
  rich_text: ["prose", "narrow_prose"],
  audio_clip: ["quote_player", "player_only", "audiogram"],
  metrics_band: ["stat_tiles", "inline_counters"],
  comparison: ["vs_table", "migration_pitch"],
  role_router: ["cards_by_role", "cards_by_stage"],
  code_block: ["tabs_multi_lang", "terminal_one_liner"],
  trust_security: ["badge_row", "compliance_grid"],
};

function resolveVariant(s: PageSection): string {
  const legal = VARIANTS[s.kind] ?? VARIANTS.rich_text;
  return s.variant && legal.includes(s.variant) ? s.variant : legal[0];
}

export function Section({ s, page, index }: { s: PageSection; page: SitePage; index: number }) {
  const ctx: Ctx = { page, index, isFirst: index === 0 };
  const variant = resolveVariant(s);
  const props: SectionProps = { s, ctx, variant };
  switch (s.kind) {
    case "hero": return <Hero {...props} />;
    case "logo_cloud": return <LogoCloud {...props} />;
    case "feature_grid": return <Bullets {...props} kind="feature_grid" />;
    case "value_props": return <Bullets {...props} kind="value_props" />;
    case "social_proof": return <SocialProof {...props} />;
    case "testimonial": return <Testimonial {...props} />;
    case "pricing": return <Pricing {...props} />;
    case "faq": return <Faq {...props} />;
    case "cta": return <Cta {...props} />;
    case "audio_clip": return <AudioClip {...props} />;
    case "metrics_band": return <MetricsBand {...props} />;
    case "comparison": return <Comparison {...props} />;
    case "role_router": return <RoleRouter {...props} />;
    case "code_block": return <CodeBlock {...props} />;
    case "trust_security": return <TrustSecurity {...props} />;
    default: return <RichText {...props} />;
  }
}
