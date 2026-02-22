"use client";

import Link from "next/link";
import { Megaphone, ChevronRight, Pin, Calendar } from "lucide-react";
import { useGetAnnouncementsQuery } from "@/store/api/announcementsApi";
import { SectionLoadError } from "@/shared";
import { getAnnouncementImageUrl } from "@/api/config";
import type { Announcement } from "@/types/announcement";

const NEWS_LIMIT = 10;

function getItemId(a: Announcement): string {
  return (a as Announcement & { _id?: string }).id ?? (a as Announcement & { _id?: string })._id ?? a.slug ?? "";
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export default function NewsBlock() {
  const { data, isLoading, error } = useGetAnnouncementsQuery({
    limit: NEWS_LIMIT,
    page: 1,
    isPinned: undefined,
  });

  const announcements = data?.data?.announcements ?? [];

  // 1 закреплённая слева, 3 последних справа
  const pinned = announcements.find(a => a.isPinned) ?? announcements[0] ?? null;
  const others = pinned
    ? announcements.filter(a => getItemId(a) !== getItemId(pinned)).slice(0, 3)
    : announcements.slice(1, 4);

  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6" aria-label="Новости">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]/10">
              <Megaphone className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Новости</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden p-4 sm:p-5">
          <div className="lg:col-span-2 rounded-xl bg-[var(--muted)]/50 animate-pulse min-h-[200px]" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-[var(--muted)]/50 rounded-lg animate-pulse" />
            ))}
          </div>
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
    <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6" aria-label="Новости и объявления">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]/10">
            <Megaphone className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Новости</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Важные объявления и обновления
            </p>
          </div>
        </div>
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline self-start sm:self-center"
        >
          Все новости
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className={`grid grid-cols-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm ${others.length > 0 ? "lg:grid-cols-[minmax(0,280px)_1fr] gap-4" : ""}`}>
        {/* Слева: 1 закреплённая (или первая), узкая колонка */}
        {pinned && (
          <Link
            href={`/news/${encodeURIComponent(pinned.slug)}`}
            className="flex flex-col min-h-0 hover:bg-[var(--accent)]/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset"
            aria-label={pinned.title}
          >
            <div className="flex flex-col sm:flex-row flex-1 p-3 sm:p-4 gap-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
                {getAnnouncementImageUrl(pinned.coverImage) ? (
                  <img
                    src={getAnnouncementImageUrl(pinned.coverImage)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                    <Megaphone className="w-8 h-8 opacity-50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 flex-wrap">
                  {pinned.isPinned && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-medium">
                      <Pin className="w-3 h-3" />
                      Закреплено
                    </span>
                  )}
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(pinned.publishedAt ?? pinned.updatedAt ?? pinned.createdAt)}
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--foreground)] text-base mt-0.5 line-clamp-2">
                  {pinned.title}
                </h3>
                {pinned.shortDescription && (
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-0.5">
                    {pinned.shortDescription}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Справа: 3 последние строки */}
        {others.length > 0 && (
        <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-[var(--border)]">
          {others.map(a => {
            const coverUrl = getAnnouncementImageUrl(a.coverImage);
            const dateStr = formatDate(a.publishedAt ?? a.updatedAt ?? a.createdAt);
            return (
              <Link
                key={getItemId(a)}
                href={`/news/${encodeURIComponent(a.slug)}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent)]/30 transition-colors border-b border-[var(--border)] last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
                  {coverUrl ? (
                    <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-[var(--muted-foreground)] opacity-50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-[var(--foreground)] text-sm line-clamp-1 block">
                    {a.title}
                  </span>
                  {dateStr && (
                    <span className="text-xs text-[var(--muted-foreground)]">{dateStr}</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
              </Link>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
