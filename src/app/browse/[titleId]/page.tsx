// ./src/app/browse/[titleId]/page.tsx
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import TitleViewClient from "./title-view-client";
import { Metadata } from "next";
import { Title } from "@/types/title";

// Функция для определения бота по User-Agent
function isBot(userAgent: string): boolean {
  const botPatterns = [
    "googlebot",
    "bingbot",
    "yandex",
    "baiduspider",
    "facebookexternalhit",
    "twitterbot",
    "linkedinbot",
    "whatsapp",
    "telegram",
    "slackbot",
    "crawler",
    "spider",
    "bot",
    "scraper",
  ];
  return botPatterns.some((pattern) =>
    userAgent.toLowerCase().includes(pattern)
  );
}

// Функция для получения метаданных
export async function generateMetadata({
  params,
}: {
  params: Promise<{ titleId: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { titleId } = resolvedParams;
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    // Получаем данные тайтла
    const response = await fetch(
      `${apiUrl}/titles/${titleId}?populateChapters=false`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          title: "Тайтл не найден - Tomilo-lib",
          description: "Запрашиваемый тайтл не найден",
        };
      }
      throw new Error(`API error: ${response.status}`);
    }

    const apiResponse = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      return {
        title: "Тайтл не найден - Tomilo-lib",
        description: "Запрашиваемый тайтл не найден",
      };
    }

    const titleData: Title = apiResponse.data;
    const titleName = titleData.name || "Без названия";
    const shortDescription = titleData.description
      ? titleData.description.substring(0, 160).replace(/<[^>]*>/g, "") + "..."
      : `Читать ${titleName} онлайн. ${titleData.genres?.join(", ")}`;

    const image = titleData.coverImage
      ? `${baseUrl}${titleData.coverImage}`
      : undefined;

    // Формируем метаданные с canonical URL
    const metadata: Metadata = {
      title: `Читать ${titleName} - Tomilo-lib`,
      description: shortDescription,
      keywords: `${titleName}, ${titleData.genres?.join(", ")}, ${
        titleData.author
      }, ${titleData.artist}, манга, маньхуа, комиксы, онлайн чтение`,
      alternates: {
        canonical: `${baseUrl}/titles/${titleData.slug}`,
      },
      robots: {
        index: true, // Разрешаем индексацию, так как пользователи могут переходить по старым ссылкам
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      openGraph: {
        title: `Читать ${titleName} - Tomilo-lib`,
        description: shortDescription,
        type: "article",
        url: `${baseUrl}/browse/${titleId}`,
        siteName: "Tomilo-lib.ru",
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `Читать ${titleName} - Tomilo-lib`,
        description: shortDescription,
        images: image ? [image] : [],
      },
    };

    return metadata;
  } catch (error) {
    console.error("Ошибка при генерации метаданных:", error);
    return {
      title: "Ошибка загрузки страницы | Tomilo-lib.ru",
      description: "Произошла ошибка при загрузке страницы",
    };
  }
}

// Основной компонент страницы
export default async function TitleView({
  params,
}: {
  params: Promise<{ titleId: string }>;
}) {
  try {
    const resolvedParams = await params;
    const { titleId } = resolvedParams;
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

    // Получаем данные тайтла для проверки slug
    const response = await fetch(
      `${apiUrl}/titles/${titleId}?populateChapters=false`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error(`API error: ${response.status}`);
    }

    const apiResponse = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      notFound();
    }

    const titleData: Title = apiResponse.data;

    // Редирект ботов на канонический URL (только в runtime компоненте)
    try {
      const currentHeaders = await headers();
      const userAgent = currentHeaders.get("user-agent") || "";
      const isBotRequest = isBot(userAgent);

      if (isBotRequest && titleData.slug) {
        // Добавляем мета-тег для перенаправления через JavaScript
        const clientRedirectScript = `
          <script>
            (function() {
              var isBot = ${JSON.stringify(isBotRequest)};
              if (isBot) {
                var canonicalUrl = '${baseUrl}/titles/${titleData.slug}';
                var meta = document.createElement('meta');
                meta.httpEquiv = 'refresh';
                meta.content = '0; url=' + canonicalUrl;
                document.head.appendChild(meta);
                
                // Также добавляем канонический тег
                var link = document.createElement('link');
                link.rel = 'canonical';
                link.href = canonicalUrl;
                document.head.appendChild(link);
              }
            })();
          </script>
        `;

        // Показываем страницу с мета-тегами для редиректа
        return (
          <>
            <div dangerouslySetInnerHTML={{ __html: clientRedirectScript }} />
            <TitleViewClient initialTitleData={titleData} />
          </>
        );
      }
    } catch (error) {
      // Если не удалось получить headers, просто показываем страницу
      console.warn("Не удалось получить headers для проверки бота:", error);
    }

    // Для обычных пользователей или если не удалось определить бота
    return <TitleViewClient initialTitleData={titleData} />;
  } catch (error) {
    console.error("Ошибка при получении данных тайтла:", error);
    notFound();
  }
}
