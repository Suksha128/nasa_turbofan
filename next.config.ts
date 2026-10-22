import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  // Set basePath and assetPrefix only if deploying to GitHub Pages
  basePath: isGithubActions ? "/nasa_turbofan" : "",
  assetPrefix: isGithubActions ? "/nasa_turbofan" : "",
  images: {
    unoptimized: true, // Required for static export on GitHub Pages
  },
};

export default nextConfig;
