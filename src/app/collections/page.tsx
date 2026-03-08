import type { Metadata } from "next";
import React, { Suspense } from "react";
import { CollectionsPage } from "@/widgets";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";

interface CollectionsPageProps {
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
}

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

const collectionsBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Коллекции", item: `${baseUrl}/collections` },
  ],
};

export async function generateMetadata({ searchParams }: CollectionsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const search = params.search || "";
  const title = search
    ? `Поиск коллекций: «${search}» — Tomilo-lib.ru`
    : "Коллекции манги, манхвы и маньхуа — Tomilo-lib.ru";
  const description = search
    ? `Коллекции по запросу «${search}». Подборки тайтлов по темам и жанрам для чтения онлайн.`
    : "Подборки тайтлов по темам и жанрам. Коллекции манги, манхвы и маньхуа для удобного чтения онлайн.";
  const canonicalUrl = search
    ? `${baseUrl}/collections?search=${encodeURIComponent(search)}`
    : `${baseUrl}/collections`;

  return buildServerSEOMetadata({
    title,
    description,
    keywords:
      "коллекции манги, подборки тайтлов, манхва, маньхуа, тематические коллекции, читать онлайн, Tomilo-lib",
    canonicalUrl,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — коллекции",
    type: "website",
  });
}

export default function CollectionsPageRoute({ searchParams }: CollectionsPageProps) {
  // Next.js 15: searchParams is a Promise and must be unwrapped before any serialization
  React.use(searchParams);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionsBreadcrumbJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        }
      >
        <CollectionsPage />
      </Suspense>
    </>
  );
}
