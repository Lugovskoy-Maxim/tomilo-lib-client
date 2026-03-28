/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import {
  useGetPopularTitlesQuery,
  useGetRecentTitlesQuery,
  useSearchTitlesQuery,
  useGetRandomTitlesQuery,
} from "@/store/api/titlesApi";
import { normalizeGenres } from "@/lib/genre-normalizer";
import type { HomeFeaturedTitle } from "@/lib/map-popular-titles-home";

export type HomeVisibleSections = Partial<{
  popular: boolean;
  featured: boolean;
  recent: boolean;
  trending: boolean;
  underrated: boolean;
  reading: boolean;
  topCombined: boolean;
  random: boolean;
}>;

export interface HomeDataOptions {
  visibleSections?: HomeVisibleSections;
  includeAdult?: boolean;
  /** С сервера (page.tsx) — блок «Популярные» рисуется до ответа RTK, быстрее LCP */
  initialPopularTitles?: HomeFeaturedTitle[] | null;
}

export const useHomeData = (
  options: HomeDataOptions = {},
): {
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
  recentTitles: {
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
  const { visibleSections = {}, includeAdult = false, initialPopularTitles = null } = options;

  // Опции кэша: не дергать сервер при каждом заходе на главную.
  // refetchOnMountOrArgChange: 600 — обновлять только если данные старше 10 мин.
  const popularCacheOptions = {
    refetchOnMountOrArgChange: 600,
  };

  const skipPopular = !visibleSections.popular && !visibleSections.featured;
  const skipRecent = !visibleSections.recent;
  // блок «В тренде» отключён — запрос тренда не выполняется
  const skipUnderrated = !visibleSections.underrated;
  const skipTopCombined = !visibleSections.topCombined;
  const skipRandom = !visibleSections.random;

  // Популярные тайтлы — запрос только когда секция в viewport
  const {
    data: popularTitlesData,
    isLoading: popularTitlesQueryLoading,
    isUninitialized: popularTitlesUninitialized,
    error: popularTitlesError,
  } = useGetPopularTitlesQuery(
    { limit: 10, includeAdult },
    { ...popularCacheOptions, skip: skipPopular },
  );

  // Недавно добавленные в каталог
  const {
    data: recentTitlesData,
    isLoading: recentTitlesLoading,
    error: recentTitlesError,
  } = useGetRecentTitlesQuery(
    { limit: 18, includeAdult },
    { ...popularCacheOptions, skip: skipRecent },
  );

  // Случайные тайтлы
  const {
    data: randomTitlesData,
    isLoading: randomTitlesLoading,
    error: randomTitlesError,
  } = useGetRandomTitlesQuery(
    { limit: 10, includeAdult },
    { ...popularCacheOptions, skip: skipRandom },
  );

  // В тренде: поиск по weekViews — временно отключено
  // const {
  //   data: trendingTitlesData,
  //   isLoading: trendingTitlesLoading,
  //   error: trendingTitlesError,
  // } = useSearchTitlesQuery(
  //   {
  //     search: "",
  //     sortBy: "weekViews",
  //     sortOrder: "desc",
  //     limit: 20,
  //     includeAdult,
  //   },
  //   { ...popularCacheOptions, skip: skipTrending },
  // );

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
      includeAdult,
    },
    { ...popularCacheOptions, skip: skipUnderrated },
  );

  // Мемоизированное преобразование популярных тайтлов (RTK приоритетнее SSR-данных)
  const popularTitlesFromApi = useMemo(
    () =>
      popularTitlesData?.data?.map(item => ({
        id: item.id,
        slug: (item as any).slug,
        title: item.title,
        image: item.cover,
        description: item.description,
        type: item.type || "Неуказан",
        year: item.releaseYear || new Date().getFullYear(),
        rating: item.rating || 0,
        genres: [],
        isAdult: item.isAdult ?? false,
      })) || [],
    [popularTitlesData],
  );

  const popularTitles = useMemo((): HomeFeaturedTitle[] => {
    if (popularTitlesFromApi.length > 0) return popularTitlesFromApi;
    if (initialPopularTitles?.length) return initialPopularTitles;
    return [];
  }, [popularTitlesFromApi, initialPopularTitles]);

  const popularTitlesLoading =
    popularTitles.length === 0 &&
    (popularTitlesQueryLoading || popularTitlesUninitialized);

  // Мемоизированное преобразование случайных тайтлов
  const randomTitles = useMemo(
    () =>
      randomTitlesData?.data?.map(item => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        image: item.cover,
        description: item.description,
        type: item.type || "Неуказан",
        year: item.releaseYear || new Date().getFullYear(),
        rating: item.rating || 0,
        genres: [],
        isAdult: item.isAdult ?? false,
      })) || [],
    [randomTitlesData],
  );

  // Мемоизированное преобразование недавно добавленных
  const recentTitles = useMemo(
    () =>
      recentTitlesData?.data?.map((item: any) => ({
        id: item.id ?? item._id,
        slug: item.slug,
        title: item.title ?? item.name ?? "",
        image: item.cover ?? item.coverImage,
        description: item.description,
        type: item.type || "Неуказан",
        year: item.releaseYear ?? new Date().getFullYear(),
        rating: item.rating ?? 0,
        genres: [],
        isAdult: item.isAdult ?? false,
      })) ?? [],
    [recentTitlesData],
  );

  // Мемоизированное преобразование трендовых — отключено вместе с запросом
  // const trendingTitles = useMemo(() =>
  //   trendingTitlesData?.data?.data?.map((item: any) => ({
  //     id: item._id,
  //     slug: item.slug,
  //     title: item.name,
  //     image: item.coverImage || "",
  //     description: item.description,
  //     views: item.views || 0,
  //     weekViews: item.weekViews ?? 0,
  //     type: item.type || "Неуказан",
  //     year: item.releaseYear || new Date().getFullYear(),
  //     rating: item.averageRating || item.rating || 0,
  //     genres: normalizeGenres(item.genres || []),
  //     isAdult: item.isAdult ?? false,
  //   })) || [],
  //   [trendingTitlesData]
  // );
  const trendingTitles: { data: any[]; loading: boolean; error: unknown } = useMemo(
    () => ({ data: [], loading: false, error: null }),
    [],
  );

  // Мемоизированное преобразование кандидатов для блока "Недооцененные"
  const underratedTitles = useMemo(() => {
    const candidates =
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

    if (candidates.length === 0) return [];

    const viewsDistribution = candidates.map(item => item.views).sort((a, b) => a - b);
    const lowViewsThreshold = viewsDistribution[Math.floor(viewsDistribution.length * 0.35)] || 0;

    const filtered = candidates
      .filter(item => item.rating >= 7.5 && item.views <= lowViewsThreshold)
      .slice(0, 20);

    return filtered.length > 0
      ? filtered
      : candidates
          .filter(item => item.rating >= 7)
          .sort((a, b) => a.views - b.views)
          .slice(0, 20);
  }, [underratedCandidatesData]);

  // Топ по типам и году — поиск по views, всегда заполненные колонки и просмотры
  const topQueries = [
    useSearchTitlesQuery(
      {
        search: "",
        types: "manhua",
        sortBy: "views",
        sortOrder: "desc",
        limit: 5,
        includeAdult,
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
        includeAdult,
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
        includeAdult,
      },
      { ...popularCacheOptions, skip: skipTopCombined },
    ),
  ];

  const [topManhuaData, topManhwaData, top2026Data] = topQueries.map(q => q.data);
  const [topManhuaLoading, topManhwaLoading, top2026Loading] = topQueries.map(q => q.isLoading);
  const [topManhuaError, topManhwaError, top2026Error] = topQueries.map(q => q.error);

  const topManhua = useMemo(
    () =>
      topManhuaData?.data?.data?.map((item: any) => ({
        id: item._id,
        slug: item.slug,
        title: item.name,
        image: item.coverImage || "",
        description: item.description ?? "",
        type: item.type || "Неуказан",
        views: item.views || 0,
        year: item.releaseYear || new Date().getFullYear(),
        rating: item.averageRating ?? item.rating ?? 0,
        genres: item.genres ?? [],
        isAdult: item.isAdult ?? false,
      })) ?? [],
    [topManhuaData],
  );

  const topManhwa = useMemo(
    () =>
      topManhwaData?.data?.data?.map((item: any) => ({
        id: item._id,
        slug: item.slug,
        title: item.name,
        image: item.coverImage || "",
        description: item.description ?? "",
        type: item.type || "Неуказан",
        views: item.views || 0,
        year: item.releaseYear || new Date().getFullYear(),
        rating: item.averageRating ?? item.rating ?? 0,
        genres: item.genres ?? [],
        isAdult: item.isAdult ?? false,
      })) ?? [],
    [topManhwaData],
  );

  const top2026 = useMemo(
    () =>
      top2026Data?.data?.data?.map((item: any) => ({
        id: item._id,
        slug: item.slug,
        title: item.name,
        image: item.coverImage || "",
        description: item.description ?? "",
        type: item.type || "Неуказан",
        views: item.views || 0,
        year: item.releaseYear || new Date().getFullYear(),
        rating: item.averageRating ?? item.rating ?? 0,
        genres: item.genres ?? [],
        isAdult: item.isAdult ?? false,
      })) ?? [],
    [top2026Data],
  );

  return {
    popularTitles: {
      data: popularTitles,
      loading: popularTitlesLoading,
      error: popularTitlesError,
    },
    recentTitles: {
      data: recentTitles,
      loading: recentTitlesLoading,
      error: recentTitlesError,
    },
    randomTitles: {
      data: randomTitles,
      loading: randomTitlesLoading,
      error: randomTitlesError,
    },
    trendingTitles: {
      data: trendingTitles.data,
      loading: trendingTitles.loading,
      error: trendingTitles.error,
    },
    underratedTitles: {
      data: underratedTitles,
      loading: underratedTitlesLoading,
      error: underratedTitlesError,
    },
    topManhua: { data: topManhua, loading: topManhuaLoading, error: topManhuaError },
    topManhwa: { data: topManhwa, loading: topManhwaLoading, error: topManhwaError },
    top2026: { data: top2026, loading: top2026Loading, error: top2026Error },
  };
};
