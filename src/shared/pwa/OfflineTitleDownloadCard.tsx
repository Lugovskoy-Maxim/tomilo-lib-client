"use client";

import { OFFLINE_FEATURES_ENABLED } from "@/config/offlineFeatures";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, ExternalLink, Loader2, Trash2 } from "lucide-react";
import type { Chapter } from "@/types/title";
import { normalizeAssetUrl } from "@/lib/asset-url";
import { getChapterPath } from "@/lib/title-paths";

const CACHE_PAGES = "tomilo-pages-v1";
const CACHE_IMAGES = "tomilo-images-v1";
const AUTH_TOKEN_KEY = "tomilo_lib_token";

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

interface OfflineTitleDownloadCardProps {
  titleId: string;
  titleName: string;
  titleSlug?: string;
  chapters: Chapter[];
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
}

function getManifestStorageKey(titleId: string): string {
  return `offline-title-manifest-${titleId}`;
}

function getChapterImageUrls(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return [];
  const chapter = raw as Record<string, unknown>;
  const fromPages = Array.isArray(chapter.pages) ? chapter.pages : [];
  const fromImages = Array.isArray(chapter.images) ? chapter.images : [];
  const candidates = [...fromPages, ...fromImages];
  return candidates.filter((v): v is string => typeof v === "string" && v.length > 0);
}

async function fetchAndCacheImage(cache: Cache, imageUrl: string): Promise<void> {
  const normalized = imageUrl.trim();
  if (!normalized) return;

  try {
    const response = await fetch(normalized, { credentials: "omit", mode: "cors" });
    if (response.ok || response.type === "opaque") {
      await cache.put(normalized, response.clone());
      return;
    }
  } catch {
    // Ignore and try no-cors fallback below.
  }

  try {
    const fallbackResponse = await fetch(normalized, { credentials: "omit", mode: "no-cors" });
    if (fallbackResponse.ok || fallbackResponse.type === "opaque") {
      await cache.put(normalized, fallbackResponse.clone());
    }
  } catch {
    // Keep going even if one image fails.
  }
}

