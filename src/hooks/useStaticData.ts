import { useState, useEffect, useRef, useCallback } from "react";
import { Collection } from "@/types/collection";
import { formatChapterRanges } from "@/lib/format-chapter-ranges";

interface ApiCollection {
  id: string;
  _id?: string;
  name: string;
  image?: string;
  cover?: string;
  coverImage?: string;
  link?: string;
  views?: number;
  [key: string]: string | number | boolean | undefined;
}

interface ApiLatestUpdate {
  id: string;
  slug?: string;
  title: string;
  cover: string;
  chapter: string;
  chapterNumber: number;
  chapters?: number[];
  timeAgo: string;
  releaseYear?: number;
  type?: string;
  isAdult?: boolean;
}

interface LatestUpdate {
  id: string;
  slug?: string;
  title: string;
  cover: string;
  chapter: string;
  releaseYear: number;
  chapterNumber: number;
  timeAgo: string;
  type?: string;
  newChapters?: number;
  isAdult?: boolean;
}

interface StaticData {
  collections: {
    data: Collection[];
    loading: boolean;
    error: string | null;
  };
  latestUpdates: {
    data: LatestUpdate[];
    loading: boolean;
    error: string | null;
  };
}

export type StaticDataVisibleSections = Partial<{
  collections: boolean;
  latestUpdates: boolean;
}>;

export interface StaticDataOptions {
  visibleSections?: StaticDataVisibleSections;
  includeAdult?: boolean;
}

export const useStaticData = (options: StaticDataOptions | StaticDataVisibleSections = {}): StaticData => {
  // Support both old (visibleSections only) and new (options object) API
  const isOptionsObject = 'visibleSections' in options || 'includeAdult' in options;
  const visibleSections = isOptionsObject ? (options as StaticDataOptions).visibleSections ?? {} : options as StaticDataVisibleSections;
  const includeAdult = isOptionsObject ? (options as StaticDataOptions).includeAdult ?? false : false;
  
  const [collections, setCollections] = useState({
    data: [] as Collection[],
    loading: true,
    error: null as string | null,
  });

  const [latestUpdates, setLatestUpdates] = useState({
    data: [] as LatestUpdate[],
    loading: true,
    error: null as string | null,
  });

  const loadCollections = visibleSections.collections ?? false;
  const loadLatestUpdates = visibleSections.latestUpdates ?? false;
  
  // Ref для предотвращения повторных загрузок коллекций
  const collectionsLoadedRef = useRef(false);
  // Ref для отслеживания последнего значения includeAdult при загрузке updates
  const lastIncludeAdultRef = useRef<boolean | null>(null);

  // Мемоизированная функция форматирования коллекций (устойчива к null/неполным элементам)
  const formatCollections = useCallback((collectionsData: unknown[]): Collection[] => {
    const safeItems = collectionsData.filter(
      (x): x is ApiCollection => x != null && typeof x === "object" && ("id" in x || "_id" in x || "name" in x)
    );
    return safeItems.map((collection: ApiCollection) => {
      const id = String((collection.id ?? collection._id) ?? "");
      const raw = (collection as Record<string, unknown>).titles;
      const titles = Array.isArray(raw) ? (raw as string[]) : [];
      const titlesCount =
        Number((collection as Record<string, unknown>).titlesCount) ||
        Number((collection as Record<string, unknown>).titles_count) ||
        titles.length;
      return {
        id,
        cover:
          (collection.cover as string) ??
          (collection.coverImage as string) ??
          (collection.image as string) ??
          "",
        name: String(collection.name ?? ""),
        description: undefined,
        titles,
        titlesCount,
        comments: [],
        views: Number(collection.views) || 0,
        createdAt: (collection.createdAt as string) ?? "",
        updatedAt: (collection.updatedAt as string) ?? "",
      };
    });
  }, []);

  useEffect(() => {
    // Предотвращаем повторную загрузку коллекций (они не зависят от includeAdult)
    if (!loadCollections || collectionsLoadedRef.current) return;
    
    let cancelled = false;
    const controller = new AbortController();
    
    const fetchCollections = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const response = await fetch(
          `${baseUrl}/collections?page=1&limit=10&sortBy=createdAt&sortOrder=desc`,
          { signal: controller.signal }
        );

        if (!response.ok)
          throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}`);
        if (cancelled) return;

        const result = await response.json();
        if (cancelled) return;

        const raw = result?.data?.collections ?? result?.data?.data ?? result?.data ?? result;
        const collectionsData = Array.isArray(raw) ? raw : [];
        let formattedCollections: Collection[];
        try {
          formattedCollections = formatCollections(collectionsData);
        } catch (_) {
          formattedCollections = [];
        }

        collectionsLoadedRef.current = true;
        setCollections({
          data: formattedCollections,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) return;
        setCollections({
          data: [],
          loading: false,
          error: "load_failed",
        });
      }
    };

    fetchCollections();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loadCollections, formatCollections]);

  useEffect(() => {
    // Пропускаем если секция не видима или значение includeAdult не изменилось
    if (!loadLatestUpdates) return;
    if (lastIncludeAdultRef.current === includeAdult && latestUpdates.data.length > 0) return;
    
    lastIncludeAdultRef.current = includeAdult;
    let cancelled = false;
    const controller = new AbortController();
    
    const fetchLatestUpdates = async () => {
      // Показываем loading только при первой загрузке
      if (latestUpdates.data.length === 0) {
        setLatestUpdates(prev => ({ ...prev, loading: true }));
      }
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const params = new URLSearchParams({ limit: "16" });
        if (includeAdult) params.append("includeAdult", "true");
        const response = await fetch(
          `${baseUrl}/titles/latest-updates?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error("Failed to fetch latest updates");
        if (cancelled) return;

        const result = await response.json();
        if (cancelled) return;
        
        const raw = result.data?.data ?? result.data?.items ?? result.data;
        const list = Array.isArray(raw) ? raw : [];
        const transformedData = list.map((item: ApiLatestUpdate & { chapters?: number[] | { numbers?: number[] } }) => {
          const raw = item.chapters;
          const numbers = Array.isArray(raw)
            ? raw
            : Array.isArray((raw as { numbers?: number[] })?.numbers)
              ? (raw as { numbers: number[] }).numbers
              : [];
          const chapter =
            numbers.length > 0
              ? numbers.length === 1
                ? `Глава ${numbers[0]}`
                : `Главы ${formatChapterRanges(numbers)}`
              : item.chapter ?? "";
          return {
            ...item,
            chapter,
            releaseYear: item.releaseYear || new Date().getFullYear(),
            type: item.type || "manga",
          };
        });
        setLatestUpdates({
          data: transformedData,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) return;
        setLatestUpdates({
          data: [],
          loading: false,
          error: "Unknown error",
        });
      }
    };
    fetchLatestUpdates();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loadLatestUpdates, includeAdult, latestUpdates.data.length]);

  return { collections, latestUpdates };
};
