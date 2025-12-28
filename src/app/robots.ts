
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/titles/",
          "/collections/", 
          "/top/",
          "/updates/",
          "/copyright/",
          "/terms-of-use/",
          "/about/",
          "/contact/"
        ],
        disallow: [
          "/admin/",
          "/profile/", 
          "/tomilo-shop/",
          "/api/",
          "/settings/",
          "/notifications/",
          "/history/",
          "/bookmarks/",
          "/auth/",
          "/rss/"
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/titles/", "/collections/"],
        disallow: ["/admin/", "/profile/", "/api/"],
      },
      {
        userAgent: "YandexBot",
        allow: ["/titles/", "/collections/"],
        disallow: ["/admin/", "/profile/", "/api/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/titles/", "/collections/"],
        disallow: ["/admin/", "/profile/", "/api/"],
      },
    ],
    sitemap: `${
      process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru"
    }/sitemap.xml`,
    host: process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru",
  };
}
