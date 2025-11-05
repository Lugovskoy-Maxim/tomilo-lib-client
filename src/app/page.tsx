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
import { ContinueReadingButton } from "@/shared/continue-reading-button";
import { useAuth } from "@/hooks/useAuth";
import { useGetPopularTitlesQuery } from "@/store/api/titlesApi";

// Базовые типы данных из API
import { Title as ApiTitle, Title, TitleType } from "@/types/title";

// Тип данных, который возвращает сервер для популярных тайтлов
interface PopularTitle {
  id: string;
  title: string;
  cover?: string;
  description?: string;
  rating?: number;
}

interface Collection {
  id: string;
  name: string;
  image: string;
  link: string;
}

interface ReadingProgress {
  titleId: string;
  chapterId: string;
  chapterNumber: number;
}

interface LatestUpdate {
  id: string;
  title: string;
  cover: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
}

// Типы для пропсов компонентов карточек
interface CarouselCardData {
  id: string; // Изменено на string
  title: string;
  type: string;
  year: number;
  rating: number;
  image?: string;
  genres: string[];
}

interface CollectionCardData {
  id: string;
  name: string;
  image: string;
  link: string;
}

interface ReadingCardData {
  id: string;
  title: string;
  cover: string;
  currentChapter: number;
  totalChapters: number;
  chaptersRead: number;
  type: string;
}

interface LatestUpdateCardData {
  id: string;
  title: string;
  cover: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
}

// Адаптеры для преобразования данных API в данные компонентов
// Вспомогательная функция для преобразования типа TitleType в строку
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
  id: title._id, // Используем _id из Title
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
  id: collection.id || `collection-${index}`,
  name: collection.name,
  image: collection.image,
  link: collection.link,
});

const adaptReadingProgressToReadingCard = (
  progress: ReadingProgress,
  titleData: Title | null, 
  index: number
): ReadingCardData => ({
  id: progress.titleId || `progress-${index}`,
  title: titleData?.name || `Манга #${progress.titleId}`,
  cover: titleData?.coverImage || "",
  currentChapter: progress.chapterNumber,
  totalChapters: titleData?.chapters?.length || 0,
  chaptersRead: Math.max(
    0,
    (titleData?.chapters?.length || 0) - progress.chapterNumber
  ),
  type: titleData?.type ? getTitleTypeString(titleData.type) : "Манга",
});

const adaptLatestUpdateToLatestUpdateCard = (
  update: LatestUpdate,
  index: number
): LatestUpdateCardData => ({
  id: update.id || `update-${index}`,
  title: update.title,
  cover: update.cover,
  chapter: update.chapter,
  chapterNumber: update.chapterNumber,
  timeAgo: update.timeAgo,
});

// Типы для компонентов
type CarouselCardComponent = ComponentType<{ data: CarouselCardData }>;
type CollectionCardComponent = ComponentType<{ data: CollectionCardData }>;
type ReadingCardComponent = ComponentType<{ data: ReadingCardData }>;
type LatestUpdateCardComponent = ComponentType<{ data: LatestUpdateCardData }>;

