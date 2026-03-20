import { ReadChapterPage } from "@/widgets";
import { ReaderTitle as ReadTitle, ReaderChapter as ReadChapter } from "@/shared/reader/types";
import ChapterErrorState from "@/shared/error-state/ChapterErrorState";
import { normalizeAssetUrl } from "@/lib/asset-url";

export default async function ServerChapterPage({
  params,
}: {
  params: { slug: string; chapterId: string };
}) {
  const { slug, chapterId } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  try {
    // Получаем данные тайтла по slug
    const titleResponse = await fetch(`${apiUrl}/titles/slug/${slug}?populateChapters=false`, {
      cache: "no-store",
    });

    if (!titleResponse.ok) {
      if (titleResponse.status === 404) {
        return (
          <ChapterErrorState
            title="Тайтл не найден"
            message="Запрашиваемый тайтл не существует или был удален."
            slug={slug}
          />
        );
      }
      throw new Error(`API error: ${titleResponse.status}`);
    }

    const titleApiResponse = await titleResponse.json();

    if (!titleApiResponse.success || !titleApiResponse.data) {
      return (
        <ChapterErrorState
          title="Тайтл не найден"
          message="Запрашиваемый тайтл не существует или был удален."
          slug={slug}
        />
      );
    }

    const titleData: import("@/types/title").Title = titleApiResponse.data;
    const titleId = titleData._id;

    // Получаем данные главы.
    // Важно: при 500 не заваливаем ридер целиком — используем данные из /chapters/title/... ниже.
    let chapterData: import("@/types/title").Chapter | null = null;
    const chapterResponse = await fetch(`${apiUrl}/chapters/${chapterId}`, {
      cache: "no-store",
    });

    if (!chapterResponse.ok) {
      if (chapterResponse.status === 404) {
        return (
          <ChapterErrorState
            title="Глава не найдена"
            message="Запрашиваемая глава не существует или была удалена."
            slug={slug}
          />
        );
      }

      if (chapterResponse.status >= 500) {
        console.error(
          `ServerChapterPage: /chapters/${chapterId} returned ${chapterResponse.status}. Falling back to chapters/title data.`,
        );
      } else {
        throw new Error(`API error: ${chapterResponse.status}`);
      }
    } else {
      const chapterApiResponse = await chapterResponse.json();

      if (!chapterApiResponse.success || !chapterApiResponse.data) {
        return (
          <ChapterErrorState
            title="Глава не найдена"
            message="Запрашиваемая глава не существует или была удалена."
            slug={slug}
          />
        );
      }

      const loadedChapter: import("@/types/title").Chapter = chapterApiResponse.data;
      chapterData = loadedChapter;

      // Проверяем, принадлежит ли глава этому тайтлу (только если получили данные главы)
      const chapterTitleId =
        typeof loadedChapter.titleId === "object"
          ? (loadedChapter.titleId as { _id: string })._id
          : loadedChapter.titleId;

      if (chapterTitleId !== titleId) {
        return (
          <ChapterErrorState
            title="Глава перемещена"
            message="Эта глава была перемещена в другой тайтл."
            slug={slug}
          />
        );
      }
    }

    // Получаем список всех глав тайтла
    const chaptersResponse = await fetch(
      `${apiUrl}/chapters/title/${titleId}?limit=10000&sortOrder=asc`,
      {
        cache: "no-store",
      },
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
        images: Array.isArray(ch.pages) ? ch.pages.map((p: string) => normalizeAssetUrl(p)) : [],
        averageRating: ch.averageRating,
        ratingSum: ch.ratingSum,
        ratingCount: ch.ratingCount,
        userRating: ch.userRating,
        reactions: ch.reactions,
      }),
    );

    const mappedTitle: ReadTitle = {
      _id: serverTitle._id,
      title: serverTitle.name,
      originalTitle: serverTitle.altNames?.[0] || "",
      slug: slug,
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

    // Find chapter by _id; для открытой главы подставляем страницы из chapterData (полный ответ API)
    const listChapter = mappedChapters.find(c => c._id === chapterId);

    if (!listChapter) {
      return (
        <ChapterErrorState
          title="Глава не найдена"
          message="Запрошенная глава не существует или была удалена."
          slug={slug}
        />
      );
    }

    const currentChapter: ReadChapter = {
      ...listChapter,
      images:
        chapterData &&
        Array.isArray(chapterData.pages) &&
        chapterData.pages.length > 0
          ? chapterData.pages.map((p: string) => normalizeAssetUrl(p))
          : listChapter.images,
      averageRating: chapterData?.averageRating ?? listChapter.averageRating,
      ratingSum: chapterData?.ratingSum ?? listChapter.ratingSum,
      ratingCount: chapterData?.ratingCount ?? listChapter.ratingCount,
      userRating: chapterData?.userRating ?? listChapter.userRating,
      reactions: chapterData?.reactions ?? listChapter.reactions,
    };

    return (
      <ReadChapterPage
        title={mappedTitle}
        chapter={currentChapter}
        chapters={mappedChapters}
        slug={slug}
      />
    );
  } catch (error) {
    console.error("Error in ServerChapterPage:", error);
    return (
      <ChapterErrorState
        title="Ошибка загрузки"
        message="Не удалось загрузить данные главы."
        slug={slug}
      />
    );
  }
}
