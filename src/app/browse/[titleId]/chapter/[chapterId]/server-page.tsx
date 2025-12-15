import { ReadChapterPage } from "@/widgets";
import {
  ReaderTitle as ReadTitle,
  ReaderChapter as ReadChapter,
} from "@/shared/reader/types";
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
    };
  } catch (error) {
    console.error("Ошибка при генерации метаданных:", error);
    return {
      title: "Ошибка загрузки страницы | Tomilo-lib.ru",
      description: "Произошла ошибка при загрузке страницы",
    };
  }
}

export default async function ServerChapterPage({
  params,
}: {
  params: Promise<{ titleId: string; chapterId: string }>;
}) {
  try {
    const resolvedParams = await params;
    const { titleId, chapterId } = resolvedParams;
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    // Получаем данные тайтла
    const titleResponse = await fetch(
      `${apiUrl}/titles/${titleId}?populateChapters=false`,
      {
        cache: "no-store",
      }
    );

    if (!titleResponse.ok) {
      if (titleResponse.status === 404) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                Тайтл не найден
              </h1>
              <p className="text-[var(--muted-foreground)]">
                Запрашиваемый тайтл не существует или был удален.
              </p>
            </div>
          </div>
        );
      }
      throw new Error(`API error: ${titleResponse.status}`);
    }

    const titleApiResponse = await titleResponse.json();

    if (!titleApiResponse.success || !titleApiResponse.data) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Тайтл не найден
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Запрашиваемый тайтл не существует или был удален.
            </p>
          </div>
        </div>
      );
    }

    const titleData: import("@/types/title").Title = titleApiResponse.data;

    // Получаем данные главы
    const chapterResponse = await fetch(`${apiUrl}/chapters/${chapterId}`, {
      cache: "no-store",
    });

    if (!chapterResponse.ok) {
      if (chapterResponse.status === 404) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                Глава не найдена
              </h1>
              <p className="text-[var(--muted-foreground)]">
                Запрашиваемая глава не существует или была удалена.
              </p>
            </div>
          </div>
        );
      }
      throw new Error(`API error: ${chapterResponse.status}`);
    }

    const chapterApiResponse = await chapterResponse.json();

    if (!chapterApiResponse.success || !chapterApiResponse.data) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Глава не найдена
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Запрашиваемая глава не существует или была удалена.
            </p>
          </div>
        </div>
      );
    }

    const chapterData: import("@/types/title").Chapter =
      chapterApiResponse.data;

    // Проверяем, принадлежит ли глава этому тайтлу
    const chapterTitleId =
      typeof chapterData.titleId === "object"
        ? (chapterData.titleId as { _id: string })._id
        : chapterData.titleId;

    if (chapterTitleId !== titleId) {
      // В серверной версии мы не можем делать редирект через router.push
      // Вместо этого возвращаем сообщение об ошибке
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Глава перемещена
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Эта глава была перемещена в другой тайтл.
            </p>
          </div>
        </div>
      );
    }

    // Получаем список всех глав тайтла
    const chaptersResponse = await fetch(
      `${apiUrl}/chapters/title/${titleId}?limit=10000&sortOrder=asc`,
      {
        cache: "no-store",
      }
    );

    if (!chaptersResponse.ok) {
      throw new Error(`Failed to fetch chapters: ${chaptersResponse.status}`);
    }

    const chaptersApiResponse = await chaptersResponse.json();
    const chaptersData = chaptersApiResponse.data || chaptersApiResponse;

    const serverTitle = titleData;

    const mappedChapters: ReadChapter[] = chaptersData.chapters.map(
      (ch: import("@/types/title").Chapter) => ({
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
        </div>
      </div>
    );
  }
}
