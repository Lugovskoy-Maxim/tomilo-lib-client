"use client";
import { useRef, useState, ReactNode, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/** Скорость автопрокрутки (px/сек) при включённом autoScrollInterval. */
const AUTO_SCROLL_SPEED_PX_PER_SEC = 36;
/** На мобильных — быстрее, т.к. экран уже. */
const AUTO_SCROLL_SPEED_MOBILE_PX_PER_SEC = 20;
const AUTO_SCROLL_RESUME_DELAY_MS = 3000;

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
  /** Интервал автопрокрутки вправо (мс). Если задан, карусель автоматически прокручивается. */
  autoScrollInterval?: number;
  /** Не показывать блок заголовка (title, description, href). Для встраивания в свой layout. */
  hideHeader?: boolean;
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
  autoScrollInterval,
  hideHeader = false,
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
   * Флаг для отслеживания, произошел ли drag в текущем взаимодействии (state для прочих проверок).
   */
  const [dragOccurred, setDragOccurred] = useState(false);

  /**
   * Ref: был ли драг в текущем жесте. Читается в handleCardClick синхронно,
   * чтобы не было ложных переходов (click приходит после mouseup, когда state уже сброшен).
   */
  const dragOccurredRef = useRef(false);

  /**
   * Начальная позиция мыши/тача при начале перетаскивания.
   */
  const [startX, setStartX] = useState(0);

  /**
   * Текущая позиция прокрутки контейнера.
   */
  const [scrollLeft, setScrollLeft] = useState(0);

  /**
   * Время начала перетаскивания для определения click vs drag.
   */
  const [dragStartTime, setDragStartTime] = useState(0);

  /**
   * Начальная позиция прокрутки перед началом перетаскивания.
   */
  const startScrollLeftRef = useRef(0);

  /**
   * Ширина контейнера — для адаптивной прокрутки и реакции на размер экрана.
   */
  const [containerWidth, setContainerWidth] = useState(0);

  /**
   * Хук для навигации между страницами.
   */
  const router = useRouter();

  /** При ручной прокрутке/перетаскивании автопрокрутка приостанавливается. */
  const autoScrollPausedRef = useRef(false);
  const autoScrollResumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** isMobile — для разной скорости автопрокрутки и ResizeObserver. */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  /** Пауза автопрокрутки при начале взаимодействия. */
  const pauseAutoScroll = useCallback(() => {
    autoScrollPausedRef.current = true;
    if (autoScrollResumeTimeoutRef.current) {
      clearTimeout(autoScrollResumeTimeoutRef.current);
      autoScrollResumeTimeoutRef.current = null;
    }
  }, []);

  /** Возобновление автопрокрутки через задержку после отпускания. */
  const scheduleAutoScrollResume = useCallback(() => {
    if (!autoScrollInterval) return;
    if (autoScrollResumeTimeoutRef.current) clearTimeout(autoScrollResumeTimeoutRef.current);
    autoScrollResumeTimeoutRef.current = setTimeout(() => {
      autoScrollPausedRef.current = false;
      autoScrollResumeTimeoutRef.current = null;
    }, AUTO_SCROLL_RESUME_DELAY_MS);
  }, [autoScrollInterval]);

  /** Автопрокрутка: RAF с ограничением dt для плавности, пауза при касании/перетаскивании. */
  useEffect(() => {
    if (!autoScrollInterval || data.length <= 1) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    let rafId: number;
    let lastTime = performance.now();
    const maxDt = 0.05;

    const tick = (now: number) => {
      if (autoScrollPausedRef.current) {
        lastTime = now;
        rafId = requestAnimationFrame(tick);
        return;
      }
      let dt = (now - lastTime) / 1000;
      lastTime = now;
      if (dt > maxDt) dt = maxDt;
      const speed = isMobile ? AUTO_SCROLL_SPEED_MOBILE_PX_PER_SEC : AUTO_SCROLL_SPEED_PX_PER_SEC;
      const delta = speed * dt;
      const halfWidth = container.scrollWidth / 2;

      container.scrollBy({ left: delta, behavior: "auto" });

      if (container.scrollLeft >= halfWidth - 1) {
        container.scrollLeft -= halfWidth;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [autoScrollInterval, data.length, isMobile]);

  /**
   * ResizeObserver: пересчитываем ширину контейнера при изменении размера.
   */
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.offsetWidth));
    ro.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, [data.length, isMobile]);

  /**
   * Получает уникальный ID карточки из данных.
   * @param item - Объект данных карточки.
   * @returns Строка с ID или пустая строка, если поле не найдено.
   */
  const getCardId = (item: T) => {
    const idValue = item[idField];
    return idValue ? String(idValue) : "";
  };

  /** Для бесконечной автопрокрутки рендерим два набора данных подряд. */
  const displayData = autoScrollInterval && data.length > 1 ? [...data, ...data] : data;

  /**
   * Прокручивает карусель в указанном направлении.
   * Адаптивно: прокручивает на ширину видимой области или на scrollAmount карточек.
   */
  const scroll = (direction: "left" | "right") => {
    if (autoScrollInterval) {
      pauseAutoScroll();
      scheduleAutoScrollResume();
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    const cardEl = container.children[0] as HTMLElement | undefined;
    const cardWidthPx = cardEl?.offsetWidth ?? 150;
    const gap = 16; // gap-4
    const cardWithGap = cardWidthPx + gap;

    // Сколько карточек влезает в видимую область (если контейнер уже измерен)
    const visibleCount =
      containerWidth > 0
        ? Math.max(1, Math.floor((containerWidth + gap) / cardWithGap))
        : scrollAmount;
    const scrollDistance = cardWithGap * Math.min(visibleCount, scrollAmount);

    container.scrollBy({
      left: direction === "left" ? -scrollDistance : scrollDistance,
      behavior: "smooth",
    });
  };

  /**
   * Обработчик начала перетаскивания карусели (мышь).
   * @param e - Событие мыши.
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // чтобы ссылки/картинки внутри не перехватывали драг
    pauseAutoScroll();
    setIsDragging(true);
    setHasDragged(false);
    setDragOccurred(false);
    dragOccurredRef.current = false;
    setStartX(e.pageX);
    const container = scrollContainerRef.current;
    if (container) {
      setScrollLeft(container.scrollLeft);
      startScrollLeftRef.current = container.scrollLeft;
    } else {
      setScrollLeft(0);
      startScrollLeftRef.current = 0;
    }
    setDragStartTime(Date.now());
  }, [pauseAutoScroll]);

  /**
   * Обработчик начала касания карусели (touch).
   * @param e - Событие касания.
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    pauseAutoScroll();
    setIsDragging(true);
    setHasDragged(false);
    setDragOccurred(false);
    dragOccurredRef.current = false;
    setStartX(e.touches[0].pageX);
    const container = scrollContainerRef.current;
    if (container) {
      setScrollLeft(container.scrollLeft);
      startScrollLeftRef.current = container.scrollLeft;
    } else {
      setScrollLeft(0);
      startScrollLeftRef.current = 0;
    }
    setDragStartTime(Date.now());
  }, [pauseAutoScroll]);

  /**
   * Обработчик завершения перетаскивания или выхода мыши/тача из зоны карусели.
   */
  const handleDragEnd = useCallback(() => {
    const container = scrollContainerRef.current;
    const scrolled = container && Math.abs(container.scrollLeft - startScrollLeftRef.current) > 5;
    if (scrolled) dragOccurredRef.current = true;

    setIsDragging(false);
    setHasDragged(false);
    setDragOccurred(false);
    scheduleAutoScrollResume();
    // Держим ref дольше: на мобильных браузер генерирует click ~300ms после touchend
    const ref = dragOccurredRef;
    setTimeout(() => {
      ref.current = false;
    }, 350);
  }, [scheduleAutoScrollResume]);

  /** Блокирует клик в capture-фазе, чтобы карточка (PopularCard и др.) не обработала его после прокрутки. */
  const handleClickCapture = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (dragOccurredRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  /**
   * Обработчик клика на карточку с проверкой drag.
   * @param item - Данные карточки.
   * @param e - Событие мыши.
   */
  const handleCardClick = useCallback((item: T, e: React.MouseEvent | React.TouchEvent) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - dragStartTime;
    
    // Определяем координаты в зависимости от типа события
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      // Touch event
      const touch = e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Проверяем, был ли это клик (не drag). Используем ref — click приходит после mouseup,
    // к тому моменту state dragOccurred уже сброшен в handleDragEnd, ref ещё не очищен.
    if (dragOccurredRef.current || dragOccurred || timeDiff > 200) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Проверяем, что клик был именно по карточке, а не по кнопкам внутри неё
    const target = e.target as HTMLElement;
    const card = target.closest("[data-card-id]");
    
    if (card) {
      // Проверяем, есть ли у карточки обработчик onClick
      const cardComponent = card.querySelector("[data-card-click-handler]");
      if (cardComponent) {
        // Если есть обработчик, не выполняем переход по умолчанию
        return;
      }

      // Используем кастомный путь если предоставлен, иначе fallback на стандартный
      const path = getItemPath ? getItemPath(item) : `/${type}/${getCardId(item)}`;
      router.push(path);
    }
  }, [dragOccurred, dragStartTime, data, getItemPath, router, type, getCardId]);

  /**
   * Обработчик отпускания кнопки мыши после перетаскивания.
   * @param e - Событие мыши.
   */
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleDragEnd();
  }, [isDragging, handleDragEnd]);

  /**
   * Обработчик окончания касания (touch end).
   * @param e - Событие касания.
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.changedTouches[0];
    const mouseEvent = {
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
    } as unknown as React.MouseEvent;
    
    handleDragEnd();
  }, [isDragging, handleDragEnd]);

  /**
   * Обработчик движения мыши во время перетаскивания.
   * @param e - Событие мыши.
   */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const movedDistance = Math.abs(e.pageX - startX);
    const overThreshold = movedDistance > 10;
    if (overThreshold) {
      setHasDragged(true);
      setDragOccurred(true);
      dragOccurredRef.current = true;
    }

    const container = scrollContainerRef.current;
    // Скролл сразу при сдвиге >10px (без ожидания state), чтобы драг не забирала ссылка
    if (overThreshold && container) {
      e.preventDefault();
      container.scrollLeft = startScrollLeftRef.current - (e.pageX - startX);
    }
  }, [isDragging, startX]);

  /**
   * Обработчик движения при касании (touch move).
   * Не меняем scrollLeft — даём браузеру нативную инерционную прокрутку (как на телефонах).
   * Только помечаем hasDragged для отличия клика от свайпа.
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const movedDistance = Math.abs(touch.pageX - startX);
    if (movedDistance > 10) {
      setHasDragged(true);
      setDragOccurred(true);
      dragOccurredRef.current = true;
    }
  }, [isDragging, startX]);

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

  const content = (
    <div className="relative group/carousel">
        {/* Прокручиваемая карусель: с autoScroll — автопрокрутка + перетаскивание, без — обычная. */}
        <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-visible scrollbar-hide cursor-grab active:cursor-grabbing select-none py-2 sm:py-4 min-w-0 touch-pan-both will-change-scroll"
            onMouseDown={handleMouseDown}
            onMouseEnter={() => {
              if (autoScrollInterval) {
                pauseAutoScroll();
              }
            }}
            onMouseLeave={() => {
              if (isDragging) {
                handleDragEnd();
                return;
              }
              if (autoScrollInterval) {
                scheduleAutoScrollResume();
              }
            }}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClickCapture={handleClickCapture}
            style={{
              userSelect: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {(autoScrollInterval && data.length > 1 ? displayData : data).map((item, index) => (
                <div
                  key={`${getCardId(item)}-${index}`}
                  className={`flex-shrink-0 h-full ${cardWidth}`}
                  data-card-id={getCardId(item)}
                  data-card-type={type}
                  onClick={(e) => handleCardClick(item, e)}
                >
                  <CardComponent data={item} />
                </div>
              )
            )}
          </div>

        {/* Кнопки по бокам карусели */}
        {showNavigation && data.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Прокрутить влево"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--secondary)]/95 dark:bg-[var(--card)]/95 border border-[var(--border)] shadow-md hover:bg-[var(--accent)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center opacity-70 md:opacity-0 md:group-hover/carousel:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-[var(--muted-foreground)]" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Прокрутить вправо"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--secondary)]/95 dark:bg-[var(--card)]/95 border border-[var(--border)] shadow-md hover:bg-[var(--accent)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center opacity-70 md:opacity-0 md:group-hover/carousel:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] touch-manipulation"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[var(--muted-foreground)]" />
            </button>
          </>
        )}
      </div>
  );

  if (hideHeader) {
    return <div className="w-full min-w-0 py-2 sm:py-4">{content}</div>;
  }

  return (
    <section className="w-full min-w-0 max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex flex-col w-full min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0">
            {icon && <div className="w-6 h-6 shrink-0 text-[var(--muted-foreground)]">{icon}</div>}
            {title && (
              <h2 className="text-lg md:text-2xl font-bold text-[var(--muted-foreground)] truncate min-w-0">
                {title}
              </h2>
            )}
          </div>
          <div className="flex flex-wrap justify-between items-center gap-2 w-full mt-0.5 min-w-0">
            <p className="text-[var(--muted-foreground)] text-sm max-w-3xl min-w-0">
              {_renderDescription()}
            </p>
            {href && (
              <Link
                href={href}
                className="text-[var(--chart-1)] hover:underline flex items-center gap-1 shrink-0"
              >
                {navigationIcon || <ExternalLink className="w-4 h-4" />}
              </Link>
            )}
          </div>
        </div>
      </div>
      {content}
    </section>
  );
}
