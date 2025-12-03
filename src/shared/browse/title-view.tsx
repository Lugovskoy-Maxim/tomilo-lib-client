"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUpdateRatingMutation } from "@/store/api/titlesApi";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Globe,
  MessageCircle,
  Share as ShareIcon,
  Edit,
  Search,
  X,
  EyeOff,
  ArrowUpDown,
} from "lucide-react";
import { Title, TitleStatus, Chapter } from "@/types/title";
import { User } from "@/types/auth";
import { ReadingHistoryEntry } from "@/types/store";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ReadButton } from "@/shared/browse/read-button";
import { BookmarkButton } from "@/shared/bookmark-button";
import { useAuth } from "@/hooks/useAuth";
import { CommentsSection } from "@/shared/comments";
import { CommentEntityType } from "@/types/comment";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/age-verification-modal";
import { translateTitleType } from "@/lib/title-type-translations";

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
      className={`flex shrink-0 items-center cursor-pointer gap-2 px-2 sm:px-2 py-1 sm:py-1 font-medium transition-colors rounded-full hover:bg-[var(--chart-1)]/70 ${
        active
          ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--chart-1)]"
          : "border-transparent text-[var(--primary)] hover:text-[var(--primary)]  bg-[var(--background)]/50 "
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
      <div className="text-xs text-[var(--primary)] mt-1">{label}</div>
      <div className="text-md font-bold text-[var(--primary)]">{value}</div>
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
      <label className="text-sm font-medium text-[var(--primary)] mb-1 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <div className="px-3 py-2 bg-[var(--background)] rounded-lg text-[var(--primary)]">
        {value}
      </div>
    </div>
  );
}

// Left Sidebar
export function LeftSidebar({
  titleData,
  chapters,
  onShare,
  isAdmin,
  onAgeVerificationRequired,
}: {
  titleData: Title;
  chapters: Chapter[];
  onShare: () => void;
  isAdmin: boolean;
  onAgeVerificationRequired?: () => void;
}) {
  const { user } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(() => checkAgeVerification(user));

  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
  };

  const handleAgeCancel = () => {
    setShowAgeModal(false);
  };

  const isAdultContent = titleData.ageLimit >= 18;
  const shouldBlurImage = isAdultContent && !isAgeVerified;

  return (
    <div className="space-y-4">
      <div className="flex flex-col rounded-full">
        {titleData.coverImage && (
          <Image
            width={320}
            height={480}
            src={process.env.NEXT_PUBLIC_URL + titleData.coverImage}
            alt={titleData.name}
            unoptimized={true}
            className="w-full max-w-[320px] mx-auto lg:max-w-none h-auto rounded-2xl shadow-lg mb-4 object-cover"
            sizes="(max-width: 1024px) 320px, 25vw"
          />
        )}

        <div className="mb-3">
          <ReadButton
            titleData={titleData}
            chapters={chapters}
            className="w-full rounded-full"
            onAgeVerificationRequired={() => setShowAgeModal(true)}
          />
        </div>

        <div className="flex gap-2">
          <BookmarkButton
            titleId={titleData?._id || ""}
            initialBookmarked={false}
            className="py-2 w-full h-10 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          />

          <button
            onClick={onShare}
            className="py-2 w-full h-10 bg-[var(--accent)] text-[var(--primary)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors flex items-center justify-center gap-2"
          >
            <ShareIcon className="w-4 h-4" />
          </button>
          {isAdmin && titleData?._id && (
            <Link
              href={`/admin/titles/edit/${titleData._id}`}
              className="w-full h-10 py-2 bg-[var(--chart-1)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/80 transition-colors flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {titleData.altNames && titleData.altNames.length > 0 && (
        <div className="bg-[var(--card)]/40 rounded-xl p-4">
          <h3 className="font-semibold text-[var(--primary)] mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Альтернативные названия
          </h3>
          <div className="space-y-1">
            {titleData.altNames.map((name, index) => (
              <p key={index} className="text-sm text-[var(--primary)]">
                {name}
              </p>
            ))}
          </div>
        </div>
      )}

      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
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
  sortOrder,
  onSortChange,
  loading,
  user,
  titleData,
  onAgeVerificationRequired,
}: {
  titleId: string;
  chapters: Chapter[];
  hasMore: boolean;
  onLoadMore: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOrder: 'desc' | 'asc';
  onSortChange: (order: 'desc' | 'asc') => void;
  loading: boolean;
  user: User | null;
  titleData?: Title;
  onAgeVerificationRequired?: () => void;
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
    <div className="space-y-4 p-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)] w-4 h-4" />
          <input
            type="text"
            placeholder="Номер или название главы"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[var(--background)]/50 rounded-full focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-[var(--primary)] text-sm sm:text-base"
          />
        </div>
        <button
          onClick={() => onSortChange(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--background)]/50 rounded-full hover:bg-[var(--accent)]/30 transition-colors text-[var(--primary)] text-sm"
          title={`Сортировка: ${sortOrder === 'desc' ? 'по убыванию' : 'по возрастанию'}`}
        >
          <ArrowUpDown className="w-4 h-4" />
          {/* {sortOrder === 'desc' ? '↓' : '↑'} */}
        </button>
      </div>

      <div className="space-y-2">
        {chapters.map((chapter, index) => (
          <div
            key={chapter._id || index}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ChapterItem
              chapter={chapter}
              titleId={titleId}
              user={user}
            />
          </div>
        ))}

        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]"></div>
          </div>
        )}

        {hasMore && !loading && <div ref={loadMoreRef} className="h-10" />}
      </div>

      {chapters.length === 0 && !loading && (
        <div className="text-center py-8 text-[var(--primary)]">
          Главы не найдены
        </div>
      )}
    </div>
  );
}

export function ChapterItem({
  chapter,
  titleId,
  user,
}: {
  chapter: Chapter;
  titleId: string;
  user: User | null;
}) {
  const { removeFromReadingHistory, useGetReadingHistoryByTitle } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Получаем историю чтения только для текущего тайтла
  const { data: readingHistoryData } = useGetReadingHistoryByTitle(titleId);
  
  // Проверяем, прочитана ли глава
  const isRead = readingHistoryData?.data?.chapters?.some((ch) => {
    if (ch.chapterId == null) return false;
    
    let historyChapterId: string;
    if (typeof ch.chapterId === 'string') {
      historyChapterId = ch.chapterId;
    } else if (ch.chapterId && typeof ch.chapterId === 'object' && '_id' in ch.chapterId) {
      historyChapterId = (ch.chapterId as { _id: string })._id;
    } else {
      return false;
    }
    
    return historyChapterId === chapter._id;
  }) || false;

  // Функция для удаления из истории чтения
  const handleRemoveFromHistory = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isRemoving) return;

    setIsRemoving(true);
    try {
      await removeFromReadingHistory(titleId, chapter._id);
      console.log(`Removed chapter ${chapter._id} from reading history`);
    } catch (error) {
      console.error("Failed to remove from reading history:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Link
      href={`/browse/${titleId}/chapter/${chapter._id}`}
      className="flex items-center bg-[var(--background)]/50 justify-between px-2 py-2 border-b border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors rounded-xl"
    >
      <div className="flex items-center gap-3">
        {/* Иконка статуса прочтения */}
        <div
          className="flex items-center w-5 h-5"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isRead && isHovered ? (
            <button
              onClick={handleRemoveFromHistory}
              disabled={isRemoving}
              className={`flex items-center justify-center transition-colors hover:text-red-600 ${
                isRemoving
                  ? "cursor-not-allowed text-[var(--primary)]"
                  : "text-red-500 cursor-pointer"
              }`}
              title="Удалить из истории чтения"
            >
              {isRemoving ? (
                <div className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          ) : (
            <Eye
              className={`w-5 h-5 ${
                isRead ? "text-green-500" : "text-[var(--primary)]"
              }`}
            />
          )}
        </div>
        <div className="flex gap-1 justify-center items-center">
          <div className="font-medium text-[var(--primary)] text-sm sm:text-sm">
            Глава {chapter.chapterNumber}
            {chapter.name != `Глава ${chapter.chapterNumber.toString()}` &&
              `: ${chapter.name}`}
          </div>
          {chapter.releaseDate && (
            <div className="flex items-center gap-1 font-medium text-[var(--primary)] text-sm sm:text-sm">
              <Calendar className="w-3 h-3" />
              {new Date(chapter.releaseDate).toLocaleDateString("ru-RU")}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-[var(--primary)]">
        {"Просмотров: "}
        {chapter.views && (
          <span className="flex items-center gap-1">
            {/* <Eye className="w-4 h-4" /> */}
            {chapter.views}
          </span>
        )}

        <ChevronDown className="w-4 h-4 -rotate-90" />
      </div>
    </Link>
  );
}

export function CommentsTab({ titleId }: { titleId: string }) {
  return (
    <CommentsSection entityType={CommentEntityType.TITLE} entityId={titleId} />
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
  sortOrder,
  onSortChange,
  titleId,
  user,
  onAgeVerificationRequired,
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
  sortOrder: 'desc' | 'asc';
  onSortChange: (order: 'desc' | 'asc') => void;
  titleId: string;
  user: User | null;
  onAgeVerificationRequired?: () => void;
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
    const fixed = num.toFixed(1);
    return fixed.replace(/\.0$/, "");
  };

  // Хук для обновления рейтинга
  const [updateRating] = useUpdateRatingMutation();

  return (
    <div className="space-y-6">
      <div className=" rounded-xl">
        <div className="relative flex flex-col lg:items-start lg:justify-between gap-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-full text-[var(--primary)]">
                <Calendar className="w-4 h-4" />
                <span>{titleData.releaseYear}</span>
              </div>
              <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-full text-[var(--primary)]">
                <BookOpen className="w-4 h-4" />
                <span>{translateTitleType(titleData.type || "")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[var(--background)]/20 px-3 py-1 rounded-full">
              <span className="text-lg font-bold text-[var(--chart-1)]">
                {formatRating(
                  typeof pendingRating === "number"
                    ? pendingRating
                    : titleData?.averageRating
                )}
              </span>
              <button
                type="button"
                onClick={() => setIsRatingOpen((v) => !v)}
                className="px-2 py-1 rounded-full bg-[var(--background)] text-[var(--primary)] text-xs hover:bg-[var(--background)]/90 transition-colors cursor-pointer"
              >
                Оценить
              </button>
            </div>
          </div>

          {/* Блок с цифрами для оценки тайтла */}
          {isRatingOpen && (
            <div className="relative flex flex-col justify-center items-end w-full ">
              <div className="absolute top-0 right-0 flex flex-col w-max bg-[var(--background)]/80 rounded-lg p-2">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-sm text-[var(--primary)]">
                    Ваша оценка
                  </span>
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
                        // Отправляем рейтинг на сервер
                        updateRating({ id: titleData?._id || "", rating: n });
                      }}
                      className={`min-w-8 h-8 px-2 rounded-md text-sm font-medium cursor-pointer ${
                        pendingRating === n
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent)]/80"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/90 mb-3 p-2">
              {titleData?.name}
            </h1>
          </div>

        </div>

        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            <span
              className="px-2.5 py-1 cursor-pointer text-red-500 rounded-full text-xs font-semibold bg-[var(--background)]/60"
              onClick={() => {
                router.push(
                  `/browse?ageLimit=${encodeURIComponent(
                    titleData?.ageLimit || ""
                  )}`
                );
              }}
            >
              {titleData?.ageLimit}+
            </span>
            {titleData.genres?.map((genre, index) => (
              <span
                key={index}
                className="px-2 py-1 cursor-pointer rounded-full text-xs font-normal bg-[var(--background)]/50 text-[var(--foreground)]"
                onClick={() => {
                  router.push(
                    `/browse?genres=${encodeURIComponent(genre || "")}`
                  );
                }}
              >
                {genre}
              </span>
            ))}
            {titleData.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 cursor-pointer rounded-full text-xs font-normal bg-[var(--background)]/50 text-[var(--foreground)]"
                onClick={() => {
                  router.push(`/browse?tags=${encodeURIComponent(tag || "")}`);
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {titleData.description && (
          <div className="mt-5">
            <div
              className={`relative ${
                !isDescriptionExpanded ? "max-h-40 overflow-hidden" : ""
              }`}
            >
              <p className="text-[var(--primary)] leading-relaxed whitespace-pre-wrap bg-[var(--card)]/40 rounded-xl p-4">
                {titleData?.description}
              </p>
              {!isDescriptionExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-8 to-transparent " />
              )}
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
      </div>

      <div className="rounded-xl overflow-hidden">
        <div className="p-1 rounded-full">
          <div className="flex gap-2 pb-2 overflow-x-auto">
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
              Главы ({titleData?.totalChapters || 0})
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

        <div className="">
          {activeTab === "description" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Автор" value={titleData?.author} />
                <InfoField label="Художник" value={titleData?.artist} />
              </div>
              {titleData.description && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[var(--background)]/50 rounded-lg p-4 text-center">
                      <div className="text-xs text-[var(--primary)] mb-1">
                        Статус
                      </div>
                      <div className="font-bold text-[var(--primary)]">
                        {statusLabels[titleData?.status || TitleStatus.ONGOING]}
                      </div>
                    </div>
                    <div className="bg-[var(--background)]/50 rounded-lg p-4 text-center">
                      <div className="text-xs text-[var(--primary)] mb-1">
                        Глав
                      </div>
                      <div className="font-bold text-[var(--primary)]">
                        {titleData?.totalChapters?.toLocaleString() || "0"}
                      </div>
                    </div>
                    <div className="bg-[var(--background)]/50 rounded-lg p-4 text-center">
                      <div className="text-xs text-[var(--primary)] mb-1">
                        Формат
                      </div>
                      <div className="font-bold text-[var(--primary)]">
                        В цвете
                      </div>
                    </div>
                    <div className="bg-[var(--background)]/50 rounded-lg p-4 text-center">
                      <div className="text-xs text-[var(--primary)] mb-1">
                        Просмотры
                      </div>
                      <div className="font-bold text-[var(--primary)]">
                        {titleData?.views?.toLocaleString() || "0"}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-[var(--primary)] mb-3 ">
                    Полное описание
                  </h3>
                  <div className="bg-[var(--background)]/50 rounded-lg p-4">
                    <p className="text-[var(--primary)] leading-relaxed whitespace-pre-wrap">
                      {titleData?.description}
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
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              loading={chaptersLoading}
              user={user}
            />
          )}
          {activeTab === "comments" && <CommentsTab titleId={titleId} />}
          {activeTab === "statistics" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatItem
                label="Просмотры"
                value={titleData?.views?.toLocaleString() || "0"}
              />
              <StatItem
                label="Оценка"
                value={formatRating(titleData?.rating)}
              />
              <StatItem
                label="Год релиза"
                value={String(titleData?.releaseYear || "")}
              />
              <StatItem
                label="Глав"
                value={titleData?.totalChapters?.toLocaleString() || "0"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RightContent;
