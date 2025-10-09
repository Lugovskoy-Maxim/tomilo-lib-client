"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Title, getTitleById, mockTitle } from "@/constants/mokeReadPage";
import { TitlePageSkeleton } from "@/shared/browse";
import TitlePageContent from "@/shared/browse/title-page-component/title-page-component";
import NotFound from "@/app/not-found";

// Улучшенная функция для поиска тайтла по ID
const findTitleById = async (id: string): Promise<Title | null> => {
  // Имитация задержки сети
  await new Promise((resolve) => setTimeout(resolve, 10000));
  
  // Пытаемся преобразовать ID в число
  const titleId = parseInt(id, 10);
  
  // Если преобразование успешно, ищем по ID
  if (!isNaN(titleId)) {
    return getTitleById(titleId) || null;
  }
  
  // Если ID не число, ищем по slug/названию (опционально)
  const foundBySlug = mockTitle.find((title: { title: string; }) => 
    title.title.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase()
  );
  
  return foundBySlug || null;
};

export default function BrowseTitlePage() {
  const params = useParams();
  const id = params.id as string;
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTitle = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) {
          setError("ID тайтла не указан");
          return;
        }
        
        const foundTitle = await findTitleById(id);

        if (foundTitle) {
          setTitle(foundTitle);
        } else {
          setError("Тайтл не найден");
        }
      } catch (err) {
        setError("Ошибка при загрузке тайтла");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTitle();
  }, [id]);

  if (loading) {
    return <TitlePageSkeleton />;
  }

  if (!title || error) {
    return <NotFound />;
  }

  return <TitlePageContent title={title} />;
}