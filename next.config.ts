import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore typescript errors during build to speed up compilation
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
