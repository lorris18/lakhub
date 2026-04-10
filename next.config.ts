import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    middlewareClientMaxBodySize: "30mb",
    serverActions: {
      bodySizeLimit: "30mb"
    }
  }
};

export default nextConfig;
