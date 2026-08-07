import { notFound } from "next/navigation";
import { PageView, pageMetadata } from "@/components/page-view";
import { allPages, pageBySlug } from "@/lib/content";

export function generateStaticParams() {
  return allPages()
    .filter((p) => p.slug !== "/" && p.slug !== "/blog")
    .map((p) => ({ slug: p.slug.replace(/^\//, "").split("/") }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return pageMetadata(pageBySlug(`/${slug.join("/")}`));
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  if (!pageBySlug(path)) notFound();
  return <PageView slug={path} />;
}
