import { notFound } from "next/navigation";
import { SITE, siteUrl } from "@/lib/content";

export function generateStaticParams() {
  return SITE.site.blog_posts.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = SITE.site.blog_posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    ...(post.meta_description ? { description: post.meta_description } : {}),
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = SITE.site.blog_posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.meta_description ? { description: post.meta_description } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.hero_image_url ? { image: post.hero_image_url } : {}),
    ...(base ? { url: `${base}/blog/${post.slug}` } : {}),
    publisher: { "@type": "Organization", name: SITE.site.title },
  };
  return (
    <article className="article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="blog-card__meta">
        {post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : ""}
        {post.reading_time_minutes ? ` · ${post.reading_time_minutes} min read` : ""}
      </p>
      <h1>{post.title}</h1>
      {post.hero_image_url ? <img className="article__hero" src={post.hero_image_url} alt={post.title} /> : null}
      {/* body_html is final rendered article HTML from the content pipeline —
          rendered verbatim by design (the pipeline owns sanitization). */}
      <div className="article__body" dangerouslySetInnerHTML={{ __html: post.body_html }} />
    </article>
  );
}
