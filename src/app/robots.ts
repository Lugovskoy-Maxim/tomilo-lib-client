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
  "/leaders",
  "/leaders/",
  "/news",
  "/news/",
  "/faq",
  "/faq/",
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
  "/user",
  "/user/",
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
  "/verify-email",
  "/verify-email/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow,
        disallow,
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot",
        allow,
        disallow,
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/"],
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: "Yandex",
        allow,
        disallow,
        crawlDelay: 2,
      },
      {
        userAgent: "YandexBot",
        allow,
        disallow,
        crawlDelay: 2,
      },
      {
        userAgent: "YandexImages",
        allow: ["/"],
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: "Bingbot",
        allow,
        disallow,
        crawlDelay: 1,
      },
      {
        userAgent: "Mail.RU_Bot",
        allow,
        disallow,
        crawlDelay: 2,
      },
      {
        userAgent: "Applebot",
        allow,
        disallow,
      },
      {
        userAgent: "facebookexternalhit",
        allow: ["/"],
      },
      {
        userAgent: "Twitterbot",
        allow: ["/"],
      },
      {
        userAgent: "TelegramBot",
        allow: ["/"],
      },
    ],
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
