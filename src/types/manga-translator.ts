// Типы для системы перевода манги

export interface MangaPage {
  id: string;
  file: File;
  imageUrl: string;
  originalText: DetectedText[];
  translatedText: DetectedText[];
  processedImage?: string;
  isProcessing: boolean;
  isProcessed: boolean;
}

export interface DetectedText {
  id: string;
  text: string;
  translatedText: string;
  bbox: BoundingBox;
  confidence: number;
  isEdited: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TranslationJob {
  id: string;
  pages: MangaPage[];
  status: 'idle' | 'processing' | 'translating' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export interface TranslatorSettings {
  sourceLanguage: string;
  targetLanguage: string;
  ocrLanguage: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface DownloadOptions {
  format: 'images' | 'zip';
  quality: number;
  includeOriginal: boolean;
}

export const DEFAULT_TRANSLATOR_SETTINGS: TranslatorSettings = {
  sourceLanguage: 'en',
  targetLanguage: 'ru',
  ocrLanguage: 'eng',
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
  textColor: '#000000',
  backgroundColor: '#ffffff',
  strokeColor: '#ffffff',
  strokeWidth: 2,
};

export interface LibreTranslateResponse {
  translatedText: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}
