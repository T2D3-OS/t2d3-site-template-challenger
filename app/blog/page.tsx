import { notFound } from "next/navigation";
import { SITE } from "@/lib/content";

export const metadata = {
  title: "Blog",
  description: `Writing from the ${SITE.site.title} team.`,
};

export default function BlogIndex() {
  const posts = SITE.site.blog_posts;
  if (posts.length === 0) notFound();
  return (
    <div className="t2d3-container" style={{ padding: "56px 24px" }}>
      <h1 className="t2d3-sec__heading">Blog</h1>
      <ul className="blog-list">
        {posts.map((p) => (
          <li className="blog-card" key={p.slug}>
            <a href={`/blog/${p.slug}`}>
              <p className="blog-card__meta">
                {p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : ""}
                {p.reading_time_minutes ? ` · ${p.reading_time_minutes} min read` : ""}
              </p>
              <h2>{p.title}</h2>
              {p.meta_description ? <p>{p.meta_description}</p> : null}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
