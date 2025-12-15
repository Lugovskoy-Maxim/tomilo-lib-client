import { ReadChapterPage } from "@/widgets";
import { notFound } from "next/navigation";
import {
  ReaderTitle as ReadTitle,
  ReaderChapter as ReadChapter,
} from "@/shared/reader/types";
import { getTitleById, getChaptersByTitle, normalizeAssetUrl } from "@/lib/api";
import { Chapter } from "@/types/title";
import { seoConfigs } from "@/hooks/useSEO";

// Функция для получения данных на сервере
async function getChapterData(titleId: string, chapterId: string) {
  try {
    // Получаем данные тайтла
    const titleData = await getTitleById({ id: titleId });
    
    if (!titleData) {
      return null;
    }

    // Получаем список глав
    const chaptersData = await getChaptersByTitle({ 
      titleId, 
      sortOrder: "asc", 
      limit: 10000 
    });

    if (!chaptersData) {
      return null;
    }

    // Маппинг данных тайтла
    const mappedTitle: ReadTitle = {
      _id: titleData._id,
      title: titleData.name,
      originalTitle: titleData.altNames?.[0] || "",
      type: titleData.type || "Манга",
      year: Number(titleData.releaseYear) || new Date().getFullYear(),
      rating: Number(titleData.rating) || 0,
      image: titleData.coverImage || "",
      genres: titleData.genres || [],
      description: titleData.description || "",
      status: titleData.status || "ongoing",
      author: titleData.author || "",
      artist: titleData.artist || "",
      totalChapters: Number(titleData.totalChapters) || chaptersData.chapters.length,
      views: Number(titleData.views) || 0,
      lastUpdate: titleData.updatedAt || "",
      chapters: [],
      alternativeTitles: titleData.altNames || [],
    };

    // Маппинг данных глав
    const mappedChapters: ReadChapter[] = chaptersData.chapters.map(
      (ch: Chapter) => ({
        _id: ch._id || "",
        number: Number(ch.chapterNumber) || 0,
        title: ch.title || "",
        date: ch.releaseDate || "",
        views: Number(ch.views) || 0,
        images: Array.isArray(ch.pages)
          ? ch.pages.map((p: string) => normalizeAssetUrl(p))
          : [],
      })
    );

    // Находим текущую главу
    const chapter = mappedChapters.find((c) => c._id === chapterId);

    if (!chapter) {
      return null;
    }

    return {
      title: mappedTitle,
      chapter,
      chapters: mappedChapters
    };
  } catch (error) {
    console.error("Error fetching chapter data:", error);
    return null;
  }
}

// Функция для генерации метаданных
export async function generateMetadata({ params }: { params: { titleId: string; chapterId: string } }) {
  const data = await getChapterData(params.titleId, params.chapterId);
  
  if (!data) {
    return {
      title: "Глава не найдена | Tomilo-lib.ru",
      description: "Запрошенная глава не найдена",
    };
  }

  const { title, chapter } = data;
  
  const seoConfig = seoConfigs.chapter(
    {
      name: title.title,
      title: title.title,
    },
    chapter.number,
    chapter.title
  );

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const url = `${baseUrl}/browse/${params.titleId}/chapter/${params.chapterId}`;

  // Добавляем структурированные данные для SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    "name": `${title.title} - Глава ${chapter.number}${chapter.title ? ` - ${chapter.title}` : ''}`,
    "position": chapter.number,
    "hasPart": chapter.images.map((_, index) => ({
      "@type": "ComicIssue",
      "position": index + 1
    })),
    "isPartOf": {
      "@type": "ComicSeries",
      "name": title.title,
      "author": title.author,
      "artist": title.artist,
      "genre": title.genres,
      "datePublished": title.year,
      "inLanguage": "ru"
    }
  };

  return {
    title: seoConfig.title,
    description: seoConfig.description,
    keywords: seoConfig.keywords,
    openGraph: {
      title: seoConfig.title,
      description: seoConfig.description,
      type: "article",
      url,
      images: title.image ? [{ url: title.image }] : undefined,
    },
    twitter: {
      title: seoConfig.title,
      description: seoConfig.description,
      card: "summary_large_image",
      images: title.image ? [{ url: title.image }] : undefined,
    },
    alternates: {
      canonical: url,
    },
    other: {
      "application/ld+json": JSON.stringify(structuredData),
    },
  };
}

export default async function ChapterPage({ params }: { params: { titleId: string; chapterId: string } }) {
  const data = await getChapterData(params.titleId, params.chapterId);
  
  if (!data) {
    notFound();
  }

  const { title, chapter, chapters } = data;

  return (
    <ReadChapterPage
      title={title}
      chapter={chapter}
      chapters={chapters}
    />
  );
}
