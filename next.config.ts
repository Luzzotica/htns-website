import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOK_PARTY_FUNNEL_ENTRY_URL } from "./lib/book-party-funnel";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(appDir, "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  async redirects() {
    return [
      {
        source: "/htns-book-party",
        destination: BOOK_PARTY_FUNNEL_ENTRY_URL,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
