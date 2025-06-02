import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm'],
  webpack: (config) => {
    config.cache = false;
    return config;
  }
};

export default nextConfig;