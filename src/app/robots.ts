export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_URL || 'https://tomilo-lib.ru'}/sitemap.xml`,
  }
}