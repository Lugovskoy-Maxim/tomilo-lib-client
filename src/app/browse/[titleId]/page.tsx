// ./src/app/browse/[titleId]/page.tsx
import { notFound } from 'next/navigation';
import TitleViewClient from './title-view-client';
import { Metadata } from 'next';
import { Title } from '@/types/title';

// Функция для получения метаданных
export async function generateMetadata(
  { params }: { params: Promise<{ titleId: string }> }
): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { titleId } = resolvedParams;
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://tomilo-lib.ru';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Получаем данные тайтла
    const response = await fetch(`${apiUrl}/titles/${titleId}?populateChapters=false`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          title: 'Тайтл не найден - Tomilo-lib',
          description: 'Запрашиваемый тайтл не найден',
        };
      }
      throw new Error(`API error: ${response.status}`);
    }

    const apiResponse = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      return {
        title: 'Тайтл не найден - Tomilo-lib',
        description: 'Запрашиваемый тайтл не найден',
      };
    }

    const titleData: Title = apiResponse.data;
    const titleName = titleData.name || 'Без названия';
    const shortDescription = titleData.description
      ? titleData.description.substring(0, 160).replace(/<[^>]*>/g, '') + '...'
      : `Читать ${titleName} онлайн. ${titleData.genres?.join(', ')}`;

    const image = titleData.coverImage
      ? `${baseUrl}${titleData.coverImage}`
      : undefined;

    // Формируем метаданные
    const metadata: Metadata = {
      title: `Читать ${titleName} - Tomilo-lib`,
      description: shortDescription,
      keywords: `${titleName}, ${titleData.genres?.join(', ')}, ${titleData.author}, ${titleData.artist}, манга, маньхуа, комиксы, онлайн чтение`,
      openGraph: {
        title: `Читать ${titleName} -  Tomilo-lib`,
        description: shortDescription,
        type: 'article',
        url: `${baseUrl}/browse/${titleId}`,
        siteName: 'Tomilo-lib.ru',
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `Читать ${titleName} - Tomilo-lib`,
        description: shortDescription,
        images: image ? [image] : [],
      },
    };

    return metadata;
  } catch (error) {
    console.error('Ошибка при генерации метаданных:', error);
    return {
      title: 'Ошибка загрузки страницы | Tomilo-lib.ru',
      description: 'Произошла ошибка при загрузке страницы',
    };
  }
}

// Основной компонент страницы
export default async function TitleView(
  { params }: { params: Promise<{ titleId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { titleId } = resolvedParams;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Получаем данные тайтла
    const response = await fetch(`${apiUrl}/titles/${titleId}?populateChapters=false`, {
      cache: 'no-store',
    });

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

    return <TitleViewClient initialTitleData={titleData} />;
  } catch (error) {
    console.error('Ошибка при получении данных тайтла:', error);
    notFound();
  }
}
