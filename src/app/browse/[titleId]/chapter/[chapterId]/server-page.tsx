import { ReadChapterPage } from "@/widgets";
import {
  ReaderTitle as ReadTitle,
  ReaderChapter as ReadChapter,
} from "@/shared/reader/types";
import { Chapter } from "@/types/title";
import { seoConfigs } from "@/hooks/useSEO";
import { Metadata } from "next";

// Функция для получения данных на сервере
async function getTitleData(titleId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/titles/${titleId}`);
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

async function getChaptersData(titleId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/chapters/title/${titleId}?limit=10000&sortOrder=asc`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chapters: ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching chapters data:", error);
    throw error;
  }
}

async function getChapterData(chapterId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/chapters/${chapterId}`);
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

function normalizeAssetUrl(p: string): string {
  if (!p) return "";
  if (p.startsWith("http")) {
    return p.replace("/api/browse/", "/uploads/browse/");
  }
  let path = p.startsWith("/") ? p : `/${p}`;
  // normalize wrong api prefix to uploads
  if (path.startsWith("/api/")) path = path.replace(/^\/api\//, "/uploads/");
  if (path.startsWith("api/")) path = path.replace(/^api\//, "uploads/");
  const origin =
    process.env.NEXT_PUBLIC_UPLOADS_URL || "http://localhost:3001/uploads";
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Функция для генерации SEO метаданных
export async function generateMetadata({
  titleId,
  chapterId
}: {
  titleId: string;
  chapterId: string;
}): Promise<Metadata> {
  try {
    // Load title data for SEO
    const titleData = await getTitleData(titleId);
    
    // Find the requested chapter
    const chaptersData = await getChaptersData(titleId);
    const chapter = chaptersData.chapters.find((c: Chapter) => c._id === chapterId);
    
    // If chapter not found in title chapters, try to fetch it directly
    let chapterData = null;
    if (!chapter) {
      try {
        chapterData = await getChapterData(chapterId);
      } catch (error) {
        console.error("Error fetching chapter data:", error);
      }
    }
    
    const currentChapter = chapter || chapterData;
    
    if (!currentChapter || !titleData) {
      return {
        title: "Глава не найдена - Tomilo-lib.ru",
        description: "Запрошенная глава не существует или была удалена.",
      };
    }
    
    // Генерация SEO данных
    const chapterNumber = Number(currentChapter.chapterNumber) || 0;
    const chapterTitle = currentChapter.title || "";
    const titleName = titleData.name || "Без названия";
    
    // Формирование заголовка по требованиям: "Читать глава № главы и название если есть - название тайтла - Tomilo-lib.ru"
    const formattedTitle = `Читать глава ${chapterNumber}${chapterTitle ? ` "${chapterTitle}"` : ''} - ${titleName} - Tomilo-lib.ru`;
    
    const seoConfig = {
      title: formattedTitle,
      description: `Читать ${titleName} главу ${chapterNumber}${chapterTitle ? ` "${chapterTitle}"` : ''} онлайн. Манга, маньхуа, комиксы.`,
      keywords: `${titleName}, глава ${chapterNumber}, ${chapterTitle}, онлайн чтение, манга, маньхуа`,
      type: 'article' as const,
    };
    
    return {
      title: seoConfig.title,
      description: seoConfig.description,
      keywords: seoConfig.keywords,
      openGraph: {
        title: seoConfig.title,
        description: seoConfig.description,
        type: "article",
        url: `${process.env.NEXT_PUBLIC_URL}/browse/${titleId}/chapter/${chapterId}`,
      },
      twitter: {
        title: seoConfig.title,
        description: seoConfig.description,
        card: "summary_large_image",
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Ошибка загрузки | Tomilo-lib.ru",
      description: "Не удалось загрузить данные главы.",
    };
  }
}

export default async function ServerChapterPage({
  titleId,
  chapterId
}: {
  titleId: string;
  chapterId: string;
}) {
  try {
    // Load title and chapters data
    const [titleData, chaptersData] = await Promise.all([
      getTitleData(titleId),
      getChaptersData(titleId)
    ]);

    // Find the requested chapter
    const chapter = chaptersData.chapters.find((c: Chapter) => c._id === chapterId);
    
    // If chapter not found in title chapters, try to fetch it directly
    let chapterData = null;
    if (!chapter) {
      try {
        chapterData = await getChapterData(chapterId);
      } catch (error) {
        console.error("Error fetching chapter data:", error);
      }
    }

    // Handle case where chapter belongs to a different title
    if (chapterData && chapterData.titleId !== titleId) {
      // В серверной версии мы не можем делать редирект через router.push
      // Вместо этого возвращаем сообщение об ошибке
      const correctTitleId = typeof chapterData.titleId === 'object' ? (chapterData.titleId as { _id: string })._id : chapterData.titleId;
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Глава перемещена
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Эта глава была перемещена в другой тайтл.
            </p>
            <div className="mt-4">
              <p>Правильный Title ID: {correctTitleId}</p>
              <p>Chapter ID: {chapterId}</p>
            </div>
          </div>
        </div>
      );
    }

    const serverTitle = titleData;

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

    const mappedTitle: ReadTitle = {
      _id: serverTitle._id,
      title: serverTitle.name,
      originalTitle: serverTitle.altNames?.[0] || "",
      type: serverTitle.type || "Манга",
      year: Number(serverTitle.releaseYear) || new Date().getFullYear(),
      rating: Number(serverTitle.rating) || 0,
      image: serverTitle.coverImage || "",
      genres: serverTitle.genres || [],
      description: serverTitle.description || "",
      status: serverTitle.status || "ongoing",
      author: serverTitle.author || "",
      artist: serverTitle.artist || "",
      totalChapters: Number(serverTitle.totalChapters) || mappedChapters.length,
      views: Number(serverTitle.views) || 0,
      lastUpdate: serverTitle.updatedAt || "",
      chapters: mappedChapters,
      alternativeTitles: serverTitle.altNames || [],
    };

    // Find chapter by _id
    const currentChapter = mappedChapters.find((c) => c._id === chapterId);

    if (!currentChapter) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Глава не найдена
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Запрошенная глава не существует или была удалена.
            </p>
            <div className="mt-4 text-sm">
              <p>Title ID: {titleId}</p>
              <p>Chapter ID: {chapterId}</p>
              <p>Available chapters: {mappedChapters.length}</p>
              <p>
                Available chapter IDs:{" "}
                {mappedChapters.map((c) => c._id).join(", ")}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <ReadChapterPage
        title={mappedTitle}
        chapter={currentChapter}
        chapters={mappedChapters}
      />
    );
  } catch (error) {
    console.error("Error in ServerChapterPage:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Ошибка загрузки
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Не удалось загрузить данные главы.
          </p>
          <div className="mt-4 text-sm">
            <p>Title ID: {titleId}</p>
            <p>Chapter ID: {chapterId}</p>
          </div>
        </div>
      </div>
    );
  }
}