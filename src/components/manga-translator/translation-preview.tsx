'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Eye, ZoomIn, ZoomOut, RotateCcw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { MangaPage, TranslatorSettings } from '@/types/manga-translator';
import { imageProcessingService } from '@/lib/image-processing-service';

interface TranslationPreviewProps {
  pages: MangaPage[];
  settings: TranslatorSettings;
}

const TranslationPreview: React.FC<TranslationPreviewProps> = ({
  pages,
  settings,
}) => {
  const [selectedPage, setSelectedPage] = useState<string>(pages[0]?.id || '');
  const [zoom, setZoom] = useState(100);
  const [processedImages, setProcessedImages] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPage = pages.find(p => p.id === selectedPage);

  // Обработка изображений с переведенным текстом
  const processImage = useCallback(async (page: MangaPage) => {
    if (page.translatedText.length === 0) return null;

    setIsProcessing(true);
    try {
      // Загружаем оригинальное изображение
      const canvas = await imageProcessingService.loadImageFromFile(page.file);
      
      // Создаем превью с переведенным текстом
      const processedCanvas = imageProcessingService.createPreviewWithText(
        canvas,
        page.translatedText,
        settings
      );
      
      // Конвертируем в data URL
      const dataUrl = imageProcessingService.canvasToDataURL(processedCanvas);
      return dataUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [settings]);

  // Обработка всех страниц при изменении настроек
  useEffect(() => {
    const processAllPages = async () => {
      const newProcessedImages: Record<string, string> = {};
      
      for (const page of pages) {
        if (page.translatedText.length > 0) {
          const processedImage = await processImage(page);
          if (processedImage) {
            newProcessedImages[page.id] = processedImage;
          }
        }
      }
      
      setProcessedImages(newProcessedImages);
    };

    if (pages.length > 0) {
      processAllPages();
    }
  }, [pages, settings, processImage]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  const currentProcessedImage = processedImages[selectedPage];

  if (pages.length === 0) {
    return (
      <div className="p-6 text-center">
        <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Нет страниц для предпросмотра
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Сначала загрузите изображения, выполните OCR и перевод
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Предпросмотр перевода
        </h2>
        
        <div className="flex items-center space-x-4">
          {/* Управление зумом */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 25}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
              {zoom}%
            </span>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 300}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleResetZoom}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Список страниц */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Страницы
          </h3>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedPage === page.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Страница {index + 1}
                  </span>
                  
                  {processedImages[page.id] && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {page.translatedText.length} текстов
                </div>
                
                {!processedImages[page.id] && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Не обработано
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Область предпросмотра */}
        <div className="lg:col-span-3">
          {currentPage && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Страница {pages.findIndex(p => p.id === selectedPage) + 1}
                </h3>
                
                <div className="flex items-center space-x-2">
                  {/* Навигация */}
                  <button
                    onClick={() => {
                      const currentIndex = pages.findIndex(p => p.id === selectedPage);
                      if (currentIndex > 0) {
                        setSelectedPage(pages[currentIndex - 1].id);
                      }
                    }}
                    disabled={pages.findIndex(p => p.id === selectedPage) === 0}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      const currentIndex = pages.findIndex(p => p.id === selectedPage);
                      if (currentIndex < pages.length - 1) {
                        setSelectedPage(pages[currentIndex + 1].id);
                      }
                    }}
                    disabled={pages.findIndex(p => p.id === selectedPage) === pages.length - 1}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Изображение */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-auto max-h-[600px]">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <div className="text-gray-600 dark:text-gray-400">Обработка изображения...</div>
                    </div>
                  </div>
                ) : currentProcessedImage ? (
                  <div className="flex justify-center p-4">
                    <img
                      src={currentProcessedImage}
                      alt={`Обработанная страница ${selectedPage}`}
                      style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                      className="max-w-none transition-transform duration-200"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Eye className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <div className="text-gray-600 dark:text-gray-400">
                        {currentPage.translatedText.length === 0
                          ? 'Нет переведенного текста'
                          : 'Ошибка обработки изображения'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Информация о тексте */}
              {currentPage.translatedText.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Переведенные тексты на этой странице:
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">


                    {currentPage.translatedText.slice(0, 5).map((text) => (
                      <div key={text.id} className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          &ldquo;{text.text}&rdquo;
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 mx-2">→</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          &ldquo;{text.translatedText}&rdquo;
                        </span>
                      </div>
                    ))}
                    {currentPage.translatedText.length > 5 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        и еще {currentPage.translatedText.length - 5} текстов...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationPreview;
