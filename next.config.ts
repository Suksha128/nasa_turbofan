import type { NextConfig } from "next";
import path from "path";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: isGithubActions ? "/nasa_turbofan" : "",
  assetPrefix: isGithubActions ? "/nasa_turbofan" : undefined,
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
