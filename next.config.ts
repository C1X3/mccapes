import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "www.minecraft.net",
      },
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "a.c-dn.net",
      },
    ],
  },
  async rewrites() {
    return [
      {
        // match any path on the admin host
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'admin.mccapes.net',
          },
        ],
        // rewrite it to /admin/<whatever>
        destination: '/admin/:path*',
      },
      // (optionally) catch the bare root
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'admin.mccapes.net',
          },
        ],
        destination: '/admin',
      },
    ]
  },
};

export default nextConfig;
