import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Уменьшаем кеш роутера, чтобы при переходе по Link контент обновлялся
  // (избегаем ситуации, когда URL меняется, а страница показывает старые данные)
  experimental: {
    staleTimes: {
      static: 0, // префетчнутые/статические страницы не кешировать на клиенте
      dynamic: 0, // динамические — по умолчанию 0 в Next 15, задаём явно
    },
  },
  async redirects() {
    return [
      {
        source: "/collection/:id",
        destination: "/collections/:id",
        permanent: true,
      },
      // Настройки перенесены в профиль
      {
        source: "/settings",
        destination: "/profile/settings",
        permanent: false,
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
      {
        protocol: "https",
        hostname: "s3.regru.cloud",
        pathname: "/tomilolib/**",
      },
    ],
  },
};
export default nextConfig;
