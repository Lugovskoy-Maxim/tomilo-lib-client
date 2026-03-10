import type { Chapter } from "@/types/title";

export function getChapterStatusLabel(chapter: Chapter): string {
  const s = String(chapter.status ?? "").toLowerCase();
  if (s === "draft") return "Черновик";
  if (s === "published") return "Опубликован";
  if (s === "scheduled") return "Запланирован";
  if (s === "hidden") return "Скрыт";
  if (s === "deleted") return "Удалён";
  return chapter.isPublished ? "Опубликован" : "Черновик";
}

export function getChapterStatusStyles(chapter: Chapter): string {
  const s = String(chapter.status ?? "").toLowerCase();
  const base = "px-2 py-1 rounded-full text-xs font-medium";
  if (s === "draft") return `${base} bg-[var(--muted)] text-[var(--muted-foreground)]`;
  if (s === "published") return `${base} bg-emerald-500/20 text-emerald-700 dark:text-emerald-400`;
  if (s === "scheduled") return `${base} bg-amber-500/20 text-amber-700 dark:text-amber-400`;
  if (s === "hidden") return `${base} bg-orange-500/20 text-orange-700 dark:text-orange-400`;
  if (s === "deleted") return `${base} bg-red-500/20 text-red-700 dark:text-red-400`;
  return chapter.isPublished
    ? `${base} bg-emerald-500/20 text-emerald-700 dark:text-emerald-400`
    : `${base} bg-[var(--muted)] text-[var(--muted-foreground)]`;
}
