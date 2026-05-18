import type { NextConfig } from "next";

const r2PublicHost = (() => {
  try {
    return process.env.R2_PUBLIC_URL
      ? new URL(process.env.R2_PUBLIC_URL).host
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: r2PublicHost
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: r2PublicHost,
            pathname: "/**",
          },
        ],
      }
    : undefined,
};

export default nextConfig;
