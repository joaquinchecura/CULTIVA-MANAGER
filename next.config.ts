// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.cultivafitness.app https://*.clerk.accounts.dev https://challenges.cloudflare.com; connect-src 'self' https://clerk.cultivafitness.app https://*.clerk.accounts.dev https://api.clerk.com https://clerk-telemetry.com; img-src 'self' data: https://img.clerk.com https://images.clerk.dev; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://challenges.cloudflare.com https://clerk.cultivafitness.app;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;