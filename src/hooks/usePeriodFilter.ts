"use client";

import { useState } from "react";

export type Period = "day" | "week" | "month";

export const periodLabels: Record<Period, string> = {
  day: "за день",
  week: "за неделю",
  month: "за месяц",
};

/**
 * Хук для управления фильтром периодов (день/неделя/месяц)
 * @param initialPeriod - Начальный период
 * @returns Объект с состоянием и функциями управления
 */
export const usePeriodFilter = (initialPeriod: Period = "day") => {
  const [activePeriod, setActivePeriod] = useState<Period>(initialPeriod);

  return {
    activePeriod,
    setActivePeriod,
    periodLabels,
  };
};
