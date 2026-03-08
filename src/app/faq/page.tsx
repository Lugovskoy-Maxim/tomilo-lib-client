import type { Metadata } from "next";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";
import { FAQ_DATA } from "@/constants/faq";
import FAQPageClient from "./FAQPageClient";

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export async function generateMetadata(): Promise<Metadata> {
  return buildServerSEOMetadata({
    title: "Частые вопросы (FAQ) — справка и помощь | Tomilo-lib.ru",
    description:
      "Ответы на популярные вопросы о Tomilo-lib: настройка профиля, режимы чтения, уведомления, приватность, монеты и достижения. Справочный центр платформы.",
    keywords:
      "FAQ, частые вопросы, помощь, справка, настройки, как читать мангу, профиль, уведомления, приватность, достижения, Tomilo-lib",
    canonicalUrl: `${baseUrl}/faq`,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — частые вопросы",
    type: "website",
  });
}

const faqPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_DATA.flatMap(section =>
    section.items.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  ),
};

const faqBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Частые вопросы", item: `${baseUrl}/faq` },
  ],
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqBreadcrumbJsonLd) }}
      />
      <FAQPageClient />
    </>
  );
}
