"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getImageUrls } from "@/lib/asset-url";

export type LoadingStrategy = "lazy" | "eager" | "viewport" | "preload-nearby";
export type ImageQuality = "low" | "medium" | "high" | "auto";

interface ImageLoadState {
  loaded: boolean;
  error: boolean;
  useFallback: boolean;
  retryCount: number;
}

interface UseImageLoaderOptions {
  images: string[];
  chapterId: string;
  currentPage: number;
  strategy?: LoadingStrategy;
  preloadCount?: number;
  maxRetries?: number;
  quality?: ImageQuality;
}

interface UseImageLoaderReturn {
  imageStates: Map<number, ImageLoadState>;
  getImageUrl: (index: number) => string;
  handleImageLoad: (index: number) => void;
  handleImageError: (index: number) => void;
  retryImage: (index: number) => void;
  retryAllFailed: () => void;
  loadedCount: number;
  errorCount: number;
  loadingProgress: number;
  preloadImages: (indexes: number[]) => void;
  isImageVisible: (index: number) => boolean;
  getLoadingPriority: (index: number) => "high" | "medium" | "low";
}

const STORAGE_KEY_QUALITY = "reader-image-quality";
const STORAGE_KEY_STRATEGY = "reader-loading-strategy";

export function useImageLoader({
  images,
  chapterId,
  currentPage,
  strategy = "preload-nearby",
  preloadCount = 3,
  maxRetries = 2,
  quality = "auto",
}: UseImageLoaderOptions): UseImageLoaderReturn {
  const [imageStates, setImageStates] = useState<Map<number, ImageLoadState>>(
    () => new Map()
  );
  const preloadedRef = useRef<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const imageElementsRef = useRef<Map<number, HTMLImageElement>>(new Map());

  const initializeStates = useCallback(() => {
    const newStates = new Map<number, ImageLoadState>();
    images.forEach((_, index) => {
      newStates.set(index, {
        loaded: false,
        error: false,
        useFallback: false,
        retryCount: 0,
      });
    });
    setImageStates(newStates);
    preloadedRef.current.clear();
  }, [images]);

  useEffect(() => {
    initializeStates();
  }, [chapterId, initializeStates]);

  const getImageUrl = useCallback(
    (index: number) => {
      const src = images[index];
      if (!src) return "";

      const state = imageStates.get(index);
      const { primary, fallback } = getImageUrls(src);

      if (state?.useFallback && fallback && fallback !== primary) {
        return fallback;
      }

      return primary;
    },
    [images, imageStates]
  );

  const handleImageLoad = useCallback((index: number) => {
    setImageStates((prev) => {
      const newMap = new Map(prev);
      const state = newMap.get(index);
      if (state) {
        newMap.set(index, { ...state, loaded: true, error: false });
      }
      return newMap;
    });
  }, []);

  const handleImageError = useCallback(
    (index: number) => {
      setImageStates((prev) => {
        const newMap = new Map(prev);
        const state = newMap.get(index);
        if (!state) return prev;

        const src = images[index];
        const { primary, fallback } = getImageUrls(src);

        if (!state.useFallback && fallback && fallback !== primary) {
          newMap.set(index, { ...state, useFallback: true });
        } else if (state.retryCount < maxRetries) {
          newMap.set(index, {
            ...state,
            retryCount: state.retryCount + 1,
          });
        } else {
          newMap.set(index, { ...state, error: true });
        }

        return newMap;
      });
    },
    [images, maxRetries]
  );

  const retryImage = useCallback((index: number) => {
    setImageStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(index, {
        loaded: false,
        error: false,
        useFallback: false,
        retryCount: 0,
      });
      return newMap;
    });
  }, []);

  const retryAllFailed = useCallback(() => {
    setImageStates((prev) => {
      const newMap = new Map(prev);
      prev.forEach((state, index) => {
        if (state.error) {
          newMap.set(index, {
            loaded: false,
            error: false,
            useFallback: false,
            retryCount: 0,
          });
        }
      });
      return newMap;
    });
  }, []);

  const preloadImages = useCallback(
    (indexes: number[]) => {
      indexes.forEach((index) => {
        if (preloadedRef.current.has(index)) return;
        if (index < 0 || index >= images.length) return;

        const url = getImageUrl(index);
        if (!url) return;

        const img = new Image();
        img.onload = () => handleImageLoad(index);
        img.onerror = () => handleImageError(index);
        img.src = url;

        imageElementsRef.current.set(index, img);
        preloadedRef.current.add(index);
      });
    },
    [images.length, getImageUrl, handleImageLoad, handleImageError]
  );

  useEffect(() => {
    if (strategy !== "preload-nearby") return;

    const toPreload: number[] = [];
    for (let i = currentPage - 1; i <= currentPage + preloadCount; i++) {
      if (i >= 0 && i < images.length) {
        toPreload.push(i);
      }
    }
    preloadImages(toPreload);
  }, [currentPage, preloadCount, images.length, strategy, preloadImages]);

  const isImageVisible = useCallback(
    (index: number) => {
      if (strategy === "eager") return true;
      if (strategy === "preload-nearby") {
        return (
          index >= currentPage - 2 && index <= currentPage + preloadCount + 1
        );
      }
      return index >= currentPage - 1 && index <= currentPage + 1;
    },
    [strategy, currentPage, preloadCount]
  );

  const getLoadingPriority = useCallback(
    (index: number): "high" | "medium" | "low" => {
      const distance = Math.abs(index - (currentPage - 1));
      if (distance === 0) return "high";
      if (distance <= 2) return "medium";
      return "low";
    },
    [currentPage]
  );

  const loadedCount = useMemo(() => {
    let count = 0;
    imageStates.forEach((state) => {
      if (state.loaded) count++;
    });
    return count;
  }, [imageStates]);

  const errorCount = useMemo(() => {
    let count = 0;
    imageStates.forEach((state) => {
      if (state.error) count++;
    });
    return count;
  }, [imageStates]);

  const loadingProgress = useMemo(() => {
    if (images.length === 0) return 0;
    return Math.round((loadedCount / images.length) * 100);
  }, [loadedCount, images.length]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      imageElementsRef.current.clear();
    };
  }, []);

  return {
    imageStates,
    getImageUrl,
    handleImageLoad,
    handleImageError,
    retryImage,
    retryAllFailed,
    loadedCount,
    errorCount,
    loadingProgress,
    preloadImages,
    isImageVisible,
    getLoadingPriority,
  };
}

export function saveLoadingStrategy(strategy: LoadingStrategy) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_STRATEGY, strategy);
  }
}

export function getLoadingStrategy(): LoadingStrategy {
  if (typeof window === "undefined") return "preload-nearby";
  return (localStorage.getItem(STORAGE_KEY_STRATEGY) as LoadingStrategy) || "preload-nearby";
}

export function saveImageQuality(quality: ImageQuality) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_QUALITY, quality);
  }
}

export function getImageQuality(): ImageQuality {
  if (typeof window === "undefined") return "auto";
  return (localStorage.getItem(STORAGE_KEY_QUALITY) as ImageQuality) || "auto";
}
