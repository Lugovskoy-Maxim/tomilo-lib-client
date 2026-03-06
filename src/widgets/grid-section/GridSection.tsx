"use client";
import { ReactNode, useState, useEffect, useRef, useMemo } from "react";
import { ExternalLink, Clock } from "lucide-react";
import Link from "next/link";

/** Колонки для layout="fixed": grid-cols-1 md:grid-cols-2 lg:grid-cols-3 (768px, 1024px). */
function getFixedColumnsFromWidth(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

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
  layout?: "fixed" | "auto-fit";
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
  layout = "fixed",
}: GridSectionProps<T>) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);
  const safeData = Array.isArray(data) ? data : [];

  useEffect(() => {
    if (layout === "fixed") {
      const update = () => setColumns(getFixedColumnsFromWidth(window.innerWidth));
      update();
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
  }, [layout]);

  useEffect(() => {
    if (layout !== "auto-fit" || !gridRef.current) return;
    const el = gridRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const gap = 20;
      const minCell = 280;
      const cols = Math.max(1, Math.floor((w + gap) / (minCell + gap)));
      setColumns(cols);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout]);

  /** Показываем число карточек кратное столбцам, чтобы не было неполной строки. */
  const displayData = useMemo(
    () => safeData.slice(0, Math.floor(safeData.length / columns) * columns),
    [safeData, columns],
  );

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
    <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6">
      {/* Заголовок секции: первая строка — иконка, заголовок и ссылка в одну линию; вторая — описание */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-nowrap">
          {icon && (
            <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] [&_svg]:w-5 [&_svg]:h-5">
              {icon}
            </div>
          )}
          {title && (
            <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)] truncate min-w-0">
              {title}
            </h2>
          )}
          {href && (
            <Link
              href={href}
              className="text-sm font-medium text-[var(--primary)] hover:underline underline-offset-2 flex items-center gap-1 shrink-0 ml-auto"
            >
              {navigationIcon || <ExternalLink className="w-4 h-4" />}
            </Link>
          )}
        </div>
        {(description || descriptionLink) && (
          <p className="text-[var(--muted-foreground)] text-xs mt-0.5 max-w-2xl">
            {renderDescription()}
          </p>
        )}
      </div>

      {/* Grid с карточками — может быть фиксированным или auto-fit для редких данных */}
      <div
        ref={layout === "auto-fit" ? gridRef : undefined}
        className={`${
          layout === "auto-fit"
            ? "grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 sm:gap-5 mx-auto"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        }`}
      >
        {displayData.length > 0 ? (
          displayData.map(item => (
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
          <div className="col-span-full flex justify-center items-center h-32 text-[var(--muted-foreground)]">
            Нет обновлений
          </div>
        )}
      </div>

      {/* Кнопка "Показать еще" для мобильных устройств */}
      {href && displayData.length >= 6 && (
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
