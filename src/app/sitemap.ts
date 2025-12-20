import { titlesApi } from '@/store/api/titlesApi'
import { collectionsApi } from '@/store/api/collectionsApi'
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

// Функция для получения всех коллекций (с пагинацией)
async function getAllCollections() {
  const allCollections = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      // Используем store.dispatch для вызова endpoint'а
      const result = await store.dispatch(
        collectionsApi.endpoints.getCollections.initiate({
          page,
          limit: 50 // Получаем по 50 коллекций за раз
        })
      )

      if (result.data?.data?.collections) {
        allCollections.push(...result.data.data.collections)
        
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
      console.error('Ошибка при получении коллекций для sitemap:', error)
      hasMore = false
    }
  }

  return allCollections
}

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://tomilo-lib.ru'
  

  // Базовые страницы
  const routes = ['', '/collections', '/top', '/updates', '/copyright', '/terms-of-use'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }))
  

  try {
    // Получаем все тайтлы
    const titles = await getAllTitles()
    
    // Получаем все коллекции
    const collections = await getAllCollections()

    // Страницы тайтлов с новыми путями /titles/slug
    const titleRoutes = titles
      .filter(title => title._id && title.slug) // Убедимся, что у тайтла есть ID и slug
      .map((title) => ({
        url: `${baseUrl}/titles/${title.slug}`,
        lastModified: title.updatedAt ? new Date(title.updatedAt) : new Date(),
      }))

    // Страницы коллекций /collections/[id]
    const collectionRoutes = collections
      .filter(collection => collection.id) // Убедимся, что у коллекции есть ID
      .map((collection) => ({
        url: `${baseUrl}/collections/${collection.id}`,
        lastModified: collection.updatedAt ? new Date(collection.updatedAt) : new Date(),
      }))

    
    return [...routes, ...titleRoutes, ...collectionRoutes]
  } catch (error) {
    console.error('Ошибка при генерации sitemap:', error)
    // Возвращаем только базовые маршруты в случае ошибки
    return routes
  }
}