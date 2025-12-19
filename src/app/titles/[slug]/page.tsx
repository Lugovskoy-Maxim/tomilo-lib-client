
import { Suspense } from "react";
import TitleViewClient from "./title-view-client";
import { Metadata } from "next";
import { Title } from "@/types/title";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Функция для получения данных тайтла по slug на сервере
async function getTitleDataBySlug(slug: string) {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      }/titles/slug/${slug}?populateChapters=false`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch title by slug: ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching title data by slug:", error);
    throw error;
  }
}

// Функция для генерации SEO метаданных
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

    // Получаем данные тайтла по slug
    const titleData = await getTitleDataBySlug(slug);
    const titleName = titleData.name || "Без названия";
    const shortDescription = titleData.description
      ? titleData.description.substring(0, 160).replace(/<[^>]*>/g, '') + '...'
      : `Читать ${titleName} онлайн. ${titleData.genres?.join(', ')}`;

    const image = titleData.coverImage
      ? `${baseUrl}${titleData.coverImage}`
      : undefined;

    // Формируем метаданные
    const metadata: Metadata = {
      title: `Читать ${titleName} - Tomilo-lib.ru`,
      description: shortDescription,
      keywords: `${titleName}, ${titleData.genres?.join(', ')}, ${titleData.author}, ${titleData.artist}, манга, маньхуа, комиксы, онлайн чтение`,
      openGraph: {
        title: `Читать ${titleName} - Tomilo-lib.ru`,
        description: shortDescription,
        type: 'article',
        url: `${baseUrl}/titles/${slug}`,
        siteName: 'Tomilo-lib.ru',
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `Читать ${titleName} - Tomilo-lib.ru`,
        description: shortDescription,
        images: image ? [image] : [],
      },
    };

    return metadata;
  } catch (error) {
    console.error('Ошибка при генерации метаданных:', error);
    return {
      title: 'Тайтл не найден - Tomilo-lib.ru',
      description: 'Запрашиваемый тайтл не найден',
    };
  }
}

export default async function TitlePage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <div className="text-[var(--foreground)]">Загрузка тайтла...</div>
        </div>
      </div>
    }>
      <TitleViewClient slug={slug} />
    </Suspense>
  );
}
