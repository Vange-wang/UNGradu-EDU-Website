import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    webpackBuildWorker: false
  },
  output: "standalone"
};

export default nextConfig;
