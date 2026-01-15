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
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  quality = 80,
  priority = false,
  onLoad,
  onError,
  style,
  onDragStart,
  draggable,
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
    if (width && height) {
      return (
        <div
          className="image-placeholder"
          style={{
            width: width,
            height: "auto",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="loading-spinner" />
        </div>
      );
    }
    return null;
  };

  // Отображение ошибки
  const renderError = () => (
    <div
      className="image-error"
      style={{
        width: width || "100%",
        height: "auto",
        backgroundColor: "#fdd",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#c33",
        border: "1px solid #fcc",
      }}
    >
      Ошибка загрузки изображения
    </div>
  );

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

      {/* Стили для компонента */}
      <style jsx>{`
        .loading-spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .image-placeholder {
          position: relative;
        }

        .image-error {
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </>
  );
};

export default OptimizedImage;
