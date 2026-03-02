import type { Metadata } from "next";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getOgImageUrl, getDefaultOgImageUrl } from "@/lib/seo-og-image";
import { sanitizeMetaString } from "@/lib/seo-meta-sanitize";
import NewsSlugPageClient from "./NewsSlugPageClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

async function getAnnouncementBySlug(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/announcements/slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.data || data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const announcement = await getAnnouncementBySlug(slug);
  
  if (!announcement) {
    return {
      title: "Новость не найдена — Tomilo-lib.ru",
      description: "Запрашиваемая новость не найдена или была удалена.",
      robots: { index: false, follow: false },
    };
  }
  
  const title = `${announcement.title} — Новости Tomilo-lib.ru`;
  const description = announcement.shortDescription || 
    (announcement.body ? announcement.body.replace(/<[^>]*>/g, "").substring(0, 160) : "Новость на Tomilo-lib.ru");
  
  const ogImageUrl = announcement.coverImage 
    ? getOgImageUrl(baseUrl, announcement.coverImage, baseUrl)
    : getDefaultOgImageUrl(baseUrl);
  
  const publishedTime = announcement.publishedAt || announcement.createdAt;
  const modifiedTime = announcement.updatedAt;
  
  return buildServerSEOMetadata({
    title: sanitizeMetaString(title),
    description: sanitizeMetaString(description),
    keywords: [
      "новости",
      "объявление",
      "Tomilo-lib",
      ...(announcement.tags || []),
    ].join(", "),
    canonicalUrl: `${baseUrl}/news/${encodeURIComponent(slug)}`,
    ogImageUrl,
    ogImageAlt: announcement.title,
    type: "article",
    article: {
      publishedTime: publishedTime ? new Date(publishedTime).toISOString() : undefined,
      modifiedTime: modifiedTime ? new Date(modifiedTime).toISOString() : undefined,
      section: "Новости",
      tags: announcement.tags,
    },
    publisher: "Tomilo-lib.ru",
  });
}

export default async function NewsSlugPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const announcement = await getAnnouncementBySlug(slug);
  
  let jsonLdScripts: React.ReactNode = null;
  
  if (announcement) {
    const newsArticleJsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: announcement.title,
      description: announcement.shortDescription || "",
      image: announcement.coverImage ? `${baseUrl}${announcement.coverImage}` : undefined,
      datePublished: announcement.publishedAt || announcement.createdAt,
      dateModified: announcement.updatedAt || announcement.publishedAt || announcement.createdAt,
      publisher: {
        "@type": "Organization",
        name: "Tomilo-lib.ru",
        url: baseUrl,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${baseUrl}/news/${slug}`,
      },
    };
    
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Новости", item: `${baseUrl}/news` },
        { "@type": "ListItem", position: 3, name: announcement.title, item: `${baseUrl}/news/${slug}` },
      ],
    };
    
    jsonLdScripts = (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </>
    );
  }
  
  return (
    <>
      {jsonLdScripts}
      <NewsSlugPageClient slug={slug} />
    </>
  );
}
