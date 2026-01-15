"use client";
import { useRef, useState, ReactNode } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CarouselProps<T> {
  title: string;
  description?: string;
  type: string;
  href?: string;
  icon?: ReactNode;
  data: T[];
  cardComponent: React.ComponentType<{ data: T }>;
  idField?: keyof T;
  cardWidth?: string;
  scrollAmount?: number;
  showNavigation?: boolean;
  navigationIcon?: ReactNode;
  descriptionLink?: {
    text: string;
    href: string;
  };
  getItemPath?: (item: T) => string;
}

/**
 * Компонент карусели для отображения списка карточек с возможностью прокрутки влево/вправо,
 * перетаскивания и навигации по карточкам.
 *
 * @param title - Заголовок карусели.
 * @param description - Описание карусели (может содержать текст со ссылкой).
 * @param type - Тип карточек, используемый для формирования маршрута при клике.
 * @param href - URL для дополнительной ссылки в правом углу заголовка.
 * @param icon - Иконка, отображаемая рядом с заголовком.
 * @param data - Массив данных для рендера карточек.
 * @param cardComponent - Компонент для отображения отдельной карточки.
 * @param idField - Ключ объекта в `data`, используемый для получения уникального ID карточки (по умолчанию "id").
 * @param cardWidth - CSS-класс для ширины карточки (адаптивный).
 * @param scrollAmount - Количество карточек, на которые будет прокручиваться карусель за один раз (по умолчанию 3).
 * @param showNavigation - Флаг для отображения кнопок навигации (по умолчанию true).
 * @param navigationIcon - Иконка для кнопки "Подробнее" (если не указана, используется ExternalLink).
 * @param descriptionLink - Объект с текстом и URL для вставки ссылки в описание.
 */

export default function Carousel<T>({
  title,
  description = "",
  type,
  href,
  icon,
  data,
  cardComponent: CardComponent,
  idField = "id" as keyof T,
  cardWidth = "w-28 sm:w-32 md:w-36 lg:w-40 xl:w-44",
  scrollAmount = 3,
  showNavigation = true,
  navigationIcon,
  descriptionLink,
  getItemPath,
}: CarouselProps<T>) {
  /**
   * Ссылка на контейнер карусели для управления прокруткой.
   */
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Состояние для отслеживания активности перетаскивания.
   */
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Флаг для отслеживания, произошел ли реальный drag.
   */
  const [hasDragged, setHasDragged] = useState(false);

  /**
   * Флаг для отслеживания, произошел ли drag в текущем взаимодействии с мышью.
   */
  const [dragOccurred, setDragOccurred] = useState(false);

  /**
   * Начальная позиция мыши при начале перетаскивания.
   */
  const [startX, setStartX] = useState(0);

  /**
   * Текущая позиция прокрутки контейнера.
   */
  const [scrollLeft, setScrollLeft] = useState(0);

  /**
   * Начальная позиция прокрутки перед началом перетаскивания.
   */
  const [, setStartScrollLeft] = useState(0);

  /**
   * Хук для навигации между страницами.
   */
  const router = useRouter();

  /**
   * Получает уникальный ID карточки из данных.
   * @param item - Объект данных карточки.
   * @returns Строка с ID или пустая строка, если поле не найдено.
   */
  const getCardId = (item: T) => {
    const idValue = item[idField];
    return idValue ? String(idValue) : "";
  };

  /**
   * Прокручивает карусель в указанном направлении.
   * @param direction - Направление прокрутки ("left" или "right").
   */
  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardElement = container.children[0] as HTMLElement;
    const cardWidth = cardElement?.offsetWidth || 150;
    const scrollDistance = cardWidth * scrollAmount;

    container.scrollBy({
      left: direction === "left" ? -scrollDistance : scrollDistance,
      behavior: "smooth",
    });
  };

  /**
   * Обработчик начала перетаскивания карусели.
   * @param e - Событие мыши.
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;

    setIsDragging(true);
    setHasDragged(false);
    setDragOccurred(false);
    setStartX(e.pageX);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setStartScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  /**
   * Обработчик завершения перетаскивания или выхода мыши из зоны карусели.
   */
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHasDragged(false);
    setDragOccurred(false);
  };

  /**
   * Обработчик отпускания кнопки мыши после перетаскивания.
   * Проверяет, был ли клик на карточку, и выполняет навигацию.
   * @param e - Событие мыши.
   */
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;

    const movedDistance = Math.abs(e.pageX - startX);
    const isClick = movedDistance < 10 && !hasDragged && !dragOccurred;

    if (isClick) {
      const cardElement = document.elementFromPoint(e.clientX, e.clientY);
      const card = cardElement?.closest("[data-card-id]");

      if (card) {
        const cardId = card.getAttribute("data-card-id");
        if (cardId) {
          // Проверяем, есть ли у карточки обработчик onClick
          const cardComponent = card.querySelector("[data-card-click-handler]");
          if (cardComponent) {
            // Если есть обработчик, не выполняем переход по умолчанию
            return;
          }

          // Находим соответствующий элемент данных
          const item = data.find(dataItem => getCardId(dataItem) === cardId);
          if (item) {
            // Используем кастомный путь если предоставлен, иначе fallback на стандартный
            const path = getItemPath ? getItemPath(item) : `/${type}/${cardId}`;
            router.push(path);
          }
        }
      }
    }

    setIsDragging(false);
    setHasDragged(false);
    setDragOccurred(false);
  };

  /**
   * Обработчик движения мыши во время перетаскивания.
   * @param e - Событие мыши.
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;

    const movedDistance = Math.abs(e.pageX - startX);
    if (movedDistance > 5) {
      setHasDragged(true);
      setDragOccurred(true);
    }

    // Only prevent default and scroll if we've moved enough to be considered a drag
    if (hasDragged) {
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = x - startX;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  /**
   * Рендерит описание с вставленной ссылкой, если `descriptionLink` предоставлен.
   * @returns JSX-элемент с описанием.
   */
  const _renderDescription = () => {
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
    <section className="w-full max-w-7xl mx-auto px-4 py-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-1">
            {icon && <div className="w-6 h-6 text-[var(--muted-foreground)]">{icon}</div>}
            {title && (
              <h2 className="text-lg md:text-2xl font-bold text-[var(--muted-foreground)]">
                {title}
              </h2>
            )}
          </div>
          <div className="flex justify-between items-center w-full">
            <p className="text-[var(--muted-foreground)] text-sm max-w-3xl">
              {_renderDescription()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {href && (
                <Link
                  href={href}
                  className="text-[var(--chart-1)] hover:underline flex items-center gap-1"
                >
                  {navigationIcon || <ExternalLink className="w-4 h-4" />}
                </Link>
              )}
            </div>
          </div>
        </div>

        {showNavigation && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full bg-[var(--secondary)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full bg-[var(--secondary)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{ userSelect: "none" }}
        >
          {data.map(item => (
            <div
              key={getCardId(item)}
              className={`flex-shrink-0 flex-col ${cardWidth}`}
              data-card-id={getCardId(item)}
              data-card-type={type}
            >
              <CardComponent data={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
