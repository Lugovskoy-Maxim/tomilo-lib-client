"use client";
import { ReactNode } from "react";
import { ExternalLink, Clock } from "lucide-react";
import Link from "next/link";

interface GridSectionProps<T> {
  title: string;
  description?: string;
  type: string;
  href?: string;
  releaseYear?: number;
  icon?: ReactNode;
  data: T[];
  cardComponent: React.ComponentType<{ data: T }>;
  idField?: keyof T;
  navigationIcon?: ReactNode;
  descriptionLink?: {
    text: string;
    href: string;
  };
}

/**
 * Секция с grid расположением карточек для последних обновлений
 */
export default function GridSection<T>({
  title,
  description = "",
  type,
  href,
  icon,
  data,
  cardComponent: CardComponent,
  idField = "id" as keyof T,
  navigationIcon,
  descriptionLink,
}: GridSectionProps<T>) {
  /**
   * Получает уникальный ID карточки из данных.
   */
  const getCardId = (item: T) => {
    const idValue = item[idField];
    return idValue ? String(idValue) : "";
  };

  /**
   * Рендерит описание с вставленной ссылкой, если `descriptionLink` предоставлен.
   */
  const renderDescription = () => {
    if (!descriptionLink) {
      return description;
    }

    const parts = description.split(descriptionLink.text);

    return (
      <>
        {parts[0]}
        <Link href={descriptionLink.href} className="text-[var(--chart-1)] hover:underline">
          {descriptionLink.text}
        </Link>
        {parts[1]}
      </>
    );
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Заголовок секции */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-2 mb-2">
            {icon && <div className="w-6 h-6 text-[var(--muted-foreground)]">{icon}</div>}
            {title && (
              <h2 className="text-2xl font-bold text-[var(--muted-foreground)]">{title}</h2>
            )}
          </div>

          <div className="flex justify-between items-center w-full">
            <p className="text-[var(--muted-foreground)] text-sm max-w-2xl">
              {renderDescription()}
            </p>

            {href && (
              <Link
                href={href}
                className="text-[var(--chart-1)] hover:underline flex items-center gap-1 whitespace-nowrap ml-4"
              >
                {navigationIcon || <ExternalLink className="w-6 h-6" />}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Grid с карточками — единые отступы между карточками */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.length > 0 ? (
          data.map(item => (
            <div
              key={getCardId(item)}
              data-card-id={getCardId(item)}
              data-card-type={type}
              className="w-full"
            >
              <CardComponent data={item} />
            </div>
          ))
        ) : (
          <div className="col-span-3 flex justify-center items-center h-32 text-[var(--muted-foreground)]">
            Нет обновлений
          </div>
        )}
      </div>

      {/* Кнопка "Показать еще" для мобильных устройств */}
      {href && data.length >= 6 && (
        <div className="flex justify-center mt-6 lg:hidden">
          <Link
            href={href}
            className="px-6 py-2 bg-[var(--secondary)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors rounded-lg text-[var(--foreground)] flex items-center gap-2 text-sm"
          >
            Показать ещё
            <Clock className="w-6 h-6" />
          </Link>
        </div>
      )}
    </section>
  );
}
