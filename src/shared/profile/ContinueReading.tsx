"use client";

import { UserProfile } from "@/types/user";
import { ReadingHistoryEntry } from "@/types/store";
import { Play, BookOpen, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { useMemo, useState } from "react";
import { getCoverUrls } from "@/lib/asset-url";
import { getChapterPath, getTitlePath } from "@/lib/title-paths";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

interface ContinueReadingProps {
  userProfile: UserProfile;
}

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

interface TitleChapterInfo {
  _id: string;
  chapterNumber: number;
}

function getLastReadInfo(entry: ReadingHistoryEntry): {
  titleId: string;
  titleSlug?: string;
  titleName: string;
  coverImage: string | null;
  lastChapterNumber: number;
  lastChapterId: string | null;
  lastChapterTitle: string | null;
  nextChapterId: string | null;
  nextChapterNumber: number;
  readAt: string;
  totalChapters?: number;
} | null {
  if (!entry) return null;
  
  const isPopulated = typeof entry.titleId === "object";
  const titleData = isPopulated ? entry.titleId : null;
  
  const titleId = isPopulated ? titleData!._id : (entry.titleId as string);
  const titleSlug = isPopulated ? titleData!.slug : undefined;
  const titleName = isPopulated ? titleData!.name : "Неизвестный тайтл";
  const coverImage = isPopulated ? (titleData!.coverImage ?? null) : null;
  
  const titleChapters = isPopulated ? (titleData!.chapters as TitleChapterInfo[] | undefined) : undefined;
  const totalChapters = titleChapters?.length;
  
  const lastChapterData = entry.chapters?.[entry.chapters.length - 1];
  const lastChapterNumber = lastChapterData?.chapterNumber ?? 1;
  const lastChapterId = lastChapterData?.chapterId ?? null;
  const lastChapterTitle = lastChapterData?.chapterTitle ?? null;
  
  let nextChapterId: string | null = null;
  const nextChapterNumber = lastChapterNumber + 1;
  
  if (titleChapters && titleChapters.length > 0) {
    const nextChapter = titleChapters.find(ch => ch.chapterNumber === nextChapterNumber);
    if (nextChapter) {
      nextChapterId = nextChapter._id;
    }
  }
  
  return {
    titleId,
    titleSlug,
    titleName,
    coverImage,
    lastChapterNumber,
    lastChapterId,
    lastChapterTitle,
    nextChapterId,
    nextChapterNumber,
    readAt: entry.readAt,
    totalChapters,
  };
}

export default function ContinueReading({ userProfile }: ContinueReadingProps) {
  const readingHistory = userProfile.readingHistory ?? [];
  const [imageError, setImageError] = useState(false);
  
  const lastRead = useMemo(() => {
    if (readingHistory.length === 0) return null;
    
    const sorted = [...readingHistory].sort((a, b) => 
      new Date(b.readAt).getTime() - new Date(a.readAt).getTime()
    );
    
    return getLastReadInfo(sorted[0]);
  }, [readingHistory]);

  const imageUrls = useMemo(() => {
    if (!lastRead?.coverImage) return null;
    return getCoverUrls(lastRead.coverImage, typeof IMAGE_HOLDER === 'string' ? IMAGE_HOLDER : IMAGE_HOLDER.src);
  }, [lastRead?.coverImage]);
  
  if (!lastRead) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/90 p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[var(--primary)]/15">
            <Play className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Продолжить чтение</h3>
        </div>
        <div className="text-center py-6 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]/50">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)] opacity-50" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Вы ещё ничего не читали
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Перейти в каталог
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }
  
  const readProgress = lastRead.totalChapters 
    ? Math.round((lastRead.lastChapterNumber / lastRead.totalChapters) * 100)
    : null;
  
  const titleInfo = { _id: lastRead.titleId, slug: lastRead.titleSlug };
  const chapterIdToRead = lastRead.nextChapterId ?? lastRead.lastChapterId;
  const chapterHref = chapterIdToRead 
    ? getChapterPath(titleInfo, chapterIdToRead)
    : getTitlePath(titleInfo);
  
  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-gradient-to-br from-[var(--card)] to-[var(--card)]/80 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-4 sm:p-5 pb-0">
        <div className="p-2 rounded-xl bg-[var(--primary)]/15">
          <Play className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Продолжить чтение</h3>
      </div>
      
      <div className="p-4 sm:p-5">
        <Link
          href={chapterHref}
          className="group flex gap-4 p-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/60 hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)]/60 transition-all duration-300"
        >
          <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-lg overflow-hidden shrink-0 shadow-md bg-[var(--secondary)]">
            {imageUrls && !imageError ? (
              <OptimizedImage
                src={imageUrls.primary}
                fallbackSrc={imageUrls.fallback}
                alt={lastRead.titleName}
                className="w-full h-full object-cover"
                width={80}
                height={112}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/20 to-[var(--chart-1)]/20">
                <BookOpen className="w-6 h-6 text-[var(--primary)]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-[var(--primary-foreground)] ml-0.5" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                {lastRead.titleName}
              </h4>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Глава {lastRead.lastChapterNumber}
                {lastRead.lastChapterTitle && (
                  <span className="opacity-75"> · {lastRead.lastChapterTitle}</span>
                )}
              </p>
            </div>
            
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(lastRead.readAt)}</span>
              </div>
              
              {readProgress !== null && (
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                      style={{ width: `${readProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--muted-foreground)]">{readProgress}%</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden sm:flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 group-hover:bg-[var(--primary)] group-hover:border-[var(--primary)] transition-all duration-300">
              <span className="text-[10px] text-[var(--muted-foreground)] group-hover:text-[var(--primary-foreground)] transition-colors">
                Глава
              </span>
              <span className="text-lg font-bold text-[var(--primary)] group-hover:text-[var(--primary-foreground)] transition-colors">
                {lastRead.nextChapterNumber}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
