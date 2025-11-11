import { useGetPopularTitlesQuery, useGetTopTitlesDayQuery, useGetTopTitlesWeekQuery, useGetTopTitlesMonthQuery } from "@/store/api/titlesApi";
import { useGetReadingHistoryQuery } from "@/store/api/authApi";

export const useHomeData = () => {
  // Популярные тайтлы
  const {
    data: popularTitlesData,
    isLoading: popularTitlesLoading,
    error: popularTitlesError,
  } = useGetPopularTitlesQuery();

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

  // История чтения
  const {
    data: readingHistory,
    isLoading: readingHistoryLoading,
    error: readingHistoryError,
  } = useGetReadingHistoryQuery();

  // Преобразование популярных тайтлов
  const popularTitles = popularTitlesData?.data?.map(item => ({
    id: item.id,
    title: item.title,
    image: item.cover,
    description: item.description,
    type: item.type || "Неуказан",
    year: item.releaseYear || new Date().getFullYear(),
    rating: item.rating || 0,
    genres: [], // Сервер не возвращает жанры для популярных тайтлов
  })) || [];

  // Преобразование топ тайтлов за день
  const topTitlesDay = topTitlesDayData?.data?.map(item => ({
    id: item.id,
    title: item.title,
    image: item.cover,
    description: item.description,
    type: item.type || "Неуказан",
    year: item.releaseYear || new Date().getFullYear(),
    rating: item.rating || 0,
    genres: [], // Сервер не возвращает жанры для топ тайтлов
  })) || [];

  // Преобразование топ тайтлов за неделю
  const topTitlesWeek = topTitlesWeekData?.data?.map(item => ({
    id: item.id,
    title: item.title,
    image: item.cover,
    description: item.description,
    type: item.type || "Неуказан",
    year: item.releaseYear || new Date().getFullYear(),
    rating: item.rating || 0,
    genres: [], // Сервер не возвращает жанры для топ тайтлов
  })) || [];

  // Преобразование топ тайтлов за месяц
  const topTitlesMonth = topTitlesMonthData?.data?.map(item => ({
    id: item.id,
    title: item.title,
    image: item.cover,
    description: item.description,
    type: item.type || "Неуказан",
    year: item.releaseYear || new Date().getFullYear(),
    rating: item.rating || 0,
    genres: [], // Сервер не возвращает жанры для топ тайтлов
  })) || [];

  // Преобразование прогресса чтения (сортировка по дате последнего чтения, самые свежие сначала)
  const readingProgress = readingHistory?.data?.map(item => {
    // Проверяем, что chapters существует и это массив
    const chaptersArray = item.chapters && Array.isArray(item.chapters) ? item.chapters : [];

    const latestChapter = chaptersArray.length > 0 ? chaptersArray.reduce((latest, current) => {
      return new Date(current.readAt) > new Date(latest.readAt) ? current : latest;
    }) : null;

    // Безопасное получение данных о тайтле
    const titleData = item.titleId && typeof item.titleId === 'object' ? item.titleId : {};
    const titleId = typeof item.titleId === 'string' ? item.titleId : (titleData as { _id?: string })._id || '';

    const totalChapters = (titleData as { chapters?: { chapterNumber: number }[] }).chapters?.length || 0;
    const currentChapter = latestChapter?.chapterNumber || 0;
    const newChapters = Math.max(0, totalChapters - currentChapter);

    return {
      id: titleId,
      title: (titleData as { name?: string }).name || `Манга #${titleId}`,
      cover: (titleData as { coverImage?: string }).coverImage || "",
      currentChapter: currentChapter,
      totalChapters,
      newChaptersSinceLastRead: newChapters,
      type: (titleData as { type?: string }).type || "Неуказан",
      readingHistory: latestChapter ? {
        titleId,
        chapterId: latestChapter.chapterId,
        chapterNumber: latestChapter.chapterNumber,
        lastReadDate: latestChapter.readAt,
      } : undefined,
      // Добавляем timestamp для сортировки
      lastReadTimestamp: latestChapter ? new Date(latestChapter.readAt).getTime() : 0,
    };
  })
  .filter(item => item.currentChapter <= item.totalChapters && item.totalChapters > 0)
  // Сортировка по дате последнего чтения (свежие сначала)
  .sort((a, b) => b.lastReadTimestamp - a.lastReadTimestamp) || [];

  return {
    popularTitles: {
      data: popularTitles,
      loading: popularTitlesLoading,
      error: popularTitlesError,
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
    readingProgress: {
      data: readingProgress,
      loading: readingHistoryLoading,
      error: readingHistoryError,
    },
  };
};