export default function OfflineTitleDownloadCard({
  titleId,
  titleName,
  titleSlug,
  chapters,
}: OfflineTitleDownloadCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [currentChapterLabel, setCurrentChapterLabel] = useState<string>("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showSelection, setShowSelection] = useState(false);
  const [rangeStartId, setRangeStartId] = useState<string>("");
  const [rangeEndId, setRangeEndId] = useState<string>("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<Record<string, boolean>>({});
  const [isDownloaded, setIsDownloaded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem(getManifestStorageKey(titleId)));
  });

  const chaptersToDownload = useMemo(
    () =>
      chapters
        .filter(ch => Boolean(ch?._id))
        .sort((a, b) => {
          const aNum = a.chapterNumber ?? 0;
          const bNum = b.chapterNumber ?? 0;
          if (aNum !== bNum) return aNum - bNum;
          return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
        }),
    [chapters],
  );
  const totalChapters = chaptersToDownload.length;

  useEffect(() => {
    if (chaptersToDownload.length === 0) {
      setRangeStartId("");
      setRangeEndId("");
      setSelectedChapterIds({});
      return;
    }

    setRangeStartId(chaptersToDownload[0]._id);
    setRangeEndId(chaptersToDownload[chaptersToDownload.length - 1]._id);

    const initialSelected = chaptersToDownload.reduce<Record<string, boolean>>((acc, ch) => {
      acc[ch._id] = true;
      return acc;
    }, {});
    setSelectedChapterIds(initialSelected);
  }, [chaptersToDownload]);

  const rangeChapters = useMemo(() => {
    if (chaptersToDownload.length === 0 || !rangeStartId || !rangeEndId) return [] as Chapter[];
    const startIndex = chaptersToDownload.findIndex(ch => ch._id === rangeStartId);
    const endIndex = chaptersToDownload.findIndex(ch => ch._id === rangeEndId);
    if (startIndex < 0 || endIndex < 0) return [] as Chapter[];
    const left = Math.min(startIndex, endIndex);
    const right = Math.max(startIndex, endIndex);
    return chaptersToDownload.slice(left, right + 1);
  }, [chaptersToDownload, rangeEndId, rangeStartId]);

  const selectedChapters = useMemo(
    () => rangeChapters.filter(ch => selectedChapterIds[ch._id]),
    [rangeChapters, selectedChapterIds],
  );
  const selectedCount = selectedChapters.length;

  const applyRangeSelection = useCallback(() => {
    const nextMap = chaptersToDownload.reduce<Record<string, boolean>>((acc, ch) => {
      acc[ch._id] = false;
      return acc;
    }, {});
    for (const ch of rangeChapters) {
      nextMap[ch._id] = true;
    }
    setSelectedChapterIds(nextMap);
  }, [chaptersToDownload, rangeChapters]);

  const selectAllVisible = useCallback(() => {
    const nextMap = { ...selectedChapterIds };
    for (const ch of rangeChapters) nextMap[ch._id] = true;
    setSelectedChapterIds(nextMap);
  }, [rangeChapters, selectedChapterIds]);

  const clearAllVisible = useCallback(() => {
    const nextMap = { ...selectedChapterIds };
    for (const ch of rangeChapters) nextMap[ch._id] = false;
    setSelectedChapterIds(nextMap);
  }, [rangeChapters, selectedChapterIds]);

  const handleDownload = useCallback(async () => {
    if (
      isDownloading ||
      isRemoving ||
      selectedCount === 0 ||
      typeof window === "undefined"
    )
      return;
    if (!("caches" in window)) {
      setErrorText("Офлайн-хранилище не поддерживается этим браузером.");
      return;
    }

    setIsDownloading(true);
    setErrorText(null);
    setProgress(0);
    setDownloadedCount(0);
    setCurrentChapterLabel("Подготовка к загрузке...");

    const apiBase = getApiBaseUrl().replace(/\/$/, "");
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const manifest: OfflineManifest = {
      titleId,
      titleName,
      titleSlug,
      chapterIds: [],
      chapterApiUrls: [],
      imageUrls: [],
      downloadedChapters: [],
      updatedAt: new Date().toISOString(),
    };

    try {
      const pagesCache = await caches.open(CACHE_PAGES);
      const imagesCache = await caches.open(CACHE_IMAGES);
      const imageUrlsSet = new Set<string>();
      const origin =
        typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";

      for (let i = 0; i < selectedChapters.length; i += 1) {
        const chapterId = selectedChapters[i]?._id;
        if (!chapterId) continue;
        setCurrentChapterLabel(`Глава ${selectedChapters[i]?.chapterNumber ?? "?"}`);

        const chapterApiUrl = `${apiBase}/chapters/${chapterId}`;
        const chapterResponse = await fetch(chapterApiUrl, {
          method: "GET",
          credentials: "include",
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        });

        if (!chapterResponse.ok) {
          throw new Error(`Не удалось загрузить главу ${chapterId}`);
        }

        await pagesCache.put(chapterApiUrl, chapterResponse.clone());
        manifest.chapterIds.push(chapterId);
        manifest.chapterApiUrls.push(chapterApiUrl);
        const chapterPath = getChapterPath({ _id: titleId, slug: titleSlug }, chapterId);
        manifest.downloadedChapters.push({
          chapterId,
          chapterNumber: selectedChapters[i]?.chapterNumber,
          chapterTitle: selectedChapters[i]?.title || selectedChapters[i]?.name,
          chapterPath,
        });

        // Сохраняем навигационные HTML страницы главы (с и без offlineRead),
        // чтобы открытие ридера работало в офлайне даже после холодного старта.
        if (origin && chapterPath) {
          const chapterPageUrl = `${origin}${chapterPath}`;
          const chapterPageOfflineUrl = `${chapterPageUrl}?offlineRead=1`;
          try {
            const chapterPageResponse = await fetch(chapterPageUrl, {
              method: "GET",
              credentials: "include",
            });
            if (chapterPageResponse.ok) {
              await pagesCache.put(chapterPageUrl, chapterPageResponse.clone());
            }
          } catch {
            // Игнорируем: офлайн-кэш API и изображений всё равно сохранится.
          }
          try {
            const chapterPageOfflineResponse = await fetch(chapterPageOfflineUrl, {
              method: "GET",
              credentials: "include",
            });
            if (chapterPageOfflineResponse.ok) {
              await pagesCache.put(chapterPageOfflineUrl, chapterPageOfflineResponse.clone());
            }
          } catch {
            // Игнорируем: офлайн-кэш API и изображений всё равно сохранится.
          }
        }

        const chapterPayload = (await chapterResponse.json()) as {
          data?: unknown;
        };
        const chapterData = chapterPayload?.data ?? chapterPayload;
        const imageUrls = getChapterImageUrls(chapterData);

        for (const imageUrl of imageUrls) {
          if (imageUrlsSet.has(imageUrl)) continue;
          const normalizedImageUrl = normalizeAssetUrl(imageUrl);
          imageUrlsSet.add(normalizedImageUrl);
          await fetchAndCacheImage(imagesCache, normalizedImageUrl);
        }

        const completed = i + 1;
        setDownloadedCount(completed);
        setProgress(Math.round((completed / selectedCount) * 100));
      }

      manifest.imageUrls = Array.from(imageUrlsSet);
      window.localStorage.setItem(getManifestStorageKey(titleId), JSON.stringify(manifest));
      setIsDownloaded(true);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Не удалось завершить загрузку.");
      setCurrentChapterLabel("Загрузка прервана");
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, isRemoving, selectedChapters, selectedCount, titleId, titleName, titleSlug]);

  const handleRemove = useCallback(async () => {
    if (isRemoving || isDownloading || typeof window === "undefined") return;
    if (!("caches" in window)) return;

    setIsRemoving(true);
    setErrorText(null);

    try {
      const rawManifest = window.localStorage.getItem(getManifestStorageKey(titleId));
      if (rawManifest) {
        const parsed = JSON.parse(rawManifest) as OfflineManifest;
        const pagesCache = await caches.open(CACHE_PAGES);
        const imagesCache = await caches.open(CACHE_IMAGES);

        await Promise.all([
          ...(parsed.chapterApiUrls ?? []).map(url => pagesCache.delete(url)),
          ...(parsed.imageUrls ?? []).map(url => imagesCache.delete(url)),
        ]);
      }

      window.localStorage.removeItem(getManifestStorageKey(titleId));
      setIsDownloaded(false);
      setProgress(0);
      setDownloadedCount(0);
      setCurrentChapterLabel("");
    } catch {
      setErrorText("Не удалось удалить офлайн-версию.");
    } finally {
      setIsRemoving(false);
    }
  }, [isDownloading, isRemoving, titleId]);

  if (!OFFLINE_FEATURES_ENABLED) {
    return null;
  }

  return (
    <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <h3 className="text-sm font-medium text-[var(--foreground)]">Офлайн загрузка</h3>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Скачивание всех глав тайтла на устройство для чтения без интернета.
          </p>
        </div>
        {isDownloaded && !isDownloading && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Скачано
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (!showSelection) {
              setShowSelection(true);
              return;
            }
            void handleDownload();
          }}
          disabled={isDownloading || isRemoving || selectedCount === 0}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Загружается...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {showSelection ? "Начать загрузку" : "Скачать тайтл"}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving || isDownloading || !isDownloaded}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)]/70 text-[var(--foreground)] text-sm font-medium hover:bg-[var(--background)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRemoving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Удаляем...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Удалить офлайн
            </>
          )}
        </button>

        <Link
          href="/offline"
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)]/70 text-[var(--foreground)] text-sm font-medium hover:bg-[var(--background)] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Офлайн библиотека
        </Link>
      </div>

      {showSelection && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-xs text-[var(--muted-foreground)]">
              С главы
              <select
                value={rangeStartId}
                onChange={e => setRangeStartId(e.target.value)}
                disabled={isDownloading || isRemoving || totalChapters === 0}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 disabled:opacity-60"
              >
                {chaptersToDownload.map(ch => (
                  <option key={`start-${ch._id}`} value={ch._id}>
                    {`Глава ${ch.chapterNumber ?? "?"}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-[var(--muted-foreground)]">
              По главу
              <select
                value={rangeEndId}
                onChange={e => setRangeEndId(e.target.value)}
                disabled={isDownloading || isRemoving || totalChapters === 0}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 disabled:opacity-60"
              >
                {chaptersToDownload.map(ch => (
                  <option key={`end-${ch._id}`} value={ch._id}>
                    {`Глава ${ch.chapterNumber ?? "?"}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyRangeSelection}
              disabled={isDownloading || isRemoving}
              className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] bg-[var(--background)]/70 hover:bg-[var(--background)] transition-colors disabled:opacity-60"
            >
              Выбрать диапазон
            </button>
            <button
              type="button"
              onClick={selectAllVisible}
              disabled={isDownloading || isRemoving}
              className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] bg-[var(--background)]/70 hover:bg-[var(--background)] transition-colors disabled:opacity-60"
            >
              Отметить все
            </button>
            <button
              type="button"
              onClick={clearAllVisible}
              disabled={isDownloading || isRemoving}
              className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] bg-[var(--background)]/70 hover:bg-[var(--background)] transition-colors disabled:opacity-60"
            >
              Снять все
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)]/50 p-2 space-y-1">
            {rangeChapters.map(ch => {
              const checked = Boolean(selectedChapterIds[ch._id]);
              return (
                <label
                  key={ch._id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--background)]/70 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e =>
                      setSelectedChapterIds(prev => ({ ...prev, [ch._id]: e.target.checked }))
                    }
                    disabled={isDownloading || isRemoving}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">
                    Глава {ch.chapterNumber ?? "?"}
                    {ch.title || ch.name ? ` - ${ch.title || ch.name}` : ""}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Выбрано глав: {selectedCount} из {totalChapters}
      </p>

      {(isDownloading || downloadedCount > 0) && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
            <span>{isDownloading ? "Прогресс загрузки" : "Последняя загрузка"}</span>
            <span>
              {downloadedCount}/{selectedCount} глав ({progress}%)
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--background)]/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/60 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {isDownloading && currentChapterLabel && (
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{currentChapterLabel}</p>
          )}
        </div>
      )}

      {errorText && <p className="mt-2 text-xs text-red-500">{errorText}</p>}
      {totalChapters === 0 && (
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">Нет доступных глав для загрузки.</p>
      )}
    </div>
  );
}
