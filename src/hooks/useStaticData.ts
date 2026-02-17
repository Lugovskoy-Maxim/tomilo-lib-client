import { useState, useEffect } from "react";
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

export const useStaticData = (visibleSections: StaticDataVisibleSections = {}): StaticData => {
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

  useEffect(() => {
    if (!loadCollections) return;
    // Загрузка коллекций с API
    const fetchCollections = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const response = await fetch(
          `${baseUrl}/collections?page=1&limit=10&sortBy=createdAt&sortOrder=desc`,
        );

        if (!response.ok)
          throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}`);

        const result = await response.json();
        const raw = result.data?.collections ?? result.data?.data ?? result.data;
        const collectionsData = Array.isArray(raw) ? raw : [];

        // Преобразуем данные в формат Collection для CollectionCard
        const formattedCollections: Collection[] = collectionsData.map((collection: ApiCollection) => {
          const id = String((collection.id || collection._id) ?? "");
          return {
            id,
            cover:
              (collection.cover as string) ??
              (collection.coverImage as string) ??
              (collection.image as string) ??
              "",
            name: collection.name ?? "",
            description: undefined,
            titles: [],
            comments: [],
            views: Number(collection.views) || 0,
            createdAt: "",
            updatedAt: "",
          };
        });

        setCollections({
          data: formattedCollections,
          loading: false,
          error: null,
        });
      } catch {
        setCollections({
          data: [],
          loading: false,
          error: "load_failed",
        });
      }
    };

    fetchCollections();
  }, [loadCollections]);

  useEffect(() => {
    if (!loadLatestUpdates) return;
    const fetchLatestUpdates = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const response = await fetch(`${baseUrl}/titles/latest-updates`);

        if (!response.ok) throw new Error("Failed to fetch latest updates");

        const result = await response.json();
        const raw = result.data?.data ?? result.data?.items ?? result.data;
        const list = Array.isArray(raw) ? raw : [];
        const transformedData = list.map((item: ApiLatestUpdate) => {
          const chapter =
            item.chapters?.length !== undefined && item.chapters.length > 0
              ? `Главы ${formatChapterRanges(item.chapters)}`
              : item.chapter;
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
      } catch {
        setLatestUpdates({
          data: [],
          loading: false,
          error: "Unknown error",
        });
      }
    };
    fetchLatestUpdates();
  }, [loadLatestUpdates]);

  return { collections, latestUpdates };
};
