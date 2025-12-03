// ./src/app/browse/[titleId]/page.tsx
import { notFound } from 'next/navigation';
import { titlesApi } from '@/store/api/titlesApi';
import { store } from '@/store/index';
import { Title } from "@/types/title";
import TitleViewClient from './title-view-client';
import { Metadata } from 'next';

// Функция для получения метаданных
export async function generateMetadata(
  { params }: { params: Promise<{ titleId: string }> }
): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { titleId } = resolvedParams;
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://tomilo-lib.ru';
    
    // Получаем данные тайтла
    const result = await store.dispatch(
      titlesApi.endpoints.getTitleById.initiate({ 
        id: titleId, 
        includeChapters: false 
      })
    );
    
    if (!result.data) {
      return {
        title: 'Тайтл не найден | Tomilo-lib.ru',
        description: 'Запрашиваемый тайтл не найден',
      };
    }
    
    const titleData = result.data;
    const titleName = titleData.name || 'Без названия';
    const shortDescription = titleData.description
      ? titleData.description.substring(0, 160).replace(/<[^>]*>/g, '') + '...'
      : `Читать ${titleName} онлайн. ${titleData.genres?.join(', ')}`;
    
    const image = titleData.coverImage 
      ? `${baseUrl}${titleData.coverImage}`
      : undefined;
    
    // Формируем метаданные
    const metadata: Metadata = {
      title: `${titleName} - Читать онлайн | Tomilo-lib.ru`,
      description: shortDescription,
      keywords: `${titleName}, ${titleData.genres?.join(', ')}, ${titleData.author}, ${titleData.artist}, манга, маньхуа, комиксы, онлайн чтение`,
      openGraph: {
        title: `${titleName} - Читать онлайн | Tomilo-lib.ru`,
        description: shortDescription,
        type: 'article',
        url: `${baseUrl}/browse/${titleId}`,
        siteName: 'Tomilo-lib.ru',
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${titleName} - Читать онлайн | Tomilo-lib.ru`,
        description: shortDescription,
        images: image ? [image] : [],
      },
    };
    
    return metadata;
  } catch (error) {
    console.error('Ошибка при генерации метаданных:', error);
    return {
      title: 'Ошибка | Tomilo-lib.ru',
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
    
    // Получаем данные тайтла
    const result = await store.dispatch(
      titlesApi.endpoints.getTitleById.initiate({ 
        id: titleId, 
        includeChapters: false 
      })
    );
    
    if (!result.data) {
      notFound();
    }
    
    return <TitleViewClient initialTitleData={result.data} />;
  } catch (error) {
    console.error('Ошибка при получении данных тайтла:', error);
    notFound();
  }
}