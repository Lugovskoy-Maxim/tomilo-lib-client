import { ReactNode } from "react";
import { Carousel } from "@/widgets";

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
      <div className="carousel-skeleton animate-pulse w-full max-w-7xl mx-auto px-3 py-2 sm:px-4">
        <div className="h-8 bg-[var(--muted)] rounded w-48 mb-3 sm:mb-4"></div>
        <div className="flex gap-3 sm:gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-24 sm:w-28 md:w-32 lg:w-40 h-32 sm:h-36 md:h-40 bg-[var(--muted)] rounded-lg mb-2"></div>
              <div className="h-4 bg-[var(--muted)] rounded w-20 sm:w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    // Handle error silently in production
    return null;
  }

  if (!data?.length) return null;

  return <Carousel title={title} data={data} cardComponent={cardComponent} {...carouselProps} />;
}
