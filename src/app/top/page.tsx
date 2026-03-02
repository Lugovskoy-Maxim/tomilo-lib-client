import type { Metadata } from "next";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";
import TopPageClient from "./TopPageClient";

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export async function generateMetadata(): Promise<Metadata> {
  return buildServerSEOMetadata({
    title: "Топ тайтлов — рейтинг лучшей манги, манхвы и маньхуа | Tomilo-lib.ru",
    description:
      "Рейтинг самых популярных тайтлов за день, неделю и месяц. Лучшая манга, манхва и маньхуа по просмотрам и оценкам читателей.",
    keywords:
      "топ манги, рейтинг манги, популярная манхва, лучшая маньхуа, топ тайтлов, рейтинг по просмотрам, популярные комиксы, топ за неделю, топ за месяц",
    canonicalUrl: `${baseUrl}/top`,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — топ тайтлов",
    type: "website",
  });
}

const topBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Топ тайтлов", item: `${baseUrl}/top` },
  ],
};

export default function TopPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(topBreadcrumbJsonLd) }}
      />
      <TopPageClient />
    </>
  );
}
