/**
 * Приоритеты загрузки страниц ридера: первая картинка в DOM — кандидат в LCP,
 * её нельзя отдавать в lazy/low при восстановлении позиции с середины главы.
 */
export function getContinuousScrollImageLoadProps(
  imageIndex: number,
  pageNumber: number,
  imageLoadPriority: Map<number, "low" | "medium" | "high">,
): {
  loading: "eager" | "lazy";
  priority: boolean;
  fetchPriority?: "high" | "low" | "auto";
} {
  if (imageIndex === 0) {
    return { loading: "eager", priority: true, fetchPriority: "high" };
  }

  if (imageLoadPriority.size > 0) {
    const p = imageLoadPriority.get(pageNumber);
    const isHigh = p === "high";
    return {
      loading: isHigh ? "eager" : "lazy",
      priority: isHigh,
      fetchPriority: isHigh ? "high" : undefined,
    };
  }

  // Только первая страница eager без карты приоритетов — меньше конкуренции за сеть с LCP.
  const eagerCount = 1;
  const eager = imageIndex < eagerCount;
  return {
    loading: eager ? "eager" : "lazy",
    priority: false,
    fetchPriority: undefined,
  };
}

export function readerImageSizes(isMobile: boolean, imageWidth: number): string {
  return isMobile ? "100vw" : `(max-width: 768px) 100vw, ${imageWidth}px`;
}
