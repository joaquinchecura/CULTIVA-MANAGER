// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.cultivafitness.app https://*.clerk.accounts.dev https://challenges.cloudflare.com blob:",
              "worker-src 'self' blob:",
              "connect-src 'self' https://*.cultivafitness.app https://*.clerk.accounts.dev https://api.clerk.com https://clerk-telemetry.com",
              "img-src 'self' data: https://img.clerk.com https://images.clerk.dev",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "frame-src 'self' https://challenges.cloudflare.com https://*.cultivafitness.app",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;