"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Megaphone, Pin, Calendar, ChevronRight } from "lucide-react";
import { useGetAnnouncementsQuery } from "@/store/api/announcementsApi";
import { Header, Footer } from "@/widgets";
import Pagination from "@/shared/browse/pagination";
import { getAnnouncementImageUrls } from "@/api/config";
import type { Announcement } from "@/types/announcement";
import LinesBackground from "@/shared/lines-background/LinesBackground";

const PER_PAGE = 12;

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function NewsCardImage({ src, className }: { src: string | undefined; className?: string }) {
  const [useFallback, setUseFallback] = useState(false);
  const { primary, fallback } = getAnnouncementImageUrls(src);
  const imageSrc = useFallback && fallback !== primary ? fallback : primary;

  if (!imageSrc) {
    return (
      <div className={`${className} bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center`}>
        <Megaphone className="w-12 h-12 text-[var(--primary)]/40" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt=""
      className={className}
      onError={() => {
        if (!useFallback && fallback && fallback !== primary) {
          setUseFallback(true);
        }
      }}
    />
  );
}

function NewsCard({ announcement }: { announcement: Announcement }) {
  const dateStr = formatDate(announcement.publishedAt ?? announcement.updatedAt ?? announcement.createdAt);

  return (
    <Link
      href={`/news/${encodeURIComponent(announcement.slug)}`}
      className="group flex gap-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all duration-300"
    >
      <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-[var(--muted)]">
        <NewsCardImage
          src={announcement.coverImage}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {announcement.isPinned && (
          <span className="absolute top-1 left-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary)] text-white">
            <Pin className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-1">
          <Calendar className="w-3 h-3" />
          <span>{dateStr}</span>
        </div>
        <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base line-clamp-2 mb-1 group-hover:text-[var(--primary)] transition-colors">
          {announcement.title}
        </h3>
        {announcement.shortDescription && (
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] line-clamp-2">
            {announcement.shortDescription}
          </p>
        )}
        {announcement.tags && announcement.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {announcement.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function NewsCardSkeleton() {
  return (
    <div className="flex gap-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-[var(--muted)] animate-pulse" />
      <div className="flex-1 flex flex-col justify-center space-y-2">
        <div className="h-3 w-20 bg-[var(--muted)] rounded animate-pulse" />
        <div className="h-5 w-full bg-[var(--muted)] rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetAnnouncementsQuery({
    page,
    limit: PER_PAGE,
  });

  const announcements = data?.data?.announcements ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  return (
    <>
      <LinesBackground />
      <Header />
      <main className="min-h-screen pt-[var(--header-height)] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            На главную
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--primary)]/10">
                <Megaphone className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                  Новости и объявления
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                  Все важные обновления и события
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center mb-4">
                <Megaphone className="w-8 h-8 text-[var(--destructive)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Не удалось загрузить новости
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] max-w-md">
                Произошла ошибка при загрузке. Попробуйте обновить страницу.
              </p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
                <Megaphone className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Пока нет новостей
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] max-w-md">
                Здесь будут появляться важные объявления и обновления.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map(a => (
                  <NewsCard key={a.id} announcement={a} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center pt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
