
// Client-side only imports for PDF processing
let pdfjsLib: any = null;
const isClient = typeof window !== 'undefined';

// Initialize PDF.js library (client-side only)
async function initializePDFJS(): Promise<any> {
  if (!isClient) {
    throw new Error('PDF processing is only available on the client side');
  }
  
  if (!pdfjsLib) {
    // Dynamic import to avoid server-side issues
    pdfjsLib = await import('pdfjs-dist');
    // Настройка PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  
  return pdfjsLib;
}

export interface PDFPage {
  canvas: HTMLCanvasElement;
  pageNumber: number;
}

export class PDFProcessor {
  /**
   * Извлекает все страницы из PDF файла и конвертирует их в изображения
   */
  static async extractPagesFromPDF(file: File): Promise<PDFPage[]> {
    const pdfjs = await initializePDFJS();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    const pages: PDFPage[] = [];

    // Обрабатываем каждую страницу
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Настройки рендеринга
      const viewport = page.getViewport({ scale: 2.0 }); // Увеличиваем для лучшего качества
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Рендерим страницу на canvas
      await page.render({
        canvas,
        canvasContext: context,
        viewport: viewport
      }).promise;

      pages.push({
        canvas,
        pageNumber: pageNum
      });
    }

    return pages;
  }

  /**
   * Конвертирует canvas в blob для создания File объекта
   */
  static async canvasToFile(canvas: HTMLCanvasElement, pageNumber: number): Promise<File> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `page_${pageNumber}.png`, {
            type: 'image/png'
          });
          resolve(file);
        } else {
          // Fallback если toBlob не поддерживается
          const dataUrl = canvas.toDataURL('image/png');
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], `page_${pageNumber}.png`, {
                type: 'image/png'
              });
              resolve(file);
            });
        }
      }, 'image/png', 0.9);
    });
  }

  /**
   * Основная функция для обработки PDF файла
   */
  static async processPDFFile(file: File): Promise<File[]> {
    try {
      const pages = await this.extractPagesFromPDF(file);
      const imageFiles: File[] = [];

      // Конвертируем каждую страницу в файл
      for (const page of pages) {
        const imageFile = await this.canvasToFile(page.canvas, page.pageNumber);
        imageFiles.push(imageFile);
      }

      return imageFiles;
    } catch (error) {
      console.error('Ошибка при обработке PDF:', error);
      throw new Error('Не удалось обработать PDF файл');
    }
  }

  /**
   * Получает информацию о PDF файле
   */
  static async getPDFInfo(file: File): Promise<{ pageCount: number; fileSize: string }> {
    try {
      const pdfjs = await initializePDFJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      
      const fileSize = this.formatFileSize(file.size);

      return {
        pageCount: pdf.numPages,
        fileSize
      };
    } catch (error) {
      console.error('Ошибка при получении информации о PDF:', error);
      throw new Error('Не удалось получить информацию о PDF файле');
    }
  }

  /**
   * Форматирует размер файла в читаемый вид
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
