

// Утилиты для OCR обработки изображений с помощью Tesseract.js
import { createWorker, Worker } from 'tesseract.js';

import { DetectedText, BoundingBox, OCRResult } from '../types/manga-translator';

// Типы для ответа Tesseract.js
interface TesseractBBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: TesseractBBox;
}

interface TesseractLine {
  text: string;
  confidence: number;
  bbox: TesseractBBox;
}

interface TesseractData {
  lines?: TesseractLine[];
  words?: TesseractWord[];
  text?: string;
}

interface TesseractResponse {
  data: TesseractData;
}

export class OCRService {
  private static instance: OCRService;
  private worker: Worker | null = null;
  private isInitialized = false;

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async initialize(language = 'eng'): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await createWorker(language);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw error;
    }
  }

  async terminate(): Promise<void> {
    if (this.worker && this.isInitialized) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  async extractTextFromImage(imageFile: File): Promise<OCRResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }


    try {
      if (!this.worker) {
        throw new Error('OCR worker is not initialized');
      }

      const response: TesseractResponse = await this.worker.recognize(imageFile);
      const data = response.data;
      const results: OCRResult[] = [];

      // Обрабатываем каждую строку текста
      if (data.lines) {
        for (const line of data.lines) {
          const text = line.text.trim();
          if (text) {
            results.push({
              text,
              confidence: line.confidence,
              bbox: {
                x: line.bbox.x0,
                y: line.bbox.y0,
                width: line.bbox.x1 - line.bbox.x0,
                height: line.bbox.y1 - line.bbox.y0,
              },
            });
          }
        }
      }

      // Если нет строк, пробуем обработать слова
      if (results.length === 0) {
        if (data.words) {
          for (const word of data.words) {
            const text = word.text.trim();
            if (text && word.confidence > 30) { // Фильтруем низкокачественные результаты
              results.push({
                text,
                confidence: word.confidence,
                bbox: {
                  x: word.bbox.x0,
                  y: word.bbox.y0,
                  width: word.bbox.x1 - word.bbox.x0,
                  height: word.bbox.y1 - word.bbox.y0,
                },
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error('OCR processing error:', error);
      throw error;
    }
  }

  async extractTextFromCanvas(canvas: HTMLCanvasElement): Promise<OCRResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }


    try {
      if (!this.worker) {
        throw new Error('OCR worker is not initialized');
      }

      const response: TesseractResponse = await this.worker.recognize(canvas);
      const data = response.data;
      const results: OCRResult[] = [];

      if (data.lines) {
        for (const line of data.lines) {
          const text = line.text.trim();
          if (text) {
            results.push({
              text,
              confidence: line.confidence,
              bbox: {
                x: line.bbox.x0,
                y: line.bbox.y0,
                width: line.bbox.x1 - line.bbox.x0,
                height: line.bbox.y1 - line.bbox.y0,
              },
            });
          }
        }
      }

      if (results.length === 0) {
        if (data.words) {
          for (const word of data.words) {
            const text = word.text.trim();
            if (text && word.confidence > 30) {
              results.push({
                text,
                confidence: word.confidence,
                bbox: {
                  x: word.bbox.x0,
                  y: word.bbox.y0,
                  width: word.bbox.x1 - word.bbox.x0,
                  height: word.bbox.y1 - word.bbox.y0,
                },
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error('OCR processing error:', error);
      throw error;
    }
  }

  // Улучшение качества изображения для OCR
  async preprocessImageForOCR(imageFile: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Устанавливаем размеры canvas
        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        // Рисуем изображение на canvas
        ctx.drawImage(img, 0, 0);

        // Применяем фильтры для улучшения OCR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Конвертируем в оттенки серого и увеличиваем контраст
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          
          // Увеличиваем контраст
          const contrast = 1.5;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const enhanced = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
          
          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha остается без изменений
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  // Преобразование результатов OCR в формат DetectedText
  convertOCRResultsToDetectedText(ocrResults: OCRResult[]): DetectedText[] {
    return ocrResults.map((result, index) => ({
      id: `text-${index}`,
      text: result.text,
      translatedText: '',
      bbox: result.bbox,
      confidence: result.confidence,
      isEdited: false,
    }));
  }
}

export const ocrService = OCRService.getInstance();
