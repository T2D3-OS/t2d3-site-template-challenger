import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin the project root to THIS directory. When the template sits inside the
// t2d3-playbook-app monorepo (its canonical home), Next's lockfile-based root
// inference would otherwise walk up and compile the monorepo's middleware
// into the site build.
const root = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root },
  outputFileTracingRoot: root,
  // Brand/pack assets live on external hosts (Supabase public buckets etc.) —
  // plain <img> with unoptimized images keeps the template host-agnostic.
  images: { unoptimized: true },
};

export default nextConfig;
