'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileImage, Loader2, Download, Settings, Eye, Edit3 } from 'lucide-react';
import { MangaPage, DetectedText, TranslatorSettings, DEFAULT_TRANSLATOR_SETTINGS, TranslationJob } from '@/types/manga-translator';
import { ocrService } from '@/lib/ocr-service';
import { translationService } from '@/lib/translation-service';
import { imageProcessingService } from '@/lib/image-processing-service';
import JSZip from 'jszip';
import ImageUploader from './image-uploader';
import TextEditor from './text-editor';
import TranslationPreview from './translation-preview';
import DownloadManager from './download-manager';
import SettingsPanel from './settings-panel';

const MangaTranslator: React.FC = () => {
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [job, setJob] = useState<TranslationJob>({
    id: '',
    pages: [],
    status: 'idle',
    progress: 0,
  });
  const [settings, setSettings] = useState<TranslatorSettings>(DEFAULT_TRANSLATOR_SETTINGS);


  type TabType = 'upload' | 'edit' | 'preview' | 'download' | 'settings';
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Инициализация OCR при загрузке компонента
  useEffect(() => {
    const initializeOCR = async () => {
      try {
        await ocrService.initialize(settings.ocrLanguage);
      } catch (err) {
        console.error('Failed to initialize OCR:', err);
        setError('Не удалось инициализировать OCR. Проверьте подключение к интернету.');
      }
    };

    initializeOCR();

    // Очистка при размонтировании
    return () => {
      ocrService.terminate();
    };
  }, [settings.ocrLanguage]);

  // Обработка загрузки файлов
  const handleFileUpload = useCallback(async (files: FileList) => {
    setError(null);
    setIsProcessing(true);

    try {
      const newPages: MangaPage[] = Array.from(files).map((file, index) => ({
        id: `page-${Date.now()}-${index}`,
        file,
        imageUrl: URL.createObjectURL(file),
        originalText: [],
        translatedText: [],
        isProcessing: false,
        isProcessed: false,
      }));

      setPages(prev => [...prev, ...newPages]);
      setActiveTab('edit');
    } catch (err) {
      setError('Ошибка при загрузке файлов');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // OCR обработка всех страниц
  const processOCR = useCallback(async () => {
    if (pages.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const processedPages = [...pages];

      for (let i = 0; i < processedPages.length; i++) {
        const page = processedPages[i];
        page.isProcessing = true;
        setPages([...processedPages]);

        try {
          // Предварительная обработка изображения для лучшего OCR
          const canvas = await imageProcessingService.loadImageFromFile(page.file);
          const enhancedCanvas = imageProcessingService.enhanceImageForOCR(canvas);
          
          // OCR обработка
          const ocrResults = await ocrService.extractTextFromCanvas(enhancedCanvas);
          const detectedTexts = ocrService.convertOCRResultsToDetectedText(ocrResults);
          
          page.originalText = detectedTexts;
          page.isProcessing = false;
          page.isProcessed = true;
        } catch (err) {
          console.error(`OCR error for page ${i}:`, err);
          page.isProcessing = false;
          page.isProcessed = false;
        }

        setPages([...processedPages]);
      }
    } catch (err) {
      setError('Ошибка при обработке OCR');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [pages]);

  // Перевод всех распознанных текстов
  const translateTexts = useCallback(async () => {
    if (pages.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const processedPages = [...pages];

      for (let i = 0; i < processedPages.length; i++) {
        const page = processedPages[i];
        
        if (page.originalText.length === 0) continue;

        const textsToTranslate = page.originalText.map(text => text.text);
        const translatedTexts = await translationService.translateBatch(
          textsToTranslate,
          settings.sourceLanguage,
          settings.targetLanguage
        );

        // Обновляем переведенные тексты
        page.translatedText = page.originalText.map((original, index) => ({
          ...original,
          translatedText: translatedTexts[index] || original.text,
        }));

        setPages([...processedPages]);
      }
    } catch (err) {
      setError('Ошибка при переводе текстов');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [pages, settings.sourceLanguage, settings.targetLanguage]);

  // Обновление переведенного текста
  const updateTranslatedText = useCallback((pageId: string, textId: string, newText: string) => {
    setPages(prev => prev.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          translatedText: page.translatedText.map(text => 
            text.id === textId 
              ? { ...text, translatedText: newText, isEdited: true }
              : text
          ),
        };
      }
      return page;
    }));
  }, []);

  // Сброс состояния
  const resetTranslator = useCallback(() => {
    setPages([]);
    setJob({
      id: '',
      pages: [],
      status: 'idle',
      progress: 0,
    });
    setActiveTab('upload');
    setError(null);
  }, []);

  // Получение статистики
  const getStats = useCallback(() => {
    const totalPages = pages.length;
    const processedPages = pages.filter(p => p.isProcessed).length;
    const totalTexts = pages.reduce((sum, p) => sum + p.originalText.length, 0);
    const translatedTexts = pages.reduce((sum, p) => sum + p.translatedText.length, 0);

    return { totalPages, processedPages, totalTexts, translatedTexts };
  }, [pages]);

  const stats = getStats();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Навигация по вкладкам */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">

          {[
            { id: 'upload', label: 'Загрузка', icon: Upload },
            { id: 'edit', label: 'Редактирование', icon: Edit3 },
            { id: 'preview', label: 'Предпросмотр', icon: Eye },
            { id: 'download', label: 'Скачивание', icon: Download },
            { id: 'settings', label: 'Настройки', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}

              onClick={() => setActiveTab(id as TabType)}
              disabled={id === 'edit' && pages.length === 0}

              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              } ${id === 'edit' && pages.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Статистика */}
      {pages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalPages}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Страниц</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.processedPages}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Обработано</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalTexts}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Текстов</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.translatedTexts}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Переведено</div>
          </div>
        </div>
      )}

      {/* Ошибки */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="text-red-800 dark:text-red-200">{error}</div>
        </div>
      )}

      {/* Основной контент */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {activeTab === 'upload' && (
          <ImageUploader
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
            onProcessOCR={processOCR}
            onTranslate={translateTexts}
            pages={pages}
          />
        )}

        {activeTab === 'edit' && (
          <TextEditor
            pages={pages}
            onUpdateText={updateTranslatedText}
            settings={settings}
          />
        )}

        {activeTab === 'preview' && (
          <TranslationPreview
            pages={pages}
            settings={settings}
          />
        )}


        {activeTab === 'download' && (
          <DownloadManager
            pages={pages}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}
      </div>

      {/* Кнопка сброса */}
      {pages.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={resetTranslator}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Начать заново
          </button>
        </div>
      )}
    </div>
  );
};

export default MangaTranslator;
