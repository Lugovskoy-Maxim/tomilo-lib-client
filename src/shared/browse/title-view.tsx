"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Globe,
  MessageCircle,
  Play,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Edit,
  Search,
  X,
} from "lucide-react";
import { Title, TitleStatus, Chapter } from "@/types/title";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Shared UI
export function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 font-medium transition-colors border-b-2 ${active
        ? "border-[var(--primary)] text-[var(--primary)]"
        : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

export function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col text-center">
      <div className="text-xs text-[var(--muted-foreground)] mt-1">{label}</div>
      <div className="text-md font-bold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

export function InfoField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string;
  icon?: React.ElementType;
}) {
  if (!value) return null;
  return (
    <div>
      <label className="text-sm font-medium text-[var(--muted-foreground)] mb-1 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <div className="px-3 py-2 bg-[var(--background)] rounded-lg text-[var(--foreground)]">
        {value}
      </div>
    </div>
  );
}

// Left Sidebar
export function LeftSidebar({
  titleData,
  onBookmark,
  onShare,
  isAdmin,
}: {
  titleData: Title;
  onBookmark: () => void;
  onShare: () => void;
  isAdmin: boolean;
}) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const router = useRouter();

  const handleBookmarkClick = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col bg-[var(--card)] rounded-xl p-4">
        {titleData.coverImage && (
          <Image
            width={320}
            height={480}
            src={`${process.env.NEXT_PUBLIC_URL}${titleData.coverImage}`}
            loader={() => `${process.env.NEXT_PUBLIC_URL}${titleData.coverImage}`}
            alt={titleData.name}
            className="w-full max-w-[320px] mx-auto lg:max-w-none rounded-lg shadow-lg mb-4 object-cover"
          />
        )}

        <button className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-[var(--primary)]/90 transition-colors flex items-center justify-center gap-2 mb-3">
          <Play className="w-5 h-5" />
          Читать
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleBookmarkClick}
            className={`py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isBookmarked
              ? "bg-yellow-500 text-white"
              : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
              }`}
          >
            <BookmarkIcon className="w-4 h-4" />
            {isBookmarked ? "В закладках" : "В закладки"}
          </button>

          <button
            onClick={onShare}
            className="py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors flex items-center justify-center gap-2"
          >
            <ShareIcon className="w-4 h-4" />
            Поделиться
          </button>
        </div>

        {isAdmin && (
          <Link
            href={`/admin/titles/edit/${titleData._id}`}
            className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Редактировать
          </Link>
        )}
      </div>

      {titleData.altNames && titleData.altNames.length > 0 && (
        <div className="bg-[var(--card)] rounded-xl p-4">
          <h3 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Альтернативные названия
          </h3>
          <div className="space-y-1">
            {titleData.altNames.map((name, index) => (
              <p key={index} className="text-sm text-[var(--muted-foreground)]">
                {name}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Chapters
export function ChaptersTab({
  titleId,
  chapters,
  hasMore,
  onLoadMore,
  searchQuery,
  onSearchChange,
  loading,
}: {
  titleId: string;
  chapters: Chapter[];
  hasMore: boolean;
  onLoadMore: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  loading: boolean;
}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !hasMore) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onLoadMore();
    });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, onLoadMore]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
        <input
          type="text"
          placeholder="Номер или название главы"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-[var(--background)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-[var(--foreground)] text-sm sm:text-base"
        />
      </div>

      <div className="space-y-2">
        {chapters.map((chapter, index) => (
          <ChapterItem
            key={chapter._id || index}
            chapter={chapter}
            titleId={titleId}
            index={index}
          />
        ))}

        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]"></div>
          </div>
        )}

        {hasMore && !loading && <div ref={loadMoreRef} className="h-10" />}
      </div>

      {chapters.length === 0 && !loading && (
        <div className="text-center py-8 text-[var(--muted-foreground)]">
          Главы не найдены
        </div>
      )}
    </div>
  );
}

