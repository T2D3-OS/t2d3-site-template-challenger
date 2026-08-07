import { notFound } from "next/navigation";
import { PageView, pageMetadata } from "@/components/page-view";
import { pageBySlug } from "@/lib/content";

export const metadata = pageMetadata(pageBySlug("/"));

export default function HomePage() {
  const page = pageBySlug("/");
  if (!page) notFound();
  return <PageView slug="/" />;
}
