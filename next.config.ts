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
              // AGREGAMOS cdn.protect.clerk.com ACÁ
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.cultivafitness.app https://*.clerk.accounts.dev https://challenges.cloudflare.com https://cdn.protect.clerk.com blob:",
              "worker-src 'self' blob:",
              // TAMBIÉN LO AGREGAMOS ACÁ POR LAS DUDAS
              "connect-src 'self' https://*.cultivafitness.app https://*.clerk.accounts.dev https://api.clerk.com https://clerk-telemetry.com https://cdn.protect.clerk.com",
              // Cloudinary: imágenes y GIFs de ejercicios + fotos de clientes. blob: para previsualizar subidas.
              "img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com https://images.clerk.dev",
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