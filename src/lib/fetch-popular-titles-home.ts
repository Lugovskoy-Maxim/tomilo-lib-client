import type { ApiResponseDto } from "@/types/api";

type PopularApiItem = {
  id: string;
  title: string;
  cover?: string;
  description?: string;
  rating?: number;
  type: string;
  releaseYear: number;
  isAdult?: boolean;
  slug?: string;
};

/**
 * Загрузка популярных тайтлов на сервере для главной — данные попадают в первый клиентский рендер до RTK (LCP).
 * Как у гостя с 18+ контентом (как в Lighthouse / первый визит).
 */
export async function fetchPopularTitlesForHome(): Promise<ApiResponseDto<PopularApiItem[]> | null> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/$/, "");
  try {
    const url = `${baseUrl}/titles/popular?limit=10&includeAdult=true`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponseDto<PopularApiItem[]>;
    if (!json?.success || !Array.isArray(json.data)) return null;
    return json;
  } catch {
    return null;
  }
}
