"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Chapter } from "@/types/title";

const CHART_GRADIENT_ID = "chapter-ratings-gradient";

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
      <div className="text-xs font-medium text-[var(--muted-foreground)] tracking-wide">
        Распределение оценок по главам
      </div>
      <div className="h-[220px] w-full rounded-xl overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
          >
            <defs>
              <linearGradient id={CHART_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
              opacity={0.4}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)", strokeWidth: 1 }}
            />
            <YAxis
              dataKey="rating"
              domain={[1, 10]}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
              formatter={(value, _name, props) => [
                `${value ?? 0} (${(props?.payload as ChartPoint)?.count ?? 0} ${(props?.payload as ChartPoint)?.count === 1 ? "оценка" : "оценок"})`,
                "Рейтинг",
              ]}
              labelFormatter={(_label, payload) =>
                payload?.[0] ? `Глава ${payload[0].payload.chapterNumber}` : ""
              }
              cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="basis"
              dataKey="rating"
              stroke="var(--primary)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={`url(#${CHART_GRADIENT_ID})`}
              dot={false}
              activeDot={{ r: 6, stroke: "var(--card)", strokeWidth: 2, fill: "var(--primary)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