export function ChapterItem({
  chapter,
  titleId,
  index,
}: {
  chapter: Chapter;
  titleId: string;
  index: number;
}) {
  return (
    <Link
      href={`/browse/${titleId}/chapter/${chapter._id}`}
      className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg hover:ring-1 hover:ring-[var(--primary)] transition-colors group"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
          {index + 1}
        </div>
        <div>
          <div className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors text-sm sm:text-base">
            Глава {chapter.chapterNumber}
            {chapter.title && `: ${chapter.title}`}
          </div>
          {chapter.releaseDate && (
            <div className="text-xs text-[var(--muted-foreground)]">
              {new Date(chapter.releaseDate).toLocaleDateString("ru-RU")}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
        {chapter.views && (
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {chapter.views}
          </span>
        )}
        <ChevronDown className="w-4 h-4 -rotate-90" />
      </div>
    </Link>
  );
}

export function CommentsTab() {
  return (
    <div className="text-center py-8">
      <MessageCircle className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        Система комментариев
      </h3>
      <p className="text-[var(--muted-foreground)]">
        Комментарии будут доступны в ближайшее время
      </p>
    </div>
  );
}

// Right Content
export function RightContent({
  titleData,
  activeTab,
  onTabChange,
  isDescriptionExpanded,
  onDescriptionToggle,
  chapters,
  hasMoreChapters,
  chaptersLoading,
  onLoadMoreChapters,
  searchQuery,
  onSearchChange,
  titleId,
}: {
  titleData: Title;
  activeTab: "description" | "chapters" | "comments" | "statistics";
  onTabChange: (
    tab: "description" | "chapters" | "comments" | "statistics"
  ) => void;
  isDescriptionExpanded: boolean;
  onDescriptionToggle: () => void;
  chapters: Chapter[];
  hasMoreChapters: boolean;
  chaptersLoading: boolean;
  onLoadMoreChapters: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  titleId: string;
}) {
  const statusLabels: Record<TitleStatus, string> = {
    [TitleStatus.ONGOING]: "Онгоинг",
    [TitleStatus.COMPLETED]: "Завершен",
    [TitleStatus.PAUSE]: "Приостановлен",
    [TitleStatus.CANCELLED]: "Заброшен",
  };
  const router = useRouter();
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);

  const formatRating = (value?: number) => {
    const num = typeof value === "number" ? value : 0;
    const fixed = num.toFixed(2);
    return fixed.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  };

  return (
    <div className="space-y-6">
      <div className="bg-[var(--card)] rounded-xl p-4 sm:p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-1 sm:mb-2">
              {titleData.name}
            </h1>

            <div className="flex items-center gap-2 mb-2 sm:mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{titleData.releaseYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{titleData.type || "Манга"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-[var(--foreground)]">
                {formatRating(
                  typeof pendingRating === "number" ? pendingRating : titleData.rating
                )}
              </span>
              <button
                type="button"
                onClick={() => setIsRatingOpen((v) => !v)}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--foreground)] text-sm hover:bg-[var(--accent)]/80"
              >
                Оценить
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 cursor-pointer text-red-800 rounded-full text-xs font-semibold" onClick={() => {
              router.push(`/browse?ageLimit=${encodeURIComponent(titleData.ageLimit)}`);
            }}>
              {titleData.ageLimit}+
            </span>
            {titleData.genres?.map((genre, index) => (
              <span
                key={index}
                className="px-2 py-1 cursor-pointer rounded-full text-xs font-semibold"
                onClick={() => {
                  router.push(`/browse?genres=${encodeURIComponent(genre)}`);
                }}
              >
                {genre}
              </span>
            ))}
            {titleData.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 cursor-pointer rounded-full text-xs font-semibold"
                onClick={() => {
                  router.push(`/browse?tags=${encodeURIComponent(tag)}`);
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {isRatingOpen && (
          <div className="mt-3 p-3 bg-[var(--background)] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--muted-foreground)]">Ваша оценка</span>
              <button
                type="button"
                onClick={() => setIsRatingOpen(false)}
                className="p-1 rounded hover:bg-[var(--accent)]"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setPendingRating(n);
                    setIsRatingOpen(false);
                    console.log("Rate title", titleData._id, n);
                  }}
                  className={`min-w-8 h-8 px-2 rounded-md text-sm font-medium ${
                    pendingRating === n
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {titleData.description && (
          <div className="mt-5">
            <div className={`relative ${!isDescriptionExpanded ? "max-h-20 overflow-hidden" : ""}`}>
              <p className="text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">
                {titleData.description}
              </p>
              {!isDescriptionExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--card)] to-transparent" />)
              }
            </div>
            {titleData.description.length > 100 && (
              <button
                onClick={onDescriptionToggle}
                className="mt-2 text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                {isDescriptionExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 z-10" />
                    Свернуть
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 z-10" />
                    Раскрыть полностью
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 sm:pt-4 text-md border border-dashed border-[var(--border)] rounded-md pb-4">
          <StatItem label="Статус тайтла" value={statusLabels[titleData.status]} />
          <StatItem label="Глав" value={titleData.totalChapters?.toLocaleString() || "0"} />
          <StatItem label="Формат" value="В цвете, Вебтун, Веб" />
          <StatItem label="Просмотры" value={titleData.views?.toLocaleString() || "0"} />
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-xl">
        <div className="border-b border-[var(--border)]">
          <div className="flex overflow-x-auto">
            <TabButton
              active={activeTab === "description"}
              onClick={() => onTabChange("description")}
              icon={BookOpen}
            >
              О тайтле
            </TabButton>
            <TabButton
              active={activeTab === "chapters"}
              onClick={() => onTabChange("chapters")}
              icon={ChevronDown}
            >
              Главы ({titleData.totalChapters || 0})
            </TabButton>
            <TabButton
              active={activeTab === "comments"}
              onClick={() => onTabChange("comments")}
              icon={MessageCircle}
            >
              Комментарии
            </TabButton>
            <TabButton
              active={activeTab === "statistics"}
              onClick={() => onTabChange("statistics")}
              icon={Eye}
            >
              Статистика
            </TabButton>
          </div>
        </div>

        <div className="p-4 sm:p-5 md:p-6">
          {activeTab === "description" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Автор" value={titleData.author} />
                <InfoField label="Художник" value={titleData.artist} />
              </div>
              {titleData.description && (
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-3">
                    Полное описание
                  </h3>
                  <div className="bg-[var(--background)] rounded-lg p-4">
                    <p className="text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">
                      {titleData.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "chapters" && (
            <ChaptersTab
              titleId={titleId}
              chapters={chapters}
              hasMore={hasMoreChapters}
              onLoadMore={onLoadMoreChapters}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              loading={chaptersLoading}
            />
          )}
          {activeTab === "comments" && <CommentsTab />}
          {activeTab === "statistics" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatItem label="Просмотры" value={titleData.views?.toLocaleString() || "0"} />
              <StatItem label="Оценка" value={titleData.rating?.toFixed(2) || "0.00"} />
              <StatItem label="Год релиза" value={String(titleData.releaseYear)} />
              <StatItem label="Глав" value={titleData.totalChapters?.toLocaleString() || "0"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RightContent;
