import { Suspense } from "react";
import ServerChapterPage from "./server-page";
import { Metadata } from "next";

// Функция для получения данных на сервере
async function getTitleData(titleId: string) {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      }/titles/${titleId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch title: ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching title data:", error);
    throw error;
  }
}

async function getChapterData(chapterId: string) {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      }/chapters/${chapterId}`
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
  params: Promise<{ titleId: string; chapterId: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { titleId, chapterId } = resolvedParams;
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

    // Получаем данные тайтла
    const titleData = await getTitleData(titleId);
    const titleName = titleData.name || "Без названия";

    // Получаем данные главы
    const chapterData = await getChapterData(chapterId);
    const chapterNumber = Number(chapterData.chapterNumber) || 0;
    const chapterTitle = chapterData.title || "";

    // Формирование заголовка по требованиям: "Читать глава № главы и название если есть - название тайтла - Tomilo-lib.ru"
    const formattedTitle = `Глава ${chapterNumber}${
      chapterTitle ? ` "${chapterTitle}"` : ""
    } - ${titleName} - Tomilo-lib.ru`;

    const shortDescription = `Читать ${titleName} главу ${chapterNumber}${
      chapterTitle ? ` "${chapterTitle}"` : ""
    } онлайн. Манга, манхва, маньхуа, комиксы.`;

    const image = titleData.coverImage
      ? `${baseUrl}${titleData.coverImage}`
      : undefined;

    // Формируем метаданные
    const metadata: Metadata = {
      title: formattedTitle,
      description: shortDescription,
      keywords: `${titleName}, глава ${chapterNumber}, ${chapterTitle}, онлайн чтение, манга, маньхуа, манхва`,
      openGraph: {
        title: `Глава ${chapterNumber}${
          chapterTitle ? ` "${chapterTitle}"` : ""
        } - ${titleName} - Tomilo-lib.ru`,
        description: shortDescription,
        type: "article",
        url: `${baseUrl}/browse/${titleId}/chapter/${chapterId}`,
        siteName: "Tomilo-lib.ru",
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: formattedTitle,
        description: shortDescription,
        images: image ? [image] : [],
      },
    };

    // Добавляем микроразметку Schema.org
    const schemaOrgData = {
      "@context": "https://schema.org",
      "@type": "Chapter",
      name: `Глава ${chapterNumber}${chapterTitle ? ` "${chapterTitle}"` : ""}`,
      position: chapterNumber,
      hasPart: {
        "@type": "ComicIssue",
        name: titleName,
        author: titleData.author || "",
        datePublished: chapterData.releaseDate || "",
        genre: titleData.genres || [],
        image: image || "",
        description: shortDescription,
      },
    };

    // Добавляем JSON-LD микроразметку в head
    const schemaOrgJsonLd = JSON.stringify(schemaOrgData);

    return {
      ...metadata,
      other: {
        'script:ld+json': schemaOrgJsonLd,
      },
    };
  } catch (error) {
    console.error("Ошибка при генерации метаданных:", error);
    return {
      title: "Ошибка загрузки страницы | Tomilo-lib.ru",
      description: "Произошла ошибка при загрузке страницы",
    };
  }
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ titleId: string; chapterId: string }>;
}) {
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <div className="text-[var(--foreground)]">Загрузка данных...</div>
        </div>
      </div>
    }>
      <ServerChapterPage params={params} />
    </Suspense>
  );
}
