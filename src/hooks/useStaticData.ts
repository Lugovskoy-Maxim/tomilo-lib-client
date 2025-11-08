import { useState, useEffect } from "react";

interface Collection {
  id: string;
  name: string;
  image: string;
  link: string;
}

interface LatestUpdate {
  id: string;
  title: string;
  cover: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
}

export const useStaticData = () => {
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
    // Статические данные для коллекций
    setCollections({
      data: [
        {
          id: '1',
          name: 'Сёнен',
          image: '/uploads/collections/1.webp',
          link: '/collections/shonen',
        },
        {
          id: '2',
          name: 'Романтика',
          image: '/uploads/collections/2.webp',
          link: '/collections/romance',
        },
        {
          id: '3',
          name: 'Фэнтези',
          image: '/uploads/collections/3.webp',
          link: '/collections/fantasy',
        },
      ],
      loading: false,
      error: null,
    });

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

    fetchLatestUpdates();
  }, []);

  return { collections, latestUpdates };
};