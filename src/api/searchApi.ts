import { SearchResult } from "@/types/search";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export async function searchApi(term: string, signal?: AbortSignal): Promise<SearchResult[]> {
  if (!term.trim()) {
    return [];
  }

  try {
    const response = await fetch(`${baseUrl}/search?q=${encodeURIComponent(term)}`, { signal });

    if (!response.ok) {
      throw new Error(`Ошибка поиска: ${response.status}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    return results as SearchResult[];
  } catch (error) {
    console.error('Ошибка при выполнении поиска:', error);
    return [];
  }
}
