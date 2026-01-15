import { useState, useEffect } from "react";
import { Collection } from "@/types/collection";

interface ApiCollection {
  id: string;
  _id?: string;
  name: string;
  image?: string;
  link?: string;
  views?: number;
  [key: string]: string | number | boolean | undefined;
}

interface ApiLatestUpdate {
  id: string;
  title: string;
  cover: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
  releaseYear?: number;
  type?: string;
}

interface LatestUpdate {
  id: string;
  title: string;
  cover: string;
  chapter: string;
  releaseYear: number;
  chapterNumber: number;
  timeAgo: string;
  type?: string;
  newChapters?: number;
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

export const useStaticData = (): StaticData => {
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

  useEffect(() => {
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
        const collectionsData = result.data?.collections || result.data?.data || result.data || [];

        // Преобразуем данные в формат, ожидаемый компонентом CollectionCard
        const formattedCollections = collectionsData.map((collection: ApiCollection) => ({
          ...collection,
          _id: collection.id || collection._id,
          link: collection.link || `/collections/${collection.id || collection._id}`,
        }));

        setCollections({
          data: formattedCollections,
          loading: false,
          error: null,
        });
      } catch {
        // Возвращаем к статическим данным в случае ошибки
        setCollections({
          data: [
            {
              id: "1",
              cover: "/collections/1.webp",
              name: "Сёнен",
              description: "Коллекция сёнэн манги",
              titles: [],
              comments: [],
              views: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "2",
              cover: "/collections/2.webp",
              name: "Романтика",
              description: "Коллекция романтических произведений",
              titles: [],
              comments: [],
              views: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "3",
              cover: "/collections/3.webp",
              name: "Фэнтези",
              description: "Коллекция фэнтези произведений",
              titles: [],
              comments: [],
              views: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          loading: false,
          error: null,
        });
      }
    };

    // Загрузка последних обновлений
    const fetchLatestUpdates = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const response = await fetch(`${baseUrl}/titles/latest-updates`);

        if (!response.ok) throw new Error("Failed to fetch latest updates");

        const result = await response.json();
        // Преобразуем данные, добавляя недостающие поля с дефолтными значениями
        const transformedData = (result.data || []).map((item: ApiLatestUpdate) => ({
          ...item,
          releaseYear: item.releaseYear || new Date().getFullYear(),
          type: item.type || "manga",
        }));
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

    fetchCollections();
    fetchLatestUpdates();
  }, []);

  return { collections, latestUpdates };
};
