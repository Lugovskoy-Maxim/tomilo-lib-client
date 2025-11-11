import { ReactNode } from "react";
import { Carousel } from "@/widgets";
import LoadingSkeleton from "@/shared/loading-skeleton";
import ErrorState from "@/shared/error-state";

interface DataCarouselProps<T> {
  title: string;
  data: T[] | undefined;
  loading: boolean;
  error: unknown;
  cardComponent: React.ComponentType<{ data: T }>;
  description?: string;
  type: string;
  href?: string;
  icon?: ReactNode;
  navigationIcon?: ReactNode;
  cardWidth?: string;
  showNavigation?: boolean;
  descriptionLink?: {
    text: string;
    href: string;
  };
}

/**
 * Компонент карусели с обработкой состояний загрузки и ошибок
 */
export default function DataCarousel<T>({
  title,
  data,
  loading,
  error,
  cardComponent,
  ...carouselProps
}: DataCarouselProps<T>) {
  if (loading) {
    return (
      <div className="carousel-skeleton animate-pulse">
        <div className="h-8 bg-[var(--muted)] rounded w-48 mb-4"></div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-30 h-40 bg-[var(--muted)] rounded-lg mb-2"></div>
              <div className="h-4 bg-[var(--muted)] rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error(`Ошибка загрузки ${title}:`, error);
    return null;
  }

  if (!data?.length) return null;

  return (
    <Carousel
      title={title}
      data={data}
      cardComponent={cardComponent}
      {...carouselProps}
    />
  );
}
