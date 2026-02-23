/**
 * Единый построитель серверных SEO-метаданных для Next.js (generateMetadata).
 * Обеспечивает корректные превью и индексацию во всех соцсетях и поисковиках:
 *
 * Поисковики: Google, Yandex, Bing — title, description, canonical, robots.
 * Open Graph: Facebook, VK, LinkedIn, Telegram, WhatsApp, Discord, Pinterest — og:*
 * Twitter/X: twitter:card, twitter:title, twitter:image, twitter:image:alt и др.
 *
 * Требования: абсолютные URL для og:image/twitter:image (metadataBase в layout),
 * изображения PNG/JPEG (не SVG), санитизированные строки для title/description.
 */

import type { Metadata } from "next";

const SITE_NAME = "Tomilo-lib.ru";
const LOCALE = "ru_RU";
const TWITTER_CREATOR = "@tomilo_lib";
const TWITTER_SITE = "@tomilo_lib";

export interface ServerSEOParams {
  /** Заголовок страницы (уже санитизированный для meta) */
  title: string;
  /** Описание (150–160 символов для сниппета в выдаче, санитизированное) */
  description: string;
  /** Ключевые слова через запятую */
  keywords?: string;
  /** Категория страницы (для части поисковиков) */
  category?: string;
  /** Абсолютный URL страницы (canonical + og:url) */
  canonicalUrl: string;
  /** Абсолютный URL изображения для OG/Twitter (PNG/JPEG, 1200×630 рекомендуется) */
  ogImageUrl: string;
  /** Подпись к изображению (og:image:alt) */
  ogImageAlt?: string;
  /** og:type — "website" | "article" */
  type?: "website" | "article";
  /** Не индексировать (noindex, nofollow) */
  noindex?: boolean;
  /** Дополнительные поля для article (улучшают ранжирование в поиске) */
  article?: {
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
  /** Дополнительные authors (meta) */
  authors?: string[];
  /** publisher */
  publisher?: string;
  /** creator (meta) */
  creator?: string;
  /** Yandex verification (если нужен на странице; в layout уже есть) */
  verification?: { yandex?: string };
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
}

/**
 * Собирает объект Metadata для поисковиков и соцсетей.
 * Используйте для всех страниц с generateMetadata.
 */
export function buildServerSEOMetadata(params: ServerSEOParams): Metadata {
  const {
    title,
    description,
    keywords,
    category,
    canonicalUrl,
    ogImageUrl,
    ogImageAlt = SITE_NAME,
    type = "website",
    noindex = false,
    article,
    authors,
    publisher,
    creator,
    verification,
  } = params;

  const ogImage = {
    url: ogImageUrl,
    width: 1200 as const,
    height: 630 as const,
    alt: ogImageAlt,
  };

  const metadata: Metadata = {
    title,
    description,
    ...(keywords && { keywords }),
    ...(category && { category }),
    ...(authors?.length && { authors: authors.map((a) => ({ name: a })) }),
    ...(creator && { creator }),
    ...(publisher && { publisher }),
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    alternates: {
      canonical: canonicalUrl,
      languages: { "ru-RU": canonicalUrl },
    },
    openGraph: {
      type,
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: LOCALE,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      site: TWITTER_SITE,
      creator: TWITTER_CREATOR,
    },
    ...(verification && Object.keys(verification).length > 0 && { verification }),
  };

  if (type === "article" && article) {
    (metadata.openGraph as Record<string, unknown>) = {
      ...metadata.openGraph,
      type: "article",
      ...(article.publishedTime && { publishedTime: article.publishedTime }),
      ...(article.modifiedTime && { modifiedTime: article.modifiedTime }),
      ...(article.section && { section: article.section }),
      ...(article.tags?.length && { tags: article.tags }),
      ...(article.author && { authors: [article.author] }),
    };
  }

  return metadata;
}

/**
 * Базовый URL сайта для использования в og:image и canonical.
 */
export function getSiteBaseUrl(): string {
  return getBaseUrl();
}
