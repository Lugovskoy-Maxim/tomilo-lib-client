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

// Базовые типы данных из API
import { Title as ApiTitle, TitleType } from "@/types/title";

// Тип данных, который возвращает сервер для популярных тайтлов
interface ServerTitle {
  id: string;
  title: string;
  cover?: string;
  description?: string;
  rating: number;
}

interface AdaptedTitle {
  id: string;
  title: string;
  cover: string;
  description?: string;
  rating: number;
  releaseYear: number;
  genres: string[];
  type?: TitleType;
}

interface Collection {
  id: string;
  name: string;
  image: string;
  link: string;
}

interface ReadingProgress {
  id: string;
  title: string;
  cover: string;
  currentChapter: string;
  chapterNumber: number;
  progress: number;
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
  currentChapter: string;
  chapterNumber: number;
  progress: number;
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

const adaptTitleToCarouselCard = (title: AdaptedTitle, index: number): CarouselCardData => ({
  id: title.id || `title-${index}`, // Используем ID из данных или создаем уникальный
  title: title.title,
  type: title.type ? getTitleTypeString(title.type) : "Манга",
  year: title.releaseYear,
  rating: title.rating,
  image: title.cover,
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
  index: number
): ReadingCardData => ({
  id: progress.id || `progress-${index}`,
  title: progress.title,
  cover: progress.cover,
  currentChapter: progress.currentChapter,
  chapterNumber: progress.chapterNumber,
  progress: progress.progress,
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

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(errorMessage);
        console.error(`Error fetching ${endpoint}:`, err);
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
      <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={`carousel-skeleton-${i}`} className="flex-shrink-0">
            <div className="w-30 h-40 bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
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
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
  error: string | null
): React.ReactNode {
  if (isLoading) return <CarouselSkeleton />;
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
  const popularTitles = useApiData<ServerTitle>("/titles/popular");
  const collections = useApiData<Collection>("/collections");
  const readingProgress = useApiData<ReadingProgress>("/user/reading-progress");
  const latestUpdates = useApiData<LatestUpdate>("/titles/latest-updates");

  useEffect(() => {
    pageTitle.setTitlePage("Tomilo-lib.ru - Платформа манги и комиксов");
  }, []);

  // Адаптер для преобразования данных API тайтлов в формат, ожидаемый компонентом
  const adaptApiTitleToTitle = (serverTitle: ServerTitle, index: number): AdaptedTitle => ({
    id: serverTitle.id,
    title: serverTitle.title,
    cover: serverTitle.cover || "",
    description: serverTitle.description,
    rating: serverTitle.rating,
    releaseYear: new Date().getFullYear(), // Заглушка, так как сервер не возвращает год
    genres: [], // Заглушка, так как сервер не возвращает жанры
    type: undefined, // Заглушка, так как сервер не возвращает тип
  });

  // Преобразуем данные API в формат, ожидаемый компонентами
  const adaptedPopularTitles = popularTitles.data.map((apiTitle, index) =>
    adaptTitleToCarouselCard(adaptApiTitleToTitle(apiTitle, index), index)
  );
  const adaptedCollections = collections.data.map((collection, index) =>
    adaptCollectionToCollectionCard(collection, index)
  );
  const adaptedReadingProgress = readingProgress.data.map((progress, index) =>
    adaptReadingProgressToReadingCard(progress, index)
  );
  const adaptedLatestUpdates = latestUpdates.data.map((update, index) =>
    adaptLatestUpdateToLatestUpdateCard(update, index)
  );

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center gap-6">
        {/* Кнопка продолжения чтения */}
        <div className="w-full max-w-6xl px-4 py-4">
          <ContinueReadingButton className="max-w-xs" />
        </div>
        
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
          popularTitles.loading,
          popularTitles.error
        )}

        {/* Коллекции */}
        {renderCarousel(
          "Коллекции по темам",
          adaptedCollections,
          CollectionCard as CollectionCardComponent,
          {
            description: "Здесь подобраны самые популярные коллекции, которые вы можете прочитать.",
            type: "collection",
            href: "/collections",
            cardWidth: "w-24 sm:w-28 md:w-32 lg:w-36",
            icon: <LibraryIcon className="w-6 h-6" />,
            showNavigation: false,
            navigationIcon: <SquareArrowOutUpRight className="w-6 h-6" />,
          },
          collections.loading,
          collections.error
        )}

        {/* Продолжить чтение */}
        {renderCarousel(
          "Продолжить чтение",
          adaptedReadingProgress,
          ReadingCard as unknown as ReadingCardComponent,
          {
            description: "Это главы, которые вы ещё не прочитали. Данный список генерируется на основании ваших закладок.",
            type: "browse",
            icon: <BookOpen className="w-6 h-6" />,
            navigationIcon: <SquareArrowOutUpRight className="w-6 h-6" />,
            descriptionLink: { text: "закладок", href: "/bookmarks" },
            showNavigation: false,
            cardWidth: "w-68 sm:w-72 md:w-80 lg:w-96",
          },
          readingProgress.loading,
          readingProgress.error
        )}

        {/* Последние обновления */}
        {latestUpdates.loading ? (
          <GridSkeleton />
        ) : latestUpdates.error ? (
          null
        ) : adaptedLatestUpdates.length > 0 ? (
          <GridSection
            title="Последние обновления"
            description="Свежие главы, которые только что вышли. Смотрите все обновления в каталоге."
            type="browse"
            href="/updates"
            icon={<Clock className="w-6 h-6" />}
            data={adaptedLatestUpdates}
            cardComponent={LatestUpdateCard as unknown as  LatestUpdateCardComponent}
          />
        ) : null}
      </main>
      <Footer />
    </>
  );
}
