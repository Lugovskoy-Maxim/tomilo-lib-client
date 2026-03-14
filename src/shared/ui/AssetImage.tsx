"use client";

import { useState, useEffect } from "react";
import { getImageUrls } from "@/lib/asset-url";

/**
 * Изображение из S3/asset storage. Рендерит нативный <img>, без Next.js Image Optimization,
 * чтобы картинки гарантированно грузились на проде (нет зависимости от sharp / _next/image).
 * При ошибке загрузки primary (S3) автоматически пробует fallback (основной сервер uploads).
 */
export interface AssetImageProps {
  /** Путь или URL изображения (будет нормализован через getImageUrls) */
  src: string;
  alt: string;
  className?: string;
  /** Заполнить контейнер (как fill у next/image) */
  fill?: boolean;
  sizes?: string;
  loading?: "lazy" | "eager";
  onError?: () => void;
  onLoad?: () => void;
}

export default function AssetImage({
  src,
  alt,
  className = "",
  fill = false,
  sizes,
  loading = "lazy",
  onError,
  onLoad,
}: AssetImageProps) {
  const { primary, fallback } = getImageUrls(src);
  const [currentUrl, setCurrentUrl] = useState(primary);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setCurrentUrl(primary);
    setErrored(false);
  }, [src, primary]);

  if (!primary) return null;

  const handleError = () => {
    if (!errored && fallback && fallback !== currentUrl) {
      setErrored(true);
      setCurrentUrl(fallback);
    } else {
      onError?.();
    }
  };

  const img = (
    <img
      src={currentUrl}
      alt={alt}
      loading={loading}
      decoding="async"
      className={fill ? `absolute inset-0 h-full w-full object-cover ${className}` : className}
      sizes={sizes}
      onError={handleError}
      onLoad={onLoad}
    />
  );

  if (fill) {
    return (
      <span className="relative block size-full" style={{ overflow: "hidden" }}>
        {img}
      </span>
    );
  }
  return img;
}
