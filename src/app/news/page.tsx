import type { Metadata } from "next";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";
import NewsPageClient from "./NewsPageClient";

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export async function generateMetadata(): Promise<Metadata> {
  return buildServerSEOMetadata({
    title: "Новости и объявления — последние обновления платформы | Tomilo-lib.ru",
    description:
      "Все новости и объявления Tomilo-lib. Узнавайте первыми о новых функциях, обновлениях каталога, акциях и важных событиях платформы.",
    keywords:
      "новости манги, объявления, обновления сайта, события, анонсы, Tomilo-lib новости, новые функции, релизы",
    canonicalUrl: `${baseUrl}/news`,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — новости и объявления",
    type: "website",
  });
}

const newsBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Новости", item: `${baseUrl}/news` },
  ],
};

export default function NewsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsBreadcrumbJsonLd) }}
      />
      <NewsPageClient />
    </>
  );
}
