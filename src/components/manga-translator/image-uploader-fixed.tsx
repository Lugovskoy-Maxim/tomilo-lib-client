'use client';

import React, { useCallback } from 'react';
import { Upload, FileImage, Languages, X } from 'lucide-react';
import { MangaPage } from '@/types/manga-translator';

interface ImageUploaderProps {
  onFileUpload: (files: FileList) => void;
  isProcessing: boolean;
  onProcessOCR: () => void;
  onTranslate: () => void;
  pages: MangaPage[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFileUpload,
  isProcessing,
  onProcessOCR,
  onTranslate,
  pages,
}) => {
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        onFileUpload(files);
      }
    },
    [onFileUpload]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        onFileUpload(files);
      }
    },
    [onFileUpload]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  const removePage = useCallback((pageId: string) => {
    // В реальном приложении здесь была бы логика удаления страницы
    console.log('Remove page:', pageId);
  }, []);

  const hasProcessedPages = pages.some((page) => page.isProcessed);
  const hasTranslatedPages = pages.some(
    (page) => page.translatedText.length > 0
  );

  return (
    <div className="p-6">
      {/* Загрузка файлов */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Загрузка изображений
        </h2>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Перетащите изображения сюда или нажмите для выбора
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Поддерживаются форматы: JPG, PNG, WEBP
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Список загруженных страниц */}
      {pages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Загруженные страницы ({pages.length})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {pages.map((page) => (
              <div key={page.id} className="relative group">
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={page.imageUrl}
                    alt={`Страница ${page.id}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Статус обработки */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {page.isProcessing ? (
                      <div className="text-white text-sm">Обработка...</div>
                    ) : page.isProcessed ? (
                      <div className="text-green-400 text-sm">✓ Готово</div>
                    ) : (
                      <button
                        onClick={() => removePage(page.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Информация о тексте */}
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {page.originalText.length} текстов
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      {pages.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onProcessOCR}
            disabled={isProcessing}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <FileImage className="w-4 h-4 mr-2" />
            {isProcessing ? 'Обработка...' : 'Распознать текст (OCR)'}
          </button>

          <button
            onClick={onTranslate}
            disabled={isProcessing || !hasProcessedPages}
            className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
          >
            <Languages className="w-4 h-4 mr-2" />
            {isProcessing ? 'Перевод...' : 'Перевести текст'}
          </button>
        </div>
      )}

      {/* Инструкции */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          Как использовать:
        </h4>

        <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>1. Загрузите изображения страниц манги</li>
          <li>2. Нажмите &quot;Распознать текст&quot; для извлечения текста с изображений</li>
          <li>3. Нажмите &quot;Перевести текст&quot; для автоматического перевода на русский</li>
          <li>4. Перейдите на вкладку &quot;Редактирование&quot; для ручной правки перевода</li>
          <li>5. Проверьте результат во вкладке &quot;Предпросмотр&quot;</li>
          <li>6. Скачайте готовые изображения во вкладке &quot;Скачивание&quot;</li>
        </ol>
      </div>
    </div>
  );
};

export default ImageUploader;
