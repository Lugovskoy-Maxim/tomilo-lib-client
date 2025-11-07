"use client";
import { useState, useEffect, ComponentType } from "react";
import {
  BookOpen,
  Clock,
  LibraryIcon,
  SquareArrowOutUpRight,
  Trophy,
} from "lucide-react";

import { CarouselCard, CollectionCard, ReadingCard } from "@/shared";
import LatestUpdateCard from "@/shared/last-updates/last-updates";
import { Carousel, Footer, GridSection, Header } from "@/widgets";
import { pageTitle } from "@/lib/page-title";
import { useAuth } from "@/hooks/useAuth";
import { useGetPopularTitlesQuery } from "@/store/api/titlesApi";
import { useGetReadingHistoryQuery, ReadingHistoryChapter } from "@/store/api/authApi";


import { Title, TitleType } from "@/types/title";
import {
  PopularTitle,
  Collection,
  ReadingProgress,
  LatestUpdate,
  CarouselCardData,
  CollectionCardData,
  ReadingCardData,
  LatestUpdateCardData,
  CarouselCardComponent,
  CollectionCardComponent,
  ReadingCardComponent,
  LatestUpdateCardComponent,
  CarouselProps,
} from "@/types/home";

// Адаптеры для преобразования данных API в данные компонентов
const getTitleTypeString = (type: TitleType): string => {
  switch (type) {
    case TitleType.MANGA:
      return "Манга";
    case TitleType.MANHWA:
      return "Манхва";
    case TitleType.MANHUA:
      return "Маньхуа";
    case TitleType.NOVEL:
      return "Ранобэ";
    case TitleType.LIGHT_NOVEL:
      return "Лайт-новелла";
    case TitleType.COMIC:
      return "Комикс";
    case TitleType.OTHER:
      return "Другое";
    default:
      return "Манга";
  }
};

const adaptTitleToCarouselCard = (
  title: Title,
  index: number
): CarouselCardData => ({
  id: String(title._id),
  title: title.name,
  type: title.type ? getTitleTypeString(title.type) : "Неизвестный",
  year: title.releaseYear,
  rating: title.rating,
  image: title.coverImage,
  genres: title.genres,
});

const adaptCollectionToCollectionCard = (
  collection: Collection,
  index: number
): CollectionCardData => ({
  id: String(collection.id || `collection-${index}`),
  name: collection.name,
  image: collection.image,
  link: collection.link,
});

const adaptReadingProgressToReadingCard = (
  progress: ReadingProgress,
  titleData: Title | null,
  index: number
): ReadingCardData => {
  const titleId = typeof progress.titleId === 'object' ? progress.titleId._id || progress.titleId.id || '' : progress.titleId;
  const chapterId = typeof progress.chapterId === 'object' ? progress.chapterId._id || progress.chapterId.id || '' : progress.chapterId;
  const chapterNumber = progress.chapterNumber;
  const lastReadDate = progress.lastReadDate;

  // Рассчитываем количество новых глав с момента последнего чтения
  let newChaptersSinceLastRead = 0;
  const totalChapters = titleData?.chapters?.length || (typeof progress.titleId === 'object' ? progress.titleId.totalChapters : undefined) || 0;

  if (lastReadDate && totalChapters > 0) {
    // TODO: Получить данные глав с датами публикации для точного подсчета
    // Пока используем заглушку - считаем все главы после текущей как новые
    newChaptersSinceLastRead = Math.max(0, totalChapters - chapterNumber);
  } else {
    // Fallback на старую логику, если нет даты последнего чтения
    newChaptersSinceLastRead = Math.max(0, totalChapters - chapterNumber);
  }

  // Для "Продолжить чтение" currentChapter - это следующая глава для чтения
  const nextChapterNumber = chapterNumber < totalChapters ? chapterNumber + 1 : chapterNumber;

  return {
    id: titleId,
    title: titleData?.name || (typeof progress.titleId === 'object' ? progress.titleId.name : undefined) || `Манга #${titleId || 'Unknown'}`,
    cover: titleData?.coverImage || (typeof progress.titleId === 'object' ? progress.titleId.coverImage : undefined) || "",
    currentChapter: nextChapterNumber, // Следующая глава для чтения
    totalChapters: titleData?.chapters?.length || (typeof progress.titleId === 'object' ? progress.titleId.totalChapters : undefined) || 0,
    newChaptersSinceLastRead,
    type: titleData?.type ? getTitleTypeString(titleData.type) : (typeof progress.titleId === 'object' ? (progress.titleId.type ? getTitleTypeString(progress.titleId.type as TitleType) : undefined) : undefined) || "Манга",
    readingHistory: {
      titleId: typeof progress.titleId === 'string' ? progress.titleId : (progress.titleId && typeof progress.titleId === 'object' ? progress.titleId._id || progress.titleId.id || '' : ''),
      chapterId: typeof progress.chapterId === 'string' ? progress.chapterId : (progress.chapterId && typeof progress.chapterId === 'object' ? progress.chapterId._id || progress.chapterId.id || '' : ''),
      chapterNumber: progress.chapterNumber, // Последняя прочитанная глава
      lastReadDate: progress.lastReadDate,
    },
  };
};

