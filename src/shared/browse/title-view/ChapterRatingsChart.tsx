"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Chapter } from "@/types/title";

interface ChapterRatingsChartProps {
  chapters: Chapter[];
}

interface ChartPoint {
  chapterNumber: number;
  label: string;
  rating: number;
  count: number;
}

/** График среднего рейтинга по главам. Вызывается только когда блок статистики в зоне видимости (ленивый монтаж в RightContent). */
export function ChapterRatingsChart({ chapters }: ChapterRatingsChartProps): React.ReactElement | null {
  const chartData = useMemo((): ChartPoint[] => {
    if (!chapters.length) return [];

    const withRating = chapters.filter(
      ch => (ch.ratingCount ?? 0) > 0 && (ch.ratingSum != null || ch.averageRating != null),
    );
    if (withRating.length === 0) return [];

    const average = (ch: Chapter): number => {
      if (ch.averageRating != null) return ch.averageRating;
      const sum = ch.ratingSum ?? 0;
      const count = ch.ratingCount ?? 1;
      return count > 0 ? sum / count : 0;
    };

    const sorted = [...withRating].sort(
      (a, b) => Number(a.chapterNumber ?? 0) - Number(b.chapterNumber ?? 0),
    );

    return sorted.map(ch => ({
      chapterNumber: Number(ch.chapterNumber ?? 0),
      label: `Гл. ${ch.chapterNumber}`,
      rating: Math.round(average(ch) * 10) / 10,
      count: ch.ratingCount ?? 0,
    }));
  }, [chapters]);

  if (chartData.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="text-xs text-[var(--muted-foreground)]">
        Распределение оценок по главам
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              dataKey="rating"
              domain={[1, 10]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              width={24}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "var(--foreground)" }}
              formatter={(value: number, _name: string, props: { payload: ChartPoint }) => [
                `${value} (${props.payload.count} ${props.payload.count === 1 ? "оценка" : "оценок"})`,
                "Рейтинг",
              ]}
              labelFormatter={(_label, payload) =>
                payload?.[0] ? `Глава ${payload[0].payload.chapterNumber}` : ""
              }
            />
            <Bar
              dataKey="rating"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
