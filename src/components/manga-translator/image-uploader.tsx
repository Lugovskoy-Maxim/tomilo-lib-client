'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileImage, Languages, X, FileText } from 'lucide-react';
import { MangaPage } from '@/types/manga-translator';
import { PDFProcessor } from '@/lib/pdf-service';

interface ImageUploaderProps {
  onFileUpload: (files: FileList) => void;
  isProcessing: boolean;
  onProcessOCR: () => void;
  onTranslate: () => void;
  pages: MangaPage[];
  onPDFProcessing?: (isProcessing: boolean) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFileUpload,
  isProcessing,
  onProcessOCR,
  onTranslate,
  pages,
  onPDFProcessing,
}) => {
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        
        // Проверяем тип файла
        if (file.type === 'application/pdf') {
          // Обрабатываем PDF файл
          setIsProcessingPDF(true);
          onPDFProcessing?.(true);
          
          try {
            const imageFiles = await PDFProcessor.processPDFFile(file);
            // Создаем новый FileList из извлеченных изображений
            const dt = new DataTransfer();
            imageFiles.forEach(imgFile => dt.items.add(imgFile));
            onFileUpload(dt.files);
          } catch (error) {
            console.error('Ошибка при обработке PDF:', error);
            alert('Не удалось обработать PDF файл. Пожалуйста, попробуйте другой файл.');
          } finally {
            setIsProcessingPDF(false);
            onPDFProcessing?.(false);
          }
        } else if (file.type.startsWith('image/')) {
          // Обрабатываем изображение
          onFileUpload(files);
        } else {
          alert('Поддерживаются только изображения (JPG, PNG, WEBP) и PDF файлы.');
        }
      }
    },
    [onFileUpload, onPDFProcessing]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        
        if (file.type === 'application/pdf') {
          setIsProcessingPDF(true);
          onPDFProcessing?.(true);
          
          try {
            const imageFiles = await PDFProcessor.processPDFFile(file);
            const dt = new DataTransfer();
            imageFiles.forEach(imgFile => dt.items.add(imgFile));
            onFileUpload(dt.files);
          } catch (error) {
            console.error('Ошибка при обработке PDF:', error);
            alert('Не удалось обработать PDF файл. Пожалуйста, попробуйте другой файл.');
          } finally {
            setIsProcessingPDF(false);
            onPDFProcessing?.(false);
          }
        } else if (file.type.startsWith('image/')) {
          onFileUpload(files);
        } else {
          alert('Поддерживаются только изображения (JPG, PNG, WEBP) и PDF файлы.');
        }
      }
    },
    [onFileUpload, onPDFProcessing]
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

  const getDropzoneText = () => {
    if (isProcessingPDF) {
      return 'Обработка PDF файла...';
    }
    return 'Перетащите изображения или PDF файл сюда, или нажмите для выбора';
  };

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
            {getDropzoneText()}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Поддерживаются форматы: JPG, PNG, WEBP, PDF
          </p>
          {isProcessingPDF && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Извлечение страниц из PDF...</span>
            </div>
          )}
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessingPDF}
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
                      <div className="text-white text-sm flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Обработка...</span>
                      </div>
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
            disabled={isProcessing || isProcessingPDF}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <FileImage className="w-4 h-4 mr-2" />
            {isProcessing ? 'Обработка...' : 'Распознать текст (OCR)'}
          </button>

          <button
            onClick={onTranslate}
            disabled={isProcessing || !hasProcessedPages || isProcessingPDF}
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
          <li>1. Загрузите изображения или PDF файл с главой манги</li>
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
