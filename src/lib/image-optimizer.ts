/**
 * Утилита для оптимизации изображений и уменьшения нагрузки при загрузке
 */
import { useState, useCallback } from "react";

// Типы для конфигурации изображений
interface ImageConfig {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: "jpeg" | "webp" | "png";
}

// Типы для состояния изображения
export interface ImageState {
  src: string;
  optimizedSrc?: string;
  isLoading: boolean;
  isLoaded: boolean;
  error?: string;
  width?: number;
  height?: number;
}

/**
 * Оптимизация изображения перед загрузкой
 */
export const optimizeImage = async (file: File, config: ImageConfig = {}): Promise<Blob> => {
  const { quality = 0.8, maxWidth = 1920, maxHeight = 1080, format = "webp" } = config;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Не удалось получить контекст canvas"));
      return;
    }

    img.onload = () => {
      // Вычисляем новые размеры с сохранением пропорций
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Устанавливаем размеры canvas
      canvas.width = width;
      canvas.height = height;

      // Рисуем изображение с новыми размерами
      ctx.drawImage(img, 0, 0, width, height);

      // Конвертируем в blob с оптимизацией качества
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Не удалось создать blob из изображения"));
          }
        },
        `image/${format}`,
        quality,
      );
    };

    img.onerror = () => {
      reject(new Error("Не удалось загрузить изображение"));
    };

    // Загружаем изображение
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Ленивая загрузка изображений с Intersection Observer
 */
export class ImageLazyLoader {
  private observer: IntersectionObserver;
  private imageStates: Map<string, ImageState>;

  constructor() {
    this.imageStates = new Map();

    // Создаем Intersection Observer для ленивой загрузки
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: "50px", // Начинаем загрузку за 50px до попадания в viewport
        threshold: 0.01,
      },
    );
  }

  /**
   * Наблюдение за изображением
   */
  observe(img: HTMLImageElement, src: string): void {
    // Устанавливаем placeholder
    img.src = this.getPlaceholderImage(img.width, img.height);

    // Сохраняем состояние изображения
    const state: ImageState = {
      src,
      isLoading: true,
      isLoaded: false,
    };

    this.imageStates.set(img.src, state);

    // Начинаем наблюдение
    this.observer.observe(img);
  }

  /**
   * Загрузка изображения
   */
  private loadImage(img: HTMLImageElement): void {
    const state = this.imageStates.get(img.src);
    if (!state) return;

    // Создаем новый элемент изображения для предзагрузки
    const preloadImg = new Image();

    preloadImg.onload = () => {
      // Обновляем src основного изображения
      img.src = state.src;

      // Обновляем состояние
      this.imageStates.set(img.src, {
        ...state,
        isLoading: false,
        isLoaded: true,
        width: preloadImg.width,
        height: preloadImg.height,
      });
    };

    preloadImg.onerror = () => {
      // Устанавливаем placeholder при ошибке
      img.src = this.getErrorPlaceholder();

      // Обновляем состояние
      this.imageStates.set(img.src, {
        ...state,
        isLoading: false,
        isLoaded: false,
        error: "Не удалось загрузить изображение",
      });
    };

    // Начинаем предзагрузку
    preloadImg.src = state.src;
  }

  /**
   * Генерация placeholder изображения
   */
  private getPlaceholderImage(width: number, height: number): string {
    // Создаем SVG placeholder с градиентом
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0">
          <animate attributeName="fill" values="#f0f0f0;#e0e0e0;#f0f0f0" dur="2s" repeatCount="indefinite" />
        </rect>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Placeholder для ошибок
   */
  private getErrorPlaceholder(): string {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3I8L3RleHQ+PC9zdmc+";
  }

  /**
   * Очистка ресурсов
   */
  destroy(): void {
    this.observer.disconnect();
    this.imageStates.clear();
  }
}

/**
 * Хук для управления состоянием изображения
 */
export const useImageState = (initialSrc?: string) => {
  const [state, setState] = useState<ImageState>({
    src: initialSrc || "",
    isLoading: false,
    isLoaded: false,
  });

  const loadImage = useCallback(
    (src: string) => {
      // Если это то же самое изображение, что уже загружено, не перезагружаем
      if (state.src === src && state.isLoaded) {
        return;
      }

      setState({
        src,
        isLoading: true,
        isLoaded: false,
      });

      const img = new Image();

      img.onload = () => {
        // Проверяем, актуально ли еще это изображение
        if (state.src === src) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isLoaded: true,
            width: img.width,
            height: img.height,
          }));
        }
      };

      img.onerror = () => {
        // Проверяем, актуально ли еще это изображение
        if (state.src === src) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isLoaded: false,
            error: "Не удалось загрузить изображение",
          }));
        }
      };

      // Начинаем загрузку изображения сразу
      img.src = src;
    },
    [state.src, state.isLoaded],
  );

  return { ...state, loadImage };
};

/**
 * Оптимизация изображений для различных размеров экрана
 */
export const generateSrcSet = (
  baseSrc: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920],
): string => {
  return sizes.map(size => `${baseSrc}?w=${size} ${size}w`).join(", ");
};

/**
 * Выбор подходящего размера изображения на основе размера экрана
 */
export const selectImageSize = (baseSrc: string, screenWidth: number): string => {
  const sizes = [320, 640, 768, 1024, 1280, 1920];
  const targetSize = sizes.find(size => size >= screenWidth) || sizes[sizes.length - 1];
  return `${baseSrc}?w=${targetSize}`;
};

// Экспорт всех функций
export default {
  optimizeImage,
  ImageLazyLoader,
  useImageState,
  generateSrcSet,
  selectImageSize,
};
