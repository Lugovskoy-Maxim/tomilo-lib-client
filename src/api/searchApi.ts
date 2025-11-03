export interface SearchResult {
  id: string;
  title: string;
  cover?: string; 
  description?: string;
  type?: string;
  releaseYear?: number; 
  rating?: number;
  totalChapters?: number; 
}

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
    
    const results = await response.json();
    return results as SearchResult[];
  } catch (error) {
    console.error('Ошибка при выполнении поиска:', error);
    return [];
  }
}