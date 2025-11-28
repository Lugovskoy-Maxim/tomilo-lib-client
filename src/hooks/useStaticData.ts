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

interface LatestUpdate {
  id: string;
  title: string;
  cover: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
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
        const response = await fetch(`${baseUrl}/collections?page=1&limit=10&sortBy=createdAt&sortOrder=desc`);
        
        if (!response.ok) throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}`);
        
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
      } catch (error) {
        console.error("Error fetching collections:", error);
        // Возвращаем к статическим данным в случае ошибки
        setCollections({
          data: [
            {
              _id: '1',
              name: 'Сёнен',
              image: '/collections/1.webp',
              link: '/collections/shonen',
              views: 0,
            } as Collection,
            {
              _id: '2',
              name: 'Романтика',
              image: '/collections/2.webp',
              link: '/collections/romance',
              views: 0,
            } as Collection,
            {
              _id: '3',
              name: 'Фэнтези',
              image: '/collections/3.webp',
              link: '/collections/fantasy',
              views: 0,
            } as Collection,
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
        
        if (!response.ok) throw new Error('Failed to fetch latest updates');
        
        const result = await response.json();
        setLatestUpdates({
          data: result.data || [],
          loading: false,
          error: null,
        });
      } catch (error) {
        setLatestUpdates({
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchCollections();
    fetchLatestUpdates();
  }, []);

  return { collections, latestUpdates };
};