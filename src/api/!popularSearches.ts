export interface PopularSearchesResult {
  id: string;
  term: string;
  count: number;
}

export async function getPopularSearches():Promise<PopularSearchesResult[]> {
  try {
    const response = await fetch("/api/popular-searches");
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const results = await response.json();
    return results as PopularSearchesResult[];
  } catch (error) {
    console.error("Ошибка при получении популярных запросов", error);
    return [];
  }
}
