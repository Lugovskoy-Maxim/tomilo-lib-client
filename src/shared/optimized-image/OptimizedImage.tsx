"use client";
import React, { useEffect, useRef } from "react";
import { useImageState } from "@/lib/image-optimizer";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  onDragStart?: (e: React.DragEvent) => void;
  draggable?: boolean;
  hidePlaceholder?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  onLoad,
  onError,
  style,
  onDragStart,
  draggable,
  hidePlaceholder = false,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const { isLoading, isLoaded, error, loadImage } = useImageState();

  // Отслеживаем изменения src и priority для перезагрузки изображения при необходимости
  useEffect(() => {
    if (src) {
      // Если priority=true, загружаем немедленно
      // Иначе начинаем загрузку сразу (без ожидания видимости)
      loadImage(src);
    }
  }, [src, priority, loadImage]);

  const handleLoad = () => {
    if (onLoad) onLoad();
  };

  const handleError = () => {
    if (onError) onError();
  };

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
    
    if (width && height) {
      return (
        <div
          className="image-placeholder"
          style={{
            width: "100%",
            aspectRatio: width / height,
            backgroundColor: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius)",
          }}
        >
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
    }
    // Если размеры не указаны, используем skeleton с 100% width
    return (
      <div
        className="image-placeholder"
        style={{
          width: "100%",
          paddingBottom: "137.5%", // Соотношение 220/160 = 1.375 (137.5%)
          backgroundColor: "var(--muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius)",
        }}
      >
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
    const aspectRatio = width && height ? width / height : 160 / 220;
    return (
      <div
        className="image-error"
        style={{
          width: "100%",
          aspectRatio: aspectRatio,
          backgroundColor: "var(--destructive)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--destructive-foreground)",
          border: "1px solid var(--destructive)",
          borderRadius: "var(--radius)",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        Ошибка
      </div>
    );
  };

  // Если есть ошибка, отображаем сообщение об ошибке
  if (error) {
    return renderError();
  }

  // Определяем стиль отображения в зависимости от состояния загрузки
  const imageStyle = {
    display: isLoading ? "none" : "block",
    width: width ? `${width}px` : "100%",
    height: "auto",
    ...style,
  };

  return (
    <>
      {/* Placeholder во время загрузки */}
      {isLoading && !isLoaded && getPlaceholder()}

      {/* Основное изображение */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={imageClasses}
        width={width}
        height={height}
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
