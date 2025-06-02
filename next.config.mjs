/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm'],
  webpack: (config) => {
    config.cache = false;
    return config;
  }
};

export default nextConfig;