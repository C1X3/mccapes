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
      {
        protocol: "https",
        hostname: "flagsapi.com",
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'dash.mccapes.net',
          },
        ],
        destination: 'https://mccapes.net/admin/:path*',
      },
    ];
  },
};

export default nextConfig;
