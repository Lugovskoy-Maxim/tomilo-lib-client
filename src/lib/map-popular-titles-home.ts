import type { ApiResponseDto } from "@/types/api";

/** Формат данных для блока «Популярные» / FeaturedTitleBlock (совпадает с useHomeData). */
export type HomeFeaturedTitle = {
  id: string;
  slug?: string;
  title: string;
  image: string | undefined;
  description: string | undefined;
  type: string;
  year: number;
  rating: number;
  genres: never[];
  isAdult: boolean;
};

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

/** Преобразует ответ API `/titles/popular` в данные для главной (сервер и клиент). */
export function mapPopularTitlesResponseToHome(
  response: ApiResponseDto<PopularApiItem[]> | null | undefined,
): HomeFeaturedTitle[] {
  const list = response?.data;
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.map(item => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    image: item.cover,
    description: item.description,
    type: item.type || "Неуказан",
    year: item.releaseYear || new Date().getFullYear(),
    rating: item.rating || 0,
    genres: [],
    isAdult: item.isAdult ?? false,
  }));
}
