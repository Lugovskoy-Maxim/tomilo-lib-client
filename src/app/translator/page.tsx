import { Suspense } from 'react';
import MangaTranslator from '@/components/manga-translator/manga-translator';
import { Header, Footer } from '@/widgets';

export const metadata = {
  title: 'Переводчик манги | Tomilo-lib.ru',
  description: 'Автоматический перевод манги с английского на русский с помощью OCR и машинного перевода',
};

export default function TranslatorPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Переводчик манги
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Загрузите изображения манги на английском языке, и мы автоматически распознаем текст, 
            переведем его на русский и позволим отредактировать результат перед скачиванием.
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600 dark:text-gray-400">Загрузка переводчика...</div>
            </div>
          </div>
        }>
          <MangaTranslator />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
