import { Title, ChaptersResponse } from "@/types/title";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Функция для нормализации URL изображений
export function normalizeAssetUrl(p: string): string {
  if (!p) return "";
  if (p.startsWith("http")) {
    return p.replace("/api/browse/", "/uploads/browse/");
  }
  let path = p.startsWith("/") ? p : `/${p}`;
  // normalize wrong api prefix to uploads
  if (path.startsWith("/api/")) path = path.replace(/^\/api\//, "/uploads/");
  if (path.startsWith("api/")) path = path.replace(/^api\//, "uploads/");
  const origin =
    process.env.NEXT_PUBLIC_UPLOADS_URL || "http://localhost:3001/uploads";
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Получение тайтла по ID
export async function getTitleById({ id }: { id: string }): Promise<Title | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/titles/${id}`, {
      next: { revalidate: 3600 }, // Кэшировать на 1 час
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Обработка различных форматов ответа API
    if (data.success === false) {
      throw new Error(data.message || 'Failed to fetch title');
    }
    
    if (data.data) {
      return data.data;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching title:", error);
    return null;
  }
}

// Получение глав по ID тайтла
export async function getChaptersByTitle({ 
  titleId, 
  page = 1, 
  limit = 10000, 
  sortOrder = "asc" 
}: { 
  titleId: string; 
  page?: number; 
  limit?: number; 
  sortOrder?: "asc" | "desc"; 
}): Promise<ChaptersResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chapters/title/${titleId}?page=${page}&limit=${limit}&sortOrder=${sortOrder}`,
      {
        next: { revalidate: 3600 }, // Кэшировать на 1 час
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Обработка различных форматов ответа API
    if (data.success === false) {
      throw new Error(data.message || 'Failed to fetch chapters');
    }
    
    // Нормализация ответа
    if (data.data) {
      return data.data;
    }
    
    // Если данные находятся в корневом объекте
    const chapters = data.chapters || [];
    const total = data.total || data.pagination?.total || chapters.length;
    const currentPage = data.page || data.pagination?.page || 1;
    const totalPages = data.totalPages || data.pagination?.pages || Math.ceil(total / limit);
    const hasMore = data.hasMore || currentPage < totalPages;
    
    return {
      chapters,
      total,
      page: currentPage,
      limit,
      totalPages,
      hasMore
    };
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return null;
  }
}