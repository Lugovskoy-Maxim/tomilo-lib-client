

import { notFound } from "next/navigation";
import { Metadata } from "next";
import CollectionDetailsClient from "./collection-details-client";
import { Collection } from "@/types/collection";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

// Функция для получения данных коллекции по ID на сервере
async function getCollectionDataById(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/collections/${id}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch collection by id: ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching collection data by id:", error);
    throw error;
  }
}

// Функция для генерации SEO метаданных
export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

    // Получаем данные коллекции по ID
    const collectionData = await getCollectionDataById(id);
    const collectionName = collectionData.name || "Коллекция";
    const description = collectionData.description
      ? collectionData.description.substring(0, 160).replace(/<[^>]*>/g, '') + '...'
      : `Просмотрите коллекцию "${collectionName}" с ${collectionData.titles?.length || 0} тайтлами`;
    
    const image = collectionData.cover
      ? `${baseUrl}${collectionData.cover}`
      : `${baseUrl}/logo/tomilo_color.svg`;

    // Формируем метаданные
    const metadata: Metadata = {
      title: `${collectionName} - Tomilo-lib.ru`,
      description: description,

      keywords: `${collectionName}, коллекция, тайтлы, манга, маньхуа, комиксы, онлайн чтение, ${collectionData.titles?.slice(0, 5).map((title: { name: string }) => title.name).join(', ')}`,
      openGraph: {
        title: `${collectionName} - Tomilo-lib.ru`,
        description: description,
        type: 'website',
        url: `${baseUrl}/collections/${id}`,
        siteName: 'Tomilo-lib.ru',
        images: [{ url: image }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${collectionName} - Tomilo-lib.ru`,
        description: description,
        images: [image],
      },
    };

    return metadata;
  } catch (error) {
    console.error('Ошибка при генерации метаданных коллекции:', error);
    return {
      title: 'Коллекция не найдена - Tomilo-lib.ru',
      description: 'Запрашиваемая коллекция не найдена',
    };
  }
}

// Серверный компонент страницы коллекции по ID
export default async function CollectionPage({ params }: CollectionPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Валидация ID
  if (!id || id === 'undefined') {
    notFound();
  }

  return <CollectionDetailsClient collectionId={id} />;
}
