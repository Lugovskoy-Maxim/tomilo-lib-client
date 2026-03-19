"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Clock, Sparkles } from "lucide-react";
import { useGetReadingHistoryQuery } from "@/store/api/authApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { ReadingHistoryEntry } from "@/types/store";
import { getChapterPath } from "@/lib/title-paths";
import { getCoverUrls } from "@/lib/asset-url";
import { translateTitleType } from "@/lib/title-type-translations";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import SectionLoadError from "@/shared/error-state/SectionLoadError";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн назад`;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/** Нормализованный элемент для карточки: все поля с сервера */
interface ContinueItem {
  titleId: string;
  slug?: string;
  name: string;
  coverImage: string | null;
  type: string;
  /** Всего глав в тайтле — только из populated title.chapters (не chaptersCount!). 0 если неизвестно */
  totalChapters: number;
  /** Прочитано глав (chaptersCount или chapters.length) */
  chaptersRead: number;
  chaptersCount?: number;
  /** Есть ли с сервера полные данные тайтла (name, cover, totalChapters) */
  isTitlePopulated: boolean;
  /** Последняя прочитанная глава */
  lastChapter: {
    chapterId: string;
    chapterNumber: number;
    chapterTitle: string | null;
    readAt: string;
  };
  readAt: string;
}

function normalizeEntry(entry: ReadingHistoryEntry): ContinueItem | null {
  const isPopulated = typeof entry.titleId === "object" && entry.titleId !== null;
  const titleData = isPopulated
    ? (entry.titleId as {
        _id: string;
        name?: string;
        title?: string;
        slug?: string;
        coverImage?: string;
        type?: string;
        chapters?: { chapterNumber: number }[];
      })
    : null;

  const titleId = isPopulated ? titleData!._id : (entry.titleId as string);
  const name = (isPopulated ? titleData!.name || titleData!.title : null) || `Тайтл #${titleId}`;
  const slug = isPopulated ? titleData!.slug : undefined;
  const coverImage = isPopulated ? (titleData!.coverImage ?? null) : null;
  const type = isPopulated ? (titleData!.type ?? "") : "";

  const titleChapters = isPopulated ? titleData!.chapters : undefined;
  // totalChapters — только из тайтла (всего глав в произведении). chaptersCount = прочитано, не подставляем!
  const totalChapters =
    isPopulated && Array.isArray(titleChapters) && titleChapters.length > 0
      ? titleChapters.length
      : 0;
  const chapters = entry.chapters ?? [];
  const chaptersRead = entry.chaptersCount ?? chapters.length;

  if (chapters.length === 0) return null;

  const lastChapter = chapters.reduce(
    (latest, ch) => (new Date(ch.readAt) > new Date(latest.readAt) ? ch : latest),
    chapters[0],
  );
  const chapterId =
    typeof lastChapter.chapterId === "object" && lastChapter.chapterId != null
      ? (lastChapter.chapterId as { _id: string })._id
      : String(lastChapter.chapterId);

  return {
    titleId,
    slug,
    name,
    coverImage,
    type,
    totalChapters,
    chaptersRead,
    chaptersCount: entry.chaptersCount,
    isTitlePopulated: isPopulated,
    lastChapter: {
      chapterId,
      chapterNumber: lastChapter.chapterNumber,
      chapterTitle: lastChapter.chapterTitle ?? null,
      readAt: lastChapter.readAt,
    },
    readAt: entry.readAt,
  };
}

/** Нужно ли запрашивать тайтл с сервера (нет нормального названия или уже есть в кэше) */
function needsTitleFetch(item: ContinueItem): boolean {
  const fallbackName = `Тайтл #${item.titleId}`;
  return !item.name || item.name.trim() === "" || item.name === fallbackName;
}

