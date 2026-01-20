import { Suspense } from "react";
import { Metadata } from "next";
import { TitlesPageClient } from "./TitlesPageClient";
import { generateDynamicSEOMetadata } from "@/lib/seo-utils";
import { Filters } from "@/types/browse-page";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Функция для генерации SEO метаданных
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  // Извлечение фильтров из параметров URL
  const filters: Filters = {
    search: (params.search as string) || "",
    genres: (params.genres as string)?.split(",").filter(Boolean) || [],
    types: (params.types as string)?.split(",").filter(Boolean) || [],
    status: (params.status as string)?.split(",").filter(Boolean) || [],
    ageLimits: (params.ageLimits as string)?.split(",").filter(Boolean).map(Number) || [],
    releaseYears: (params.releaseYears as string)?.split(",").filter(Boolean).map(Number) || [],
    tags: (params.tags as string)?.split(",").filter(Boolean) || [],
    sortBy: (params.sortBy as any) || "averageRating",
    sortOrder: (params.sortOrder as any) || "desc",
  };

  const seoData = generateDynamicSEOMetadata(filters);

  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords,
    openGraph: seoData.openGraph,
    twitter: seoData.twitter,
  };
}

export default function TitlesPageRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <div className="text-[var(--foreground)]">Загрузка каталога...</div>
          </div>
        </div>
      }
    >
      <TitlesPageClient />
    </Suspense>
  );
}
