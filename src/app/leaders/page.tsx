import type { Metadata } from "next";
import { Suspense } from "react";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";
import LeadersPageClient from "./LeadersPageClient";

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export async function generateMetadata(): Promise<Metadata> {
  return buildServerSEOMetadata({
    title: "Таблица лидеров — рейтинг активных читателей | Tomilo-lib.ru",
    description:
      "Рейтинг самых активных пользователей Tomilo-lib. Топ читателей по уровню, прочитанным главам, оценкам и комментариям. Соревнуйтесь с другими!",
    keywords:
      "таблица лидеров, рейтинг читателей, топ пользователей, активные читатели, уровень, достижения, прочитанные главы, комиксы, манга",
    canonicalUrl: `${baseUrl}/leaders`,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — таблица лидеров",
    type: "website",
  });
}

const leadersBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Лидеры", item: `${baseUrl}/leaders` },
  ],
};

export default function LeadersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(leadersBreadcrumbJsonLd) }}
      />
      <Suspense fallback={null}>
        <LeadersPageClient />
      </Suspense>
    </>
  );
}
