import { titlesApi } from '@/store/api/titlesApi'
import { store } from '@/store/index'

// Функция для получения всех тайтлов (с пагинацией)
async function getAllTitles() {
  const allTitles = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      // Используем store.dispatch для вызова endpoint'а
      const result = await store.dispatch(
        titlesApi.endpoints.searchTitles.initiate({
          page,
          limit: 50 // Получаем по 50 тайтлов за раз
        })
      )

      if (result.data?.data?.data) {
        allTitles.push(...result.data.data.data)
        
        // Проверяем, есть ли еще страницы
        if (page >= result.data.data.totalPages) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    } catch (error) {
      console.error('Ошибка при получении тайтлов для sitemap:', error)
      hasMore = false
    }
  }

  return allTitles
}

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://tomilo-lib.ru'
  
  // Базовые страницы
  const routes = ['', '/browse', '/top', '/updates', '/copyright', '/terms-of-use'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }))
  
  try {
    // Получаем все тайтлы
    const titles = await getAllTitles()
    

    // Страницы тайтлов с новыми путями /titles/slug
    const titleRoutes = titles
      .filter(title => title._id && title.slug) // Убедимся, что у тайтла есть ID и slug
      .map((title) => ({
        url: `${baseUrl}/titles/${title.slug}`,
        lastModified: title.updatedAt ? new Date(title.updatedAt) : new Date(),
      }))
    
    // Добавляем также старые URL для совместимости (временное решение)
    const legacyTitleRoutes = titles
      .filter(title => title._id) // Убедимся, что у тайтла есть ID
      .map((title) => ({
        url: `${baseUrl}/browse/${title._id}`,
        lastModified: title.updatedAt ? new Date(title.updatedAt) : new Date(),
      }))
    

    
    return [...routes, ...titleRoutes, ...legacyTitleRoutes]
  } catch (error) {
    console.error('Ошибка при генерации sitemap:', error)
    // Возвращаем только базовые маршруты в случае ошибки
    return routes
  }
}