import type { Metadata } from "next";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";
import { UpdatesPage } from "@/widgets";

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export async function generateMetadata(): Promise<Metadata> {
  return buildServerSEOMetadata({
    title: "Лента новых глав — последние обновления манги и маньхуа | Tomilo-lib.ru",
    description:
      "Свежие главы манги, манхвы и маньхуа. Все последние обновления тайтлов в одной ленте. Следите за новыми релизами онлайн.",
    keywords:
      "новые главы, обновления манги, свежие релизы, последние главы, лента обновлений, читать онлайн, манга новинки, манхва обновления",
    canonicalUrl: `${baseUrl}/updates`,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — лента обновлений",
    type: "website",
  });
}

const updatesBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Обновления", item: `${baseUrl}/updates` },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(updatesBreadcrumbJsonLd) }}
      />
      <UpdatesPage />
    </>
  );
}
