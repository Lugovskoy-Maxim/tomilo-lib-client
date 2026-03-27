"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Download, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Footer, Header } from "@/widgets";

interface OfflineManifest {
  titleId: string;
  titleName: string;
  titleSlug?: string;
  chapterIds: string[];
  chapterApiUrls: string[];
  imageUrls: string[];
  downloadedChapters: {
    chapterId: string;
    chapterNumber?: number;
    chapterTitle?: string;
    chapterPath: string;
  }[];
  updatedAt: string;
}

const CACHE_PAGES = "tomilo-pages-v1";

function getManifestStorageKey(titleId: string): string {
  return `offline-title-manifest-${titleId}`;
}

function readOfflineManifests(): OfflineManifest[] {
  if (typeof window === "undefined") return [];

  const manifests: OfflineManifest[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith("offline-title-manifest-")) continue;
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as OfflineManifest;
      manifests.push(parsed);
    } catch {
      // Ignore invalid localStorage records.
    }
  }

  return manifests.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export default function OfflinePage() {
  const [manifests, setManifests] = useState<OfflineManifest[]>([]);
  const [removingChapterKey, setRemovingChapterKey] = useState<string | null>(null);

  useEffect(() => {
    setManifests(readOfflineManifests());
  }, []);

  const handleRemoveChapter = useCallback(async (titleId: string, chapterId: string) => {
    if (typeof window === "undefined" || !chapterId || !titleId) return;

    const key = `${titleId}:${chapterId}`;
    setRemovingChapterKey(key);

    try {
      const storageKey = getManifestStorageKey(titleId);
      const rawManifest = window.localStorage.getItem(storageKey);
      if (!rawManifest) return;

      const manifest = JSON.parse(rawManifest) as OfflineManifest;
      const chapterIndex = (manifest.chapterIds ?? []).findIndex(id => id === chapterId);
      const chapterApiUrl =
        chapterIndex >= 0
          ? manifest.chapterApiUrls?.[chapterIndex]
          : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/$/, "")}/chapters/${chapterId}`;

      if ("caches" in window && chapterApiUrl) {
        const pagesCache = await caches.open(CACHE_PAGES);
        await pagesCache.delete(chapterApiUrl);
      }

      const nextManifest: OfflineManifest = {
        ...manifest,
        chapterIds: (manifest.chapterIds ?? []).filter(id => id !== chapterId),
        chapterApiUrls: (manifest.chapterApiUrls ?? []).filter(url => !url.endsWith(`/chapters/${chapterId}`)),
        downloadedChapters: (manifest.downloadedChapters ?? []).filter(
          chapter => chapter.chapterId !== chapterId,
        ),
        updatedAt: new Date().toISOString(),
      };

      if ((nextManifest.chapterIds?.length ?? 0) === 0) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(nextManifest));
      }

      setManifests(readOfflineManifests());
    } catch {
      // Keep UX stable if local cache/localStorage is temporarily inconsistent.
    } finally {
      setRemovingChapterKey(null);
    }
  }, []);

  const totalDownloadedChapters = useMemo(
    () => manifests.reduce((sum, m) => sum + (m.downloadedChapters?.length ?? m.chapterIds?.length ?? 0), 0),
    [manifests],
  );

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Header />
      <div className="container mx-auto px-4 sm:px-5 pb-24 md:pb-20">
        <div className="max-w-5xl mx-auto pt-6 sm:pt-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-sm p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                  Офлайн библиотека
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Запуск скачанных глав без подключения к интернету.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-[var(--muted-foreground)]">
                <Download className="w-4 h-4 text-[var(--primary)]" />
                Тайтлов: {manifests.length} | Глав: {totalDownloadedChapters}
              </div>
            </div>

            {manifests.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Офлайн-копии пока нет. Откройте любой тайтл и нажмите `Скачать тайтл`.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {manifests.map(manifest => (
                  <section
                    key={manifest.titleId}
                    className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-[var(--foreground)] truncate">
                          {manifest.titleName}
                        </h2>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          Скачано глав: {manifest.downloadedChapters?.length ?? manifest.chapterIds?.length ?? 0}
                        </p>
                      </div>
                      {manifest.titleSlug && (
                        <Link
                          href={`/titles/${manifest.titleSlug}?tab=chapters`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-[var(--border)] bg-[var(--background)]/70 hover:bg-[var(--background)]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          К тайтлу
                        </Link>
                      )}
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-[var(--border)]/60 bg-[var(--background)]/40 p-2 space-y-1">
                      {(manifest.downloadedChapters ?? []).map(ch => {
                        const chapterKey = `${manifest.titleId}:${ch.chapterId}`;
                        const isRemovingThisChapter = removingChapterKey === chapterKey;

                        return (
                          <div
                            key={`${manifest.titleId}-${ch.chapterId}`}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background)]/70 transition-colors"
                          >
                            <Link
                              href={`${ch.chapterPath}?offlineRead=1`}
                              className="min-w-0 flex-1 flex items-center gap-2"
                            >
                              <BookOpen className="w-4 h-4 text-[var(--primary)] shrink-0" />
                              <span className="truncate">
                                Глава {ch.chapterNumber ?? "?"}
                                {ch.chapterTitle ? ` - ${ch.chapterTitle}` : ""}
                              </span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => void handleRemoveChapter(manifest.titleId, ch.chapterId)}
                              disabled={isRemovingThisChapter}
                              className="inline-flex items-center justify-center rounded-md p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 disabled:opacity-60"
                              aria-label="Удалить офлайн главу"
                              title="Удалить офлайн главу"
                            >
                              {isRemovingThisChapter ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