const adaptLatestUpdateToLatestUpdateCard = (
  update: LatestUpdate,
  index: number
): LatestUpdateCardData => ({
  id: String(update.id || `update-${index}`),
  title: update.title,
  cover: update.cover,
  chapter: update.chapter,
  chapterNumber: update.chapterNumber,
  timeAgo: update.timeAgo,
});

// Универсальный хук для данных
function useApiData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}${endpoint}`);

        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        const result = await response.json();

        if (result && typeof result === "object" && "data" in result) {
          if (Array.isArray(result.data)) {
            setData(result.data);
          }
          else if (
            result.data &&
            typeof result.data === "object" &&
            "data" in result.data &&
            Array.isArray(result.data.data)
          ) {
            setData(result.data.data);
          }
          else {
            setData([]);
          }
        }
        else if (Array.isArray(result)) {
          setData(result);
        }
        else {
          setData([]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(errorMessage);
        console.error(`Error fetching ${endpoint}:`, err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl, endpoint]);

  return { data, loading, error };
}

// Компоненты скелетонов
function CarouselSkeleton() {
  return (
    <div className="carousel-skeleton animate-pulse">
      <div className="h-8 bg-[var(--muted)] rounded w-48 mb-4"></div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={`carousel-skeleton-${i}`} className="flex-shrink-0">
            <div className="w-30 h-40 bg-[var(--muted)] rounded-lg mb-2"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-24"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
      {[...Array(12)].map((_, i) => (
        <div key={`grid-skeleton-${i}`}>
          <div className="w-full h-48 bg-[var(--muted)] rounded-lg mb-2"></div>
          <div className="h-4 bg-[var(--muted)] rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

// Типизированная функция рендера карусели
function renderCarousel<T>(
  title: string,
  data: T[],
  cardComponent: ComponentType<{ data: T }>,
  props: Omit<CarouselProps<T>, "title" | "data" | "cardComponent">,
  isLoading: boolean,
  error: string | null,
  mounted: boolean
): React.ReactNode {
  if (!mounted || isLoading) return <CarouselSkeleton />;
  if (error) {
    console.error(`Ошибка загрузки ${title}:`, error);
    return null;
  }
  if (!data.length) return null;

  return (
    <Carousel
      title={title}
      data={data}
      cardComponent={cardComponent}
      {...props}
    />
  );
}

// Главный компонент
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const {
    data: popularTitlesData,
    isLoading: popularTitlesLoading,
    error: popularTitlesError,
  } = useGetPopularTitlesQuery();
  const popularTitlesErrorMessage =
    popularTitlesError && "message" in popularTitlesError
      ? popularTitlesError.message || null
      : null;
  const collections = useApiData<Collection>("/collections");
  const { continueReading, readingHistoryLoading: authReadingHistoryLoading, readingHistoryError: authReadingHistoryError } =
    useAuth();
  const continueReadingArray = continueReading || [];
  const latestUpdates = useApiData<LatestUpdate>("/titles/latest-updates");
  const [fullTitlesData, setFullTitlesData] = useState<Record<string, Title>>({});
  const [titleData, setTitleData] = useState<Record<string, Title>>({});
  const [errorItems, setErrorItems] = useState<Record<string, boolean>>({});
  const {
    data: readingHistory,
  } = useGetReadingHistoryQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    pageTitle.setTitlePage("Tomilo-lib.ru - Платформа манги и комиксов");
  }, []);

  // Получаем полные данные о популярных тайтлах
  useEffect(() => {
    if (!popularTitlesData?.data || popularTitlesData.data.length === 0) return;

    const fetchFullTitleData = async (popularTitle: PopularTitle) => {
      if (!fullTitlesData[popularTitle.id]) {
        try {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/titles/${popularTitle.id}`
          );
          const result = await response.json();

          if (result && typeof result === "object" && "success" in result) {
            if (result.success && result.data) {
              setFullTitlesData((prev) => ({
                ...prev,
                [popularTitle.id]: result.data!,
              }));
            }
          } else if (result && typeof result === "object" && "_id" in result) {
            setFullTitlesData((prev) => ({
              ...prev,
              [popularTitle.id]: result,
            }));
          }
        } catch (error) {
          console.error(
            "Ошибка при получении данных о популярном тайтле:",
            error
          );
        }
      }
    };

    popularTitlesData.data.forEach(fetchFullTitleData);
  }, [popularTitlesData, fullTitlesData]);

  // Получаем данные о манге для каждого тайтла из истории чтения
  useEffect(() => {
    if (!readingHistory?.data || readingHistory.data.length === 0) return;

    const fetchTitleData = async (item: { titleId: string; chapters: ReadingHistoryChapter[] }) => {
      const titleId: string = item.titleId;
      if (!titleData[titleId] && !errorItems[titleId]) {
        try {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/titles/${titleId}`
          );
          const result = await response.json();

          if (result && typeof result === "object" && "success" in result) {
            if (result.success && result.data) {
              setTitleData((prev) => ({
                ...prev,
                [titleId]: result.data!,
              }));
            } else {
              setErrorItems((prev) => ({
                ...prev,
                [titleId]: true,
              }));
            }
          } else if (result && typeof result === "object" && "_id" in result) {
            setTitleData((prev) => ({
              ...prev,
              [titleId]: result,
            }));
          } else {
            setErrorItems((prev) => ({
              ...prev,
              [titleId]: true,
            }));
          }
        } catch (error) {
          console.error(
            "Ошибка при получении данных о тайтле из истории чтения:",
            error
          );
          setErrorItems((prev) => ({
            ...prev,
            [titleId]: true,
          }));
        }
      }
    };

    readingHistory.data.forEach(fetchTitleData);
  }, [readingHistory, titleData, errorItems]);

  // Преобразуем данные API в формат, ожидаемый компонентами
  const adaptedPopularTitles =
    popularTitlesData?.data?.map((popularTitle, index) => {
      const fullTitle = fullTitlesData[popularTitle.id];
      if (fullTitle) {
        return adaptTitleToCarouselCard(fullTitle, index);
      } else {
        return {
          id: String(popularTitle.id),
          title: popularTitle.title,
          type: "Манга",
          year: new Date().getFullYear(),
          rating: popularTitle.rating ?? 0,
          image: popularTitle.cover,
          genres: [],
        };
      }
    }) || [];

  const adaptedCollections = collections.data.map((collection, index) =>
    adaptCollectionToCollectionCard(collection, index)
  );

  const adaptedReadingProgress =
    readingHistory?.data?.map((entry, index) => {
      const titleId = entry.titleId;
      const titleInfo = titleData[titleId];
      // Get the latest chapter from the entry
      const latestChapter = entry.chapters.reduce((latest, current) =>
        new Date(current.readAt) > new Date(latest.readAt) ? current : latest
      );
      const progress: ReadingProgress = {
        titleId: entry.titleId,
        chapterId: latestChapter.chapterId,
        chapterNumber: latestChapter.chapterNumber,
        lastReadDate: latestChapter.readAt,
      };
      return adaptReadingProgressToReadingCard(
        progress,
        titleInfo || null,
        index
      );
    }) || [];

  // Фильтруем только те тайтлы, где есть непрочитанные главы
  const filteredReadingProgress = adaptedReadingProgress.filter(item => {
    return item.currentChapter <= item.totalChapters && item.totalChapters > 0;
  });

  const adaptedLatestUpdates = latestUpdates.data.map((update, index) =>
    adaptLatestUpdateToLatestUpdateCard(update, index)
  );

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex flex-col items-center justify-center gap-6">
          <CarouselSkeleton />
          <CarouselSkeleton />
          <CarouselSkeleton />
          <GridSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center gap-6">
        {/* Популярные тайтлы */}
        {renderCarousel(
          "Популярные тайтлы",
          adaptedPopularTitles,
          CarouselCard as unknown as CarouselCardComponent,
          {
            type: "browse",
            icon: <Trophy className="w-6 h-6" />,
            navigationIcon: <SquareArrowOutUpRight className="w-6 h-6" />,
            cardWidth: "w-30 sm:w-30 md:w-35 lg:w-40",
          },
          popularTitlesLoading,
          popularTitlesErrorMessage,
          mounted
        )}

        {/* Коллекции */}
        {renderCarousel(
          "Коллекции по темам",
          adaptedCollections,
          CollectionCard as CollectionCardComponent,
          {
            description:
              "Здесь подобраны самые популярные коллекции, которые вы можете прочитать.",
            type: "collection",
            href: "/collections",
            cardWidth: "w-24 sm:w-28 md:w-32 lg:w-36",
            icon: <LibraryIcon className="w-6 h-6" />,
            showNavigation: false,
            navigationIcon: <SquareArrowOutUpRight className="w-6 h-6" />,
          },
          collections.loading,
          collections.error,
          mounted
        )}

        {/* Продолжить чтение */}
        {renderCarousel(
          "Продолжить чтение",
          filteredReadingProgress,
          ReadingCard as unknown as ReadingCardComponent,
          {
            description:
              "Это главы, которые вы ещё не прочитали. Данный список генерируется на основании вашей истории чтения.",
            type: "browse",
            icon: <BookOpen className="w-6 h-6" />,
            navigationIcon: <SquareArrowOutUpRight className="w-6 h-6" />,
            descriptionLink: { text: "истории чтения", href: "/profile" },
            showNavigation: false,
            cardWidth: "w-68 sm:w-72 md:w-80 lg:w-96",
          },
          authReadingHistoryLoading,
          authReadingHistoryError && "message" in authReadingHistoryError
            ? authReadingHistoryError.message || null
            : null,
          mounted
        )}

        {/* Последние обновления */}
        {!mounted || latestUpdates.loading ? (
          <GridSkeleton />
        ) : latestUpdates.error ? null : adaptedLatestUpdates.length > 0 ? (
          <GridSection
            title="Последние обновления"
            description="Свежие главы, которые только что вышли. Смотрите все обновления в каталоге."
            type="browse"
            href="/updates"
            icon={<Clock className="w-6 h-6" />}
            data={adaptedLatestUpdates}
            cardComponent={
              LatestUpdateCard as unknown as LatestUpdateCardComponent
            }
          />
        ) : null}
      </main>
      <Footer />
    </>
  );
}