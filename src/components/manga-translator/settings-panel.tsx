'use client';

import React from 'react';
import { Settings, Palette, Type, Languages } from 'lucide-react';
import { TranslatorSettings } from '@/types/manga-translator';

interface SettingsPanelProps {
  settings: TranslatorSettings;
  onSettingsChange: (settings: TranslatorSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
}) => {

  const updateSetting = (key: keyof TranslatorSettings, value: string | number) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Settings className="w-6 h-6 mr-2 text-gray-700 dark:text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Настройки переводчика
        </h2>
      </div>

      <div className="space-y-6">
        {/* Языковые настройки */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Languages className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Языковые настройки
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Исходный язык
              </label>
              <select
                value={settings.sourceLanguage}
                onChange={(e) => updateSetting('sourceLanguage', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Целевой язык
              </label>
              <select
                value={settings.targetLanguage}
                onChange={(e) => updateSetting('targetLanguage', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="ja">Japanese</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Язык OCR
              </label>
              <select
                value={settings.ocrLanguage}
                onChange={(e) => updateSetting('ocrLanguage', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="eng">English</option>
                <option value="jpn">Japanese</option>
                <option value="kor">Korean</option>
                <option value="chi_sim">Chinese (Simplified)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Настройки шрифта */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Type className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Настройки шрифта
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Семейство шрифта
              </label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                <option value="'Noto Sans', sans-serif">Noto Sans</option>
                <option value="'Noto Serif', serif">Noto Serif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Размер шрифта: {settings.fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="32"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Цветовые настройки */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Palette className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Цветовые настройки
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Цвет текста
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => updateSetting('textColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.textColor}
                  onChange={(e) => updateSetting('textColor', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Цвет фона
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Цвет обводки
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.strokeColor}
                  onChange={(e) => updateSetting('strokeColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.strokeColor}
                  onChange={(e) => updateSetting('strokeColor', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Толщина обводки: {settings.strokeWidth}px
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={settings.strokeWidth}
                onChange={(e) => updateSetting('strokeWidth', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Предустановки */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Предустановленные стили
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => onSettingsChange({
                ...settings,
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                textColor: '#000000',
                backgroundColor: '#ffffff',
                strokeColor: '#ffffff',
                strokeWidth: 2,
              })}
              className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900 dark:text-white">Классический</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Белый фон, черный текст</div>
              <div className="mt-2 text-xs bg-black text-white px-2 py-1 rounded inline-block">
                Пример текста
              </div>
            </button>

            <button
              onClick={() => onSettingsChange({
                ...settings,
                fontFamily: 'Comic Sans MS, cursive',
                fontSize: 16,
                textColor: '#1a1a1a',
                backgroundColor: '#fef7e0',
                strokeColor: '#fef7e0',
                strokeWidth: 0,
              })}
              className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900 dark:text-white">Манга стиль</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Кремовый фон, читаемый текст</div>
              <div className="mt-2 text-xs bg-[#fef7e0] text-[#1a1a1a] px-2 py-1 rounded inline-block">
                Пример текста
              </div>
            </button>

            <button
              onClick={() => onSettingsChange({
                ...settings,
                fontFamily: 'Times New Roman, serif',
                fontSize: 15,
                textColor: '#ffffff',
                backgroundColor: '#000000',
                strokeColor: '#ffffff',
                strokeWidth: 1,
              })}
              className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900 dark:text-white">Инверсия</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Темный фон, белый текст</div>
              <div className="mt-2 text-xs bg-black text-white px-2 py-1 rounded border border-white">
                Пример текста
              </div>
            </button>
          </div>
        </div>

        {/* Информация */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Советы по настройке:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Для лучшего OCR качества используйте изображения высокого разрешения</li>
            <li>• Экспериментируйте с размерами шрифта для лучшей читаемости</li>
            <li>• Обводка помогает сделать текст более читаемым на сложном фоне</li>
            <li>• Выбирайте цвета, которые контрастируют с фоном изображения</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
