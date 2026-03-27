import { Metadata } from "next";
import { HomePage } from "@/widgets";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";
import AdBlock from "@/shared/ad-block/AdBlock";

const siteBaseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = siteBaseUrl;
  const title = "Tomilo-lib.ru — Манга, манхва и маньхуа читать онлайн бесплатно";
  const description =
    "Читайте мангу, манхву и маньхуа онлайн бесплатно. Тысячи тайтлов, удобный ридер, закладки и история чтения. Регулярные обновления, каталог по жанрам и коллекции.";
  const ogImageUrl = getDefaultOgImageUrl(baseUrl);

  return buildServerSEOMetadata({
    title,
    description,
    keywords:
      "манга читать онлайн, манхва, маньхуа, комиксы онлайн, читать мангу бесплатно, тайтлы, главы манги, каталог манги, обновления манги, Tomilo-lib",
    canonicalUrl: baseUrl,
    ogImageUrl,
    ogImageAlt: "Tomilo-lib — манга, манхва, маньхуа онлайн",
    type: "website",
  });
}

const homeBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ "@type": "ListItem", position: 1, name: "Tomilo-lib.ru", item: siteBaseUrl }],
};

export default function Home() {
  return (
    <>
      <HomePage />
      <AdBlock />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeBreadcrumbJsonLd) }}
      />
    </>
  );
}
