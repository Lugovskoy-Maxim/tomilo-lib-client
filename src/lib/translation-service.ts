// Утилиты для работы с LibreTranslate API
import { LibreTranslateResponse } from '@/types/manga-translator';

const LIBRE_TRANSLATE_API_URL = 'https://libretranslate.de/translate';

export class TranslationService {
  private static instance: TranslationService;
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private requestDelay = 100; // Задержка между запросами в мс

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  async translateText(text: string, sourceLang = 'en', targetLang = 'ru'): Promise<string> {
    if (!text.trim()) return text;

    try {
      const response = await fetch(LIBRE_TRANSLATE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data: LibreTranslateResponse = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Возвращаем исходный текст в случае ошибки
    }
  }

  async translateBatch(texts: string[], sourceLang = 'en', targetLang = 'ru'): Promise<string[]> {
    const results: string[] = [];
    
    for (const text of texts) {
      const translated = await this.translateText(text, sourceLang, targetLang);
      results.push(translated);
      
      // Добавляем задержку между запросами
      if (this.requestDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
    }
    
    return results;
  }

  // Очередь для обработки множественных переводов
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }
    
    this.isProcessing = false;
  }

  async translateWithQueue(text: string, sourceLang = 'en', targetLang = 'ru'): Promise<string> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          const result = await this.translateText(text, sourceLang, targetLang);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      this.queue.push(task);
      this.processQueue();
    });
  }

  // Проверка доступности API
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch('https://libretranslate.de/languages');
      return response.ok;
    } catch {
      return false;
    }
  }

  // Получение списка поддерживаемых языков
  async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    try {
      const response = await fetch('https://libretranslate.de/languages');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
    }
    
    // Возвращаем базовый список языков
    return [
      { code: 'en', name: 'English' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
    ];
  }
}

export const translationService = TranslationService.getInstance();
