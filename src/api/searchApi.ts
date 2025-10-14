export interface SearchResult {
  id: number;
  title: string;
  image?: string;
  description?: string;
  type?: string;
  year?: number;
  rating?: number;
}

export async function searchApi(term: string): Promise<SearchResult[]> {
  if (!term.trim()) {
    return [];
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
    
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