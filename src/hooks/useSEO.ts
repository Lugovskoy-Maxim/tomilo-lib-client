"use client";
import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
}

export const useSEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  noindex = false,
}: SEOProps) => {
  useEffect(() => {
    // Установка title
    if (title && typeof document !== 'undefined') {
      document.title = title;
    }

    // Функция для установки или обновления meta тега
    const setMetaTag = (name: string, content: string, property = false) => {
      if (typeof document === 'undefined') return;

      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

      if (element) {
        element.content = content;
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Функция для удаления meta тега
    const removeMetaTag = (name: string, property = false) => {
      if (typeof document === 'undefined') return;

      const attribute = property ? 'property' : 'name';
      const element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (element) {
        element.remove();
      }
    };

    // Установка основных мета-тегов
    if (description) {
      setMetaTag('description', description);
      setMetaTag('og:description', description, true);
      setMetaTag('twitter:description', description, true);
    }

    if (keywords) {
      setMetaTag('keywords', keywords);
    }

    if (image) {
      setMetaTag('og:image', image, true);
      setMetaTag('twitter:image', image, true);
    }

    if (url) {
      setMetaTag('og:url', url, true);
    }

    // Open Graph мета-теги
    setMetaTag('og:type', type, true);
    setMetaTag('og:site_name', 'Tomilo-lib.ru', true);

    if (title) {
      setMetaTag('og:title', title, true);
    }

    // Twitter Card мета-теги
    setMetaTag('twitter:card', 'summary_large_image', true);

    if (title) {
      setMetaTag('twitter:title', title, true);
    }

    // Article специфичные мета-теги
    if (type === 'article') {
      if (author) {
        setMetaTag('article:author', author, true);
      }
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        setMetaTag('article:modified_time', modifiedTime, true);
      }
      if (section) {
        setMetaTag('article:section', section, true);
      }
      if (tags && tags.length > 0) {
        tags.forEach(tag => {
          setMetaTag('article:tag', tag, true);
        });
      }
    }

    // Profile специфичные мета-теги
    if (type === 'profile' && author) {
      setMetaTag('profile:username', author, true);
    }

    // Robots мета-тег
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      removeMetaTag('robots');
    }

    // Очистка при размонтировании
    return () => {
      // Не удаляем мета-теги при размонтировании, так как они могут быть нужны для других компонентов
      // Вместо этого они будут перезаписаны при следующем вызове useSEO
    };
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, section, tags, noindex]);
};

// Предустановленные конфигурации для разных типов страниц
export const seoConfigs = {
  home: {
    title: 'Tomilo-lib.ru - Читать мангу, манхву, маньхуа и комиксы онлайн',
    description: 'Большая коллекция манги, манхвы, маньхуа и комиксов для чтения онлайн бесплатно. Удобный интерфейс, регулярные обновления, закладки и история чтения.',
    keywords: 'манга, маньхуа, комиксы, чтение онлайн, тайтлы, главы, манхва, бесплатно, онлайн, читать',
    type: 'website' as const,
  },

  browse: (searchQuery?: string) => ({
    title: searchQuery
      ? `Поиск: "${searchQuery}" - Каталог тайтлов - Tomilo-lib.ru`
      : 'Каталог тайтлов - Tomilo-lib.ru',
    description: searchQuery
      ? `Результаты поиска по запросу "${searchQuery}". Найдите интересующие вас тайтлы в нашем каталоге манги и комиксов.`
      : 'Обширный каталог манги, маньхуа и комиксов. Фильтры по жанрам, статусу и популярности.',
    keywords: 'каталог, манга, маньхуа, комиксы, поиск, фильтры, жанры',
    type: 'website' as const,
  }),

  title: (titleData: {
    name?: string;
    title?: string;
    description?: string;
    genres?: string[];
    author?: string;
    artist?: string;
    status?: string;
    releaseYear?: number;
    coverImage?: string;
    image?: string;
  }) => {
    const titleName = titleData.name || titleData.title || 'Без названия';
    const shortDescription = titleData.description
      ? titleData.description.substring(0, 160).replace(/<[^>]*>/g, '') + '...'
      : `Читать ${titleName} онлайн. ${titleData.genres?.join(', ')}`;
    
    return {
      title: `Читать ${titleName} - Tomilo-lib.ru`,
      description: shortDescription,
      keywords: `${titleName}, ${titleData.genres?.join(', ')}, ${titleData.author}, ${titleData.artist}, манга, маньхуа, комиксы, онлайн чтение`,
      image: titleData.coverImage || titleData.image,
      type: 'article' as const,
      author: titleData.author,
      section: titleData.genres?.[0],
      tags: titleData.genres,
      publishedTime: titleData.releaseYear ? new Date(titleData.releaseYear, 0, 1).toISOString() : undefined,
    };
  },

  chapter: (titleData: {
    name?: string;
    title?: string;
  }, chapterNumber: number, chapterTitle?: string) => {
    const titleName = titleData.name || titleData.title || 'Без названия';
    const chapterText = chapterTitle ? ` - ${chapterTitle}` : '';

    return {
      title: `${titleName} - Глава ${chapterNumber}${chapterText} - Tomilo-lib.ru`,
      description: `Читать ${titleName} главу ${chapterNumber}${chapterTitle ? ` "${chapterTitle}"` : ''} онлайн. Манга, манхва, маньхуа, комиксы.`,
      keywords: `${titleName}, глава ${chapterNumber}, ${chapterTitle}, онлайн чтение, манга, манхва, маньхуа`,
      type: 'article' as const,
    };
  },

  profile: (userName?: string) => ({
    title: userName ? `${userName} - Профиль | Tomilo-lib.ru` : 'Профиль пользователя | Tomilo-lib.ru',
    description: userName
      ? `Профиль пользователя ${userName}. История чтения, закладки, настройки аккаунта.`
      : 'Личный кабинет пользователя. Управление закладками, историей чтения и настройками.',
    keywords: 'профиль, пользователь, закладки, история чтения, настройки',
    type: 'profile' as const,
    author: userName,
  }),

  bookmarks: {
    title: 'Мои закладки - Tomilo-lib.ru',
    description: 'Управление закладками. Все сохраненные вами манги и комиксы в одном месте.',
    keywords: 'закладки, сохраненные тайтлы, манга, маньхуа, комиксы',
    type: 'website' as const,
  },

  history: {
    title: 'История чтения - Tomilo-lib.ru',
    description: 'История прочитанных глав. Отслеживайте свой прогресс чтения манги и комиксов.',
    keywords: 'история чтения, прочитанные главы, прогресс, манга, маньхуа',
    type: 'website' as const,
  },

  static: (pageName: string, description: string) => ({
    title: `${pageName} | Tomilo-lib.ru`,
    description,
    keywords: `${pageName.toLowerCase()}, информация, правила`,
    type: 'website' as const,
  }),
};