function ContinueCard({ item }: { item: ContinueItem }) {
  const shouldFetch = needsTitleFetch(item);
  const { data: titleData, isLoading: titleLoading } = useGetTitleByIdQuery(
    { id: item.titleId, includeChapters: true },
    { skip: !shouldFetch },
  );
  const progressLoading = shouldFetch && titleLoading && !titleData;

  const name =
    shouldFetch && titleData
      ? (titleData.name ?? (titleData as { title?: string }).title ?? item.name)
      : item.name;
  const coverImage =
    shouldFetch && titleData ? (titleData.coverImage ?? item.coverImage) : item.coverImage;
  const slug = shouldFetch && titleData ? (titleData.slug ?? item.slug) : item.slug;
  const totalChapters =
    item.totalChapters > 0
      ? item.totalChapters
      : (titleData?.chapters?.length ?? titleData?.totalChapters ?? 0);

  const titleRef = { _id: item.titleId, slug: slug ?? undefined };
  const chapterHref = getChapterPath(titleRef, item.lastChapter.chapterId);
  const hasKnownTotal = totalChapters > 0;
  const progress = hasKnownTotal
    ? Math.min(100, Math.round((item.chaptersRead / totalChapters) * 100))
    : 0;

  // Если прогресс известен и он 100% — скрываем карточку "продолжить чтение"
  if (hasKnownTotal && progress >= 100) return null;
  const imageUrls = useMemo(
    () =>
      coverImage
        ? getCoverUrls(
            coverImage,
            typeof IMAGE_HOLDER === "string" ? IMAGE_HOLDER : IMAGE_HOLDER.src,
          )
        : null,
    [coverImage],
  );

  const t = item.lastChapter.chapterTitle?.trim();
  const chNum = item.lastChapter.chapterNumber;
  const showChapterTitle = t && t !== String(chNum) && t !== `Глава ${chNum}`;

  return (
    <div className="flex flex-col flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] h-full">
      <div className="group relative flex-1 min-h-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-300">
        <Link href={chapterHref} className="flex items-stretch gap-3 p-3 sm:p-4 block h-full">
          <div className="relative w-[90px] h-[129px] sm:w-24 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-[var(--muted)]">
            {imageUrls ? (
              <OptimizedImage
                src={imageUrls.primary}
                fallbackSrc={imageUrls.fallback}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                width={96}
                height={128}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[var(--primary)]/10">
                <BookOpen className="w-8 h-8 text-[var(--primary)]" />
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--card)]/95 text-[var(--foreground)] border border-[var(--border)]">
                {translateTitleType(item.type) || "—"}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors">
                {name}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Глава {item.lastChapter.chapterNumber}
                {showChapterTitle && (
                  <span className="opacity-90"> · {item.lastChapter.chapterTitle}</span>
                )}
              </p>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{formatTimeAgo(item.lastChapter.readAt)}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {hasKnownTotal ? (
                  <>
                    <p className="text-[10px] font-medium text-[var(--foreground)]">
                      Прочитано {item.chaptersRead} из {totalChapters} глав
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden min-w-0">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--chart-1)] to-[var(--chart-5)] transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-[var(--foreground)] shrink-0">
                        {progress}%
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-medium text-[var(--muted-foreground)]">
                      {progressLoading
                        ? "Загрузка прогресса…"
                        : `Прочитано глав: ${item.chaptersRead}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden min-w-0">
                        <div
                          className="h-full rounded-full bg-[var(--muted-foreground)]/30 min-w-[20%] shimmer"
                          style={{ width: progressLoading ? "40%" : "0%" }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-[var(--muted-foreground)] shrink-0 w-8">
                        {progressLoading ? "…" : "—"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

/** Пустое состояние: призыв начать читать */
function EmptyState() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
        <BookOpen className="w-7 h-7 text-[var(--primary)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">Продолжить чтение</h3>
      <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-5">
        Здесь появятся тайтлы, которые вы начнёте читать. Откройте любой тайтл и нажмите «Читать».
      </p>
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Перейти в каталог
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

const CONTINUE_LIST_LIMIT = 50;

export interface ContinueReadingSectionProps {
  /** История из useAuth (GET /history?limit=200). Если передана — отдельный GET /history?limit=50 не выполняется. */
  clientReadingHistory?: ReadingHistoryEntry[];
}

export default function ContinueReadingSection({ clientReadingHistory }: ContinueReadingSectionProps = {}) {
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  const { isAuthenticated } = useAuth();
  const hasAuth = isAuthenticated ?? !!getToken();

  // Не запрашивать историю отдельно, если родитель передал данные (один общий запрос с useAuth).
  const skipHistoryQuery = !hasAuth || clientReadingHistory !== undefined;
  const {
    data: historyResponse,
    isLoading,
    error,
  } = useGetReadingHistoryQuery({ limit: CONTINUE_LIST_LIMIT }, { skip: skipHistoryQuery });

  const items = useMemo(() => {
    const list =
      clientReadingHistory !== undefined
        ? clientReadingHistory.slice(0, CONTINUE_LIST_LIMIT)
        : Array.isArray(historyResponse?.data)
          ? historyResponse.data
          : [];
    return list
      .map(normalizeEntry)
      .filter((x): x is ContinueItem => x != null)
      // Не показываем тайтлы, которые уже прочитаны на 100%
      .filter(item => !(item.totalChapters > 0 && item.chaptersRead >= item.totalChapters))
      .sort(
        (a, b) =>
          new Date(b.lastChapter.readAt).getTime() - new Date(a.lastChapter.readAt).getTime(),
      );
  }, [clientReadingHistory, historyResponse?.data]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const dragOccurredRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragOccurredRef.current = false;
    startXRef.current = e.pageX;
    const el = scrollRef.current;
    if (el) startScrollLeftRef.current = el.scrollLeft;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = Math.abs(e.pageX - startXRef.current);
      if (dx > 8) {
        dragOccurredRef.current = true;
        e.preventDefault();
      }
      const el = scrollRef.current;
      if (el && dx > 0) {
        el.scrollLeft = startScrollLeftRef.current - (e.pageX - startXRef.current);
      }
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setTimeout(() => {
      dragOccurredRef.current = false;
    }, 300);
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) setIsDragging(false);
  }, [isDragging]);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragOccurredRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  if (!hasAuth) return null;

  // При использовании clientReadingHistory запрос не выполняется — показываем скелетон только пока нет данных.
  const showLoading = isLoading && clientReadingHistory === undefined;
  if (showLoading) {
    return (
      <section className="w-full min-w-0 max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6">
        <CarouselSkeleton
          title="Продолжить чтение"
          cardWidth="w-68 sm:w-72 md:w-80 lg:w-96"
          variant="reading"
          showDescription
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full min-w-0 max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6">
        <SectionLoadError sectionTitle="Продолжить чтение" />
      </section>
    );
  }

  return (
    <section
      className="w-full min-w-0 max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6"
      aria-label="Продолжить чтение"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">
              Продолжить чтение
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              На основе вашей истории чтения
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <Link
            href="/profile"
            className="text-sm font-medium text-[var(--primary)] hover:underline underline-offset-2 flex items-center gap-1"
          >
            Вся история
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto overflow-y-visible py-2 scrollbar-hide scroll-smooth min-w-0 touch-pan-both carousel-scroll will-change-scroll cursor-grab active:cursor-grabbing select-none"
          style={{ userSelect: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClickCapture={handleClickCapture}
        >
          {items.map(item => (
            <ContinueCard key={item.titleId} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
