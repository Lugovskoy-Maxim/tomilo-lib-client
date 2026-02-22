import { Suspense } from "react";
import { TitleView } from "@/widgets";
import { Metadata } from "next";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitleDisplayNameForSEO } from "@/lib/seo-title-name";
import { getOgImageUrl } from "@/lib/seo-og-image";
import { sanitizeMetaString } from "@/lib/seo-meta-sanitize";

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
    // Формируем расширенные метаданные (всегда одно изображение для превью в мессенджерах)
    const metadata: Metadata = {
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
      authors: titleData.author ? [titleData.author] : [],
      creator: titleData.artist || titleData.author,
      publisher: "Tomilo-lib.ru",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },

      openGraph: {
        title: safeTitle,
        description: safeDescription,
        type: "article" as const,
        url: `${baseUrl}/titles/${encodeURIComponent(slug)}`,
        siteName: "Tomilo-lib.ru",
        locale: "ru_RU",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: coverImage ? `${titleName} - обложка` : "Tomilo-lib — читать онлайн",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: safeTitle,
        description: safeDescription,
        images: [ogImageUrl],
        creator: "@tomilo_lib",
        site: "@tomilo_lib",
      },
      alternates: {
        canonical: `${baseUrl}/titles/${slug}`,
        languages: {
          "ru-RU": `${baseUrl}/titles/${slug}`,
        },
      },
      verification: {
        yandex: "8f2bae575aa86202",
      },
    };

    return metadata;
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

export default async function TitlePageRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const rawSlug = String(resolvedParams.slug ?? "");
  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    slug = rawSlug;
  }

  return (
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
  );
}
