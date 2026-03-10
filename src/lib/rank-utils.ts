// Система рангов силы из маньхуа "Сильнейший во все времена"
// Уровень 0–90. XP для следующего уровня растёт с каждым уровнем.
// 9 рангов по 10 уровней (ранги от слабейшего к сильнейшему):
// 1 Ученик боевых искусств, 2 Царство единого начала - Воин, … 9 Царство девяти небес - Боевой император

/**
 * Порог суммарного XP для перехода на следующий уровень.
 * Должно совпадать с сервером: users.service.ts calculateNextLevelExp()
 * Формула: 100 * level^1.5 (экспоненциальный рост).
 */
export function getNextLevelExp(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Порог XP для входа в текущий уровень (суммарный XP на начало уровня).
 */
export function getCurrentLevelExp(level: number): number {
  if (level <= 0) return 0;
  return getNextLevelExp(level - 1);
}

/**
 * Прогресс до следующего уровня: 0..100.
 * experience — суммарный XP пользователя.
 */
export function getLevelProgress(
  level: number,
  experience: number,
): {
  progressPercent: number;
  currentLevelExp: number;
  nextLevelExp: number;
} {
  const currentLevelExp = getCurrentLevelExp(level);
  const nextLevelExp = getNextLevelExp(level);
  const segment = nextLevelExp - currentLevelExp;
  const expInSegment = Math.max(0, experience - currentLevelExp);
  const progressPercent = segment <= 0 ? 100 : Math.min(100, (expInSegment / segment) * 100);
  return { progressPercent, currentLevelExp, nextLevelExp };
}

export interface RankInfo {
  rank: number; // Ранг (1-9), 1 - самый слабый, 9 - самый сильный
  stars: number; // Звезды (1-9)
  name: string; // Название ранга
  minLevel: number; // Минимальный уровень для этого ранга/звезд
}

// Названия рангов (индекс = номер ранга 1–9). Соответствует блоку «Уровни и ранги».
export const RANK_NAMES = [
  "", // Заглушка для индекса 0
  "Ученик боевых искусств", // 1-й ранг, уровни 0–9
  "Царство единого начала - Воин", // 2, уровни 10–19
  "Царство двойственности - Мастер", // 3, уровни 20–29
  "Царство трёх начал - Великий мастер", // 4, уровни 30–39
  "Царство четырёх стихий - Лорд", // 5, уровни 40–49
  "Царство пяти стихий - Король", // 6, уровни 50–59
  "Царство шести направлений - Предок", // 7, уровни 60–69
  "Царство семи созвездий - Повелитель", // 8, уровни 70–79
  "Царство восьми пустынь - Почётный воин", // 9, уровни 80–89
  "Царство девяти небес - Боевой император", // 9-й ранг, уровень 90
];

/**
 * Конвертирует уровень (0–90) в ранг и звезды.
 * 9 рангов по 10 уровней: уровень 0–9 → ранг 1, 10–19 → ранг 2, …, 80–90 → ранг 9.
 * @param level Уровень от 0 до 90
 * @returns Объект с информацией о ранге и звездах
 */
export function levelToRank(level: number): RankInfo {
  const clampedLevel = Math.max(0, Math.min(90, Math.floor(level)));

  // Ранг 1–9: по 10 уровней на ранг
  const rank = Math.floor(clampedLevel / 10) + 1;
  // Звёзды 1–9 внутри ранга (уровень внутри десятки)
  const stars = (clampedLevel % 10) + 1;

  // Корректируем для максимального уровня
  let finalRank = rank;
  let finalStars = stars;

  if (clampedLevel >= 90) {
    finalRank = 9;
    finalStars = 9;
  } else if (clampedLevel === 0) {
    finalRank = 1;
    finalStars = 1;
  }
  finalRank = Math.min(9, Math.max(1, finalRank));
  finalStars = Math.min(9, Math.max(1, finalStars));

  return {
    rank: finalRank,
    stars: finalStars,
    name: RANK_NAMES[finalRank],
    minLevel: clampedLevel,
  };
}

/**
 * Возвращает строковое представление ранга для блока «Уровни и ранги».
 * Формат: "Название ранга (уровень) ★★★☆☆☆☆☆☆"
 * @param level Уровень 0–90
 */
export function getRankDisplay(level: number): string {
  const clampedLevel = Math.max(0, Math.min(90, Math.floor(level)));
  const rankInfo = levelToRank(level);
  const starsDisplay = "★".repeat(rankInfo.stars) + "☆".repeat(9 - rankInfo.stars);
  return `${rankInfo.name} (${clampedLevel}) ${starsDisplay}`;
}

/**
 * Возвращает цвет для отображения ранга
 * @param rank Номер ранга (1-9)
 * @returns CSS цвет
 */
export function getRankColor(rank: number): string {
  const colors = [
    "#FFD700", // 1-й ранг -
    "#FFD700", // 2-й ранг -
    "#FFD700", // 3-й ранг -
    "#FFD700", // 4-й ранг -
    "#FFD700", // 5-й ранг -
    "#FFD700", // 6-й ранг -
    "#FFD700", // 7-й ранг -
    "#FFD700", // 8-й ранг -
    "#FFA600", // 9-й ранг -
  ];

  // Корректируем индекс (массив начинается с 0)
  const index = Math.max(0, Math.min(8, 9 - rank));
  return colors[index];
}
