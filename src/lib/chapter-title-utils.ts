import { Chapter } from "@/types/title";

/**
 * Format chapter name for display
 * If the chapter name doesn't contain "Глава" prefix, adds it with the chapter number
 */
export function getChapterDisplayName(chapter: Pick<Chapter, "name" | "chapterNumber" | "title">): string {
  const name = chapter.name || "";
  const chapterNumber = chapter.chapterNumber;
  const title = chapter.title;

  // Check if name already contains "Глава" (case-insensitive)
  const hasChapterPrefix = /глава/i.test(name);

  if (hasChapterPrefix) {
    // If title field exists and name doesn't contain it, append title
    if (title && !name.toLowerCase().includes(title.toLowerCase())) {
      return `${name} - ${title}`;
    }
    return name;
  }

  // If no "Глава" prefix, create display name with chapter number
  if (title) {
    return `Глава ${chapterNumber} - ${title}`;
  }

  return `Глава ${chapterNumber} ${name ? `- ${name}` : ""}`.trim();
}

/**
 * Format chapter name for display with custom options
 */
export function formatChapterName(
  name: string,
  chapterNumber: number,
  options?: {
    includeTitle?: boolean;
    title?: string;
    prefix?: string;
    separator?: string;
  }
): string {
  const { includeTitle = true, title, prefix = "Глава", separator = " - " } = options || {};

  const hasChapterPrefix = /глава/i.test(name);

  if (hasChapterPrefix) {
    if (includeTitle && title && !name.toLowerCase().includes(title.toLowerCase())) {
      return `${name}${separator}${title}`;
    }
    return name;
  }

  let result = `${prefix} ${chapterNumber}`;
  if (includeTitle && title) {
    result += `${separator}${title}`;
  } else if (name) {
    result += `${separator}${name}`;
  }

  return result;
}

