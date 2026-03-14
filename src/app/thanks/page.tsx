import type { Metadata } from "next";
import React from "react";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";
import ThanksPageClient from "./ThanksPageClient";

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildServerSEOMetadata({
    title: "Благодарности — вкладчики, персонажи и участники сообщества | Tomilo-lib.ru",
    description:
      "Благодарим тех, кто предлагает персонажей, помогает с оформлением и участвует в жизни платформы Tomilo-lib.",
    keywords:
      "благодарности, вкладчики, предложения персонажей, сообщество, рейтинг, Tomilo-lib",
    canonicalUrl: `${baseUrl}/thanks`,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — благодарности вкладчикам",
    type: "website",
  });
}

const thanksBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Благодарности", item: `${baseUrl}/thanks` },
  ],
};

export default function ThanksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(thanksBreadcrumbJsonLd) }}
      />
      <ThanksPageClient />
    </>
  );
}
