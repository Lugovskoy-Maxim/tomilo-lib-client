import { Suspense } from "react";
import { TitleView } from "@/widgets";
import type { Metadata } from "next";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitleDisplayNameForSEO } from "@/lib/seo-title-name";
import { getOgImageUrl } from "@/lib/seo-og-image";
import { sanitizeMetaString } from "@/lib/seo-meta-sanitize";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Кодируем slug для URL (апостроф, кавычки и др.) — бэкенд должен декодировать
function encodeSlugForApi(slug: string): string {
  return encodeURIComponent(slug);
}

// Функция для получения данных тайтла по slug на сервере
async function getTitleDataBySlug(slug: string) {
  try {
    const encodedSlug = encodeSlugForApi(slug);
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      }/titles/slug/${encodedSlug}?populateChapters=false`,
      {
        next: { revalidate: 60 }, // Короткое кеширование для быстрого обновления SEO при изменении slug
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SEO-Bot/1.0)",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch title by slug: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching title data by slug:", error);
    return null;
  }
}

// Функция для генерации улучшенных SEO метаданных
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const rawSlug = String(resolvedParams.slug ?? "");
    // Декодируем slug на случай двойного кодирования (Telegram/краулеры по-разному передают URL)
    let slug: string;
    try {
      slug = decodeURIComponent(rawSlug);
    } catch {
      slug = rawSlug;
    }
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

    // Получаем данные тайтла по slug
    const titleData = await getTitleDataBySlug(slug);

    if (!titleData) {
      return {
        title: "Тайтл не найден - Tomilo-lib.ru",
        description: "Запрашиваемый тайтл не найден на сайте Tomilo-lib.ru",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const titleName = getTitleDisplayNameForSEO(titleData as Record<string, unknown>, slug);
    const titleType = titleData.type || "other";
    const titleTypeTranslate = translateTitleType(titleType);
    const genresStr = (titleData.genres ?? []).join(", ");
    const shortDescription = titleData.description
      ? titleData.description.substring(0, 160).replace(/<[^>]*>/g, "")
      : `Читать ${titleName} онлайн на Tomilo-lib.ru.${genresStr ? ` ${genresStr}` : ""}`;

    // Базовый URL для картинок: если обложки отдаются с API — crawler должен получать абсолютный URL с того же хоста
    const imageBaseUrl =
      process.env.NEXT_PUBLIC_IMAGE_URL ||
      (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "") ||
      baseUrl;
    const coverImage =
      titleData.coverImage ?? (titleData as { image?: string }).image ?? (titleData as { cover?: string }).cover;
    // Абсолютный URL — Telegram не подставляет домен к относительным путям в og:image
    const ogImageUrl = getOgImageUrl(baseUrl, coverImage, imageBaseUrl);
    // Санитизация для meta: апостроф/кавычки в названии не ломают парсер Telegram (не показывается Sil%26)
    const safeTitle = sanitizeMetaString(`Читать ${titleName} - ${titleTypeTranslate} - Tomilo-lib.ru`);
    const safeDescription = sanitizeMetaString(shortDescription);
    const canonicalUrl = `${baseUrl}/titles/${encodeURIComponent(slug)}`;
    const publishedTime =
      titleData.createdAt && typeof titleData.createdAt === "string"
        ? new Date(titleData.createdAt).toISOString()
        : undefined;
    const modifiedTime =
      titleData.updatedAt && typeof titleData.updatedAt === "string"
        ? new Date(titleData.updatedAt).toISOString()
        : undefined;

    return buildServerSEOMetadata({
      title: safeTitle,
      description: safeDescription,
      keywords: [
        titleName,
        ...(titleData.genres || []),
        titleData.author,
        titleData.artist,
        "манга",
        "маньхуа",
        "манхва",
        "комиксы",
        "онлайн чтение",
        "Tomilo-lib",
        titleData.type,
      ]
        .filter(Boolean)
        .join(", "),
      category: titleTypeTranslate,
      canonicalUrl,
      ogImageUrl,
      ogImageAlt: coverImage ? `${titleName} - обложка` : "Tomilo-lib — читать онлайн",
      type: "article",
      article: {
        author: titleData.author,
        publishedTime,
        modifiedTime,
        section: titleData.type,
        tags: titleData.genres,
      },
      authors: titleData.author ? [titleData.author] : [],
      creator: titleData.artist || titleData.author || undefined,
      publisher: "Tomilo-lib.ru",
      verification: { yandex: "8f2bae575aa86202" },
    });
  } catch (error) {
    console.error("Ошибка при генерации метаданных:", error);
    return {
      title: "Ошибка загрузки - Tomilo-lib.ru",
      description: "Произошла ошибка при загрузке страницы",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// Генерируем статические параметры для популярных тайтлов
export async function generateStaticParams() {
  try {
    // В реальном приложении здесь должен быть запрос к API
    // для получения популярных тайтлов для предварительной генерации
    return [];
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

function buildTitleJsonLd(baseUrl: string, titleData: Record<string, unknown>, titleName: string) {
  const slug = String(titleData.slug ?? "");
  const url = `${baseUrl}/titles/${encodeURIComponent(slug)}`;
  const imageBaseUrl =
    process.env.NEXT_PUBLIC_IMAGE_URL ||
    (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "") ||
    baseUrl;
  const cover =
    titleData.coverImage ?? (titleData as { image?: string }).image ?? (titleData as { cover?: string }).cover;
  const image =
    cover && typeof cover === "string"
      ? cover.startsWith("http")
        ? cover
        : `${imageBaseUrl.replace(/\/$/, "")}${cover.startsWith("/") ? cover : `/${cover}`}`
      : `${baseUrl}/logo/og-default.png`;
  const type = String(titleData.type ?? "other");
  const isBook = type === "novel" || type === "light_novel";
  const description = titleData.description
    ? String(titleData.description).replace(/<[^>]*>/g, "").substring(0, 500)
    : `Читать ${titleName} онлайн на Tomilo-lib.ru`;

  const mainEntity = {
    "@context": "https://schema.org",
    "@type": isBook ? "Book" : "ComicSeries",
    name: titleName,
    description,
    url,
    image,
    inLanguage: "ru",
    author: titleData.author
      ? { "@type": "Person", name: String(titleData.author) }
      : undefined,
    publisher: { "@type": "Organization", name: "Tomilo-lib.ru", url: baseUrl },
    datePublished: titleData.createdAt || undefined,
    dateModified: titleData.updatedAt || undefined,
    ...(titleData.genres && Array.isArray(titleData.genres) && titleData.genres.length > 0
      ? { genre: titleData.genres.map((g: string) => ({ "@type": "Thing", name: g })) }
      : {}),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Каталог", item: `${baseUrl}/titles` },
      { "@type": "ListItem", position: 3, name: titleName, item: url },
    ],
  };

  return { mainEntity, breadcrumb };
}

export default async function TitlePageRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const rawSlug = String(resolvedParams.slug ?? "");
  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    slug = rawSlug;
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
  const titleData = await getTitleDataBySlug(slug);

  let jsonLdScripts: React.ReactNode = null;
  if (titleData) {
    const titleName = getTitleDisplayNameForSEO(titleData as Record<string, unknown>, slug);
    const { mainEntity, breadcrumb } = buildTitleJsonLd(baseUrl, titleData as Record<string, unknown>, titleName);
    jsonLdScripts = (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(mainEntity) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
      </>
    );
  }

  return (
    <>
      {jsonLdScripts}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
              <div className="text-[var(--foreground)]">Загрузка тайтла...</div>
            </div>
          </div>
        }
      >
        <TitleView slug={slug} />
      </Suspense>
    </>
  );
}
