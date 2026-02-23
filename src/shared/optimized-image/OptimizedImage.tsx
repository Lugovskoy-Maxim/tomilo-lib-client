"use client";
import React, { useEffect, useRef, useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  quality?: number;
  priority?: boolean;
  /** Показывать изображение только когда true (для последовательного отображения по порядку) */
  visible?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  onDragStart?: (e: React.DragEvent) => void;
  draggable?: boolean;
  hidePlaceholder?: boolean;
  fallbackSrc?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  fill = false,
  priority = false,
  visible = true,
  onLoad,
  onError,
  style,
  onDragStart,
  draggable,
  hidePlaceholder = false,
  fallbackSrc,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [isLoading, setIsLoading] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Сбрасываем состояние при смене src
  useEffect(() => {
    setHasError(false);
    setError(null);
    setIsLoaded(false);
    setShouldLoad(priority);
    setIsLoading(priority);
  }, [src, priority]);

  // Ленивая загрузка: начинаем запрос только около viewport
  useEffect(() => {
    if (priority || shouldLoad) return;
    const element = imgRef.current;
    if (!element) {
      // Fallback: если ref ещё не готов, не блокируем загрузку.
      setShouldLoad(true);
      setIsLoading(true);
      return;
    }
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      setIsLoading(true);
      return;
    }

    // Fail-safe: если observer по какой-то причине не сработал, не держим изображение в вечной загрузке.
    const forceLoadTimeout = window.setTimeout(() => {
      setShouldLoad(true);
      setIsLoading(true);
      observerRef.current?.disconnect();
      observerRef.current = null;
    }, 1200);

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          setShouldLoad(true);
          setIsLoading(true);
          observerRef.current?.disconnect();
          observerRef.current = null;
        });
      },
      {
        rootMargin: "250px 0px",
        threshold: 0.01,
      },
    );

    observerRef.current.observe(element);

    return () => {
      window.clearTimeout(forceLoadTimeout);
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [priority, shouldLoad]);

  const handleLoad = () => {
    setIsLoading(false);
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Не удалось загрузить изображение");
    setHasError(true);
    if (onError) onError();
  };

  // Определяем реальный src (fallback если есть ошибка)
  const actualSrc = hasError && fallbackSrc ? fallbackSrc : src;

  // Определяем классы для изображения
  const imageClasses = [
    className,
    isLoading ? "loading" : "",
    isLoaded ? "loaded" : "",
    error ? "error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Placeholder для изображения во время загрузки
  const getPlaceholder = () => {
    // Для маленьких изображений (аватаров) не показываем спиннер
    if (hidePlaceholder || (width && width <= 60)) {
      return null;
    }
    
    // Для fill mode используем абсолютное позиционирование
    const placeholderStyle: React.CSSProperties = fill
      ? {
          position: "absolute",
          inset: 0,
          backgroundColor: "var(--muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius)",
        }
      : width && height
        ? {
            width: "100%",
            aspectRatio: width / height,
            backgroundColor: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius)",
          }
        : {
            width: "100%",
            paddingBottom: "137.5%",
            backgroundColor: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius)",
          };

    return (
      <div className="image-placeholder" style={placeholderStyle}>
        <div
          style={{
            border: "2px solid var(--muted)",
            borderTop: "2px solid var(--primary)",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  };

  // Отображение ошибки
  const renderError = () => {
    const errorStyle: React.CSSProperties = fill
      ? {
          position: "absolute",
          inset: 0,
          backgroundColor: "var(--destructive)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--destructive-foreground)",
          border: "1px solid var(--destructive)",
          borderRadius: "var(--radius)",
          fontSize: "14px",
          fontWeight: 500,
        }
      : {
          width: "100%",
          aspectRatio: width && height ? width / height : 160 / 220,
          backgroundColor: "var(--destructive)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--destructive-foreground)",
          border: "1px solid var(--destructive)",
          borderRadius: "var(--radius)",
          fontSize: "14px",
          fontWeight: 500,
        };

    return (
      <div className="image-error" style={errorStyle}>
        Ошибка
      </div>
    );
  };

  // Если есть ошибка и нет fallback, отображаем сообщение об ошибке
  if (error && !fallbackSrc) {
    return renderError();
  }

  // Определяем стиль отображения: показываем только когда загружено и разрешено (visible — для порядка по индексу)
  const showImage = isLoaded && visible;
  const imageStyle: React.CSSProperties = fill
    ? {
        display: "block",
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: showImage ? 1 : 0,
        transition: "opacity 200ms ease-out",
        ...style,
      }
    : {
        display: "block",
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
        opacity: showImage ? 1 : 0,
        transition: "opacity 200ms ease-out",
        ...style,
      };

  return (
    <>
      {/* Placeholder во время загрузки */}
      {!isLoaded && getPlaceholder()}

      {/* Основное изображение */}
      <img
        ref={imgRef}
        src={shouldLoad ? actualSrc : undefined}
        alt={alt}
        className={imageClasses}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        style={imageStyle}
        onDragStart={onDragStart}
        draggable={draggable}
      />

      {/* Глобальные стили для анимации спиннера */}
      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default OptimizedImage;
