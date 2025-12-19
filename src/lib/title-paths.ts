/**
 * Утилита для генерации правильных путей к тайтлам
 * Использует /titles/[slug] если есть slug, иначе /browse/[id]
 */

export interface TitleWithSlug {
  _id: string;
  slug?: string;
}

export interface TitleWithId {
  id: string;
  slug?: string;
}

/**
 * Генерирует правильный путь к тайтлу
 */
export function getTitlePath(title: TitleWithSlug | TitleWithId): string {
  const id = 'id' in title ? title.id : title._id;
  const slug = title.slug;
  
  return slug ? `/titles/${slug}` : `/browse/${id}`;
}

/**
 * Генерирует правильный путь к главе тайтла
 */
export function getChapterPath(
  title: TitleWithSlug | TitleWithId, 
  chapterId: string
): string {
  const id = 'id' in title ? title.id : title._id;
  const slug = title.slug;
  
  return slug ? `/titles/${slug}/chapter/${chapterId}` : `/browse/${id}/chapter/${chapterId}`;
}

/**
 * Генерирует правильный путь к странице тайтла (альтернатива getTitlePath для совместимости)
 */
export function getTitleUrl(title: TitleWithSlug | TitleWithId): string {
  return getTitlePath(title);
}

/**
 * Проверяет, доступен ли slug для тайтла
 */
export function hasSlug(title: TitleWithSlug | TitleWithId): boolean {
  return !!title.slug;
}

/**
 * Создает объект с правильными путями для тайтла
 */
export function createTitlePaths(title: TitleWithSlug | TitleWithId) {
  const id = 'id' in title ? title.id : title._id;
  const slug = title.slug;
  
  return {
    id,
    slug,
    titlePath: getTitlePath(title),
    chapterPath: (chapterId: string) => getChapterPath(title, chapterId),
    hasSlug: !!slug
  };
}
