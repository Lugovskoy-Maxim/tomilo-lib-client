// Система рангов силы из маньхуа "Сильнейший во все времена"
// 9 рангов, каждый с 9 звездами
// Ранги от слабейшего к сильнейшему:
// 1-й ранг → 9-й ранг (самый слабый → сильнейший)

export interface RankInfo {
  rank: number;        // Ранг (1-9), 1 - самый слабый, 9 - самый сильный
  stars: number;       // Звезды (1-9)
  name: string;        // Название ранга
  minLevel: number;    // Минимальный уровень для этого ранга/звезд
}

// Названия рангов
const RANK_NAMES = [
  "", // Заглушка для индекса 0
  "Ученик боевых искусств", // 1-й ранг - самый слабый
  "Царство единого начала - Воин",
  "Царство двойственности - Мастер",
  "Царство трёх начал - Великий мастер",
  "Царство четырёх стихий - Лорд",
  "Царство пяти стихий - Король",
  "Царство шести направлений - Предок",
  "Царство семи созвездий - Повелитель",
  "Царство восьми пустынь - Почётный воин",
  "Царство девяти небес - Боевой император" // 9-й ранг - самый сильный
];

/**
 * Конвертирует уровень (0-100) в ранг и звезды
 * @param level Уровень от 0 до 100
 * @returns Объект с информацией о ранге и звездах
 */
export function levelToRank(level: number): RankInfo {
  // Ограничиваем уровень диапазоном 0-100
  const clampedLevel = Math.max(0, Math.min(100, level));
  
  // Рассчитываем общий прогресс (0-80, так как 9 рангов * 9 звезд = 81 комбинация, но у нас 0-100 уровней)
  // Для упрощения: каждый ранг занимает ~11.11 уровней (100/9)
  // Каждая звезда в ранге занимает ~1.23 уровня (11.11/9)
  
  // Определяем ранг (1-9) - чем выше уровень, тем выше номер ранга
  const rank = Math.floor(clampedLevel / 11.11) + 1 || 1; // 1-9, 1 - самый слабый
  
  // Определяем звезды (1-9) в рамках ранга
  const rankProgress = clampedLevel % 11.11;
  const stars = Math.floor(rankProgress / 1.23) + 1 || 1; // 1-9
  
  // Корректируем для максимального уровня
  let finalRank = rank;
  let finalStars = stars;
  
  if (clampedLevel >= 100) {
    finalRank = 9;  // Девятый ранг
    finalStars = 9; // 9 звезд
  } else if (clampedLevel === 0) {
    finalRank = 1;  // Первый ранг
    finalStars = 1; // 1 звезда
  }
  
  // Ограничиваем значения диапазонами
  finalRank = Math.min(9, Math.max(1, finalRank));
  finalStars = Math.min(9, Math.max(1, finalStars));
  
  return {
    rank: finalRank,
    stars: finalStars,
    name: RANK_NAMES[finalRank],
    minLevel: clampedLevel
  };
}

/**
 * Возвращает строковое представление ранга и звезд
 * @param level Уровень от 0 до 100
 * @returns Строка в формате "Ранг [номер] - [звезды]"
 */
export function getRankDisplay(level: number): string {
  const rankInfo = levelToRank(level);
  // const starsDisplay = "★".repeat(rankInfo.stars) + "☆".repeat(9 - rankInfo.stars);
  return `${rankInfo.name} (${rankInfo.rank}-й ранг)`;
}

/**
 * Возвращает цвет для отображения ранга
 * @param rank Номер ранга (1-9)
 * @returns CSS цвет
 */
export function getRankColor(rank: number): string {
  const colors = [
    "#FFD700", // 1-й ранг - Золотой
    "#FFA500", // 2-й ранг - Оранжевый
    "#FF4500", // 3-й ранг - Оранжево-красный
    "#FF0000", // 4-й ранг - Красный
    "#8A2BE2", // 5-й ранг - Сине-фиолетовый
    "#0000FF", // 6-й ранг - Синий
    "#008000", // 7-й ранг - Зеленый
    "#FFFF00", // 8-й ранг - Желтый
    "#C0C0C0"  // 9-й ранг - Серебряный
  ];
  
  // Корректируем индекс (массив начинается с 0)
  const index = Math.max(0, Math.min(8, 9 - rank));
  return colors[index];
}