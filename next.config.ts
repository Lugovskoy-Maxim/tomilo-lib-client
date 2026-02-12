import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /collection/:id → /collections/:id (исправление опечатки/старого URL)
      {
        source: "/collection/:id",
        destination: "/collections/:id",
        permanent: true,
      },
    ];
  },
  images: {
    // Allow common mock/demo hosts
    domains: [],
    qualities: [85],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "tomilo-lib.ru",
        pathname: "/**",
      },
    ],
  },
};
export default nextConfig;
