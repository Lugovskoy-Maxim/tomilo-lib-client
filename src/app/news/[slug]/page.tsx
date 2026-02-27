"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useGetAnnouncementBySlugQuery } from "@/store/api/announcementsApi";
import { Header, Footer } from "@/widgets";
import { getAnnouncementImageUrls } from "@/api/config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function NewsSlugPage({ params }: PageProps) {
  const { slug } = use(params);
  const { data, isLoading, error } = useGetAnnouncementBySlugQuery(slug);

  const announcement = data?.data;

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-[var(--header-height)] pb-12">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="h-8 w-48 bg-[var(--muted)] rounded animate-pulse mb-4" />
            <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse mb-2" />
            <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !announcement) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-[var(--header-height)] pb-12">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <p className="text-[var(--muted-foreground)]">Объявление не найдено.</p>
            <Link
              href="/news"
              className="inline-flex items-center gap-1 mt-4 text-[var(--primary)] hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              К списку новостей
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { primary: coverPrimary, fallback: coverFallback } = getAnnouncementImageUrls(announcement.coverImage);
  const [useCoverFallback, setUseCoverFallback] = useState(false);
  const coverSrc = useCoverFallback && coverFallback !== coverPrimary ? coverFallback : coverPrimary;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-[var(--header-height)] pb-12">
        <article className="max-w-3xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            На главную
          </Link>

          {coverSrc && (
            <div className="rounded-xl overflow-hidden border border-[var(--border)] mb-6">
              <img
                src={coverSrc}
                alt=""
                className="w-full h-auto object-cover max-h-[320px]"
                onError={() => {
                  if (!useCoverFallback && coverFallback && coverFallback !== coverPrimary) {
                    setUseCoverFallback(true);
                  }
                }}
              />
            </div>
          )}

          <header className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
              {announcement.title}
            </h1>
            {(announcement.publishedAt || announcement.updatedAt) && (
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                {announcement.publishedAt
                  ? new Date(announcement.publishedAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : announcement.updatedAt
                    ? new Date(announcement.updatedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : null}
              </p>
            )}
          </header>

          {announcement.shortDescription && (
            <p className="text-[var(--muted-foreground)] mb-6">{announcement.shortDescription}</p>
          )}

          {announcement.body && (
            <div
              className="prose prose-invert max-w-none text-[var(--foreground)] announcement-body"
              dangerouslySetInnerHTML={{ __html: announcement.body }}
            />
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
