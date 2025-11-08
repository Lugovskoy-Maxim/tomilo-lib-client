import { useGetPopularTitlesQuery } from "@/store/api/titlesApi";
import { useGetReadingHistoryQuery } from "@/store/api/authApi";

export const useHomeData = () => {
  // Популярные тайтлы
  const {
    data: popularTitlesData,
    isLoading: popularTitlesLoading,
    error: popularTitlesError,
  } = useGetPopularTitlesQuery();

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
    cover: item.cover,
    description: item.description,
    type: item.type || "Неуказан",
    releaseYear: item.releaseYear || new Date().getFullYear(), 
    rating: item.rating || 0,
    // genres: item.genres || [], // И берем жанры  если есть
  })) || [];

  // Преобразование прогресса чтения
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
    };
  }).filter(item => item.currentChapter <= item.totalChapters && item.totalChapters > 0) || [];

  return {
    popularTitles: {
      data: popularTitles,
      loading: popularTitlesLoading,
      error: popularTitlesError,
    },
    readingProgress: {
      data: readingProgress,
      loading: readingHistoryLoading,
      error: readingHistoryError,
    },
  };
};