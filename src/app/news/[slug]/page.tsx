"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Calendar, Pin, Megaphone } from "lucide-react";
import { useGetAnnouncementBySlugQuery } from "@/store/api/announcementsApi";
import { Header, Footer } from "@/widgets";
import { getAnnouncementImageUrls } from "@/api/config";
import LinesBackground from "@/shared/lines-background/LinesBackground";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatFullDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NewsSlugPage({ params }: PageProps) {
  const { slug } = use(params);
  const { data, isLoading, error } = useGetAnnouncementBySlugQuery(slug);
  const [useCoverFallback, setUseCoverFallback] = useState(false);

  const announcement = data?.data;

  const { coverSrc, coverPrimary, coverFallback } = useMemo(() => {
    if (!announcement?.coverImage) return { coverSrc: "", coverPrimary: "", coverFallback: "" };
    const { primary, fallback } = getAnnouncementImageUrls(announcement.coverImage);
    const src = useCoverFallback && fallback !== primary ? fallback : primary;
    return { coverSrc: src, coverPrimary: primary, coverFallback: fallback };
  }, [announcement?.coverImage, useCoverFallback]);

  if (isLoading) {
    return (
      <>
        <LinesBackground />
        <Header />
        <main className="min-h-screen pt-[var(--header-height)] pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse mb-6" />
            <div className="rounded-2xl overflow-hidden bg-[var(--muted)] animate-pulse aspect-[2/1] mb-6" />
            <div className="space-y-3">
              <div className="h-8 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
              <div className="h-4 w-32 bg-[var(--muted)] rounded animate-pulse" />
              <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse mt-6" />
              <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-[var(--muted)] rounded animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !announcement) {
    return (
      <>
        <LinesBackground />
        <Header />
        <main className="min-h-screen pt-[var(--header-height)] pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
                <Megaphone className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                Новость не найдена
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-md">
                Возможно, она была удалена или перемещена.
              </p>
              <Link
                href="/news"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4" />
                К списку новостей
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const dateStr = formatFullDate(announcement.publishedAt ?? announcement.updatedAt ?? announcement.createdAt);

  return (
    <>
      <LinesBackground />
      <Header />
      <main className="min-h-screen pt-[var(--header-height)] pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Все новости
          </Link>

          <header className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Image */}
              {coverSrc && (
                <div className="flex-shrink-0 w-full sm:w-[140px] md:w-[180px]">
                  <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)] aspect-[4/3] sm:aspect-square">
                    <img
                      src={coverSrc}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => {
                        if (!useCoverFallback && coverFallback && coverFallback !== coverPrimary) {
                          setUseCoverFallback(true);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {announcement.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium">
                      <Pin className="w-3 h-3" />
                      Закреплено
                    </span>
                  )}
                  {announcement.tags && announcement.tags.length > 0 && (
                    <>
                      {announcement.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)] leading-tight mb-2">
                  {announcement.title}
                </h1>
                {announcement.shortDescription && (
                  <p className="text-sm sm:text-base text-[var(--muted-foreground)] mb-3 leading-relaxed line-clamp-3">
                    {announcement.shortDescription}
                  </p>
                )}
                {dateStr && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Calendar className="w-4 h-4" />
                    <span>{dateStr}</span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {announcement.body && (
            <div
              className="announcement-body"
              dangerouslySetInnerHTML={{ __html: announcement.body }}
            />
          )}

          <div className="mt-12 pt-8 border-t border-[var(--border)]">
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] font-medium hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              Вернуться к списку новостей
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
