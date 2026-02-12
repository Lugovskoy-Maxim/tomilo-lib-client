import { Filters } from "@/types/browse-page";
import { translateTitleType, translateTitleStatus } from "@/lib/title-type-translations";

// Функция для генерации динамических SEO метаданных на основе фильтров
export function generateDynamicSEOMetadata(filters: Filters) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

  // Генерация заголовка на основе фильтров
  let title = "Каталог манги, манхвы, маньхуа и комиксов";

  if (filters.search) {
    title = `Поиск: "${filters.search}" - Каталог тайтлов`;
  } else if (
    filters.genres.length > 0 ||
    filters.types.length > 0 ||
    filters.status.length > 0 ||
    filters.releaseYears.length > 0
  ) {
    const filterParts = [];

    if (filters.genres.length > 0) {
      filterParts.push(`жанрам: ${filters.genres.slice(0, 3).join(", ")}`);
    }

    if (filters.types.length > 0) {
      const translatedTypes = filters.types.map(type => translateTitleType(type));
      filterParts.push(`типам: ${translatedTypes.join(", ")}`);
    }

    if (filters.status.length > 0) {
      const translatedStatuses = filters.status.map(status => translateTitleStatus(status));
      filterParts.push(`статусам: ${translatedStatuses.join(", ")}`);
    }

    if (filters.releaseYears.length > 0) {
      filterParts.push(`годам: ${filters.releaseYears.join(", ")}`);
    }

    title = `Каталог тайтлов: фильтр по ${filterParts.join(", ")}`;
  }

  title += " - Tomilo-lib.ru";

  // Генерация описания на основе фильтров
  let description =
    "Полный каталог манги, манхвы, маньхуа и комиксов для чтения онлайн. Поиск по жанрам, годам выпуска, статусу и типу. Удобная навигация и регулярные обновления.";

  if (filters.search) {
    description = `Результаты поиска по запросу "${filters.search}". Найдите интересующие вас тайтлы в нашем каталоге манги, манхвы, маньхуа и комиксов.`;
  } else if (
    filters.genres.length > 0 ||
    filters.types.length > 0 ||
    filters.status.length > 0 ||
    filters.releaseYears.length > 0
  ) {
    const activeFilters = [];

    if (filters.genres.length > 0) {
      activeFilters.push(`${filters.genres.length} жанрам`);
    }

    if (filters.types.length > 0) {
      activeFilters.push(`${filters.types.length} типам`);
    }

    if (filters.status.length > 0) {
      activeFilters.push(`${filters.status.length} статусам`);
    }

    if (filters.releaseYears.length > 0) {
      activeFilters.push(`${filters.releaseYears.length} годам`);
    }

    description = `Каталог тайтлов отфильтрован по ${activeFilters.join(", ")}. Полный каталог манги, манхвы, маньхуа и комиксов для чтения онлайн.`;
  }

  // Генерация ключевых слов на основе фильтров
  let keywords =
    "каталог манги, манхва, маньхуа, комиксы, онлайн чтение, поиск тайтлов, жанры манги";

  if (filters.search) {
    keywords = `${filters.search}, поиск, ${keywords}`;
  }

  if (filters.genres.length > 0) {
    keywords = `${filters.genres.slice(0, 5).join(", ")}, ${keywords}`;
  }

  if (filters.types.length > 0) {
    const translatedTypes = filters.types.map(type => translateTitleType(type));
    keywords = `${translatedTypes.join(", ")}, ${keywords}`;
  }

  if (filters.status.length > 0) {
    const translatedStatuses = filters.status.map(status => translateTitleStatus(status));
    keywords = `${translatedStatuses.join(", ")}, ${keywords}`;
  }

  if (filters.releaseYears.length > 0) {
    keywords = `${filters.releaseYears.join(", ")}, ${keywords}`;
  }

  // Генерация URL с параметрами
  const url = new URL(`${baseUrl}/titles`);

  if (filters.search) url.searchParams.set("search", filters.search);
  if (filters.genres.length > 0) url.searchParams.set("genres", filters.genres.join(","));
  if (filters.types.length > 0) url.searchParams.set("types", filters.types.join(","));
  if (filters.status.length > 0) url.searchParams.set("status", filters.status.join(","));
  if (filters.ageLimits.length > 0) url.searchParams.set("ageLimits", filters.ageLimits.join(","));
  if (filters.releaseYears.length > 0)
    url.searchParams.set("releaseYears", filters.releaseYears.join(","));
  if (filters.tags.length > 0) url.searchParams.set("tags", filters.tags.join(","));
  if (filters.sortBy !== "averageRating") url.searchParams.set("sortBy", filters.sortBy);
  if (filters.sortOrder !== "desc") url.searchParams.set("sortOrder", filters.sortOrder);

  return {
    title,
    description,
    keywords,
    robots: {
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
      canonical: url.toString(),
      languages: { "ru-RU": url.toString() },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: url.toString(),
      siteName: "Tomilo-lib.ru",
      locale: "ru_RU",
      images: [
        {
          url: `${baseUrl}/logo/tomilo_color.svg`,
          width: 1200,
          height: 630,
          alt: "Tomilo-lib — каталог манги, манхвы, маньхуа",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/logo/tomilo_color.svg`],
      creator: "@tomilo_lib",
      site: "@tomilo_lib",
    },
  };
}
