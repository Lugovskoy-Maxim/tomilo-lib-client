'use client';

import React, { useState, useCallback } from 'react';
import { Download, FileImage, Archive, Settings, CheckCircle } from 'lucide-react';
import { MangaPage, TranslatorSettings, DownloadOptions } from '@/types/manga-translator';
import { imageProcessingService } from '@/lib/image-processing-service';
import JSZip from 'jszip';

interface DownloadManagerProps {
  pages: MangaPage[];
  settings: TranslatorSettings;
}

const DownloadManager: React.FC<DownloadManagerProps> = ({
  pages,
  settings,
}) => {
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    format: 'zip',
    quality: 0.9,
    includeOriginal: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadLinks, setDownloadLinks] = useState<Record<string, string>>({});

  const processedPages = pages.filter(page => page.translatedText.length > 0);

  const processImageForDownload = useCallback(async (page: MangaPage): Promise<string | null> => {
    try {
      // Загружаем оригинальное изображение
      const canvas = await imageProcessingService.loadImageFromFile(page.file);
      
      // Создаем обработанное изображение с переведенным текстом
      const processedCanvas = imageProcessingService.replaceTextOnImage(
        canvas,
        page.translatedText,
        settings
      );
      
      // Конвертируем в blob
      const blob = await imageProcessingService.canvasToBlob(
        processedCanvas,
        'image/png',
        downloadOptions.quality
      );
      
      // Создаем URL для скачивания
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error processing image for download:', error);
      return null;
    }
  }, [settings, downloadOptions.quality]);

  const downloadSingleImage = useCallback(async (page: MangaPage, index: number) => {
    const imageUrl = await processImageForDownload(page);
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `translated_page_${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Очищаем URL после скачивания
      setTimeout(() => URL.revokeObjectURL(imageUrl), 100);
    }
  }, [processImageForDownload]);

  const downloadAsZip = useCallback(async () => {
    if (processedPages.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      
      // Добавляем обработанные изображения в архив
      for (let i = 0; i < processedPages.length; i++) {
        const page = processedPages[i];
        setProgress(((i + 1) / processedPages.length) * 100);

        const imageUrl = await processImageForDownload(page);
        if (imageUrl) {
          // Загружаем blob и добавляем в архив
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          zip.file(`translated_page_${i + 1}.png`, blob);
          
          // Очищаем URL
          URL.revokeObjectURL(imageUrl);
        }
      }

      // Добавляем исходные изображения если нужно
      if (downloadOptions.includeOriginal) {
        const originalFolder = zip.folder('original');
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const arrayBuffer = await page.file.arrayBuffer();
          originalFolder?.file(`original_page_${i + 1}.${page.file.name.split('.').pop()}`, arrayBuffer);
        }
      }

      // Создаем и скачиваем архив
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = 'translated_manga.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Очищаем URL
      setTimeout(() => URL.revokeObjectURL(zipUrl), 100);
    } catch (error) {
      console.error('Error creating ZIP:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [processedPages, downloadOptions.includeOriginal, processImageForDownload]);

  const downloadAllIndividually = useCallback(async () => {
    if (processedPages.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      for (let i = 0; i < processedPages.length; i++) {
        setProgress(((i + 1) / processedPages.length) * 100);
        await downloadSingleImage(processedPages[i], i);
        
        // Небольшая задержка между скачиваниями
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error downloading images:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [processedPages, downloadSingleImage]);

  if (pages.length === 0) {
    return (
      <div className="p-6 text-center">
        <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Нет готовых файлов для скачивания
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
          Скачивание результатов
        </h2>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Готово к скачиванию: {processedPages.length} из {pages.length} страниц
        </div>
      </div>

      {/* Настройки скачивания */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Настройки скачивания
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Формат */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Формат
            </label>
            <select
              value={downloadOptions.format}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, format: e.target.value as 'images' | 'zip' }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="zip">ZIP архив</option>
              <option value="images">Отдельные изображения</option>
            </select>
          </div>

          {/* Качество */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Качество: {Math.round(downloadOptions.quality * 100)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.1"
              value={downloadOptions.quality}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Дополнительные опции */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Дополнительно
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={downloadOptions.includeOriginal}
                onChange={(e) => setDownloadOptions(prev => ({ ...prev, includeOriginal: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Включить оригиналы
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Прогресс */}
      {isProcessing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Обработка файлов...
            </span>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <FileImage className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{pages.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Всего страниц</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{processedPages.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Готово к скачиванию</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Archive className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {processedPages.reduce((sum, page) => sum + page.translatedText.length, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Переведенных текстов</div>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки скачивания */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={downloadAsZip}
          disabled={isProcessing || processedPages.length === 0}
          className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          <Archive className="w-4 h-4 mr-2" />
          Скачать ZIP архив
        </button>

        <button
          onClick={downloadAllIndividually}
          disabled={isProcessing || processedPages.length === 0}
          className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
        >
          <FileImage className="w-4 h-4 mr-2" />
          Скачать по одному
        </button>

        {processedPages.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Готово к скачиванию
          </div>
        )}
      </div>

      {/* Инструкции */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
          Готово! Ваши переведенные страницы можно скачать:
        </h4>
        <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">

          <li>• <strong>ZIP архив</strong> - все страницы в одном файле (рекомендуется)</li>
          <li>• <strong>Отдельные изображения</strong> - каждая страница скачивается отдельно</li>
          <li>• Включите `Оригиналы` если хотите сохранить и исходные изображения</li>
          <li>• Качество можно настроить для уменьшения размера файлов</li>
        </ul>
      </div>
    </div>
  );
};

export default DownloadManager;
