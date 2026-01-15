// Константы периодов фильтрации

export type Period = "day" | "week" | "month";

// Константы периодов
export const PERIODS = {
  DAY: "day" as const,
  WEEK: "week" as const,
  MONTH: "month" as const,
};

// Метки периодов
export const PERIOD_LABELS: Record<Period, string> = {
  day: "за день",
  week: "за неделю",
  month: "за месяц",
};

// Сокращенные метки для UI
export const PERIOD_SHORT_LABELS: Record<Period, string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
};

// Значения для сортировки
export const PERIOD_SORT_VALUES = {
  day: "today",
  week: "thisWeek",
  month: "thisMonth",
} as const;

// API параметры для периодов
export const PERIOD_API_PARAMS: Record<Period, string> = {
  day: "1d",
  week: "1w",
  month: "1m",
};

// Описания периодов для помощи пользователям
export const PERIOD_DESCRIPTIONS: Record<Period, string> = {
  day: "Тайтлы, популярные за последние 24 часа",
  week: "Тайтлы, популярные за последнюю неделю",
  month: "Тайтлы, популярные за последний месяц",
};

// Функция для получения метки периода
export const getPeriodLabel = (period: Period): string => {
  return PERIOD_LABELS[period];
};

// Функция для получения сокращенной метки периода
export const getPeriodShortLabel = (period: Period): string => {
  return PERIOD_SHORT_LABELS[period];
};

// Функция для получения API параметра периода
export const getPeriodApiParam = (period: Period): string => {
  return PERIOD_API_PARAMS[period];
};

// Функция для получения описания периода
export const getPeriodDescription = (period: Period): string => {
  return PERIOD_DESCRIPTIONS[period];
};

// Список всех доступных периодов
export const ALL_PERIODS: Period[] = [PERIODS.DAY, PERIODS.WEEK, PERIODS.MONTH];

// Функция для валидации периода
export const isValidPeriod = (period: string): period is Period => {
  return Object.values(PERIODS).includes(period as Period);
};
