/**
 * Форматирует массив номеров глав в читаемую строку с диапазонами.
 * Последовательные номера объединяются в диапазон (например 34,35,36 -> 34-36).
 * Непоследовательные части выводятся через запятую (например 24 и 34-55 -> "24, 34-55").
 *
 * Примеры:
 * [24, 34, 35, 36, ..., 55] -> "24, 34-55"
 * [1, 2, 3] -> "1-3"
 * [1, 3, 5] -> "1, 3, 5"
 */
export function formatChapterRanges(chapterNumbers: number[]): string {
  if (!chapterNumbers.length) return "";

  const sorted = [...new Set(chapterNumbers)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];

    if (current !== undefined && current === prev + 1) {
      rangeEnd = current;
      continue;
    }

    if (rangeStart === rangeEnd) {
      ranges.push(String(rangeStart));
    } else {
      ranges.push(`${rangeStart}-${rangeEnd}`);
    }

    if (current !== undefined) {
      rangeStart = current;
      rangeEnd = current;
    }
  }

  return ranges.join(", ");
}
