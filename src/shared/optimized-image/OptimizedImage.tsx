"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  quality?: number;
  priority?: boolean;
  /** Низкий приоритет загрузки — изображение будет загружаться с задержкой */
  lowPriority?: boolean;
  /** Показывать изображение только когда true (для последовательного отображения по порядку) */
  visible?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  onDragStart?: (e: React.DragEvent) => void;
  draggable?: boolean;
  hidePlaceholder?: boolean;
  fallbackSrc?: string;
  /** Изображение-заглушка при ошибке загрузки всех источников */
  errorSrc?: string;
  /** Кастомный контент при ошибке загрузки (например, инициал пользователя вместо текста «Ошибка») */
  errorContent?: React.ReactNode;
  /** Размеры для responsive images (для fill mode) */
  sizes?: string;
  /** Использовать нативный img вместо next/image (для внешних изображений без настроенных доменов) */
  unoptimized?: boolean;
}

const DEFAULT_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  fill = false,
  quality = 85,
  priority = false,
  lowPriority = false,
  visible = true,
  onLoad,
  onError,
  style,
  onDragStart,
  draggable,
  hidePlaceholder = false,
  fallbackSrc,
  errorSrc,
  errorContent,
  sizes,
  unoptimized = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [triedErrorSrc, setTriedErrorSrc] = useState(false);

  // Сброс состояния при смене основного src
  useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
    setHasError(false);
    setTriedFallback(false);
    setTriedErrorSrc(false);
    setShouldLoad(priority);
  }, [src, priority]);

  // Ленивая загрузка с IntersectionObserver для lowPriority изображений
  useEffect(() => {
    if (priority || shouldLoad || !containerRef.current) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const rootMarginValue = lowPriority ? "300px 0px" : "800px 0px";
    const forceLoadTimeout = window.setTimeout(
      () => {
        setShouldLoad(true);
      },
      lowPriority ? 3000 : 1200,
    );

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: rootMarginValue, threshold: 0.01 },
    );

    observer.observe(containerRef.current);

    return () => {
      window.clearTimeout(forceLoadTimeout);
      observer.disconnect();
    };
  }, [priority, shouldLoad, lowPriority]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    // Пробуем fallback
    if (!triedFallback && fallbackSrc && fallbackSrc !== src) {
      setCurrentSrc(fallbackSrc);
      setTriedFallback(true);
      return;
    }
    // Пробуем errorSrc
    if (!triedErrorSrc && errorSrc && errorSrc !== src && errorSrc !== fallbackSrc) {
      setCurrentSrc(errorSrc);
      setTriedErrorSrc(true);
      return;
    }
    // Все источники провалились
    setHasError(true);
    onError?.();
  }, [src, fallbackSrc, errorSrc, triedFallback, triedErrorSrc, onError]);

  // Placeholder во время загрузки
  const renderPlaceholder = () => {
    if (hidePlaceholder || (width && width <= 60)) return null;

    const placeholderStyle: React.CSSProperties = fill
      ? { position: "absolute", inset: 0 }
      : width && height
        ? { width: "100%", aspectRatio: width / height }
        : { width: "100%", paddingBottom: "137.5%" };

    return (
      <div
        className="image-placeholder bg-[var(--muted)] flex items-center justify-center rounded-[var(--radius)]"
        style={placeholderStyle}
      >
        <div className="w-5 h-5 border-2 border-[var(--muted)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  };

  // Отображение ошибки
  const renderError = () => {
    if (errorContent) return <>{errorContent}</>;
    const errorStyle: React.CSSProperties = fill
      ? { position: "absolute", inset: 0 }
      : { width: "100%", aspectRatio: width && height ? width / height : 160 / 220 };

    return (
      <div
        className="image-error bg-[var(--destructive)] text-[var(--destructive-foreground)] flex items-center justify-center rounded-[var(--radius)] border border-[var(--destructive)] text-sm font-medium"
        style={errorStyle}
      >
        Ошибка
      </div>
    );
  };

  if (hasError) return renderError();

  const showImage = isLoaded && visible;

  // В dev-режиме next/image optimization может вызывать timeout при обращении к удалённым серверам.
  // Используем unoptimized для всех http/https URL чтобы избежать проблем.
  // Next.js Image Optimization лучше работает в production с правильно настроенным CDN.
  const isRemoteUrl = currentSrc?.startsWith("http");
  const shouldUnoptimize = unoptimized || isRemoteUrl;

  // Общие стили для изображения
  const imageClassName = `${className} ${isLoaded ? "loaded" : ""} transition-opacity duration-200 ${showImage ? "opacity-100" : "opacity-0"}`;

  // Обработчик dragStart для Image компонента
  const handleDragStart = (e: React.SyntheticEvent) => {
    if (onDragStart) {
      onDragStart(e as unknown as React.DragEvent);
    }
  };

  return (
    <div
      ref={containerRef}
      className={fill ? "relative w-full h-full" : undefined}
      style={!fill ? style : undefined}
    >
      {/* Placeholder */}
      {!isLoaded && renderPlaceholder()}

      {/* Основное изображение */}
      {shouldLoad &&
        currentSrc &&
        (fill ? (
          <Image
            src={currentSrc}
            alt={alt}
            fill
            sizes={sizes || DEFAULT_SIZES}
            quality={quality}
            priority={priority}
            className={`${imageClassName} object-cover`}
            style={style}
            onLoad={handleLoad}
            onError={handleError}
            draggable={draggable}
            onDragStart={handleDragStart}
            unoptimized={shouldUnoptimize}
          />
        ) : (
          <Image
            src={currentSrc}
            alt={alt}
            width={width || 160}
            height={height || 220}
            quality={quality}
            priority={priority}
            className={imageClassName}
            style={style}
            onLoad={handleLoad}
            onError={handleError}
            draggable={draggable}
            onDragStart={handleDragStart}
            unoptimized={shouldUnoptimize}
          />
        ))}
    </div>
  );
};

export default OptimizedImage;
