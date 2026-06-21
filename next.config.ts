import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/recipes.db"],
    "/**/*": ["./data/recipes.db"],
  },
};

export default nextConfig;
