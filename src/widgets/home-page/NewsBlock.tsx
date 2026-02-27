"use client";

import Link from "next/link";
import { Megaphone, ChevronRight, ChevronLeft } from "lucide-react";
import { useState, useRef } from "react";
import { useGetAnnouncementsQuery } from "@/store/api/announcementsApi";
import { SectionLoadError } from "@/shared";
import { getAnnouncementImageUrls } from "@/api/config";
import type { Announcement } from "@/types/announcement";

function AnnouncementImage({ src, className }: { src: string | undefined; className?: string }) {
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
      const scrollAmount = 320;
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-3 p-4">
              <div className="w-24 h-24 rounded-xl bg-[var(--muted)] animate-pulse" />
              <div className="h-4 w-32 bg-[var(--muted)] rounded animate-pulse" />
              <div className="h-3 w-20 bg-[var(--muted)] rounded animate-pulse" />
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
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {news.map(a => (
          <Link
            key={getItemId(a)}
            href={`/news/${encodeURIComponent(a.slug)}`}
            className="group flex items-center gap-4 min-w-[280px] sm:min-w-[320px] max-w-[360px] flex-shrink-0 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 hover:bg-[var(--accent)]/10 transition-all"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
              <AnnouncementImage
                src={a.coverImage}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[var(--foreground)] text-sm line-clamp-2 block mb-1 group-hover:text-[var(--primary)] transition-colors">
                {a.title}
              </span>
              {a.shortDescription && (
                <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-2">
                  {a.shortDescription}
                </p>
              )}
              <span className="text-xs text-[var(--primary)] font-medium inline-flex items-center gap-1">
                Подробнее
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
