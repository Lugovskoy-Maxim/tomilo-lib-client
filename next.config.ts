import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Корень проекта для file tracing (убирает предупреждение о нескольких lockfile)
  outputFileTracingRoot: path.join(__dirname),
  // eslint: {
  //   // Не падать по линту при билде; линт по-прежнему можно запускать через npm run lint
  //   ignoreDuringBuilds: true,
  // },
  // Уменьшаем кеш роутера, чтобы при переходе по Link контент обновлялся
  // (избегаем ситуации, когда URL меняется, а страница показывает старые данные)
  experimental: {
    staleTimes: {
      static: 0, // префетчнутые/статические страницы не кешировать на клиенте
      dynamic: 0, // динамические — по умолчанию 0 в Next 15, задаём явно
    },
    // Не предзагружать записи роутера при старте — меньше конкурирующей работы с первым экраном
    preloadEntriesOnStart: false,
    // Меньше JS на странице: tree-shake barrel-exports (иконки, motion и т.д.)
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts", "react-redux"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
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
    /**
     * В dev с Turbopack иногда падает кэш оптимизатора: LRUCache «calculateSize returned 0»
     * (пустой/нестандартный ответ по URL). Без оптимизации в development ошибки в консоли исчезают;
     * production-сборка по-прежнему оптимизирует картинки.
     */
    unoptimized: isDev,
    // Allow common mock/demo hosts
    domains: [],
    qualities: [78, 85],
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

// Bundle analyzer — подключается только когда ANALYZE=true и модуль установлен
let finalConfig = nextConfig;

if (process.env.ANALYZE === "true") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundleAnalyzer = require("@next/bundle-analyzer");
    finalConfig = bundleAnalyzer({ enabled: true })(nextConfig);
  } catch {
    console.warn(
      "⚠️  @next/bundle-analyzer not installed. Run: npm install -D @next/bundle-analyzer",
    );
  }
}

export default finalConfig;
