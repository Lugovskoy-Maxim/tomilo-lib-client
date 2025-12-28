'use client';

import React, { useState, useCallback } from 'react';
import { Edit3, Save, RotateCcw, Search } from 'lucide-react';
import { MangaPage, DetectedText, TranslatorSettings } from '@/types/manga-translator';

interface TextEditorProps {
  pages: MangaPage[];
  onUpdateText: (pageId: string, textId: string, newText: string) => void;
  settings: TranslatorSettings;
}

const TextEditor: React.FC<TextEditorProps> = ({
  pages,
  onUpdateText,
  settings,
}) => {
  const [selectedPage, setSelectedPage] = useState<string>(pages[0]?.id || '');
  const [selectedText, setSelectedText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);

  const currentPage = pages.find(p => p.id === selectedPage);
  
  const filteredTexts = currentPage?.translatedText.filter(text => 
    text.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    text.translatedText.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleTextUpdate = useCallback((textId: string, newText: string) => {
    if (currentPage) {
      onUpdateText(currentPage.id, textId, newText);
    }
  }, [currentPage, onUpdateText]);

  const resetText = useCallback((text: DetectedText) => {
    handleTextUpdate(text.id, text.text); // Возвращаем к оригиналу
  }, [handleTextUpdate]);

  if (pages.length === 0) {
    return (
      <div className="p-6 text-center">
        <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Нет страниц для редактирования
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Сначала загрузите изображения и выполните OCR обработку
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Редактирование текста
        </h2>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск текста..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              editMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            {editMode ? 'Просмотр' : 'Редактирование'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список страниц */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Страницы
          </h3>
          
          <div className="space-y-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedPage === page.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Страница {page.id.split('-').pop()}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {page.translatedText.length} текстов
                  </span>
                </div>
                
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {page.isProcessed ? '✓ Обработано' : '⏳ В обработке'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Редактор текста */}
        <div className="lg:col-span-2">
          {currentPage && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Страница {currentPage.id.split('-').pop()} - Тексты ({filteredTexts.length})
                </h3>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Найдено: {filteredTexts.length} из {currentPage.translatedText.length}
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredTexts.length === 0 ? (
                  <div className="text-center py-8">
                    <Edit3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery ? 'Ничего не найдено' : 'Нет распознанного текста'}
                    </p>
                  </div>
                ) : (
                  filteredTexts.map((text) => (
                    <div
                      key={text.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Оригинальный текст */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Оригинал
                          </label>
                          <div className="p-3 bg-white dark:bg-gray-800 rounded border text-sm text-gray-900 dark:text-white">
                            {text.text}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Уверенность: {Math.round(text.confidence)}%
                          </div>
                        </div>

                        {/* Переведенный текст */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Перевод
                            </label>
                            
                            <div className="flex space-x-2">
                              {text.isEdited && (
                                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded">
                                  Изменено
                                </span>
                              )}
                              
                              <button
                                onClick={() => resetText(text)}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title="Сбросить к оригиналу"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {editMode ? (
                            <textarea
                              value={text.translatedText}
                              onChange={(e) => handleTextUpdate(text.id, e.target.value)}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                              rows={3}
                              placeholder="Введите перевод..."
                            />
                          ) : (
                            <div className="p-3 bg-white dark:bg-gray-800 rounded border text-sm text-gray-900 dark:text-white min-h-[3rem]">
                              {text.translatedText || 'Нет перевода'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Информация о позиции */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Позиция: x={Math.round(text.bbox.x)}, y={Math.round(text.bbox.y)}, 
                          w={Math.round(text.bbox.width)}, h={Math.round(text.bbox.height)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
