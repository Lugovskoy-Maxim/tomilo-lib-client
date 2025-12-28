// Утилиты для обработки изображений и замены текста с помощью Canvas API
import { DetectedText, TranslatorSettings } from '@/types/manga-translator';

export class ImageProcessingService {
  private static instance: ImageProcessingService;

  static getInstance(): ImageProcessingService {
    if (!ImageProcessingService.instance) {
      ImageProcessingService.instance = new ImageProcessingService();
    }
    return ImageProcessingService.instance;
  }

  // Загрузка изображения из File и создание Canvas
  async loadImageFromFile(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Загрузка изображения из URL
  async loadImageFromUrl(url: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };

      img.onerror = () => reject(new Error('Failed to load image from URL'));
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }

  // Замена текста на изображении
  replaceTextOnImage(
    canvas: HTMLCanvasElement,
    detectedTexts: DetectedText[],
    settings: TranslatorSettings
  ): HTMLCanvasElement {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Сохраняем текущее состояние
    ctx.save();

    // Настраиваем шрифт
    ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
    ctx.fillStyle = settings.textColor;
    ctx.strokeStyle = settings.strokeColor;
    ctx.lineWidth = settings.strokeWidth;

    // Устанавливаем выравнивание текста
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Обрабатываем каждый распознанный текст
    detectedTexts.forEach((detectedText) => {
      const { bbox, translatedText } = detectedText;
      
      // Очищаем область с исходным текстом
      ctx.clearRect(bbox.x, bbox.y, bbox.width, bbox.height);
      
      // Рисуем фон для лучшей читаемости
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);

      // Рисуем обводку текста
      if (settings.strokeWidth > 0) {
        ctx.strokeStyle = settings.strokeColor;
        ctx.strokeText(
          translatedText,
          bbox.x + bbox.width / 2,
          bbox.y + bbox.height / 2
        );
      }

      // Рисуем текст
      ctx.fillStyle = settings.textColor;
      ctx.fillText(
        translatedText,
        bbox.x + bbox.width / 2,
        bbox.y + bbox.height / 2
      );
    });

    // Восстанавливаем состояние
    ctx.restore();

    return canvas;
  }

  // Удаление исходного текста (создание белого прямоугольника)
  removeTextFromImage(canvas: HTMLCanvasElement, bbox: { x: number; y: number; width: number; height: number }): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);
  }

  // Изменение размера изображения
  resizeImage(canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number): HTMLCanvasElement {
    const aspectRatio = canvas.width / canvas.height;
    let newWidth = canvas.width;
    let newHeight = canvas.height;

    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    const resizedCanvas = document.createElement('canvas');
    const ctx = resizedCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;

    // Используем высококачественное масштабирование
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);

    return resizedCanvas;
  }

  // Преобразование Canvas в Blob для сохранения
  async canvasToBlob(canvas: HTMLCanvasElement, format: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.9): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        format,
        quality
      );
    });
  }

  // Преобразование Canvas в Data URL
  canvasToDataURL(canvas: HTMLCanvasElement, format: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.9): string {
    return canvas.toDataURL(format, quality);
  }

  // Создание превью с наложением переведенного текста
  createPreviewWithText(
    originalCanvas: HTMLCanvasElement,
    detectedTexts: DetectedText[],
    settings: TranslatorSettings
  ): HTMLCanvasElement {
    // Создаем копию оригинального изображения
    const previewCanvas = document.createElement('canvas');
    const ctx = previewCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    previewCanvas.width = originalCanvas.width;
    previewCanvas.height = originalCanvas.height;

    // Рисуем оригинальное изображение
    ctx.drawImage(originalCanvas, 0, 0);

    // Накладываем переведенный текст
    this.replaceTextOnImage(previewCanvas, detectedTexts, settings);

    return previewCanvas;
  }

  // Улучшение качества изображения для лучшего OCR
  enhanceImageForOCR(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const enhancedCanvas = document.createElement('canvas');
    const ctx = enhancedCanvas.getContext('2d');
    const originalCtx = canvas.getContext('2d');

    if (!ctx || !originalCtx) {
      throw new Error('Cannot get canvas context');
    }

    enhancedCanvas.width = canvas.width;
    enhancedCanvas.height = canvas.height;

    // Получаем данные изображения
    const imageData = originalCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Применяем улучшения
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // Увеличиваем контраст
      const contrast = 1.3;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const enhanced = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    return enhancedCanvas;
  }

  // Обрезка изображения по bounding box
  cropImageByBbox(canvas: HTMLCanvasElement, bbox: { x: number; y: number; width: number; height: number }): HTMLCanvasElement {
    const croppedCanvas = document.createElement('canvas');
    const ctx = croppedCanvas.getContext('2d');
    const originalCtx = canvas.getContext('2d');

    if (!ctx || !originalCtx) {
      throw new Error('Cannot get canvas context');
    }

    croppedCanvas.width = bbox.width;
    croppedCanvas.height = bbox.height;

    ctx.drawImage(
      canvas,
      bbox.x, bbox.y, bbox.width, bbox.height,
      0, 0, bbox.width, bbox.height
    );

    return croppedCanvas;
  }
}

export const imageProcessingService = ImageProcessingService.getInstance();
