"use client";

import Link from "next/link";
import { Megaphone, ChevronRight, ChevronLeft, Pin, Calendar } from "lucide-react";
import { useState, useRef } from "react";
import { useGetAnnouncementsQuery } from "@/store/api/announcementsApi";
import { SectionLoadError } from "@/shared";
import { getAnnouncementImageUrls } from "@/api/config";
import type { Announcement } from "@/types/announcement";

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function AnnouncementImage({ src, className }: { src: string | undefined; className?: string }) {
  const [useFallback, setUseFallback] = useState(false);
  const { primary, fallback } = getAnnouncementImageUrls(src);
  const imageSrc = useFallback && fallback !== primary ? fallback : primary;

  if (!imageSrc) {
    return (
      <div className={`${className} bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center`}>
        <Megaphone className="w-10 h-10 text-[var(--primary)]/40" />
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

const NEWS_LIMIT = 6;

function getItemId(a: Announcement): string {
  return (a as Announcement & { _id?: string }).id ?? (a as Announcement & { _id?: string })._id ?? a.slug ?? "";
}

export default function NewsBlock() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error } = useGetAnnouncementsQuery({
    limit: NEWS_LIMIT,
    page: 1,
    isPinned: undefined,
  });

  const announcements = data?.data?.announcements ?? [];
  const news = announcements.slice(0, 6);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6" aria-label="Новости">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Новости</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-[200px] sm:w-[220px] rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="aspect-[4/3] bg-[var(--muted)] animate-pulse" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 w-14 bg-[var(--muted)] rounded animate-pulse" />
                <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <SectionLoadError sectionTitle="Новости" />
      </section>
    );
  }

  if (!announcements.length) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6" aria-label="Новости">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Новости</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/news"
            className="text-sm text-[var(--primary)] hover:underline font-medium hidden sm:inline-flex items-center gap-1"
          >
            Все новости
            <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] flex items-center justify-center transition-colors"
            aria-label="Назад"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] flex items-center justify-center transition-colors"
            aria-label="Вперёд"
          >
            <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {news.map(a => {
          const dateStr = formatDate(a.publishedAt ?? a.updatedAt ?? a.createdAt);
          return (
            <Link
              key={getItemId(a)}
              href={`/news/${encodeURIComponent(a.slug)}`}
              className="group flex-shrink-0 w-[200px] sm:w-[220px] rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--muted)]">
                <AnnouncementImage
                  src={a.coverImage}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {a.isPinned && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary)] text-white">
                    <Pin className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)] mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>{dateStr}</span>
                </div>
                <h3 className="font-semibold text-[var(--foreground)] text-[13px] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                  {a.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex justify-center mt-4 sm:hidden">
        <Link
          href="/news"
          className="inline-flex items-center gap-1 text-sm text-[var(--primary)] font-medium hover:underline"
        >
          Все новости
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
