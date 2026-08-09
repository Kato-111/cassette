import { config as loadEnv } from "dotenv";
import { join } from "node:path";
import type { NextConfig } from "next";

loadEnv({ path: join(process.cwd(), "..", "..", ".env") });

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
  async redirects() {
    return [
      {
        source: "/settings",
        destination: "/settings/session",
        permanent: false,
      },
    ];
  },
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    staleTimes: {
      dynamic: 60,
      static: 300,
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
