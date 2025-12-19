/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useGetPopularTitlesQuery,
  useSearchTitlesQuery,
  useGetRandomTitlesQuery,
  useGetTopTitlesDayQuery,
  useGetTopTitlesWeekQuery,
  useGetTopTitlesMonthQuery,
} from "@/store/api/titlesApi";
import { useGetReadingHistoryQuery } from "@/store/api/authApi";
import { Chapter } from "@/types/title";
import { TopTitleData } from "@/types/home";
import { normalizeGenres } from "@/lib/genre-normalizer";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export const useHomeData = (): {

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
  top2025: {
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
  topTitlesDay: TopTitleData;
  topTitlesWeek: TopTitleData;
  topTitlesMonth: TopTitleData;
} => {
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

  
  // Популярные тайтлы
  const {
    data: popularTitlesData,
    isLoading: popularTitlesLoading,
    error: popularTitlesError,
  } = useGetPopularTitlesQuery();

  // Случайные тайтлы
  const {
    data: randomTitlesData,
    isLoading: randomTitlesLoading,
    error: randomTitlesError,
  } = useGetRandomTitlesQuery({ limit: 10 });

  // Топ тайтлы за день
  const {
    data: topTitlesDayData,
    isLoading: topTitlesDayLoading,
    error: topTitlesDayError,
  } = useGetTopTitlesDayQuery({ limit: 10 });

  // Топ тайтлы за неделю
  const {
    data: topTitlesWeekData,
    isLoading: topTitlesWeekLoading,
    error: topTitlesWeekError,
  } = useGetTopTitlesWeekQuery({ limit: 10 });

  // Топ тайтлы за месяц
  const {
    data: topTitlesMonthData,
    isLoading: topTitlesMonthLoading,
    error: topTitlesMonthError,
  } = useGetTopTitlesMonthQuery({ limit: 10 });

  // Топ тайтлы Маньхуа
  const {
    data: topManhuaData,
    isLoading: topManhuaLoading,
    error: topManhuaError,
  } = useSearchTitlesQuery({
    search: "",
    type: "manhua",
    sortBy: "views",
    sortOrder: "desc",
    limit: 5,
  });

  // Топ тайтлы Манхва
  const {
    data: topManhwaData,
    isLoading: topManhwaLoading,
    error: topManhwaError,
  } = useSearchTitlesQuery({
    search: "",
    type: "manhwa",
    sortBy: "views",
    sortOrder: "desc",
    limit: 5,
  });

  // Топ тайтлы 2025 года
  const {
    data: top2025Data,
    isLoading: top2025Loading,
    error: top2025Error,
  } = useSearchTitlesQuery({
    search: "",
    releaseYear: 2025,
    sortBy: "views",
    sortOrder: "desc",
    limit: 5,
  });

  // История чтения
  const {
    data: readingHistory,
    isLoading: readingHistoryLoading,
    error: readingHistoryError,
  } = useGetReadingHistoryQuery(undefined, {
    skip: !getToken(),
  });



  // Преобразование популярных тайтлов
  const popularTitles =
    popularTitlesData?.data?.map((item) => ({
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
    randomTitlesData?.data?.map((item) => ({
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


  // Преобразование топ тайтлов Маньхуа
  const topManhua =
    topManhuaData?.data?.data?.map((item) => ({
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

  // Преобразование топ тайтлов за день
  const topTitlesDay =
    topTitlesDayData?.data?.map((item) => ({
      id: item.id,
      title: item.title,
      image: item.cover,
      description: item.description,
      type: item.type || "Неуказан",
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.rating || 0,
      genres: [], // Жанры не возвращаются для топ тайтлов
      isAdult: item.isAdult ?? false,
      ratingCount: item.ratingCount || 0,
    })) || [];

  // Преобразование топ тайтлов за неделю
  const topTitlesWeek =
    topTitlesWeekData?.data?.map((item) => ({
      id: item.id,
      title: item.title,
      image: item.cover,
      description: item.description,
      type: item.type || "Неуказан",
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.rating || 0,
      genres: [], // Жанры не возвращаются для топ тайтлов
      isAdult: item.isAdult ?? false,
      ratingCount: item.ratingCount || 0,
    })) || [];

  // Преобразование топ тайтлов за месяц
  const topTitlesMonth =
    topTitlesMonthData?.data?.map((item) => ({
      id: item.id,
      title: item.title,
      image: item.cover,
      description: item.description,
      type: item.type || "Неуказан",
      year: item.releaseYear || new Date().getFullYear(),
      rating: item.rating || 0,
      genres: [], // Жанры не возвращаются для топ тайтлов
      isAdult: item.isAdult ?? false,
      ratingCount: item.ratingCount || 0,
    })) || [];


  // Преобразование топ тайтлов Манхва
  const topManhwa =
    topManhwaData?.data?.data?.map((item) => ({
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


  // Преобразование топ тайтлов 2025 года
  const top2025 =
    top2025Data?.data?.data?.map((item) => ({
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
  const readingProgress =
    readingHistory?.data
      ?.map((item) => {
        // Проверяем, что chapters существует и это массив
        const chaptersArray =
          item.chapters && Array.isArray(item.chapters) ? item.chapters : [];

        const latestChapter =
          chaptersArray.length > 0
            ? chaptersArray.reduce((latest, current) => {
                return new Date(current.readAt) > new Date(latest.readAt)
                  ? current
                  : latest;
              })
            : null;

        // Безопасное получение данных о тайтле
        const titleData =
          item.titleId && typeof item.titleId === "object" ? item.titleId : {};
        const titleId =
          typeof item.titleId === "string"
            ? item.titleId
            : (titleData as { _id?: string })._id || "";

        const titleChapters =
          (titleData as { chapters?: Chapter[] }).chapters || [];
        const totalChapters = titleChapters.length;
        const currentChapter = latestChapter?.chapterNumber || 0;

        // Calculate new chapters based on release date vs last read date
        const lastReadDate = latestChapter
          ? new Date(latestChapter.readAt)
          : new Date(0);
        const newChapters = titleChapters.filter(
          (ch: Chapter) =>
            ch.releaseDate && new Date(ch.releaseDate) > lastReadDate
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
          lastReadTimestamp: latestChapter
            ? new Date(latestChapter.readAt).getTime()
            : 0,
        };
      })
      .filter(
        (item) =>
          item.currentChapter <= item.totalChapters && item.totalChapters > 0
      )
      // Сортировка по дате последнего чтения (свежие сначала)
      .sort((a, b) => b.lastReadTimestamp - a.lastReadTimestamp) || [];

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
    top2025: {
      data: top2025,
      loading: top2025Loading,
      error: top2025Error,
    },
    topTitlesDay: {
      data: topTitlesDay,
      loading: topTitlesDayLoading,
      error: topTitlesDayError,
    },
    topTitlesWeek: {
      data: topTitlesWeek,
      loading: topTitlesWeekLoading,
      error: topTitlesWeekError,
    },
    topTitlesMonth: {
      data: topTitlesMonth,
      loading: topTitlesMonthLoading,
      error: topTitlesMonthError,
    },
  };
};
