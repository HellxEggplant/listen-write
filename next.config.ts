import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "listen-write";
const basePath = isGitHubPages && !repositoryName.endsWith(".github.io") ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  ...(isGitHubPages ? { output: "export" as const, trailingSlash: true, assetPrefix: basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_GITHUB_PAGES: String(isGitHubPages),
  },
};

export default nextConfig;
