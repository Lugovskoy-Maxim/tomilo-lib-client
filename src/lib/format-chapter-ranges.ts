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

    if (current !== undefined && areConsecutive(prev, current)) {
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

const STEP_EPS = 1e-9;

/** Последовательными считаем числа, если разница не больше 1 (41, 41.1, 41.2, 41.5, 42 — один диапазон), чтобы дробные главы не разрывали список. */
function areConsecutive(a: number, b: number): boolean {
  const step = b - a;
  return step > 0 && step <= 1 + STEP_EPS;
}

/** Распознаёт диапазон вида "1-12" или "1 – 12" (дефис или en-dash), возвращает [from, to] или null */
function parseRangePart(part: string): [number, number] | null {
  const normalized = part.replace(/\s/g, "").replace(/\u2013/g, "-"); // en-dash -> hyphen
  const rangeMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (!rangeMatch) return null;
  const a = parseFloat(rangeMatch[1]);
  const b = parseFloat(rangeMatch[2]);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return a <= b ? [a, b] : [b, a];
}

/**
 * Парсит строку вида "Главы 167, 166, 165, 164", "Главы 1–12" или "167, 166, 165" и возвращает
 * отформатированную строку с логичной нумерацией (по возрастанию, диапазоны).
 * Если распарсить не удаётся — возвращает исходную строку.
 */
export function formatChapterString(chapterStr: string): string {
  if (!chapterStr?.trim()) return chapterStr;

  const trimmed = chapterStr.trim();
  const prefixMatch = trimmed.match(/^Главы\s+/i);
  const prefix = prefixMatch ? prefixMatch[0] : "";
  const rest = prefix ? trimmed.slice(prefix.length).trim() : trimmed;

  const numbers: number[] = [];
  const parts = rest.split(/\s*,\s*/);
  for (const p of parts) {
    const range = parseRangePart(p.trim());
    if (range !== null) {
      const [from, to] = range;
      for (let n = from; n <= to; n++) numbers.push(n);
      continue;
    }
    const num = parseFloat(p.replace(/\s/g, ""));
    if (!Number.isNaN(num)) numbers.push(num);
  }

  if (numbers.length === 0) return chapterStr;
  if (numbers.length === 1) return `Глава ${numbers[0]}`;

  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];

    if (current !== undefined && areConsecutive(prev, current)) {
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

  return prefix + ranges.join(", ");
}
