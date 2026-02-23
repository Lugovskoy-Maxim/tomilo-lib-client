import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CollectionDetails } from "@/widgets";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getOgImageUrl } from "@/lib/seo-og-image";
import { sanitizeMetaString } from "@/lib/seo-meta-sanitize";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

// Функция для получения данных коллекции по ID на сервере
async function getCollectionDataById(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/collections/${id}`,
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

    const collectionData = await getCollectionDataById(id);
    const collectionName = collectionData.name || "Коллекция";
    const rawDescription = collectionData.description
      ? collectionData.description.substring(0, 160).replace(/<[^>]*>/g, "") + "..."
      : `Просмотрите коллекцию "${collectionName}" с ${collectionData.titles?.length || 0} тайтлами`;

    const coverPath = collectionData.cover ?? null;
    const ogImageUrl = getOgImageUrl(baseUrl, coverPath, baseUrl);

    const pageTitle = `Коллекция «${collectionName}» — Tomilo-lib.ru`;
    const canonicalUrl = `${baseUrl}/collections/${id}`;

    return buildServerSEOMetadata({
      title: sanitizeMetaString(pageTitle),
      description: sanitizeMetaString(rawDescription),
      keywords: `${collectionName}, коллекция, тайтлы, манга, маньхуа, манхва, комиксы, онлайн чтение, ${collectionData.titles
        ?.slice(0, 5)
        .map((t: { name: string }) => t.name)
        .join(", ")}`,
      canonicalUrl,
      ogImageUrl,
      ogImageAlt: `Коллекция: ${collectionName}`,
      type: "website",
    });
  } catch (error) {
    console.error("Ошибка при генерации метаданных коллекции:", error);
    return {
      title: "Коллекция не найдена - Tomilo-lib.ru",
      description: "Запрашиваемая коллекция не найдена",
    };
  }
}

// Серверный компонент страницы коллекции по ID
export default async function CollectionPageRoute({ params }: CollectionPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Валидация ID
  if (!id || id === "undefined") {
    notFound();
  }

  return <CollectionDetails collectionId={id} />;
}
