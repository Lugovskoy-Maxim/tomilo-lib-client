import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

const allow = [
  "/",
  "/titles",
  "/titles/",
  "/collections",
  "/collections/",
  "/top",
  "/top/",
  "/updates",
  "/updates/",
  "/about",
  "/about/",
  "/contact",
  "/contact/",
  "/copyright",
  "/copyright/",
  "/terms-of-use",
  "/terms-of-use/",
  "/privacy-policy",
  "/privacy-policy/",
  "/rss",
  "/rss/",
];

const disallow = [
  "/admin",
  "/admin/",
  "/profile",
  "/profile/",
  "/api",
  "/api/",
  "/settings",
  "/settings/",
  "/notifications",
  "/notifications/",
  "/history",
  "/history/",
  "/bookmarks",
  "/bookmarks/",
  "/auth",
  "/auth/",
  "/tomilo-shop",
  "/tomilo-shop/",
  "/reset-password",
  "/reset-password/",
  "/rate-limit",
  "/rate-limit/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow,
        disallow,
      },
      {
        userAgent: "Googlebot",
        allow,
        disallow,
      },
      {
        userAgent: "Yandex",
        allow,
        disallow,
      },
      {
        userAgent: "Yandexbot",
        allow,
        disallow,
      },
      {
        userAgent: "Bingbot",
        allow,
        disallow,
      },
    ],
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
