/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useGetPopularTitlesQuery,
  useSearchTitlesQuery,
  useGetRandomTitlesQuery,
} from "@/store/api/titlesApi";
import { useGetReadingHistoryQuery } from "@/store/api/authApi";
import { Chapter } from "@/types/title";
import { normalizeGenres } from "@/lib/genre-normalizer";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export type HomeVisibleSections = Partial<{
  popular: boolean;
  trending: boolean;
  underrated: boolean;
  reading: boolean;
  topCombined: boolean;
  random: boolean;
}>;

export const useHomeData = (visibleSections: HomeVisibleSections = {}): {
  popularTitles: {
    data: {
      id: string;
      slug?: string;
      title: string;
      image: string | undefined;
      description: string | undefined;
      type: string;
      year: number;
      rating: number;
      genres: never[];
      isAdult: boolean;
    }[];
    loading: boolean;
    error: unknown;
  };

  randomTitles: {
    data: {
      id: string;
      slug?: string;
      title: string;
      image: string;
      description: string;
      type: string;
      year: number;
      rating: number;
      genres: never[];
      isAdult: boolean;
    }[];
    loading: boolean;
    error: unknown;
  };
  trendingTitles: {
    data: {
      id: string;
      slug?: string;
      title: string;
      image: string;
      description: string;
      views: number;
      weekViews?: number;
      type: string;
      year: number;
      rating: number;
      genres: string[];
      isAdult: boolean;
    }[];
    loading: boolean;
    error: unknown;
  };
  underratedTitles: {
    data: {
      id: string;
      slug?: string;
      title: string;
      image: string;
      description: string;
      views: number;
      type: string;
      year: number;
      rating: number;
      genres: string[];
      isAdult: boolean;
    }[];
    loading: boolean;
    error: unknown;
  };
  readingProgress: {
    data: {
      id: string;
      title: string;
      cover: string;
      currentChapter: number;
      totalChapters: number;
      newChaptersSinceLastRead: number;
      type: string;
      readingHistory?: {
        titleId: string;
        chapterId: string;
        chapterNumber: number;
        lastReadDate?: string;
      };
      lastReadTimestamp: number;
    }[];
    loading: boolean;
    error: unknown;
  };

  topManhua: {
    data: {
      id: string;
      slug?: string;
      title: string;
      image: string;
      description: string;
      views: number;
      type: string;
      year: number;
      rating: number;
      genres: string[];
      isAdult: boolean;
    }[];
    loading: boolean;
    error: unknown;
  };
  topManhwa: {
    data: {
      id: string;
      slug?: string;
      title: string;
      image: string;
      description: string;
      views: number;
      type: string;
      year: number;
      rating: number;
      genres: string[];
      isAdult: boolean;
    }[];
    loading: boolean;
    error: unknown;
  };
  top2026: {
    data: {
      id: string;
      slug?: string;
      title: string;
      image: string;
      description: string;
      views: number;
      type: string;
      year: number;
      rating: number;
      genres: string[];
      isAdult: boolean;
    }[];
    loading: boolean;
    error: unknown;
  };
} => {
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

  // Опции кэша: не дергать сервер при каждом заходе на главную.
  // refetchOnMountOrArgChange: 600 — обновлять только если данные старше 10 мин.
  const popularCacheOptions = {
    keepUnusedDataFor: 600,
    refetchOnMountOrArgChange: 600,
  };

  const skipPopular = !visibleSections.popular;
  const skipTrending = !visibleSections.trending;
  const skipUnderrated = !visibleSections.underrated;
  const skipTopCombined = !visibleSections.topCombined;
  const skipRandom = !visibleSections.random;
  const skipReading = !visibleSections.reading || !getToken();

  // Популярные тайтлы — запрос только когда секция в viewport
  const {
    data: popularTitlesData,
    isLoading: popularTitlesLoading,
    error: popularTitlesError,
  } = useGetPopularTitlesQuery({ limit: 35 }, { ...popularCacheOptions, skip: skipPopular });

  // Случайные тайтлы
  const {
    data: randomTitlesData,
    isLoading: randomTitlesLoading,
    error: randomTitlesError,
  } = useGetRandomTitlesQuery({ limit: 10 }, { ...popularCacheOptions, skip: skipRandom });

  const {
    data: trendingTitlesData,
    isLoading: trendingTitlesLoading,
    error: trendingTitlesError,
  } = useSearchTitlesQuery(
    {
      search: "",
      sortBy: "weekViews",
      sortOrder: "desc",
      limit: 20,
    },
    { ...popularCacheOptions, skip: skipTrending },
  );

  const {
    data: underratedCandidatesData,
    isLoading: underratedTitlesLoading,
    error: underratedTitlesError,
  } = useSearchTitlesQuery(
    {
      search: "",
      sortBy: "averageRating",
      sortOrder: "desc",
      limit: 80,
    },
    { ...popularCacheOptions, skip: skipUnderrated },
  );

  // Топ тайтлы — загрузка только когда секция в viewport
  const topQueries = [
    useSearchTitlesQuery(
      {
        search: "",
        types: "manhua",
        sortBy: "views",
        sortOrder: "desc",
        limit: 5,
      },
      { ...popularCacheOptions, skip: skipTopCombined },
    ),
    useSearchTitlesQuery(
      {
        search: "",
        types: "manhwa",
        sortBy: "views",
        sortOrder: "desc",
        limit: 5,
      },
      { ...popularCacheOptions, skip: skipTopCombined },
    ),
    useSearchTitlesQuery(
      {
        search: "",
        releaseYear: 2026,
        sortBy: "views",
        sortOrder: "desc",
        limit: 5,
      },
      { ...popularCacheOptions, skip: skipTopCombined },
    ),
  ];

  const [topManhuaData, topManhwaData, top2026Data] = topQueries.map(query => query.data);
  const [topManhuaLoading, topManhwaLoading, top2026Loading] = topQueries.map(query => query.isLoading);
  const [topManhuaError, topManhwaError, top2026Error] = topQueries.map(query => query.error);

  // История чтения — только когда секция в viewport и пользователь авторизован
  const {
    data: readingHistory,
    isLoading: readingHistoryLoading,
    error: readingHistoryError,
  } = useGetReadingHistoryQuery(
    { limit: 100 },
    {
      skip: skipReading,
    },
  );

  // Преобразование популярных тайтлов
  const popularTitles =
    popularTitlesData?.data?.map(item => ({
      id: item.id,
      slug: (item as any).slug, // Добавляем поддержку slug
      title: item.title,
      image: item.cover,
      description: item.description,
      type: item.type || "Неуказан",
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.rating || 0,
      genres: [], // Сервер не возвращает жанры для популярных тайтлов
      isAdult: item.isAdult ?? false, // Используем isAdult из API или false по умолчанию
    })) || [];

  // Преобразование случайных тайтлов
  const randomTitles =
    randomTitlesData?.data?.map(item => ({
      id: item.id,
      slug: item.slug, // Добавляем поддержку slug
      title: item.title,
      image: item.cover,
      description: item.description,
      type: item.type || "Неуказан",
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.rating || 0,
      genres: [], // Жанры не возвращаются для случайных тайтлов
      isAdult: item.isAdult ?? false,
    })) || [];

  // Преобразование трендовых тайтлов (рост за неделю)
  const trendingTitles =
    trendingTitlesData?.data?.data?.map(item => ({
      id: item._id,
      slug: (item as any).slug,
      title: item.name,
      image: item.coverImage || "",
      description: item.description,
      views: item.views || 0,
      weekViews: (item as any).weekViews ?? 0,
      type: item.type || "Неуказан",
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.averageRating || item.rating || 0,
      genres: normalizeGenres(item.genres || []),
      isAdult: item.isAdult ?? false,
    })) || [];

  // Преобразование кандидатов для блока "Недооцененные"
  const underratedCandidates =
    underratedCandidatesData?.data?.data?.map(item => ({
      id: item._id,
      slug: (item as any).slug,
      title: item.name,
      image: item.coverImage || "",
      description: item.description,
      views: item.views || 0,
      type: item.type || "Неуказан",
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.averageRating || item.rating || 0,
      genres: normalizeGenres(item.genres || []),
      isAdult: item.isAdult ?? false,
    })) || [];

  // Недооценённые: высокий рейтинг + нижний сегмент по просмотрам
  const viewsDistribution = underratedCandidates
    .map(item => item.views)
    .sort((a, b) => a - b);
  const lowViewsThreshold =
    viewsDistribution.length > 0
      ? viewsDistribution[Math.floor(viewsDistribution.length * 0.35)]
      : 0;

  const underratedFiltered = underratedCandidates
    .filter(item => item.rating >= 7.5 && item.views <= lowViewsThreshold)
    .slice(0, 20);

  const underratedTitles =
    underratedFiltered.length > 0
      ? underratedFiltered
      : underratedCandidates
          .filter(item => item.rating >= 7)
          .sort((a, b) => a.views - b.views)
          .slice(0, 20);

  // Преобразование топ тайтлов Маньхуа
  const topManhua =
    topManhuaData?.data?.data?.map(item => ({
      id: item._id,
      slug: (item as any).slug, // Добавляем поддержку slug для правильной навигации
      title: item.name,
      image: item.coverImage || "",
      description: item.description,
      type: item.type || "Неуказан",
      views: item.views || 0,
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.averageRating || item.rating || 0,
      genres: normalizeGenres(item.genres || []),
      isAdult: item.isAdult ?? false,
    })) || [];

  // Преобразование топ тайтлов Манхва
  const topManhwa =
    topManhwaData?.data?.data?.map(item => ({
      id: item._id,
      slug: (item as any).slug, // Добавляем поддержку slug для правильной навигации
      title: item.name,
      image: item.coverImage || "",
      description: item.description,
      views: item.views || 0,
      type: item.type || "Неуказан",
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.averageRating || item.rating || 0,
      genres: normalizeGenres(item.genres || []),
      isAdult: item.isAdult ?? false,
    })) || [];

  // Преобразование топ тайтлов 2026 года
  const top2026 =
    top2026Data?.data?.data?.map(item => ({
      id: item._id,
      slug: (item as any).slug, // Добавляем поддержку slug для правильной навигации
      title: item.name,
      image: item.coverImage || "",
      description: item.description,
      views: item.views || 0,
      type: item.type || "Неуказан",
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.averageRating || item.rating || 0,
      genres: normalizeGenres(item.genres || []),
      isAdult: item.isAdult ?? false,
    })) || [];

  // Преобразование прогресса чтения (сортировка по дате последнего чтения, самые свежие сначала)
  const readingHistoryArray = Array.isArray(readingHistory?.data)
    ? readingHistory.data
    : [];
  const readingProgress =
    readingHistoryArray
      .map(item => {
        // Проверяем, что chapters существует и это массив
        const chaptersArray = item.chapters && Array.isArray(item.chapters) ? item.chapters : [];

        const latestChapter =
          chaptersArray.length > 0
            ? chaptersArray.reduce((latest, current) => {
                return new Date(current.readAt) > new Date(latest.readAt) ? current : latest;
              })
            : null;

        // Безопасное получение данных о тайтле
        const titleData = item.titleId && typeof item.titleId === "object" ? item.titleId : {};
        const titleId =
          typeof item.titleId === "string"
            ? item.titleId
            : (titleData as { _id?: string })._id || "";

        const titleChapters = (titleData as { chapters?: Chapter[] }).chapters || [];
        const totalChapters = titleChapters.length;
        const currentChapter = latestChapter?.chapterNumber || 0;

        // Считаем новые главы по номеру: главы с номером больше последней прочитанной
        // (releaseDate не используется, т.к. API истории часто не возвращает его для глав)
        const newChapters = titleChapters.filter(
          (ch: Chapter) => (ch.chapterNumber ?? 0) > currentChapter,
        ).length;

        return {
          id: titleId,
          title: (titleData as { name?: string }).name || `Манга #${titleId}`,
          cover: (titleData as { coverImage?: string }).coverImage || "",
          currentChapter: currentChapter,
          totalChapters,
          newChaptersSinceLastRead: newChapters,
          type: (titleData as { type?: string }).type || "Неуказан",
          readingHistory: latestChapter
            ? {
                titleId,
                chapterId: latestChapter.chapterId,
                chapterNumber: latestChapter.chapterNumber,
                lastReadDate: latestChapter.readAt,
              }
            : undefined,
          // Добавляем timestamp для сортировки
          lastReadTimestamp: latestChapter ? new Date(latestChapter.readAt).getTime() : 0,
        };
      })
      .filter(item => item.currentChapter <= item.totalChapters && item.totalChapters > 0)
      // Сортировка по дате последнего чтения (свежие сначала)
      .sort((a, b) => b.lastReadTimestamp - a.lastReadTimestamp);

  return {
    popularTitles: {
      data: popularTitles,
      loading: popularTitlesLoading,
      error: popularTitlesError,
    },
    randomTitles: {
      data: randomTitles,
      loading: randomTitlesLoading,
      error: randomTitlesError,
    },
    trendingTitles: {
      data: trendingTitles,
      loading: trendingTitlesLoading,
      error: trendingTitlesError,
    },
    underratedTitles: {
      data: underratedTitles,
      loading: underratedTitlesLoading,
      error: underratedTitlesError,
    },
    readingProgress: {
      data: readingProgress,
      loading: readingHistoryLoading,
      error: readingHistoryError,
    },
    topManhua: {
      data: topManhua,
      loading: topManhuaLoading,
      error: topManhuaError,
    },
    topManhwa: {
      data: topManhwa,
      loading: topManhwaLoading,
      error: topManhwaError,
    },
    top2026: {
      data: top2026,
      loading: top2026Loading,
      error: top2026Error,
    },
  };
};
