export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/browse/", "/profile/", "/tomilo-shop/"],
      },
    ],
    sitemap: `${
      process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru"
    }/sitemap.xml`,
  };
}
