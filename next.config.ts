import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow common mock/demo hosts
    domains: ["127.0.0.1", "localhost", "tomilo-lib.ru"],
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
        hostname: "mirai.senkuro.net",
        pathname: "/**",
      },
    ],
  },
};
export default nextConfig;
