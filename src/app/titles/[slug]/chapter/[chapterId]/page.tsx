import React, { Suspense } from "react";
import ServerChapterPage from "./ServerPage";
import { Metadata } from "next";
import { getTitleDisplayNameForSEO } from "@/lib/seo-title-name";
import { getOgImageUrl } from "@/lib/seo-og-image";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { sanitizeMetaString } from "@/lib/seo-meta-sanitize";

// Кодируем slug для URL (апостроф, кавычки и др.) — бэкенд должен декодировать
function encodeSlugForApi(slug: string): string {
  return encodeURIComponent(slug);
}

// Функция для получения данных тайтла по slug на сервере
async function getTitleDataBySlug(slug: string) {
  try {
    const encodedSlug = encodeSlugForApi(slug);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/titles/slug/${encodedSlug}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch title by slug: ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching title data by slug:", error);
    throw error;
  }
}

async function getChapterData(chapterId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/chapters/${chapterId}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching chapter data:", error);
    throw error;
  }
}

// Функция для генерации SEO метаданных
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { slug, chapterId } = resolvedParams;
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

    // Получаем данные тайтла по slug
    const titleData = await getTitleDataBySlug(slug);
    const titleName = getTitleDisplayNameForSEO(titleData as Record<string, unknown>, slug);

    // Получаем данные главы
    const chapterData = await getChapterData(chapterId);
    const chapterNumber = Number(chapterData.chapterNumber) || 0;
    const chapterTitle = chapterData.title || "";

    const formattedTitle = `Глава ${chapterNumber}${
      chapterTitle ? ` "${chapterTitle}"` : ""
    } - ${titleName} - Tomilo-lib.ru`;
    const shortDescription = `Читать ${titleName} главу ${chapterNumber}${
      chapterTitle ? ` "${chapterTitle}"` : ""
    } онлайн. Манга, манхва, маньхуа, комиксы.`;

    const imageBaseUrl =
      process.env.NEXT_PUBLIC_IMAGE_URL ||
      (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "") ||
      baseUrl;
    const coverImage =
      titleData.coverImage ?? (titleData as { image?: string }).image ?? (titleData as { cover?: string }).cover;
    const ogImageUrl = getOgImageUrl(baseUrl, coverImage, imageBaseUrl);
    const chapterUrl = `${baseUrl}/titles/${encodeURIComponent(slug)}/chapter/${chapterId}`;

    return buildServerSEOMetadata({
      title: sanitizeMetaString(formattedTitle),
      description: sanitizeMetaString(shortDescription),
      keywords: `${titleName}, глава ${chapterNumber}, ${chapterTitle}, читать онлайн, манга, маньхуа, манхва, комиксы`,
      canonicalUrl: chapterUrl,
      ogImageUrl,
      ogImageAlt: coverImage
        ? `${titleName} — глава ${chapterNumber}`
        : "Tomilo-lib — читать мангу, манхву, маньхуа",
      type: "article",
    });
  } catch (error) {
    console.error("Ошибка при генерации метаданных:", error);
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
    const fallbackImage = getOgImageUrl(baseUrl, null);
    return buildServerSEOMetadata({
      title: "Ошибка загрузки страницы | Tomilo-lib.ru",
      description: "Произошла ошибка при загрузке страницы",
      canonicalUrl: baseUrl,
      ogImageUrl: fallbackImage,
      ogImageAlt: "Tomilo-lib",
      type: "website",
    });
  }
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}) {
  const resolved = await params;
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
  let jsonLdScripts: React.ReactNode = null;

  try {
    const titleData = await getTitleDataBySlug(resolved.slug);
    const chapterData = await getChapterData(resolved.chapterId);
    const titleName = titleData?.name || "Без названия";
    const chapterNumber = Number(chapterData?.chapterNumber) || 0;
    const chapterTitle = chapterData?.title || "";
    const chapterUrl = `${baseUrl}/titles/${resolved.slug}/chapter/${resolved.chapterId}`;
    const titleUrl = `${baseUrl}/titles/${resolved.slug}`;

    const breadcrumbList = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Tomilo-lib.ru", item: baseUrl },
        { "@type": "ListItem", position: 2, name: titleName, item: titleUrl },
        {
          "@type": "ListItem",
          position: 3,
          name: `Глава ${chapterNumber}${chapterTitle ? ` — ${chapterTitle}` : ""}`,
          item: chapterUrl,
        },
      ],
    };
    const comicIssue = {
      "@context": "https://schema.org",
      "@type": "ComicIssue",
      name: `Глава ${chapterNumber}${chapterTitle ? ` — ${chapterTitle}` : ""}`,
      description: `Читать ${titleName} главу ${chapterNumber} онлайн.`,
      position: chapterNumber,
      image: titleData?.coverImage ? `${baseUrl}${titleData.coverImage}` : undefined,
      datePublished: chapterData?.releaseDate || undefined,
      isPartOf: { "@type": "ComicSeries", name: titleName, url: titleUrl },
    };

    jsonLdScripts = (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(comicIssue) }}
        />
      </>
    );
  } catch {
    // JSON-LD опционален, страница всё равно рендерится
  }

  return (
    <>
      {jsonLdScripts}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
              <div className="text-[var(--foreground)]">Загрузка данных...</div>
            </div>
          </div>
        }
      >
        <ServerChapterPage params={params} />
      </Suspense>
    </>
  );
}
