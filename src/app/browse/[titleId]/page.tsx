import { Title, getTitleById, mockTitle } from "@/constants/mokeReadPage";
import { TitlePageSkeleton } from "@/shared/browse";
import TitlePageContent from "@/shared/browse/title-page-components";
import NotFound from "@/app/not-found";
import { pageTitle } from "@/lib/page-title";
import { Suspense } from "react";

interface BrowseTitlePageProps {
  params: Promise<{
    titleId: string;
  }>;
}

// Функция для поиска тайтла по ID
async function findTitleById(id: string): Promise<Title | null> {
  // Имитация задержки сети
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Пытаемся преобразовать ID в число
  const titleId = parseInt(id, 10);

  // Если преобразование успешно, ищем по ID
  if (!isNaN(titleId)) {
    return getTitleById(titleId) || null;
  }

  // Если ID не число, ищем по slug/названию
  const foundBySlug = mockTitle.find(
    (title) =>
      title.title.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase()
  );

  return foundBySlug || null;
}

export default async function BrowseTitlePage({
  params,
}: BrowseTitlePageProps) {
  // Ожидаем params
  const resolvedParams = await params;
  const { titleId } = resolvedParams;

  if (!titleId) {
    pageTitle.setTitle("Тайтл не найден");
    return <NotFound />;
  }

  return (
    <Suspense fallback={<TitlePageSkeleton />}>
      <TitleContent titleId={titleId} />
    </Suspense>
  );
}

// Компонент для загрузки и отображения контента
async function TitleContent({ titleId }: { titleId: string }) {
  try {
    const title = await findTitleById(titleId);

    if (!title) {
      pageTitle.setTitle("Тайтл не найден");
      return <NotFound />;
    }

    pageTitle.setTitlePage(title.title);
    return <TitlePageContent title={title} />;
  } catch (error) {
    console.error("Ошибка при загрузке тайтла:", error);
    pageTitle.setTitle("Ошибка загрузки");
    return <NotFound />;
  }
}

// Альтернативный вариант с generateMetadata для SEO
export async function generateMetadata({ params }: BrowseTitlePageProps) {
  // Ожидаем params
  const resolvedParams = await params;
  const { titleId } = resolvedParams;

  try {
    const title = await findTitleById(titleId);

    if (!title) {
      return {
        title: "Тайтл не найден",
      };
    }

    return {
      title: title.title,
      description: title.description || `Страница тайтла ${title.title}`,
    };
  } catch (error) {
    return {
      title: "Ошибка загрузки",
    };
  }
}

