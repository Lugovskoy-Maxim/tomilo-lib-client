"use client";
import React, { useEffect, useRef, useState } from "react";
import { useImageState } from "@/lib/image-optimizer";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  quality?: number;
  priority?: boolean;
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
  onLoad,
  onError,
  style,
  onDragStart,
  draggable,
  hidePlaceholder = false,
  fallbackSrc,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const { isLoading, isLoaded, error, loadImage } = useImageState();
  const [hasError, setHasError] = useState(false);

  // Отслеживаем изменения src и priority для перезагрузки изображения при необходимости
  useEffect(() => {
    if (src) {
      setHasError(false);
      // Если priority=true, загружаем немедленно
      // Иначе начинаем загрузку сразу (без ожидания видимости)
      loadImage(src);
    }
  }, [src, priority, loadImage]);

  const handleLoad = () => {
    if (onLoad) onLoad();
  };

  const handleError = () => {
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

  // Определяем стиль отображения в зависимости от состояния загрузки
  const imageStyle: React.CSSProperties = fill
    ? {
        display: isLoading ? "none" : "block",
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style,
      }
    : {
        display: isLoading ? "none" : "block",
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
        ...style,
      };

  return (
    <>
      {/* Placeholder во время загрузки */}
      {isLoading && !isLoaded && getPlaceholder()}

      {/* Основное изображение */}
      <img
        ref={imgRef}
        src={actualSrc}
        alt={alt}
        className={imageClasses}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
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