// Пропсы для карусели
interface CarouselProps<T> {
  title: string;
  data: T[];
  cardComponent: ComponentType<{ data: T }>;
  type: "browse" | "collection";
  href?: string;
  description?: string;
  icon?: React.ReactNode;
  navigationIcon?: React.ReactNode;
  cardWidth?: string;
  showNavigation?: boolean;
  descriptionLink?: {
    text: string;
    href: string;
  };
}

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
        console.log(`Data fetched from ${endpoint}:`, result);
        // Проверяем, есть ли у ответа обертка ApiResponseDto
        if (result && typeof result === "object" && "data" in result) {
          // Если это массив, используем его напрямую
          if (Array.isArray(result.data)) {
            setData(result.data);
          }
          // Если это объект с массивом внутри, используем этот массив
          else if (
            result.data &&
            typeof result.data === "object" &&
            "data" in result.data &&
            Array.isArray(result.data.data)
          ) {
            setData(result.data.data);
          }
          // В других случаях используем пустой массив
          else {
            setData([]);
          }
        }
        // Если нет обертки ApiResponseDto, используем результат напрямую (если это массив)
        else if (Array.isArray(result)) {
          setData(result);
        }
        // В других случаях используем пустой массив
        else {
          setData([]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(errorMessage);
        console.error(`Error fetching ${endpoint}:`, err);
        setData([]); // Устанавливаем пустой массив в случае ошибки
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
    <div className="carousel-skeleton animate-pulse" suppressHydrationWarning>
      <div className="h-8 bg-gray-200 rounded w-48 mb-4" suppressHydrationWarning></div>
      <div className="flex gap-4 overflow-hidden" suppressHydrationWarning>
        {[...Array(6)].map((_, i) => (
          <div key={`carousel-skeleton-${i}`} className="flex-shrink-0" suppressHydrationWarning>
            <div className="w-30 h-40 bg-gray-200 rounded-lg mb-2" suppressHydrationWarning></div>
            <div className="h-4 bg-gray-200 rounded w-24" suppressHydrationWarning></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse" suppressHydrationWarning>
      {[...Array(12)].map((_, i) => (
        <div key={`grid-skeleton-${i}`} suppressHydrationWarning>
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-2" suppressHydrationWarning></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" suppressHydrationWarning></div>
          <div className="h-3 bg-gray-200 rounded w-1/2" suppressHydrationWarning></div>
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
  const popularTitlesErrorMessage = popularTitlesError?.message || null;
  const collections = useApiData<Collection>("/collections");
  const { continueReading, continueReadingLoading, continueReadingError } = useAuth();
  const continueReadingArray = continueReading ? [continueReading] : [];
  const latestUpdates = useApiData<LatestUpdate>("/titles/latest-updates");
  const [fullTitlesData, setFullTitlesData] = useState<Record<string, Title>>(
    {}
  );
  const [titleData, setTitleData] = useState<Record<string, Title>>({});
  const [errorItems, setErrorItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    pageTitle.setTitlePage("Tomilo-lib.ru - Платформа манги и комиксов");
  }, []);

  // Получаем полные данные о популярных тайтлах
  useEffect(() => {
    if (!popularTitlesData?.data || popularTitlesData.data.length === 0) return;

    popularTitlesData.data.forEach((popularTitle) => {
      if (!fullTitlesData[popularTitle.id]) {
        // Получаем полные данные о тайтле
        fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/titles/${popularTitle.id}`
        )
          .then((response) => response.json())
          .then((response: { success: boolean; data?: Title } | Title) => {
            // Проверяем, есть ли у ответа обертка ApiResponseDto
            if (
              response &&
              typeof response === "object" &&
              "success" in response
            ) {
              // Если это объект ApiResponseDto, извлекаем данные
              if (response.success && response.data) {
                setFullTitlesData((prev) => ({
                  ...prev,
                  [popularTitle.id]: response.data!,
                }));
              }
            } else if (
              response &&
              typeof response === "object" &&
              "_id" in response
            ) {
              // Если это объект Title без обертки ApiResponseDto
              setFullTitlesData((prev) => ({
                ...prev,
                [popularTitle.id]: response,
              }));
            }
          })
          .catch((error) => {
            console.error(
              "Ошибка при получении данных о популярном тайтле:",
              error
            );
          });
      }
    });
  }, [popularTitlesData, fullTitlesData]);

  // Получаем данные о манге для каждого тайтла из истории чтения
  useEffect(() => {
    if (!continueReadingArray || continueReadingArray.length === 0) return;

    // Получаем все тайтлы из истории чтения
    const lastTitles = continueReadingArray;

    lastTitles.forEach((item) => {
      if (!titleData[item.titleId] && !errorItems[item.titleId]) {
        // Получаем данные о тайтле
        fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/titles/${item.titleId}`
        )
          .then((response) => response.json())
          .then((response: { success: boolean; data?: Title } | Title) => {
            // Проверяем, есть ли у ответа обертка ApiResponseDto
            if (
              response &&
              typeof response === "object" &&
              "success" in response
            ) {
              // Если это объект ApiResponseDto, извлекаем данные
              if (response.success && response.data) {
                setTitleData((prev) => ({
                  ...prev,
                  [item.titleId]: response.data!,
                }));
              } else {
                // Помечаем элемент как ошибочный, если данные не получены
                setErrorItems((prev) => ({
                  ...prev,
                  [item.titleId]: true,
                }));
              }
            } else if (
              response &&
              typeof response === "object" &&
              "_id" in response
            ) {
              // Если это объект Title без обертки ApiResponseDto
              setTitleData((prev) => ({
                ...prev,
                [item.titleId]: response,
              }));
            } else {
              // В других случаях помечаем элемент как ошибочный
              setErrorItems((prev) => ({
                ...prev,
                [item.titleId]: true,
              }));
            }
          })
          .catch((error) => {
            console.error("Ошибка при получении данных о манге:", error);
            // Помечаем элемент как ошибочный при сетевой ошибке
            setErrorItems((prev) => ({
              ...prev,
              [item.titleId]: true,
            }));
          });
      }
    });
  }, [continueReading, titleData, errorItems]);

  // Преобразуем данные API в формат, ожидаемый компонентами
  const adaptedPopularTitles =
    popularTitlesData?.data?.map((popularTitle, index) => {
      const fullTitle = fullTitlesData[popularTitle.id];
      if (fullTitle) {
        return adaptTitleToCarouselCard(fullTitle, index);
      } else {
        // Если полные данные еще не загружены, используем минимальные данные с заглушками
        return {
          id: popularTitle.id,
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
    continueReadingArray?.map((progress, index) =>
      adaptReadingProgressToReadingCard(
        progress,
        titleData[progress.titleId] || null,
        index
      )
    ) || [];
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
          adaptedReadingProgress,
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
          continueReadingLoading,
          continueReadingError?.message || null,
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
