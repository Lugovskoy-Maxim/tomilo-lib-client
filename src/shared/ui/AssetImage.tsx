"use client";

import { normalizeAssetUrl } from "@/lib/asset-url";

/**
 * Изображение из S3/asset storage. Рендерит нативный <img>, без Next.js Image Optimization,
 * чтобы картинки гарантированно грузились на проде (нет зависимости от sharp / _next/image).
 */
export interface AssetImageProps {
  /** Путь или URL изображения (будет нормализован через normalizeAssetUrl) */
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
  const url = normalizeAssetUrl(src);
  if (!url) return null;

  const img = (
    <img
      src={url}
      alt={alt}
      loading={loading}
      decoding="async"
      className={fill ? `absolute inset-0 h-full w-full object-cover ${className}` : className}
      sizes={sizes}
      onError={onError}
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
